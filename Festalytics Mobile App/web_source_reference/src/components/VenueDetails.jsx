import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Star, MapPin, Users, DollarSign, CheckCircle, Phone, Info, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PublicSiteHeader from './PublicSiteHeader';
import Footer from './Footer';
import hallsData from '../data/halls.json';
import { db, auth } from "../firebase";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { submitCustomerQuotation } from "@/lib/firestore/quotations";
import { useAuth } from "@/context/AuthContext";
import {
  appendZaydanCallingRow,
  quotationToCallingRow,
  ZAYDAN_VENUE_SLUG,
} from "@/lib/google/zaydanCallingSheet";
import PublicVenueCalendar from "@/components/venue/PublicVenueCalendar";
import { getDateStatus } from "@/lib/firestore/venueCalendar";
import { usePublicVenueCalendar } from "@/hooks/usePublicVenueCalendar";
import CustomerVenueChat from "@/components/chat/CustomerVenueChat";
import VenueFaqSection from "@/components/venue/VenueFaqSection";

const VenueDetails = () => {
  const { id } = useParams();
  const router = useRouter();
  const { requireAuth, loadPendingAction } = useAuth();
  const [venue, setVenue] = useState(null);
  const [activeImage, setActiveImage] = useState(0);
  const [rating, setRating] = useState('4.5');

  useEffect(() => {
    const loadVenue = async () => {
      const foundInJson = hallsData.find(
        (h) =>
          h.hall_id?.toString() === id ||
          (h.hall_name && h.hall_name.toLowerCase().replace(/\s+/g, "-") === id?.toLowerCase())
      );

      if (foundInJson) {
        setVenue(foundInJson);
        return;
      }

      try {
        const docRef = doc(db, "venues", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const profile = data.profile || {};
          setVenue({
            hall_id: id,
            hall_name: profile.hall_name || data.name || data.hallName || id.replace(/-/g, " "),
            description:
              profile.description ||
              data.description ||
              "A premium wedding and event venue on Festalytics.",
            full_address: profile.address || data.streetAddress || "",
            area: profile.area || data.city || "Lahore",
            phone_1: profile.phone_1 || "",
            capacity_sitting: String(profile.capacity || data.capacity || 500),
            one_dish_chicken: String(data.pricing?.chickenPrice || 2000),
            one_dish_beef: String(data.pricing?.beefPrice || 2850),
            one_dish_mutton: String(data.pricing?.muttonPrice || 4100),
            images: (data.images || []).map((img, idx) =>
              typeof img === "string"
                ? img
                : img?.url || "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80"
            ),
            is_air_conditioned: "yes",
            generator_backup: "yes",
            decoration_in_house: "yes",
            bridal_room: "yes",
            parking_capacity: "100",
            isFromFirestoreOnly: true,
          });
        } else {
          setVenue(null);
        }
      } catch (err) {
        console.error("Error loading Firestore-only venue:", err);
        setVenue(null);
      }
    };

    if (id) loadVenue();
  }, [id]);

  useEffect(() => {
    if (venue) {
      setRating(venue.rating || (Math.random() * (5.0 - 4.0) + 4.0).toFixed(1));
    }
  }, [venue]);

  const [dbVenue, setDbVenue] = useState(null);
  const [loadingDb, setLoadingDb] = useState(true);

  // Dynamic Cost Estimation Engine states
  const [guestsCount, setGuestsCount] = useState(150);
  const [selectedPkgId, setSelectedPkgId] = useState("pkg-1");
  const [includeAC, setIncludeAC] = useState(true);
  const [includeGenerator, setIncludeGenerator] = useState(true);
  
  const [includeDecor, setIncludeDecor] = useState(false);
  const [includeSound, setIncludeSound] = useState(false);
  const [includeSecurity, setIncludeSecurity] = useState(false);
  const [showMenuModal, setShowMenuModal] = useState(false);

  // Customer quote form inputs states
  const [clientName, setClientName] = useState("");
  const [clientContact, setClientContact] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTiming, setEventTiming] = useState("Morning (1:00 PM - 4:00 PM)");
  const [eventCategory, setEventCategory] = useState("Barat");
  const [quoteSubmitted, setQuoteSubmitted] = useState(false);
  const [isSubmittingQuote, setIsSubmittingQuote] = useState(false);
  const [quoteToast, setQuoteToast] = useState({ show: false, message: "", type: "success" });

  const getFirestoreDocId = (venueObj) => {
    if (!venueObj) return id || null;
    if (venueObj.isFromFirestoreOnly && venueObj.hall_id) {
      return venueObj.hall_id;
    }
    const name = venueObj.hall_name ? venueObj.hall_name.toLowerCase() : "";
    if (venueObj.hall_id === "1" || name.includes("zaydan banquet hall")) {
      return "zaydan-banquet-hall";
    }
    if (venueObj.hall_id === "2" || name.includes("qasar e zaydan")) {
      return "qasar-e-zaydan";
    }
    const slug = venueObj.hall_name?.toLowerCase().replace(/\s+/g, "-");
    if (slug && !/^\d+$/.test(String(venueObj.hall_id))) {
      return slug;
    }
    return id || venueObj.hall_id?.toString() || slug;
  };

  useEffect(() => {
    if (!venue) return;

    let cancelled = false;
    const docId = getFirestoreDocId(venue);
    if (!docId) {
      setLoadingDb(false);
      return undefined;
    }

    const docRef = doc(db, "venues", docId);

    const applyVenueData = (data) => {
      if (cancelled || !data) return;
      setDbVenue(data);
      if (data.cateringPackages?.length > 0) {
        setSelectedPkgId((prev) => {
          const stillValid = data.cateringPackages.some((p) => p.id === prev);
          return stillValid ? prev : data.cateringPackages[0].id;
        });
      }
      setLoadingDb(false);
    };

    const seedDefaultVenue = async () => {
      const chickenPrice = parseInt(venue.one_dish_chicken, 10) || 2000;
      const beefPrice = parseInt(venue.one_dish_beef, 10) || 2850;
      const muttonPrice = parseInt(venue.one_dish_mutton, 10) || 4100;

      const defaultData = {
        pricing: {
          hallRent: (() => {
            if (!venue.price_range) return 250000;
            const numbers = venue.price_range.replace(/,/g, "").match(/\d+/g);
            if (numbers?.length > 0) {
              const val = parseInt(numbers[0], 10);
              return val > 20000 ? val : 250000;
            }
            return 250000;
          })(),
          acCost: 25000,
          generatorCost: 15000,
          decorAvailable: true,
          decorPrice: 120000,
          soundAvailable: true,
          soundPrice: 25000,
          securityAvailable: true,
          securityPrice: 20000,
        },
        cateringPackages: [
          {
            id: "pkg-1",
            name: "Barat Luxury Beef Menu",
            type: "Beef",
            perPlatePrice: beefPrice,
            dishes: ["Beef Biryani", "Beef Qorma", "Raita & Salad", "Assorted Naan", "Shahi Kheer"],
          },
          {
            id: "pkg-2",
            name: "Mehndi Feast Chicken Menu",
            type: "Chicken",
            perPlatePrice: chickenPrice,
            dishes: ["Chicken Pulao", "Chicken Seekh Kabab", "Fresh Salad", "Mint Raita", "Jalebi"],
          },
          {
            id: "pkg-3",
            name: "Royal Mutton Walima Menu",
            type: "Mutton",
            perPlatePrice: muttonPrice,
            dishes: ["Mutton Mandi", "Mutton Karahi", "Hummus & Pita", "Special Salad", "Shahi Tukray"],
          },
        ],
        images: venue.images
          ? venue.images.map((img, idx) => ({
              id: `img-${idx + 1}`,
              url: decodeURIComponent(img.replace("/Marriage Hall/", "/Marriage_hall/")),
              label: `${venue.hall_name} View ${idx + 1}`,
              isPrimary: idx === 0,
            }))
          : [],
        features: [
          "Premium Sound System",
          "Custom Mood Lighting",
          "Valet Parking Access",
          "Integrated Stage",
          "Full Bar Setup",
        ],
        faqs: [
          {
            id: "faq-1",
            question: `Is catering included in the base venue hire price of ${venue.hall_name}?`,
            answer:
              "Catering is not included in the base venue rate. You can choose to add our custom catering package when requesting a quote.",
            active: true,
          },
          {
            id: "faq-2",
            question: `What is the maximum capacity of ${venue.hall_name}?`,
            answer: `The venue can comfortably accommodate up to ${venue.capacity_sitting || 500} guests for banquet seating.`,
            active: true,
          },
        ],
        serviceActive: true,
        updatedAt: new Date().toISOString(),
      };

      try {
        if (auth.currentUser) {
          await setDoc(docRef, defaultData);
        }
        applyVenueData(defaultData);
      } catch (err) {
        console.error("Error seeding Firestore venue:", err);
        applyVenueData(defaultData);
      }
    };

    setLoadingDb(true);

    const unsubscribe = onSnapshot(
      docRef,
      async (snap) => {
        if (cancelled) return;
        if (snap.exists()) {
          applyVenueData(snap.data());
        } else {
          await seedDefaultVenue();
        }
      },
      (err) => {
        console.error("Venue snapshot error:", err);
        if (!cancelled) setLoadingDb(false);
      }
    );

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [venue]);

  const maxCapacity = dbVenue?.capacity || (venue?.capacity_sitting ? parseInt(venue.capacity_sitting) : 500) || 500;
  const venueSlug = venue ? getFirestoreDocId(venue) : null;
  const publicCal = usePublicVenueCalendar(venueSlug);

  useEffect(() => {
    if (guestsCount > maxCapacity) {
      setGuestsCount(maxCapacity);
    }
  }, [maxCapacity, guestsCount]);

  useEffect(() => {
    if (!venue) return;
    const pending = loadPendingAction();
    if (!pending || pending.action !== "quote") return;
    const docId = getFirestoreDocId(venue);
    if (pending.payload?.venueId !== docId) return;

    const p = pending.payload;
    if (p.clientName) setClientName(p.clientName);
    if (p.clientContact) setClientContact(p.clientContact);
    if (p.eventDate) setEventDate(p.eventDate);
    if (p.eventTiming) setEventTiming(p.eventTiming);
    if (p.eventCategory) setEventCategory(p.eventCategory);
    if (p.guestsCount != null) setGuestsCount(p.guestsCount);
    if (p.selectedPkgId) setSelectedPkgId(p.selectedPkgId);
    if (p.includeAC != null) setIncludeAC(p.includeAC);
    if (p.includeGenerator != null) setIncludeGenerator(p.includeGenerator);
    if (p.includeDecor != null) setIncludeDecor(p.includeDecor);
    if (p.includeSound != null) setIncludeSound(p.includeSound);
    if (p.includeSecurity != null) setIncludeSecurity(p.includeSecurity);
  }, [venue, loadPendingAction]);

  if (!venue) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Venue not found</h2>
          <button onClick={() => router.back()} className="text-[#D6336C] font-semibold hover:underline">
            Go back
          </button>
        </div>
      </div>
    );
  }

  // Operational Pricing and Catering Tiers (from Firestore DB or default fallback templates)
  const activePricing = dbVenue?.pricing || {
    hallRent: 250000,
    acCost: 25000,
    generatorCost: 15000,
    decorAvailable: true,
    decorPrice: 120000,
    soundAvailable: true,
    soundPrice: 25000,
    securityAvailable: true,
    securityPrice: 20000
  };

  const activePackages = (() => {
    const dbPkgs = dbVenue?.cateringPackages || [];
    
    const chickenPrice = dbVenue?.pricing?.chickenPrice || parseInt(venue?.one_dish_chicken) || 1400;
    const beefPrice = dbVenue?.pricing?.beefPrice || parseInt(venue?.one_dish_beef) || 2000;
    const muttonPrice = dbVenue?.pricing?.muttonPrice || parseInt(venue?.one_dish_mutton) || 3000;
    const mehndiPrice = dbVenue?.pricing?.mehndiPrice || 1200;
    
    const standardPkgs = [
      {
        id: 'pkg-2',
        name: "Mehndi Feast Chicken Menu",
        type: "Chicken",
        perPlatePrice: chickenPrice,
        dishes: ["Chicken Pulao", "Chicken Seekh Kabab", "Fresh Salad", "Mint Raita", "Jalebi"],
        categories: [
          {
            id: "cat-1",
            name: "Main Course",
            items: [
              { id: "item-1", name: "Chicken Karahi", description: "Wok-fried chicken with ginger, green chillies and traditional spices.", active: true },
              { id: "item-2", name: "Chicken Biryani", description: "Aromatic basmati rice layered with spiced chicken and saffron.", active: true },
              { id: "item-3", name: "Chicken Handi", description: "Boneless chicken cooked in a rich, creamy tomato-based gravy.", active: true }
            ]
          },
          {
            id: "cat-2",
            name: "Sides & Salads",
            items: [
              { id: "item-4", name: "Fresh Salad", description: "Seasonal garden fresh vegetables slice cut.", active: true },
              { id: "item-5", name: "Mint Raita", description: "Creamy yogurt infused with fresh mint leaves.", active: true }
            ]
          },
          {
            id: "cat-3",
            name: "Beverages",
            items: [
              { id: "item-6", name: "Soft Drinks", description: "Assorted cold carbonated sodas.", active: true },
              { id: "item-7", name: "Mint Margarita", description: "Refreshing blend of fresh mint, lime, and crushed ice.", active: true }
            ]
          },
          {
            id: "cat-4",
            name: "Desserts",
            items: [
              { id: "item-8", name: "Shahi Kheer", description: "Traditional slow-cooked rice pudding topped with almonds.", active: true }
            ]
          }
        ]
      },
      {
        id: 'pkg-1',
        name: "Barat Luxury Beef Menu",
        type: "Beef",
        perPlatePrice: beefPrice,
        dishes: ["Beef Biryani", "Beef Qorma", "Raita & Salad", "Assorted Naan", "Shahi Kheer"],
        categories: [
          {
            id: "cat-1",
            name: "Main Course",
            items: [
              { id: "item-b1", name: "Beef Biryani", description: "Spiced beef nested in fragrant saffron basmati rice.", active: true },
              { id: "item-b2", name: "Beef Kabab Platters", description: "Skewered charbroiled minced beef kababs.", active: true }
            ]
          },
          {
            id: "cat-2",
            name: "Sides & Salads",
            items: [
              { id: "item-b3", name: "Special Salad", description: "Lettuce, tomatoes, red onions with lemon herb dressings.", active: true },
              { id: "item-b4", name: "Roghni Naan", description: "Freshly baked buttered sesame flatbread.", active: true }
            ]
          },
          {
            id: "cat-3",
            name: "Beverages",
            items: [
              { id: "item-b5", name: "Lassi & Shakes", description: "Chilled yogurt shake or mango milkshake.", active: true }
            ]
          },
          {
            id: "cat-4",
            name: "Desserts",
            items: [
              { id: "item-b6", name: "Gulab Jamun", description: "Warm syrup soaked condensed milk balls.", active: true }
            ]
          }
        ]
      },
      {
        id: 'pkg-3',
        name: "Royal Mutton Walima Menu",
        type: "Mutton",
        perPlatePrice: muttonPrice,
        dishes: ["Mutton Mandi", "Mutton Karahi", "Hummus & Pita", "Special Salad", "Shahi Tukray"],
        categories: [
          {
            id: "cat-1",
            name: "Main Course",
            items: [
              { id: "item-m1", name: "Mutton Karahi", description: "Royal mutton slow cooked in a base of tomatoes, garlic, ginger and spices.", active: true },
              { id: "item-m2", name: "Mutton Pulao", description: "Premium basmati rice simmered in rich mutton broth.", active: true }
            ]
          },
          {
            id: "cat-2",
            name: "Sides & Salads",
            items: [
              { id: "item-m3", name: "Garlic Butter Naan", description: "Oven baked bread with fresh garlic and cilantro butter.", active: true }
            ]
          },
          {
            id: "cat-3",
            name: "Beverages",
            items: [
              { id: "item-m4", name: "Fresh Juice Platter", description: "Squeezed orange, apple, and grape juice collection.", active: true }
            ]
          },
          {
            id: "cat-4",
            name: "Desserts",
            items: [
              { id: "item-m5", name: "Zafrani Rasmalai", description: "Saffron milk infused cottage cheese discs.", active: true }
            ]
          }
        ]
      },
      {
        id: 'pkg-4',
        name: "Mehndi Special Menu",
        type: "Mehndi",
        perPlatePrice: mehndiPrice,
        dishes: ["Puri Halwa Chana", "Gol Gappay Setup", "Dahi Bhallay", "Kashmiri Chai", "Live Jalebi"],
        categories: [
          {
            id: "cat-1",
            name: "Main Course",
            items: [
              { id: "item-e1", name: "Puri Halwa Chana", description: "Crispy fried puris served with semolina halwa and spicy chickpea gravy.", active: true },
              { id: "item-e2", name: "Gol Gappay Setup", description: "Crispy semolina spheres with sweet and sour spiced water.", active: true }
            ]
          },
          {
            id: "cat-2",
            name: "Sides & Salads",
            items: [
              { id: "item-e3", name: "Dahi Bhallay", description: "Soft lentil dumplings soaked in seasoned thick yogurt.", active: true }
            ]
          },
          {
            id: "cat-3",
            name: "Beverages",
            items: [
              { id: "item-e4", name: "Special Kashmiri Chai", description: "Traditional pink tea topped with pistachios.", active: true }
            ]
          },
          {
            id: "cat-4",
            name: "Desserts",
            items: [
              { id: "item-e5", name: "Hot Live Jalebi", description: "Freshly made spiral crispy flour sweets soaked in sugar syrup.", active: true }
            ]
          }
        ]
      }
    ];

    if (dbPkgs.length > 0) {
      // Build active packages list by merging custom published packages
      // Filter out standard packages that match types of custom packages we have
      const customTypes = dbPkgs.map(p => (p.type || "").toLowerCase());
      const filteredStandards = standardPkgs.filter(std => {
        const stdType = std.type.toLowerCase();
        // Keep standard package only if we do not have a custom package of the same type
        return !customTypes.includes(stdType);
      });

      const mappedDbPkgs = dbPkgs.map(pkg => {
        const pkgType = pkg.type || "";
        let price = pkg.perPlatePrice;
        if (pkgType === "Chicken" && dbVenue?.pricing?.chickenPrice) price = dbVenue.pricing.chickenPrice;
        else if (pkgType === "Beef" && dbVenue?.pricing?.beefPrice) price = dbVenue.pricing.beefPrice;
        else if (pkgType === "Mutton" && dbVenue?.pricing?.muttonPrice) price = dbVenue.pricing.muttonPrice;
        else if (pkgType === "Mehndi" && dbVenue?.pricing?.mehndiPrice) price = dbVenue.pricing.mehndiPrice;

        let categories = pkg.categories;
        if (!categories || categories.length === 0) {
          const matchingStd = standardPkgs.find(s => s.type.toLowerCase() === pkgType.toLowerCase());
          categories = matchingStd ? matchingStd.categories : [];
        }

        return {
          ...pkg,
          perPlatePrice: price,
          categories
        };
      });
      
      return [...mappedDbPkgs, ...filteredStandards];
    }
    
    return standardPkgs;
  })();

  // Derived calculation variables for estimation engine
  const selectedPkg = activePackages.find(p => p.id === selectedPkgId) || activePackages[0];
  const baseRent = activePricing.hallRent || 0;
  const cateringCost = selectedPkg ? (selectedPkg.perPlatePrice * guestsCount) : 0;
  const utilitiesCost = (includeAC ? activePricing.acCost : 0) + (includeGenerator ? activePricing.generatorCost : 0);
  const addonsCost = (includeDecor && activePricing.decorAvailable ? activePricing.decorPrice : 0) + 
                     (includeSound && activePricing.soundAvailable ? activePricing.soundPrice : 0) + 
                     (includeSecurity && activePricing.securityAvailable ? activePricing.securityPrice : 0);
  const totalEstimation = baseRent + cateringCost + utilitiesCost + addonsCost;

  const triggerQuoteToast = (message, type = "success") => {
    setQuoteToast({ show: true, message, type });
    setTimeout(() => setQuoteToast({ show: false, message: "", type: "success" }), 3500);
  };

  const executeSubmitQuote = async () => {
    const docId = getFirestoreDocId(venue);
    setIsSubmittingQuote(true);
    const bookingId = `BK-${Math.floor(1000 + Math.random() * 9000)}`;
    const selectedPkg = activePackages.find((p) => p.id === selectedPkgId) || activePackages[0];

    const bookingPayload = {
      id: bookingId,
      customer: {
        name: clientName,
        contact: clientContact,
        otherName: "",
        address: "",
      },
      eventDetails: {
        category: eventCategory,
        date: eventDate,
        timing: eventTiming,
        guests: parseInt(guestsCount, 10),
        venueId: docId,
        source: "Online Portal",
      },
      catering: {
        packageId: selectedPkgId || "",
        packageName: selectedPkg?.name || "Venue Hire Only",
        perPlatePrice: selectedPkg ? selectedPkg.perPlatePrice : 0,
        dishes: selectedPkg ? selectedPkg.dishes || [] : [],
      },
      addons: {
        ac: includeAC,
        generator: includeGenerator,
        addonsCost: addonsCost,
        decor: includeDecor,
        sound: includeSound,
        security: includeSecurity,
      },
      financials: {
        hallRent: baseRent,
        cateringCost: cateringCost,
        utilitiesCost: utilitiesCost,
        addonsCost: addonsCost,
        taxPercentage: 0,
        taxCost: 0,
        grandTotal: totalEstimation,
        advancePaid: 0,
        remainingBalance: totalEstimation,
      },
      status: "Pending",
      bookingSource: "online",
      bookedDate: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    };

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const quotationResult = await submitCustomerQuotation({
        userId: currentUser.uid,
        customerName: clientName.trim(),
        targetVenueId: docId,
        eventDate,
        guestCount: guestsCount,
        selectedMenu: {
          packageId: selectedPkgId || "",
          packageName: selectedPkg?.name || "Venue Hire Only",
          perPlatePrice: selectedPkg ? selectedPkg.perPlatePrice : 0,
          dishes: selectedPkg ? selectedPkg.dishes || [] : [],
        },
      });

      if (docId === ZAYDAN_VENUE_SLUG) {
        try {
          await appendZaydanCallingRow(
            quotationToCallingRow({
              quotationId: quotationResult.quotationId,
              userId: currentUser.uid,
              customerName: clientName.trim(),
              targetVenueId: docId,
              eventDate,
              guestCount: guestsCount,
              status: "pending_vendor_approval",
              selectedMenu: {
                packageName: selectedPkg?.name || "Venue Hire Only",
              },
            }),
            docId
          );
        } catch (sheetErr) {
          console.warn("Zaydan calling sheet append failed:", sheetErr);
        }
      }

      try {
        await fetch("/api/sync-bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookings: [bookingPayload], isMigration: false }),
        });
      } catch (sheetErr) {
        console.warn("Could not save online request to Google Sheets:", sheetErr);
      }

      setQuoteSubmitted(true);
      triggerQuoteToast("Quote Request Submitted Successfully to Vendor ERP!");
      setClientName("");
      setClientContact("");
      setEventDate("");
    } catch (err) {
      console.error("Error submitting quote request: ", err);
      triggerQuoteToast(`Failed to submit: ${err.message}`, "error");
    } finally {
      setIsSubmittingQuote(false);
    }
  };

  const handleBookQuote = async (e) => {
    e.preventDefault();
    if (!clientName.trim() || !clientContact.trim() || !eventDate) {
      triggerQuoteToast("Please fill in your Name, Contact, and Event Date!", "error");
      return;
    }

    const docId = getFirestoreDocId(venue);

    if (publicCal.isDateUnavailable(eventDate)) {
      const status = getDateStatus(eventDate, publicCal.calendarMeta);
      const msg =
        status === "blackout"
          ? "This date is blocked by the venue (maintenance/blackout)."
          : status === "pending"
          ? "This date has a pending booking request."
          : "Selected date is already booked at this venue!";
      triggerQuoteToast(msg, "error");
      return;
    }

    requireAuth({
      action: "quote",
      payload: {
        venueId: docId,
        clientName,
        clientContact,
        eventDate,
        eventTiming,
        eventCategory,
        guestsCount,
        selectedPkgId,
        includeAC,
        includeGenerator,
        includeDecor,
        includeSound,
        includeSecurity,
      },
      onAuthed: executeSubmitQuote,
    });
  };

  // Get folder path segment of current venue (e.g. "Zaydan Banquet Hall" or "Qasar E Zaydan")
  const getVenueFolderSegment = () => {
    if (!venue || !venue.images || venue.images.length === 0) return "";
    const firstImg = venue.images[0];
    const parts = firstImg.split('/');
    const folder = parts[parts.length - 2] || "";
    return decodeURIComponent(folder);
  };

  const folderSegment = getVenueFolderSegment();

  // Pre-process images to fix pathing (load from Firestore if custom reordering was saved)
  const filteredDbImages = dbVenue?.images && dbVenue.images.length > 0
    ? dbVenue.images.map(img => typeof img === 'string' ? img : (img?.url || img?.path)).filter(Boolean)
    : [];

  const images = filteredDbImages.length > 0 
    ? filteredDbImages
    : (venue.images && venue.images.length > 0 
        ? venue.images.map(img => decodeURIComponent(img.replace('/Marriage Hall/', '/Marriage_hall/')))
        : ['/images/placeholder-hall.jpg']);

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-slate-800">
      <PublicSiteHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Venues
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content - Left Side */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Header / Title */}
            <div>
              <div className="flex justify-between items-start mb-2 gap-4">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{venue.hall_name}</h1>
                <div className="flex items-center gap-1 bg-white border border-gray-100 shadow-sm px-3 py-1 rounded-lg font-bold text-gray-700 shrink-0">
                  <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                  {rating}
                </div>
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <MapPin className="w-4 h-4" />
                <span>{venue.full_address || venue.area || 'Lahore'}</span>
              </div>
            </div>

            {/* Image Gallery */}
            <div className="space-y-4">
              <motion.div 
                key={activeImage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full h-[400px] md:h-[500px] rounded-3xl overflow-hidden bg-gray-200 shadow-sm border border-gray-100"
              >
                <img 
                  src={images[activeImage]} 
                  alt={venue.hall_name} 
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=2698&auto=format&fit=crop'; }}
                />
              </motion.div>
              
              {/* Thumbnail Strip */}
              {images.length > 1 && (
                <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-hide snap-x">
                  {images.map((img, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setActiveImage(idx)}
                      className={`relative w-24 h-24 rounded-xl overflow-hidden shrink-0 snap-start border-2 transition-all ${
                        activeImage === idx ? 'border-[#D6336C] shadow-md' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt={`Thumbnail ${idx+1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Description Section */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Info className="w-5 h-5 text-[#D6336C]" /> About This Venue
              </h2>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                {venue.description || 'Experience the perfect blend of elegance and exceptional service at our venue. Designed to host your memorable events, we offer state-of-the-art facilities, beautiful decor, and a dedicated team to make your special day truly unforgettable.'}
              </p>
            </div>

            <PublicVenueCalendar
              venueSlug={venueSlug}
              hallName={venue.hall_name}
              selectedDateKey={eventDate}
              onSelectDate={setEventDate}
            />

            <VenueFaqSection faqs={dbVenue?.faqs} />

            {/* Facilities Grid */}
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Facilities & Amenities</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-2">
                {dbVenue?.features && dbVenue.features.length > 0 ? (
                  dbVenue.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-2 text-gray-700 font-medium">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <span>{feature}</span>
                    </div>
                  ))
                ) : (
                  [
                    { key: 'is_air_conditioned', label: 'Air Conditioned' },
                    { key: 'generator_backup', label: 'Generator Backup' },
                    { key: 'decoration_in_house', label: 'In-House Decor' },
                    { key: 'bridal_room', label: 'Bridal Room' },
                    { key: 'parking_capacity', label: `Parking: ${venue.parking_capacity || 'Yes'}` }
                  ].map((facility, i) => (
                    <div key={i} className="flex items-center gap-2 text-gray-700 font-medium">
                      <CheckCircle className={`w-5 h-5 ${venue[facility.key] === 'yes' || facility.key === 'parking_capacity' ? 'text-green-500' : 'text-gray-300'}`} />
                      <span>{facility.label}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Sidebar - Right Side */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              
              {/* Automated Cost Estimation Engine & Booking Form */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6">
                <div className="border-b border-gray-100 pb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Quote & Booking Form</span>
                  </div>
                  <h3 className="text-xl font-black text-gray-900 tracking-tight">Request Event Quote</h3>
                  <p className="text-xs text-gray-400">Configure logistics & client profile to send directly to Vendor ERP.</p>
                </div>

                {quoteSubmitted ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 text-center space-y-4 shadow-inner"
                  >
                    <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                      <span className="material-symbols-outlined text-2xl font-black">task_alt</span>
                    </div>
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Proposal Transmitted!</h4>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      Your event request has been successfully dispatched to the **{venue.hall_name} Management Ledger**. 
                      Our sales reps will review your requested date, catering configuration, and logistics, and follow up shortly.
                    </p>
                    <button
                      onClick={() => setQuoteSubmitted(false)}
                      className="w-full py-3 bg-white hover:bg-slate-50 text-slate-700 font-bold border border-slate-200 rounded-xl text-[10px] uppercase tracking-widest transition-all cursor-pointer"
                    >
                      Configure Another Quote
                    </button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleBookQuote} className="space-y-5 text-left text-slate-700">
                    {/* Section: Customer Profile */}
                    <div className="space-y-3.5 bg-gray-50/50 p-4.5 rounded-2xl border border-gray-100">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">1. Client Identification</span>
                      
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest px-0.5">Your Full Name *</label>
                        <input 
                          type="text" 
                          required
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                          placeholder="e.g. Ukasha Khan" 
                          className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-gray-800 focus:ring-1 focus:ring-[#D6336C] focus:border-[#D6336C] outline-none transition-all"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest px-0.5">Contact Number / Email *</label>
                        <input 
                          type="text" 
                          required
                          value={clientContact}
                          onChange={(e) => setClientContact(e.target.value)}
                          placeholder="e.g. +92 300 1234567" 
                          className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-gray-800 focus:ring-1 focus:ring-[#D6336C] focus:border-[#D6336C] outline-none transition-all"
                        />
                      </div>
                    </div>

                    {/* Section: Event Scheduling */}
                    <div className="space-y-3.5 bg-gray-50/50 p-4.5 rounded-2xl border border-gray-100">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">2. Event Schedule</span>

                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest px-0.5">Preferred Event Date *</label>
                        <input 
                          type="date" 
                          required
                          value={eventDate}
                          onChange={(e) => setEventDate(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-gray-800 focus:ring-1 focus:ring-[#D6336C] focus:border-[#D6336C] outline-none transition-all"
                        />
                        {eventDate && publicCal.isDateUnavailable(eventDate) && (
                          <span className="text-[9px] text-red-500 font-black uppercase px-0.5 flex items-center gap-1 mt-1 animate-pulse">
                            ✕ This date is not available — choose another from the calendar
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest px-0.5">Event Slot *</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setEventTiming("Morning (1:00 PM - 4:00 PM)")}
                            className={`py-2 px-2 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all flex flex-col items-center justify-center min-h-[42px] cursor-pointer
                              ${eventTiming === "Morning (1:00 PM - 4:00 PM)"
                                ? "bg-[#D6336C]/10 border-[#D6336C] text-[#D6336C] shadow-sm"
                                : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"}`}
                          >
                            <span>Morning</span>
                            <span className="text-[7.5px] opacity-75 font-bold">1PM - 4PM</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setEventTiming("Evening (7:00 PM - 10:00 PM)")}
                            className={`py-2 px-2 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all flex flex-col items-center justify-center min-h-[42px] cursor-pointer
                              ${eventTiming === "Evening (7:00 PM - 10:00 PM)"
                                ? "bg-[#D6336C]/10 border-[#D6336C] text-[#D6336C] shadow-sm"
                                : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"}`}
                          >
                            <span>Evening</span>
                            <span className="text-[7.5px] opacity-75 font-bold">7PM - 10PM</span>
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest px-0.5">Event Category *</label>
                        <select 
                          value={eventCategory}
                          onChange={(e) => setEventCategory(e.target.value)}
                          className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-gray-800 focus:ring-1 focus:ring-[#D6336C] focus:border-[#D6336C] outline-none cursor-pointer"
                        >
                          <option value="Barat">Barat Reception</option>
                          <option value="Walima">Walima Banquet</option>
                          <option value="Mehndi">Mehndi Feasts</option>
                          <option value="Party">Social / Party</option>
                          <option value="Corporate Event">Corporate Event</option>
                        </select>
                      </div>
                    </div>

                    {/* Section: Estimator configuration */}
                    <div className="space-y-4 pt-3 border-t border-gray-100">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">3. Logistics & Setup</span>

                      {/* Guest count */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs font-bold text-gray-700">
                          <span>Number of Guests</span>
                          <span className="text-[#D6336C] bg-[#D6336C]/10 px-2 py-0.5 rounded-md font-black">{guestsCount} Guests</span>
                        </div>
                        <input 
                          type="range" 
                          min="50" 
                          max={maxCapacity} 
                          step="10"
                          value={guestsCount}
                          onChange={(e) => setGuestsCount(Math.min(parseInt(e.target.value) || 50, maxCapacity))}
                          className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-[#D6336C]"
                        />
                        <div className="flex justify-between text-[10px] text-gray-400 font-bold">
                          <span>Min: 50</span>
                          <span>Max: {maxCapacity}</span>
                        </div>
                      </div>

                      {/* Catering Tier Packages */}
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Select Catering Package</label>
                        <select 
                          value={selectedPkgId}
                          onChange={(e) => setSelectedPkgId(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-bold text-gray-800 focus:ring-1 focus:ring-[#D6336C] cursor-pointer"
                        >
                          <option value="">No Food / Venue Hire Only</option>
                          {activePackages.map(pkg => (
                            <option key={pkg.id} value={pkg.id}>
                              {pkg.name} ({pkg.type}) — Rs. {pkg.perPlatePrice}/head
                            </option>
                          ))}
                        </select>

                        {/* Dishes Preview */}
                        {selectedPkg && (
                          <div className="p-3 bg-pink-50/50 border border-pink-100 rounded-2xl space-y-2">
                            <span className="text-[9px] font-black text-[#D6336C] uppercase tracking-wider block">Included Menu Dishes:</span>
                            <div className="flex flex-wrap gap-1">
                              {selectedPkg.dishes.map((dish, i) => (
                                <span key={i} className="text-[9px] bg-white text-slate-700 px-2 py-0.5 rounded-full border border-slate-100 font-medium">
                                  {dish}
                                </span>
                              ))}
                            </div>
                            {selectedPkg?.categories && (
                              <button 
                                type="button"
                                onClick={() => setShowMenuModal(true)}
                                className="w-full mt-2 py-1.5 bg-[#D6336C] hover:bg-[#B82554] text-white rounded-xl text-[9px] font-black tracking-wider uppercase transition-colors cursor-pointer flex items-center justify-center gap-1 shadow-sm border-0"
                              >
                                <Info className="w-3 h-3" /> View Full Categorized Menu
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Utility Charges */}
                      <div className="space-y-3 pt-3 border-t border-gray-100">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Utility Configuration</label>
                        
                        <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                          <label className="flex items-center gap-2.5 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={includeAC}
                              onChange={(e) => setIncludeAC(e.target.checked)}
                              className="w-4.5 h-4.5 rounded border-gray-300 text-[#D6336C] focus:ring-[#D6336C]"
                            />
                            <span>Air Conditioning (AC)</span>
                          </label>
                          <span className="text-slate-500 font-extrabold">+Rs. {activePricing.acCost}</span>
                        </div>

                        <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                          <label className="flex items-center gap-2.5 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={includeGenerator}
                              onChange={(e) => setIncludeGenerator(e.target.checked)}
                              className="w-4.5 h-4.5 rounded border-gray-300 text-[#D6336C] focus:ring-[#D6336C]"
                            />
                            <span>Generator / Backup setup</span>
                          </label>
                          <span className="text-slate-500 font-extrabold">+Rs. {activePricing.generatorCost}</span>
                        </div>
                      </div>

                      {/* Optional Add-ons */}
                      <div className="space-y-3 pt-3 border-t border-gray-100">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Optional Add-ons & Services</label>

                        {activePricing.decorAvailable && (
                          <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                            <label className="flex items-center gap-2.5 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={includeDecor}
                                onChange={(e) => setIncludeDecor(e.target.checked)}
                                className="w-4.5 h-4.5 rounded border-gray-300 text-[#D6336C] focus:ring-[#D6336C]"
                              />
                              <span>Premium Décor Packages</span>
                            </label>
                            <span className="text-slate-500 font-extrabold">+Rs. {activePricing.decorPrice}</span>
                          </div>
                        )}

                        {activePricing.soundAvailable && (
                          <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                            <label className="flex items-center gap-2.5 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={includeSound}
                                onChange={(e) => setIncludeSound(e.target.checked)}
                                className="w-4.5 h-4.5 rounded border-gray-300 text-[#D6336C] focus:ring-[#D6336C]"
                              />
                              <span>Sound & DJ Systems</span>
                            </label>
                            <span className="text-slate-500 font-extrabold">+Rs. {activePricing.soundPrice}</span>
                          </div>
                        )}

                        {activePricing.securityAvailable && (
                          <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                            <label className="flex items-center gap-2.5 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={includeSecurity}
                                onChange={(e) => setIncludeSecurity(e.target.checked)}
                                className="w-4.5 h-4.5 rounded border-gray-300 text-[#D6336C] focus:ring-[#D6336C]"
                              />
                              <span>Valet & Event Security</span>
                            </label>
                            <span className="text-slate-500 font-extrabold">+Rs. {activePricing.securityPrice}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Calculations Summary Breakdown */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2.5">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Cost Breakdown</span>
                      
                      <div className="flex justify-between items-center text-xs text-slate-600 font-medium">
                        <span>Base Hall Rent:</span>
                        <span className="font-bold text-slate-800">Rs. {baseRent}</span>
                      </div>

                      {cateringCost > 0 && (
                        <div className="flex justify-between items-center text-xs text-slate-600 font-medium">
                          <span>Catering Subtotal ({guestsCount} × Rs. {selectedPkg?.perPlatePrice}):</span>
                          <span className="font-bold text-slate-800">Rs. {cateringCost}</span>
                        </div>
                      )}

                      {utilitiesCost > 0 && (
                        <div className="flex justify-between items-center text-xs text-slate-600 font-medium">
                          <span>Utility Setup Fees:</span>
                          <span className="font-bold text-slate-800">Rs. {utilitiesCost}</span>
                        </div>
                      )}

                      {addonsCost > 0 && (
                        <div className="flex justify-between items-center text-xs text-slate-600 font-medium">
                          <span>Optional Services:</span>
                          <span className="font-bold text-slate-800">Rs. {addonsCost}</span>
                        </div>
                      )}

                      <div className="border-t border-slate-200/60 pt-2.5 flex justify-between items-center">
                        <span className="text-sm font-black text-slate-800">Total Estimation:</span>
                        <span className="text-xl font-black text-[#D6336C]">Rs. {totalEstimation}</span>
                      </div>
                    </div>

                    <button 
                      type="submit"
                      disabled={isSubmittingQuote}
                      className="w-full bg-gradient-to-r from-[#D6336C] to-[#B02A58] text-white py-4 rounded-xl font-bold shadow-md shadow-[#D6336C]/20 hover:shadow-lg transition-all hover:-translate-y-0.5 cursor-pointer text-center text-sm disabled:opacity-50"
                    >
                      {isSubmittingQuote ? (
                        <>
                          <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2 align-middle"></span>
                          TRANSMITTING PROPOSAL...
                        </>
                      ) : (
                        "Submit Dynamic Quote Proposal"
                      )}
                    </button>
                  </form>
                )}
              </div>

              {/* Dynamic Quote Form Toast Feedback Notification */}
              <AnimatePresence>
                {quoteToast.show && (
                  <motion.div 
                    initial={{ opacity: 0, y: -40, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.9 }}
                    className={`fixed top-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-xl border font-bold text-xs tracking-wider uppercase backdrop-blur-md transition-all
                      ${quoteToast.type === 'success' 
                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shadow-emerald-500/5' 
                        : 'bg-rose-500/10 text-rose-600 border-rose-500/20 shadow-rose-500/5'
                      }`}
                  >
                    <span className="material-symbols-outlined text-lg">
                      {quoteToast.type === 'success' ? 'check_circle' : 'error'}
                    </span>
                    {quoteToast.message}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Contact Info Card */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-900 mb-4">Contact Venue</h3>
                <div className="space-y-3">
                  {venue.phone_1 && (
                    <a href={`tel:${venue.phone_1}`} className="flex items-center gap-3 text-gray-600 hover:text-[#D6336C] transition-colors p-3 bg-gray-50 rounded-xl">
                      <Phone className="w-5 h-5" />
                      <span className="font-medium">{venue.phone_1}</span>
                    </a>
                  )}
                  {venue.phone_2 && (
                    <a href={`tel:${venue.phone_2}`} className="flex items-center gap-3 text-gray-600 hover:text-[#D6336C] transition-colors p-3 bg-gray-50 rounded-xl">
                      <Phone className="w-5 h-5" />
                      <span className="font-medium">{venue.phone_2}</span>
                    </a>
                  )}
                  {!venue.phone_1 && !venue.phone_2 && (
                    <p className="text-sm text-gray-500 italic">No contact numbers available.</p>
                  )}
                </div>
              </div>

            </div>
          </div>

        </div>
      </main>

      <Footer />

      {/* Dynamic Categorized Food Menu Modal */}
      <AnimatePresence>
        {showMenuModal && selectedPkg && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[85vh]"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-pink-50/20 to-white">
                <div>
                  <h3 className="text-xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#D6336C]">restaurant_menu</span>
                    {selectedPkg.name || 'Catering Menu Package'}
                  </h3>
                  <p className="text-xs text-gray-500 font-bold mt-1">Live Menu Categories, Custom Dish Selections, and Pricing.</p>
                </div>
                <button 
                  onClick={() => setShowMenuModal(false)}
                  className="w-10 h-10 rounded-full bg-gray-100 hover:bg-pink-100 text-gray-400 hover:text-[#D6336C] transition-all flex items-center justify-center cursor-pointer border-0 font-sans font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body / Accordion List */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 text-left">
                {selectedPkg.categories && selectedPkg.categories.map((category) => (
                  <div key={category.id} className="space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                      <span className="text-sm font-black text-[#D6336C] tracking-wide uppercase">{category.name}</span>
                      <span className="text-[10px] bg-pink-100 text-[#D6336C] px-2 py-0.5 rounded-full font-black">
                        {category.items ? category.items.filter(it => it.active).length : 0} Active Dishes
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {category.items && category.items.map((item) => (
                        <div 
                          key={item.id} 
                          className={`p-3.5 rounded-2xl border transition-all ${
                            item.active 
                              ? 'bg-white border-pink-100 shadow-sm' 
                              : 'bg-gray-50 border-gray-100 opacity-60'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <span className={`text-xs font-extrabold ${item.active ? 'text-gray-800 font-black' : 'text-gray-400 font-medium line-through'}`}>
                              {item.name}
                            </span>
                          </div>
                          {item.description && (
                            <p className="text-[10px] text-gray-500 font-medium leading-relaxed mt-1">
                              {item.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                <div className="text-left">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">Estimated Setup Cost</span>
                  <span className="text-lg font-black text-[#D6336C]">Rs. {selectedPkg?.perPlatePrice || 0} / Head</span>
                </div>
                <button 
                  onClick={() => setShowMenuModal(false)}
                  className="bg-gradient-to-r from-[#D6336C] to-[#B02A58] hover:shadow-lg text-white font-black text-xs uppercase tracking-wider px-6 py-3 rounded-full cursor-pointer transition-all border-0"
                >
                  Close Menu Viewer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <CustomerVenueChat
        venueSlug={venueSlug}
        venueName={venue?.hall_name || venue?.name}
      />
    </div>
  );
};

export default VenueDetails;
