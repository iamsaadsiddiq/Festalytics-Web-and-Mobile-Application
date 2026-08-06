"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { db } from "@/firebase";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { useVendorVenue } from "@/hooks/useVendorVenue";
import VenueCalendarWorkspace from "@/components/vendor/availability/VenueCalendarWorkspace";
import {
    EMPTY_PRICING,
    hydrateVenueFromFirestore,
    buildVenueSavePayload,
} from "@/lib/firestore/venueMyServicesState";

const MyServices = () => {
    const [activeTab, setActiveTab] = useState('Overview');
    const { venueId, isLoading: venueLoading } = useVendorVenue();
    const [businessName, setBusinessName] = useState("");
    const [vendorDescription, setVendorDescription] = useState("");
    const [streetAddress, setStreetAddress] = useState("");
    const [city, setCity] = useState("");
    const [postalCode, setPostalCode] = useState("");
    const [venueType, setVenueType] = useState("");
    const [venueCategories, setVenueCategories] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [venueStats, setVenueStats] = useState({
        totalBookings: 0,
        totalRevenue: 0,
        averageRating: 0,
    });
    const [serviceActive, setServiceActive] = useState(true);
    const [faqOpen, setFaqOpen] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);

    // Toast/Notification Pop-up state
    const [toast, setToast] = useState({ show: false, message: "", type: "success" });

    // Custom Modal System States
    const [modal, setModal] = useState({
        show: false,
        type: "", // 'add-category', 'add-dish', 'delete-confirm', 'confirm-discard', 'add-faq', 'edit-faq', 'delete-faq'
        data: null // Holds context like catId, itemId, etc.
    });

    // Modal Form inputs
    const [modalInputName, setModalInputName] = useState("");
    const [modalInputPrice, setModalInputPrice] = useState("");
    const [modalInputDesc, setModalInputDesc] = useState("");
    const [modalInputQ, setModalInputQ] = useState("");
    const [modalInputA, setModalInputA] = useState("");

    const [faqs, setFaqs] = useState([]);
    const [images, setImages] = useState([]);
    const [features, setFeatures] = useState([]);
    const [newFeature, setNewFeature] = useState("");
    const [pricing, setPricing] = useState({ ...EMPTY_PRICING });

    // -----------------------------------------------------------------
    // MENU BUILDER TAB STATE (Template Library & Accordion CRUD)
    // -----------------------------------------------------------------
    const [activePackageName, setActivePackageName] = useState("");
    const [activePackageStatus, setActivePackageStatus] = useState(true);
    const [expandedCategories, setExpandedCategories] = useState({});
    const [categories, setCategories] = useState([]);

    // Editing states for categories & items
    const [editingItemId, setEditingItemId] = useState(null);
    const [editItemName, setEditItemName] = useState("");
    const [editItemDesc, setEditItemDesc] = useState("");
    const [editItemPrice, setEditItemPrice] = useState("");

    const [editingCatId, setEditingCatId] = useState(null);
    const [editCatName, setEditCatName] = useState("");
    const [capacity, setCapacity] = useState(0);
    const [cateringPackages, setCateringPackages] = useState([]);

    const applyHydratedVenue = (hydrated) => {
        setBusinessName(hydrated.businessName);
        setVendorDescription(hydrated.vendorDescription);
        setServiceActive(hydrated.serviceActive);
        setCapacity(hydrated.capacity);
        setPricing(hydrated.pricing);
        setCateringPackages(hydrated.cateringPackages);
        setFeatures(hydrated.features);
        setFaqs(hydrated.faqs);
        setImages(hydrated.images);
        setCategories(hydrated.categories);
        setActivePackageName(hydrated.activePackageName);
        setActivePackageStatus(hydrated.activePackageStatus);
        setStreetAddress(hydrated.streetAddress);
        setCity(hydrated.city);
        setPostalCode(hydrated.postalCode);
        setVenueType(hydrated.venueType);
        setVenueCategories(hydrated.venueCategories);
        setReviews(hydrated.reviews);
        setVenueStats(hydrated.stats);
        if (hydrated.categories?.length > 0) {
            setExpandedCategories({ [hydrated.categories[0].id]: true });
        } else {
            setExpandedCategories({});
        }
        if (hydrated.faqs?.length > 0) {
            setFaqOpen({ [hydrated.faqs[0].id]: true });
        }
    };

    // Helper to display gorgeous custom toast notifications
    const triggerToast = (message, type = "success") => {
        setToast({ show: true, message, type });
        setTimeout(() => {
            setToast(prev => ({ ...prev, show: false }));
        }, 4000);
    };

    // Template Pre-built Library datasets
    const templates = {
        chicken: {
            packageName: "Chicken Menu Package",
            categories: [
                {
                    id: "cat-1",
                    name: "Main Course",
                    icon: "dinner_dining",
                    items: [
                        { id: "item-1", name: "Chicken Karahi", description: "Wok-fried chicken with ginger, green chillies and traditional spices.", price: 350, active: true },
                        { id: "item-2", name: "Chicken Biryani", description: "Aromatic basmati rice layered with spiced chicken and saffron.", price: 300, active: true },
                        { id: "item-3", name: "Chicken Handi", description: "Boneless chicken cooked in a rich, creamy tomato-based gravy.", price: 320, active: true }
                    ]
                },
                {
                    id: "cat-2",
                    name: "Sides & Salads",
                    icon: "bakery_dining",
                    items: [
                        { id: "item-4", name: "Fresh Salad", description: "Seasonal garden fresh vegetables slice cut.", price: 50, active: true },
                        { id: "item-5", name: "Mint Raita", description: "Creamy yogurt infused with fresh mint leaves.", price: 40, active: true }
                    ]
                },
                {
                    id: "cat-3",
                    name: "Beverages",
                    icon: "local_bar",
                    items: [
                        { id: "item-6", name: "Soft Drinks", description: "Assorted cold carbonated sodas.", price: 50, active: true },
                        { id: "item-7", name: "Mint Margarita", description: "Refreshing blend of fresh mint, lime, and crushed ice.", price: 90, active: true }
                    ]
                },
                {
                    id: "cat-4",
                    name: "Desserts",
                    icon: "icecream",
                    items: [
                        { id: "item-8", name: "Shahi Kheer", description: "Traditional slow-cooked rice pudding topped with almonds.", price: 120, active: true }
                    ]
                }
            ]
        },
        beef: {
            packageName: "Beef Signature Menu",
            categories: [
                {
                    id: "cat-1",
                    name: "Main Course",
                    icon: "dinner_dining",
                    items: [
                        { id: "item-b1", name: "Beef Biryani", description: "Spiced beef nested in fragrant saffron basmati rice.", price: 380, active: true },
                        { id: "item-b2", name: "Beef Kabab Platters", description: "Skewered charbroiled minced beef kababs.", price: 350, active: true }
                    ]
                },
                {
                    id: "cat-2",
                    name: "Sides & Salads",
                    icon: "bakery_dining",
                    items: [
                        { id: "item-b3", name: "Special Salad", description: "Lettuce, tomatoes, red onions with lemon herb dressings.", price: 60, active: true },
                        { id: "item-b4", name: "Roghni Naan", description: "Freshly baked buttered sesame flatbread.", price: 40, active: true }
                    ]
                },
                {
                    id: "cat-3",
                    name: "Beverages",
                    icon: "local_bar",
                    items: [
                        { id: "item-b5", name: "Lassi & Shakes", description: "Chilled yogurt shake or mango milkshake.", price: 80, active: true }
                    ]
                },
                {
                    id: "cat-4",
                    name: "Desserts",
                    icon: "icecream",
                    items: [
                        { id: "item-b6", name: "Gulab Jamun", description: "Warm syrup soaked condensed milk balls.", price: 100, active: true }
                    ]
                }
            ]
        },
        mutton: {
            packageName: "Mutton Royal Banquet",
            categories: [
                {
                    id: "cat-1",
                    name: "Main Course",
                    icon: "dinner_dining",
                    items: [
                        { id: "item-m1", name: "Mutton Karahi", description: "Royal mutton slow cooked in a base of tomatoes, garlic, ginger and spices.", price: 450, active: true },
                        { id: "item-m2", name: "Mutton Pulao", description: "Premium basmati rice simmered in rich mutton broth.", price: 400, active: true }
                    ]
                },
                {
                    id: "cat-2",
                    name: "Sides & Salads",
                    icon: "bakery_dining",
                    items: [
                        { id: "item-m3", name: "Garlic Butter Naan", description: "Oven baked bread with fresh garlic and cilantro butter.", price: 50, active: true }
                    ]
                },
                {
                    id: "cat-3",
                    name: "Beverages",
                    icon: "local_bar",
                    items: [
                        { id: "item-m4", name: "Fresh Juice Platter", description: "Squeezed orange, apple, and grape juice collection.", price: 120, active: true }
                    ]
                },
                {
                    id: "cat-4",
                    name: "Desserts",
                    icon: "icecream",
                    items: [
                        { id: "item-m5", name: "Zafrani Rasmalai", description: "Saffron milk infused cottage cheese discs.", price: 130, active: true }
                    ]
                }
            ]
        },
        mehndi: {
            packageName: "Mehndi Special Feast",
            categories: [
                {
                    id: "cat-1",
                    name: "Main Course",
                    icon: "celebration",
                    items: [
                        { id: "item-e1", name: "Puri Halwa Chana", description: "Crispy fried puris served with semolina halwa and spicy chickpea gravy.", price: 180, active: true },
                        { id: "item-e2", name: "Gol Gappay Setup", description: "Crispy semolina spheres with sweet and sour spiced water.", price: 120, active: true }
                    ]
                },
                {
                    id: "cat-2",
                    name: "Sides & Salads",
                    icon: "bakery_dining",
                    items: [
                        { id: "item-e3", name: "Dahi Bhallay", description: "Soft lentil dumplings soaked in seasoned thick yogurt.", price: 90, active: true }
                    ]
                },
                {
                    id: "cat-3",
                    name: "Beverages",
                    icon: "local_bar",
                    items: [
                        { id: "item-e4", name: "Special Kashmiri Chai", description: "Traditional pink tea topped with pistachios.", price: 60, active: true }
                    ]
                },
                {
                    id: "cat-4",
                    name: "Desserts",
                    icon: "icecream",
                    items: [
                        { id: "item-e5", name: "Hot Live Jalebi", description: "Freshly made spiral crispy flour sweets soaked in sugar syrup.", price: 70, active: true }
                    ]
                }
            ]
        },
        empty: {
            packageName: "My Custom Menu",
            categories: [
                { id: "cat-1", name: "Main Course", icon: "dinner_dining", items: [] },
                { id: "cat-2", name: "Sides & Salads", icon: "bakery_dining", items: [] },
                { id: "cat-3", name: "Beverages", icon: "local_bar", items: [] },
                { id: "cat-4", name: "Desserts", icon: "icecream", items: [] }
            ]
        }
    };

    const tabs = ['Overview', 'Images', 'Description', 'Pricing', 'Menu', 'Calendar', 'Location', 'Reviews', 'FAQs'];

    useEffect(() => {
        if (!venueId || venueLoading) {
            if (!venueLoading) setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setLoadError(null);

        const docRef = doc(db, "venues", venueId);
        const unsubscribe = onSnapshot(
            docRef,
            (snap) => {
                const hydrated = hydrateVenueFromFirestore(snap.exists() ? snap.data() : undefined);
                applyHydratedVenue(hydrated);
                setIsLoading(false);
            },
            (err) => {
                console.error("[MyServices] venue snapshot error:", err);
                setLoadError(err.message);
                setIsLoading(false);
            }
        );

        return () => unsubscribe();
    }, [venueId, venueLoading]);

    const toggleFaq = (faqId) => {
        setFaqOpen(prev => ({ ...prev, [faqId]: !prev[faqId] }));
    };

    const handleAddFeature = (e) => {
        e.preventDefault();
        if (!newFeature.trim()) return;
        setFeatures([...features, newFeature.trim()]);
        setNewFeature("");
        triggerToast("Amenity feature added successfully!");
    };

    const handleRemoveFeature = (idx) => {
        setFeatures(features.filter((_, i) => i !== idx));
        triggerToast("Amenity feature removed.", "info");
    };

    const handleSaveChanges = async () => {
        if (!venueId) {
            triggerToast("No venue linked to your account.", "error");
            return;
        }
        setIsSaving(true);
        try {
            const docRef = doc(db, "venues", venueId);
            const payload = buildVenueSavePayload({
                businessName,
                vendorDescription,
                pricing,
                activePackageName,
                activePackageStatus,
                categories,
                cateringPackages,
                features,
                serviceActive,
                faqs,
                images,
                capacity,
                streetAddress,
                city,
                postalCode,
                venueType,
                venueCategories,
                reviews,
                venueId,
            });
            const { _derivedPackages, ...firestorePayload } = payload;
            await updateDoc(docRef, firestorePayload);
            if (_derivedPackages) setCateringPackages(_derivedPackages);
            triggerToast("Changes saved to your venue profile.");
        } catch (err) {
            console.error("Firestore Write Failed: ", err);
            triggerToast(
                `Publish Failed: ${err.code === "permission-denied" ? "Missing or insufficient database permissions. Please log in." : err.message}`,
                "error"
            );
        } finally {
            setIsSaving(false);
        }
    };

    // -----------------------------------------------------------------
    // MENU ACCORDION BUILDER LOGIC
    // -----------------------------------------------------------------
    const toggleCategoryAccordion = (catId) => {
        setExpandedCategories(prev => ({ ...prev, [catId]: !prev[catId] }));
    };

    const loadTemplate = (templateKey) => {
        const t = templates[templateKey];
        if (!t) return;
        
        const pkgType = templateKey === 'chicken' ? 'Chicken' :
                        templateKey === 'beef' ? 'Beef' :
                        templateKey === 'mutton' ? 'Mutton' :
                        templateKey === 'mehndi' ? 'Mehndi' : 'Chicken';
        
        const existingPkg = cateringPackages.find(p => p.type === pkgType);
        if (existingPkg && existingPkg.categories && existingPkg.categories.length > 0) {
            setActivePackageName(existingPkg.name);
            setCategories(existingPkg.categories);
            triggerToast(`Loaded customized "${existingPkg.name}" from database.`);
        } else {
            setActivePackageName(t.packageName);
            setCategories(t.categories);
            triggerToast(`Loaded standard "${t.packageName}" template.`);
        }
        
        // Auto expand first category
        setExpandedCategories({ "cat-1": true });
    };

    // Modal Add Category Trigger
    const triggerAddCategoryModal = () => {
        setModalInputName("");
        setModal({ show: true, type: "add-category", data: null });
    };

    const executeAddCategory = () => {
        if (!modalInputName.trim()) return;
        const newCatId = `cat-${Date.now()}`;
        const newCat = {
            id: newCatId,
            name: modalInputName.trim(),
            icon: "restaurant_menu",
            items: []
        };
        setCategories([...categories, newCat]);
        setExpandedCategories(prev => ({ ...prev, [newCatId]: true }));
        setModal({ show: false, type: "", data: null });
        triggerToast(`Created category "${newCat.name}"`);
    };

    // Modal Delete Category Trigger
    const triggerDeleteCategoryModal = (catId, catName) => {
        setModal({ show: true, type: "delete-category", data: { catId, catName } });
    };

    const executeDeleteCategory = () => {
        const { catId, catName } = modal.data;
        setCategories(categories.filter(c => c.id !== catId));
        setModal({ show: false, type: "", data: null });
        triggerToast(`Deleted category "${catName}"`, "info");
    };

    // Edit Category Name
    const startEditCategory = (catId, currentName) => {
        setEditingCatId(catId);
        setEditCatName(currentName);
    };

    const saveCategoryName = (catId) => {
        if (!editCatName.trim()) return;
        setCategories(categories.map(c => {
            if (c.id === catId) {
                triggerToast(`Category renamed to "${editCatName.trim()}"`);
                return { ...c, name: editCatName.trim() };
            }
            return c;
        }));
        setEditingCatId(null);
    };

    // Modal Add Dish Trigger
    const triggerAddDishModal = (catId) => {
        setModalInputName("");
        setModalInputPrice("150");
        setModalInputDesc("Delicious freshly prepared banquet specialty.");
        setModal({ show: true, type: "add-dish", data: { catId } });
    };

    const executeAddDish = () => {
        if (!modalInputName.trim()) return;
        const { catId } = modal.data;
        const price = parseFloat(modalInputPrice) || 0;
        
        const newItem = {
            id: `item-${Date.now()}`,
            name: modalInputName.trim(),
            description: modalInputDesc.trim() || "Premium culinary selection.",
            price: price,
            active: true
        };

        setCategories(categories.map(c => {
            if (c.id !== catId) return c;
            return { ...c, items: [...c.items, newItem] };
        }));

        setModal({ show: false, type: "", data: null });
        triggerToast(`Added dish "${newItem.name}" to menu`);
    };

    // Modal Delete Item Trigger
    const triggerDeleteItemModal = (catId, itemId, itemName) => {
        setModal({ show: true, type: "delete-item", data: { catId, itemId, itemName } });
    };

    const executeDeleteItem = () => {
        const { catId, itemId, itemName } = modal.data;
        setCategories(categories.map(c => {
            if (c.id !== catId) return c;
            return { ...c, items: c.items.filter(item => item.id !== itemId) };
        }));
        setModal({ show: false, type: "", data: null });
        triggerToast(`Removed dish "${itemName}"`, "info");
    };

    // Toggle Active Status of individual Item
    const handleToggleItemStatus = (catId, itemId) => {
        setCategories(categories.map(c => {
            if (c.id !== catId) return c;
            return {
                ...c,
                items: c.items.map(item => {
                    if (item.id === itemId) {
                        const nextStatus = !item.active;
                        triggerToast(`"${item.name}" is now ${nextStatus ? 'Active' : 'Inactive'}`, "info");
                        return { ...item, active: nextStatus };
                    }
                    return item;
                })
            };
        }));
    };

    // -----------------------------------------------------------------
    // FAQ BUILDER ACTIONS
    // -----------------------------------------------------------------
    const triggerAddFaqModal = () => {
        if (faqs.length >= 10) {
            triggerToast("Maximum limit of 10 FAQs reached! Please edit or delete an existing FAQ first.", "error");
            return;
        }
        setModalInputQ("");
        setModalInputA("");
        setModal({ show: true, type: "add-faq", data: null });
    };

    const executeAddFaq = () => {
        if (!modalInputQ.trim() || !modalInputA.trim()) return;
        if (faqs.length >= 10) {
            triggerToast("Maximum limit of 10 FAQs reached! Please edit or delete an existing FAQ first.", "error");
            setModal({ show: false, type: "", data: null });
            return;
        }
        const newFaq = {
            id: `faq-${Date.now()}`,
            question: modalInputQ.trim(),
            answer: modalInputA.trim(),
            active: true
        };
        setFaqs([...faqs, newFaq]);
        setFaqOpen(prev => ({ ...prev, [newFaq.id]: true }));
        setModal({ show: false, type: "", data: null });
        triggerToast("New FAQ added successfully!");
    };

    const triggerEditFaqModal = (faq) => {
        setModalInputQ(faq.question);
        setModalInputA(faq.answer);
        setModal({ show: true, type: "edit-faq", data: { faqId: faq.id } });
    };

    const executeEditFaq = () => {
        if (!modalInputQ.trim() || !modalInputA.trim()) return;
        const { faqId } = modal.data;
        setFaqs(faqs.map(f => {
            if (f.id === faqId) {
                return { ...f, question: modalInputQ.trim(), answer: modalInputA.trim() };
            }
            return f;
        }));
        setModal({ show: false, type: "", data: null });
        triggerToast("FAQ changes saved!");
    };

    const triggerDeleteFaqModal = (faqId, question) => {
        setModal({ show: true, type: "delete-faq", data: { faqId, question } });
    };

    const executeDeleteFaq = () => {
        const { faqId } = modal.data;
        setFaqs(faqs.filter(f => f.id !== faqId));
        setModal({ show: false, type: "", data: null });
        triggerToast("FAQ deleted successfully.", "info");
    };

    // -----------------------------------------------------------------
    // IMAGE GALLERY DRAG-AND-DROP ACTIONS
    // -----------------------------------------------------------------
    const handleImageDragStart = (e, index) => {
        e.dataTransfer.setData("text/plain", index.toString());
        e.dataTransfer.effectAllowed = "move";
    };

    const handleImageDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleImageDrop = (e, targetIndex) => {
        e.preventDefault();
        const sourceIndexStr = e.dataTransfer.getData("text/plain");
        if (sourceIndexStr === undefined || sourceIndexStr === "") return;
        const sourceIndex = parseInt(sourceIndexStr, 10);
        if (isNaN(sourceIndex) || sourceIndex === targetIndex) return;

        const updatedImages = [...images];
        const [movedImage] = updatedImages.splice(sourceIndex, 1);
        updatedImages.splice(targetIndex, 0, movedImage);

        // Update isPrimary attribute: first item is primary, others are false
        const finalImages = updatedImages.map((img, idx) => ({
            ...img,
            isPrimary: idx === 0
        }));

        setImages(finalImages);
        triggerToast("Gallery order updated successfully!");
    };

    const handleAddImage = (url, label) => {
        if (!url) return;
        const newImg = {
            id: `img-${Date.now()}`,
            url,
            label: label || `Gallery Image #${images.length + 1}`,
            isPrimary: images.length === 0
        };
        setImages([...images, newImg]);
        triggerToast("New image added to gallery!");
    };

    const handleDeleteImage = (imgId) => {
        const wasPrimary = images.find(img => img.id === imgId)?.isPrimary;
        const filtered = images.filter(img => img.id !== imgId);
        
        // Auto assign primary to first if primary was deleted
        const final = filtered.map((img, idx) => ({
            ...img,
            isPrimary: wasPrimary ? idx === 0 : img.isPrimary
        }));
        
        setImages(final);
        triggerToast("Image removed from gallery.", "info");
    };

    // Inline row editing configuration
    const handleStartEditItem = (item) => {
        setEditingItemId(item.id);
        setEditItemName(item.name);
        setEditItemDesc(item.description);
        setEditItemPrice(item.price.toString());
    };

    const handleSaveItemChanges = (catId, itemId) => {
        if (!editItemName.trim()) return;
        setCategories(categories.map(c => {
            if (c.id !== catId) return c;
            return {
                ...c,
                items: c.items.map(item => {
                    if (item.id === itemId) {
                        triggerToast(`Saved changes for "${editItemName.trim()}"`);
                        return {
                            ...item,
                            name: editItemName.trim(),
                            description: editItemDesc.trim(),
                            price: parseFloat(editItemPrice) || 0
                        };
                    }
                    return item;
                })
            };
        }));
        setEditingItemId(null);
    };

    // Discard all unsaved inputs trigger modal
    const triggerDiscardModal = () => {
        setModal({ show: true, type: "confirm-discard", data: null });
    };

    // Calculates totals dynamically for sticky footer
    const totalItemsCount = categories.reduce((total, cat) => total + cat.items.filter(it => it.active).length, 0);
    const estimatedTotalMenuCost = categories.reduce((total, cat) => {
        const catSub = cat.items.filter(it => it.active).reduce((sum, item) => sum + item.price, 0);
        return total + catSub;
    }, 0);

    if (venueLoading || isLoading) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
                <span className="material-symbols-outlined text-5xl text-primary animate-spin">sync</span>
                <p className="text-sm font-black text-secondary tracking-widest uppercase">
                    Loading {venueId ? `venues/${venueId}` : "your venue"}…
                </p>
            </div>
        );
    }

    if (loadError) {
        return (
            <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4 text-center px-6">
                <span className="material-symbols-outlined text-5xl text-error">error</span>
                <p className="text-sm font-bold text-on-surface-variant">{loadError}</p>
            </div>
        );
    }

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8 max-w-7xl mx-auto w-full pb-36 relative"
        >
            {/* Custom Dynamic Notification Toast */}
            <AnimatePresence>
                {toast.show && (
                    <motion.div 
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="fixed bottom-24 right-6 z-[100] bg-slate-900 text-white rounded-2xl px-6 py-4 shadow-xl flex items-center gap-3 border border-slate-800"
                    >
                        <span className={`material-symbols-outlined ${toast.type === 'error' ? 'text-red-500' : toast.type === 'info' ? 'text-blue-400' : 'text-green-400'}`}>
                            {toast.type === 'error' ? 'error' : toast.type === 'info' ? 'info' : 'check_circle'}
                        </span>
                        <span className="text-xs font-bold font-body">{toast.message}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Custom Aesthetic Modals System Overlay */}
            <AnimatePresence>
                {modal.show && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[99] flex items-center justify-center p-4"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 space-y-6 relative overflow-hidden"
                        >
                            {/* Modal Header Decoration */}
                            <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                                <div className={`p-2 rounded-xl text-white ${
                                    modal.type.includes('delete') ? 'bg-red-500' : 'bg-primary'
                                }`}>
                                    <span className="material-symbols-outlined">
                                        {modal.type === 'add-category' ? 'category' : 
                                         modal.type === 'add-dish' ? 'restaurant' : 
                                         modal.type.includes('delete') ? 'warning' : 'help'}
                                    </span>
                                </div>
                                <h3 className="text-lg font-black text-slate-800 tracking-tight capitalize">
                                    {modal.type.replace('-', ' ')}
                                </h3>
                            </div>

                            {/* Modal Forms Body */}
                            {modal.type === 'add-category' && (
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category Name</label>
                                        <input 
                                            type="text"
                                            value={modalInputName}
                                            onChange={(e) => setModalInputName(e.target.value)}
                                            placeholder="e.g. Traditional Appetizers"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-xs font-bold text-slate-800 focus:ring-1 focus:ring-primary focus:border-transparent"
                                        />
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <button 
                                            onClick={() => setModal({ show: false, type: "", data: null })}
                                            className="flex-1 py-3 rounded-full text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            onClick={executeAddCategory}
                                            className="flex-1 py-3 rounded-full text-xs font-bold text-white bg-primary shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
                                        >
                                            Create Category
                                        </button>
                                    </div>
                                </div>
                            )}

                            {modal.type === 'add-dish' && (
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dish Name</label>
                                        <input 
                                            type="text"
                                            value={modalInputName}
                                            onChange={(e) => setModalInputName(e.target.value)}
                                            placeholder="e.g. Chicken Seekh Kabab"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-xs font-bold text-slate-800 focus:ring-1 focus:ring-primary focus:border-transparent"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Per Plate Price (Rs.)</label>
                                        <input 
                                            type="number"
                                            value={modalInputPrice}
                                            onChange={(e) => setModalInputPrice(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-xs font-black text-primary focus:ring-1 focus:ring-primary focus:border-transparent"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ingredients / Description</label>
                                        <textarea 
                                            rows="2"
                                            value={modalInputDesc}
                                            onChange={(e) => setModalInputDesc(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-xs font-bold text-slate-600 focus:ring-1 focus:ring-primary focus:border-transparent resize-none"
                                        />
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <button 
                                            onClick={() => setModal({ show: false, type: "", data: null })}
                                            className="flex-1 py-3 rounded-full text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            onClick={executeAddDish}
                                            className="flex-1 py-3 rounded-full text-xs font-bold text-white bg-primary shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
                                        >
                                            Add to Category
                                        </button>
                                    </div>
                                </div>
                            )}

                            {modal.type === 'delete-category' && (
                                <div className="space-y-4">
                                    <p className="text-xs text-slate-600 font-bold leading-relaxed">
                                        Are you absolutely sure you want to delete category <strong className="text-slate-900 font-black">"{modal.data?.catName}"</strong>? This will permanently wipe out all associated menu dishes inside it.
                                    </p>
                                    <div className="flex gap-3 pt-2">
                                        <button 
                                            onClick={() => setModal({ show: false, type: "", data: null })}
                                            className="flex-1 py-3 rounded-full text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                                        >
                                            Go Back
                                        </button>
                                        <button 
                                            onClick={executeDeleteCategory}
                                            className="flex-1 py-3 rounded-full text-xs font-bold text-white bg-red-500 shadow-lg shadow-red-500/20 hover:scale-[1.02] transition-all"
                                        >
                                            Confirm Delete
                                        </button>
                                    </div>
                                </div>
                            )}

                            {modal.type === 'delete-item' && (
                                <div className="space-y-4">
                                    <p className="text-xs text-slate-600 font-bold leading-relaxed">
                                        Are you sure you want to delete <strong className="text-slate-900 font-black">"{modal.data?.itemName}"</strong> from the catering template menu?
                                    </p>
                                    <div className="flex gap-3 pt-2">
                                        <button 
                                            onClick={() => setModal({ show: false, type: "", data: null })}
                                            className="flex-1 py-3 rounded-full text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                                        >
                                            Go Back
                                        </button>
                                        <button 
                                            onClick={executeDeleteItem}
                                            className="flex-1 py-3 rounded-full text-xs font-bold text-white bg-red-500 shadow-lg shadow-red-500/20 hover:scale-[1.02] transition-all"
                                        >
                                            Confirm Delete
                                        </button>
                                    </div>
                                </div>
                            )}

                            {modal.type === 'confirm-discard' && (
                                <div className="space-y-4">
                                    <p className="text-xs text-slate-600 font-bold leading-relaxed font-body">
                                        Are you sure you want to discard your changes? All unsaved modifications in Pricing and Menu tab builder will be permanently lost.
                                    </p>
                                    <div className="flex gap-3 pt-2">
                                        <button 
                                            onClick={() => setModal({ show: false, type: "", data: null })}
                                            className="flex-1 py-3 rounded-full text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                                        >
                                            Go Back
                                        </button>
                                        <button 
                                            onClick={() => window.location.reload()}
                                            className="flex-1 py-3 rounded-full text-xs font-bold text-white bg-red-500 shadow-lg shadow-red-500/20 hover:scale-[1.02] transition-all"
                                        >
                                            Discard Everything
                                        </button>
                                    </div>
                                </div>
                            )}

                            {modal.type === 'add-faq' && (
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Question Text</label>
                                        <input 
                                            type="text"
                                            value={modalInputQ}
                                            onChange={(e) => setModalInputQ(e.target.value)}
                                            placeholder="e.g. Is valet parking available?"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-xs font-bold text-slate-800 focus:ring-1 focus:ring-primary focus:border-transparent"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Answer Text</label>
                                        <textarea 
                                            rows="4"
                                            value={modalInputA}
                                            onChange={(e) => setModalInputA(e.target.value)}
                                            placeholder="Provide a detailed, helpful answer for your clients..."
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-xs font-bold text-slate-600 focus:ring-1 focus:ring-primary focus:border-transparent resize-none"
                                        />
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <button 
                                            onClick={() => setModal({ show: false, type: "", data: null })}
                                            className="flex-1 py-3 rounded-full text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            onClick={executeAddFaq}
                                            className="flex-1 py-3 rounded-full text-xs font-bold text-white bg-primary shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
                                        >
                                            Create FAQ
                                        </button>
                                    </div>
                                </div>
                            )}

                            {modal.type === 'edit-faq' && (
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Question Text</label>
                                        <input 
                                            type="text"
                                            value={modalInputQ}
                                            onChange={(e) => setModalInputQ(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-xs font-bold text-slate-800 focus:ring-1 focus:ring-primary focus:border-transparent"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Answer Text</label>
                                        <textarea 
                                            rows="4"
                                            value={modalInputA}
                                            onChange={(e) => setModalInputA(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-xs font-bold text-slate-600 focus:ring-1 focus:ring-primary focus:border-transparent resize-none"
                                        />
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <button 
                                            onClick={() => setModal({ show: false, type: "", data: null })}
                                            className="flex-1 py-3 rounded-full text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            onClick={executeEditFaq}
                                            className="flex-1 py-3 rounded-full text-xs font-bold text-white bg-primary shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
                                        >
                                            Save Changes
                                        </button>
                                    </div>
                                </div>
                            )}

                            {modal.type === 'delete-faq' && (
                                <div className="space-y-4">
                                    <p className="text-xs text-slate-600 font-bold leading-relaxed">
                                        Are you absolutely sure you want to delete the FAQ: <strong className="text-slate-900 font-black">"{modal.data?.question}"</strong>? This will remove it from the client-end venue views immediately.
                                    </p>
                                    <div className="flex gap-3 pt-2">
                                        <button 
                                            onClick={() => setModal({ show: false, type: "", data: null })}
                                            className="flex-1 py-3 rounded-full text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                                        >
                                            Go Back
                                        </button>
                                        <button 
                                            onClick={executeDeleteFaq}
                                            className="flex-1 py-3 rounded-full text-xs font-bold text-white bg-red-500 shadow-lg shadow-red-500/20 hover:scale-[1.02] transition-all"
                                        >
                                            Confirm Delete
                                        </button>
                                    </div>
                                </div>
                            )}

                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Breadcrumbs & Header Actions */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                    <nav className="flex items-center gap-2 text-xs font-bold text-outline uppercase tracking-widest">
                        <Link href="/vendor-dashboard" className="hover:text-primary transition-colors">Dashboard</Link>
                        <span className="material-symbols-outlined text-xs text-primary">chevron_right</span>
                        <span className="text-primary">My Services</span>
                    </nav>
                    <h2 className="text-3xl font-black text-on-surface tracking-tight">
                        Edit Service:{" "}
                        <span className="text-secondary">
                            {businessName || venueId?.replace(/-/g, " ") || "Your Venue"}
                        </span>
                    </h2>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={triggerDiscardModal}
                        className="px-6 py-2.5 rounded-full font-bold text-secondary bg-surface-container-high hover:bg-secondary-container transition-colors bouncy-microinteraction cursor-pointer text-xs"
                    >
                        Discard
                    </button>
                    <button 
                        onClick={handleSaveChanges}
                        disabled={isSaving}
                        className="px-8 py-2.5 rounded-full font-bold text-on-primary bg-primary shadow-[0_4px_16px_rgba(224,64,160,0.3)] hover:scale-105 transition-all bouncy-microinteraction cursor-pointer flex items-center gap-2 text-xs"
                    >
                        {isSaving ? (
                            <>
                                <span className="material-symbols-outlined text-lg animate-spin">sync</span>
                                Publishing...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined text-lg">publish</span>
                                Save Changes
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Sub-Navigation Tabs */}
            <div className="bg-surface-container rounded-full p-1.5 flex flex-wrap items-center shadow-sm overflow-x-auto gap-1">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab;
                    return (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all cursor-pointer ${
                                isActive 
                                    ? 'bg-primary text-on-primary shadow-md' 
                                    : 'text-on-surface-variant hover:text-primary'
                            }`}
                        >
                            {tab}
                        </button>
                    );
                })}
            </div>

            {/* Dashboard Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Metrics Sidebar (Left - Always Active/Unchanged) */}
                <div className="md:col-span-4 space-y-6">
                    {/* Status Card */}
                    <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-outline-variant/30 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-outline uppercase tracking-wider">Service Status</p>
                            <h4 className="text-xl font-black text-on-surface">{serviceActive ? 'Currently Active' : 'Currently Paused'}</h4>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                checked={serviceActive} 
                                onChange={(e) => setServiceActive(e.target.checked)} 
                                className="sr-only peer" 
                                type="checkbox"
                            />
                            <div className="w-14 h-8 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary shadow-inner"></div>
                        </label>
                    </div>

                    {/* Quick Metrics */}
                    <div className="bg-primary/5 p-6 rounded-3xl border border-primary-fixed-dim">
                        <h4 className="text-sm font-bold text-primary-fixed-variant mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-lg">insights</span> Lifetime Performance
                        </h4>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-on-surface-variant font-medium">Total Bookings</span>
                                <span className="font-black text-primary text-xl">{venueStats.totalBookings || "—"}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-on-surface-variant font-medium">Total Revenue</span>
                                <span className="font-black text-secondary text-xl">
                                    {venueStats.totalRevenue ? `Rs. ${venueStats.totalRevenue.toLocaleString()}` : "—"}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-on-surface-variant font-medium">Average Rating</span>
                                <div className="flex items-center gap-1">
                                    <span className="font-black text-tertiary text-xl">
                                        {venueStats.averageRating ? venueStats.averageRating.toFixed(1) : "—"}
                                    </span>
                                    <span className="material-symbols-outlined text-tertiary text-sm fill-1">star</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Booking Trends Mini-Chart Simulation */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-outline-variant/30">
                        <p className="text-xs font-bold text-outline uppercase mb-4">Weekly Engagement</p>
                        <div className="flex items-end gap-2 h-24">
                            <div className="flex-1 bg-primary/20 rounded-t-full" style={{ height: '40%' }}></div>
                            <div className="flex-1 bg-primary/40 rounded-t-full" style={{ height: '65%' }}></div>
                            <div className="flex-1 bg-primary rounded-t-full" style={{ height: '85%' }}></div>
                            <div className="flex-1 bg-primary/60 rounded-t-full" style={{ height: '50%' }}></div>
                            <div className="flex-1 bg-primary/30 rounded-t-full" style={{ height: '30%' }}></div>
                            <div className="flex-1 bg-primary/80 rounded-t-full" style={{ height: '75%' }}></div>
                            <div className="flex-1 bg-primary rounded-t-full shadow-[0_-4px_12px_rgba(224,64,160,0.2)]" style={{ height: '100%' }}></div>
                        </div>
                        <div className="flex justify-between mt-2 text-[10px] font-bold text-outline">
                            <span>MON</span><span>WED</span><span>FRI</span><span>SUN</span>
                        </div>
                    </div>
                </div>

                {/* Main Dynamic Content Area (Right side changes on tab click) */}
                <div className="md:col-span-8 space-y-6">
                    <AnimatePresence mode="wait">
                        
                        {/* Tab 1: Overview */}
                        {activeTab === 'Overview' && (
                            <motion.div
                                key="Overview"
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                className="space-y-6"
                            >
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {/* Main Preview Image */}
                                    <div className="sm:col-span-2 relative h-72 rounded-3xl overflow-hidden group shadow-lg">
                                        <img 
                                            alt={images[0]?.label || "A luxurious grand ballroom"} 
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                            src={images[0]?.url || "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=2698"}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                        <div className="absolute bottom-6 left-6 text-white">
                                            <h3 className="text-2xl font-black">{images[0]?.label || "Main Banner Image"}</h3>
                                            <p className="text-sm opacity-90">First impression for potential clients (1st Image)</p>
                                        </div>
                                        <button 
                                            onClick={() => setActiveTab('Images')}
                                            className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/40 transition-colors cursor-pointer"
                                        >
                                            <span className="material-symbols-outlined text-white">edit</span>
                                        </button>
                                    </div>

                                    {/* Info Card 1 */}
                                    <div className="bg-white p-6 rounded-3xl border border-outline-variant/30 hover:border-primary/50 transition-colors shadow-sm">
                                        <div className="flex items-center gap-3 mb-4">
                                            <span className="material-symbols-outlined text-primary p-2 bg-primary-fixed rounded-full">info</span>
                                            <h5 className="font-black text-on-surface">Basic Info</h5>
                                        </div>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-[10px] font-bold text-outline uppercase tracking-wider">Service Name</label>
                                                <p className="font-bold text-secondary text-sm">
                                                    {businessName || "— Add name in Description or Business Settings"}
                                                </p>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-outline uppercase tracking-wider">Category</label>
                                                <p className="font-bold text-on-surface text-sm">
                                                    {venueType || venueCategories[0] || "—"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Info Card 2 */}
                                    <div className="bg-white p-6 rounded-3xl border border-outline-variant/30 hover:border-tertiary/50 transition-colors shadow-sm">
                                        <div className="flex items-center gap-3 mb-4">
                                            <span className="material-symbols-outlined text-tertiary p-2 bg-tertiary-fixed rounded-full">groups</span>
                                            <h5 className="font-black text-on-surface">Capacity & Fit</h5>
                                        </div>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-[10px] font-bold text-outline uppercase tracking-wider">Max Guests</label>
                                                <p className="font-bold text-secondary text-sm">
                                                    {capacity > 0 ? `${capacity} People` : "— Set capacity"}
                                                </p>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-outline uppercase tracking-wider">Min Duration</label>
                                                <p className="font-bold text-on-surface text-sm">4 Hours</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Recent Activity Section */}
                                <div className="bg-surface-container-low p-8 rounded-3xl border border-outline-variant/20 shadow-sm">
                                    <div className="flex items-center justify-between mb-6">
                                        <h4 className="text-xl font-black text-on-surface">Activity Log</h4>
                                        <button className="text-xs font-bold text-primary hover:underline">View History</button>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="flex items-start gap-4">
                                            <div className="w-2.5 h-2.5 rounded-full bg-primary mt-2 shadow-[0_0_8px_rgba(224,64,160,0.4)]"></div>
                                            <div>
                                                <p className="text-sm font-bold text-on-surface">Pricing Cards Updated</p>
                                                <p className="text-xs text-outline font-medium mt-0.5">Core Operational rates card synced with Firebase Firestore database • 2 hours ago</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <div className="w-2.5 h-2.5 rounded-full bg-secondary mt-2 shadow-[0_0_8px_rgba(124,82,170,0.4)]"></div>
                                            <div>
                                                <p className="text-sm font-bold text-on-surface">New Review Received</p>
                                                <p className="text-xs text-outline font-medium mt-0.5">Sarah J. left a 5-star rating for 'Wedding Reception' • Yesterday</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <div className="w-2.5 h-2.5 rounded-full bg-tertiary mt-2 shadow-[0_0_8px_rgba(0,150,204,0.4)]"></div>
                                            <div>
                                                <p className="text-sm font-bold text-on-surface">Service Draft Saved</p>
                                                <p className="text-xs text-outline font-medium mt-0.5">Catering tiered arrays updated with new dishes list • 3 days ago</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Tab 2: Images */}
                        {activeTab === 'Images' && (
                            <motion.div
                                key="Images"
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                className="bg-white p-8 rounded-3xl border border-outline-variant/30 shadow-sm space-y-8"
                            >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/20 pb-6">
                                    <div>
                                        <h3 className="text-2xl font-black text-on-surface tracking-tight flex items-center gap-2">
                                            <span className="material-symbols-outlined text-primary text-[28px]">photo_library</span>
                                            Service Gallery & Image Reordering
                                        </h3>
                                        <p className="text-xs font-semibold text-outline mt-1 leading-relaxed max-w-xl">
                                            Drag and drop the cards below to set your gallery layout. The <strong className="text-primary font-black">1st Image</strong> is automatically assigned as the main cover banner on the guest-end estimation portal.
                                        </p>
                                    </div>
                                    
                                    <div className="flex items-center gap-3 shrink-0">
                                        <button 
                                            onClick={handleSaveChanges}
                                            className="px-6 py-2.5 rounded-full font-bold text-xs text-white bg-secondary shadow-lg shadow-secondary/20 hover:scale-[1.02] transition-all cursor-pointer flex items-center gap-1.5"
                                        >
                                            <span className="material-symbols-outlined text-sm">save</span>
                                            Save Gallery Order
                                        </button>
                                    </div>
                                </div>

                                {/* Drag-and-Drop Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                    {images.length === 0 && (
                                        <div className="sm:col-span-2 md:col-span-3 p-10 text-center bg-surface-container-low rounded-3xl border-2 border-dashed border-outline-variant/40">
                                            <p className="text-sm font-bold text-on-surface-variant">
                                                No gallery images yet. Add an image URL below to build your public listing cover.
                                            </p>
                                        </div>
                                    )}
                                    {images.map((img, index) => {
                                        const orderLabels = ["1st Image (Primary Cover)", "2nd Image", "3rd Image", "4th Image", "5th Image", "6th Image", "7th Image", "8th Image", "9th Image", "10th Image"];
                                        const orderBadge = orderLabels[index] || `${index + 1}th Image`;
                                        const isFirst = index === 0;

                                        return (
                                            <div 
                                                key={img.id}
                                                draggable
                                                onDragStart={(e) => handleImageDragStart(e, index)}
                                                onDragOver={handleImageDragOver}
                                                onDrop={(e) => handleImageDrop(e, index)}
                                                className={`relative group rounded-3xl overflow-hidden border-2 transition-all duration-300 h-64 shadow-md bg-surface-container-low cursor-grab active:cursor-grabbing flex flex-col justify-between ${
                                                    isFirst 
                                                        ? 'border-primary shadow-primary/10 ring-2 ring-primary/20' 
                                                        : 'border-outline-variant/30 hover:border-secondary hover:shadow-lg'
                                                }`}
                                            >
                                                {/* Top Controls Row */}
                                                <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10 pointer-events-none">
                                                    <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider text-white shadow-sm flex items-center gap-1 pointer-events-auto ${
                                                        isFirst 
                                                            ? 'bg-gradient-to-r from-primary to-secondary' 
                                                            : 'bg-slate-800/80 backdrop-blur-sm'
                                                    }`}>
                                                        <span className="material-symbols-outlined text-xs">drag_indicator</span>
                                                        {orderBadge}
                                                    </span>

                                                    <button 
                                                        onClick={() => handleDeleteImage(img.id)}
                                                        className="w-8 h-8 rounded-full bg-red-500/90 text-white hover:bg-red-600 hover:scale-110 transition-all flex items-center justify-center shadow-sm cursor-pointer pointer-events-auto"
                                                        title="Delete Image"
                                                    >
                                                        <span className="material-symbols-outlined text-sm">delete</span>
                                                    </button>
                                                </div>

                                                {/* Card Body - Background Image */}
                                                <div className="h-44 w-full relative">
                                                    <img 
                                                        src={img.url} 
                                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                                                        alt={img.label} 
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 to-transparent"></div>
                                                </div>

                                                {/* Card Footer - Editable Label & Drag buttons */}
                                                <div className="p-4 bg-white flex flex-col gap-2 relative">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <input 
                                                            type="text" 
                                                            value={img.label}
                                                            onChange={(e) => {
                                                                const updated = [...images];
                                                                updated[index].label = e.target.value;
                                                                setImages(updated);
                                                            }}
                                                            className="flex-1 text-[11px] font-black text-on-surface bg-slate-50 hover:bg-slate-100 focus:bg-white rounded-lg px-2.5 py-1.5 border border-transparent focus:border-primary focus:ring-0 transition-all truncate"
                                                            placeholder="Add title..."
                                                        />
                                                    </div>

                                                    {/* Quick Shift buttons */}
                                                    <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-[10px] font-bold text-outline">
                                                        <div className="flex gap-1.5">
                                                            <button 
                                                                disabled={index === 0}
                                                                onClick={() => {
                                                                    const updated = [...images];
                                                                    const temp = updated[index];
                                                                    updated[index] = updated[index - 1];
                                                                    updated[index - 1] = temp;
                                                                    setImages(updated.map((im, i) => ({ ...im, isPrimary: i === 0 })));
                                                                    triggerToast("Moved left!");
                                                                }}
                                                                className="px-2 py-1 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 disabled:opacity-30 disabled:pointer-events-none transition-colors flex items-center gap-0.5 cursor-pointer"
                                                            >
                                                                <span className="material-symbols-outlined text-[10px]">arrow_back</span>
                                                                Left
                                                            </button>
                                                            <button 
                                                                disabled={index === images.length - 1}
                                                                onClick={() => {
                                                                    const updated = [...images];
                                                                    const temp = updated[index];
                                                                    updated[index] = updated[index + 1];
                                                                    updated[index + 1] = temp;
                                                                    setImages(updated.map((im, i) => ({ ...im, isPrimary: i === 0 })));
                                                                    triggerToast("Moved right!");
                                                                }}
                                                                className="px-2 py-1 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 disabled:opacity-30 disabled:pointer-events-none transition-colors flex items-center gap-0.5 cursor-pointer"
                                                            >
                                                                Right
                                                                <span className="material-symbols-outlined text-[10px]">arrow_forward</span>
                                                            </button>
                                                        </div>
                                                        <span className="text-[9px] uppercase tracking-wider text-primary/80 font-black">
                                                            {isFirst ? "⭐ Banner Cover" : "Gallery view"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* Upload/Add New Image Placeholder Card */}
                                    <div className="border-2 border-dashed border-outline-variant/60 hover:border-primary rounded-3xl p-6 flex flex-col justify-center items-center text-center gap-3 bg-surface-container-low/50 hover:bg-white transition-all h-64 min-h-[256px]">
                                        <span className="material-symbols-outlined text-primary text-[36px] bg-primary/10 p-3 rounded-full">add_a_photo</span>
                                        <div>
                                            <h5 className="font-black text-xs text-on-surface">Add New Image URL</h5>
                                            <p className="text-[10px] text-outline mt-0.5">Input a new image path from system gallery</p>
                                        </div>
                                        
                                        <div className="w-full space-y-2">
                                            <input
                                                type="text"
                                                placeholder="https://example.com/your-hall-photo.jpg"
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter" && e.target.value.trim()) {
                                                        const label = businessName
                                                            ? `${businessName} — Gallery`
                                                            : "Gallery Image";
                                                        handleAddImage(e.target.value.trim(), label);
                                                        e.target.value = "";
                                                    }
                                                }}
                                                className="w-full bg-white border border-slate-200 rounded-full px-4 py-2 font-bold text-[10px] text-on-surface focus:outline-none focus:ring-1 focus:ring-primary shadow-sm placeholder:text-outline/60"
                                            />
                                            <p className="text-[9px] text-outline font-bold">Press Enter to add image URL</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Tab 3: Description */}
                        {activeTab === 'Description' && (
                            <motion.div
                                key="Description"
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                className="bg-white p-8 rounded-3xl border border-outline-variant/30 shadow-sm space-y-8"
                            >
                                <div>
                                    <h3 className="text-2xl font-black text-on-surface tracking-tight">Service Description</h3>
                                    <p className="text-sm font-medium text-on-surface-variant mt-1">Provide clear details of what your luxury venue offers clients.</p>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest px-1">Detailed Description</label>
                                        <textarea 
                                            rows="5" 
                                            value={vendorDescription}
                                            onChange={(e) => setVendorDescription(e.target.value)}
                                            placeholder="Describe your venue for clients browsing Festalytics…"
                                            className="w-full bg-surface-container-low border-2 border-transparent rounded-3xl px-6 py-4 focus:border-primary focus:ring-0 text-on-surface font-bold text-sm resize-none transition-all"
                                        />
                                    </div>

                                    {/* Key Features checklist builder */}
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest px-1">Key Amenities & Features</label>
                                        <div className="flex flex-wrap gap-2.5 bg-surface-container-low p-4 rounded-3xl border border-outline-variant/20">
                                            {features.map((feature, i) => (
                                                <span key={i} className="bg-white text-secondary text-xs font-black py-2 px-4 rounded-full flex items-center gap-2 shadow-sm border border-outline-variant/30">
                                                    {feature}
                                                    <span 
                                                        onClick={() => handleRemoveFeature(i)}
                                                        className="material-symbols-outlined text-[16px] cursor-pointer hover:text-error transition-colors"
                                                    >
                                                        close
                                                    </span>
                                                </span>
                                            ))}
                                        </div>

                                        <form onSubmit={handleAddFeature} className="flex gap-4">
                                            <input 
                                                type="text" 
                                                value={newFeature}
                                                onChange={(e) => setNewFeature(e.target.value)}
                                                placeholder="Add new amenity (e.g. Bridal Dressing Suite)" 
                                                className="flex-1 bg-surface-container-low border-2 border-transparent rounded-full px-6 py-4 focus:border-primary focus:ring-0 text-on-surface font-bold text-xs"
                                            />
                                            <button 
                                                type="submit"
                                                className="px-8 bg-secondary text-white font-black text-xs uppercase tracking-wider rounded-full shadow-lg shadow-secondary/20 hover:scale-105 transition-transform cursor-pointer"
                                            >
                                                Add
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Tab 4: Pricing Tab — Base Operational Rate Card */}
                        {activeTab === 'Pricing' && (
                            <motion.div
                                key="Pricing"
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                className="space-y-6"
                            >
                                <div className="bg-white p-8 rounded-3xl border border-outline-variant/30 shadow-sm space-y-8">
                                    <div>
                                        <h3 className="text-2xl font-black text-on-surface tracking-tight">Base Operational Rate Card</h3>
                                        <p className="text-sm font-medium text-on-surface-variant mt-1">
                                            Configure core structures, logistical fixed bases, and utility charges that drive the automated estimation calculator.
                                        </p>
                                    </div>

                                    {/* Fixed Base Cost Section */}
                                    <div className="space-y-4">
                                        <h4 className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-2 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[16px]">home_work</span> 1. Fixed Base Cost
                                        </h4>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest px-1">Hall Rent & Seating Setup Cost (Rs.)</label>
                                            <input 
                                                type="number" 
                                                value={pricing.hallRent}
                                                onChange={(e) => setPricing({ ...pricing, hallRent: parseFloat(e.target.value) || 0 })}
                                                className="w-full bg-surface-container-low border-2 border-transparent rounded-full px-6 py-4 focus:border-primary focus:ring-0 text-on-surface font-black text-lg" 
                                            />
                                        </div>
                                    </div>

                                    {/* Utilities Section */}
                                    <div className="space-y-4 pt-4 border-t border-outline-variant/20">
                                        <h4 className="text-xs font-black text-secondary uppercase tracking-[0.2em] mb-2 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[16px]">flash_on</span> 2. Utility Setup Charges
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest px-1">Air Conditioning (AC) Cost (Rs.)</label>
                                                <input 
                                                    type="number" 
                                                    value={pricing.acCost}
                                                    onChange={(e) => setPricing({ ...pricing, acCost: parseFloat(e.target.value) || 0 })}
                                                    className="w-full bg-surface-container-low border-2 border-transparent rounded-full px-6 py-4 focus:border-primary focus:ring-0 text-on-surface font-black text-base" 
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest px-1">Generator & Power Backup setup (Rs.)</label>
                                                <input 
                                                    type="number" 
                                                    value={pricing.generatorCost}
                                                    onChange={(e) => setPricing({ ...pricing, generatorCost: parseFloat(e.target.value) || 0 })}
                                                    className="w-full bg-surface-container-low border-2 border-transparent rounded-full px-6 py-4 focus:border-primary focus:ring-0 text-on-surface font-black text-base" 
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Optional Services toggles & prices */}
                                    <div className="space-y-4 pt-4 border-t border-outline-variant/20">
                                        <h4 className="text-xs font-black text-tertiary uppercase tracking-[0.2em] mb-2 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[16px]">add_circle</span> 3. Optional Event Add-ons & Logistics
                                        </h4>
                                        
                                        <div className="space-y-5 bg-surface-container-low p-6 rounded-[2rem] border border-outline-variant/30">
                                            {/* Decor */}
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-outline-variant/20 shadow-sm">
                                                <div className="flex items-center gap-4">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={pricing.decorAvailable}
                                                        onChange={(e) => setPricing({ ...pricing, decorAvailable: e.target.checked })}
                                                        className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                                    />
                                                    <div>
                                                        <span className="font-black text-sm text-on-surface">Décor Packages & Flower Arrangements</span>
                                                        <p className="text-[10px] text-outline font-medium">Toggle availability for in-house venue theme decors</p>
                                                    </div>
                                                </div>
                                                {pricing.decorAvailable && (
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <span className="text-xs font-bold text-outline">Price (Rs.):</span>
                                                        <input 
                                                            type="number" 
                                                            value={pricing.decorPrice}
                                                            onChange={(e) => setPricing({ ...pricing, decorPrice: parseFloat(e.target.value) || 0 })}
                                                            className="w-28 bg-surface-container-low border-none rounded-full px-4 py-2 font-black text-sm focus:ring-1 focus:ring-primary"
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Sound System */}
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-outline-variant/20 shadow-sm">
                                                <div className="flex items-center gap-4">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={pricing.soundAvailable}
                                                        onChange={(e) => setPricing({ ...pricing, soundAvailable: e.target.checked })}
                                                        className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                                    />
                                                    <div>
                                                        <span className="font-black text-sm text-on-surface">Sound Systems & Professional DJ Setup</span>
                                                        <p className="text-[10px] text-outline font-medium">Toggle availability for premium AV & console packages</p>
                                                    </div>
                                                </div>
                                                {pricing.soundAvailable && (
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <span className="text-xs font-bold text-outline">Price (Rs.):</span>
                                                        <input 
                                                            type="number" 
                                                            value={pricing.soundPrice}
                                                            onChange={(e) => setPricing({ ...pricing, soundPrice: parseFloat(e.target.value) || 0 })}
                                                            className="w-28 bg-surface-container-low border-none rounded-full px-4 py-2 font-black text-sm focus:ring-1 focus:ring-primary"
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Valet */}
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-outline-variant/20 shadow-sm">
                                                <div className="flex items-center gap-4">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={pricing.securityAvailable}
                                                        onChange={(e) => setPricing({ ...pricing, securityAvailable: e.target.checked })}
                                                        className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                                    />
                                                    <div>
                                                        <span className="font-black text-sm text-on-surface">Valet Parking & Event Security guards</span>
                                                        <p className="text-[10px] text-outline font-medium">Toggle availability for security escorts & valet staff</p>
                                                    </div>
                                                </div>
                                                {pricing.securityAvailable && (
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <span className="text-xs font-bold text-outline">Price (Rs.):</span>
                                                        <input 
                                                            type="number" 
                                                            value={pricing.securityPrice}
                                                            onChange={(e) => setPricing({ ...pricing, securityPrice: parseFloat(e.target.value) || 0 })}
                                                            className="w-28 bg-surface-container-low border-none rounded-full px-4 py-2 font-black text-sm focus:ring-1 focus:ring-primary"
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                        </div>
                                    </div>

                                    {/* Catering Menu Packages Per-Head Rates */}
                                    <div className="space-y-4 pt-6 border-t border-outline-variant/20">
                                        <h4 className="text-xs font-black text-[#D6336C] uppercase tracking-[0.2em] mb-2 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[16px]">restaurant_menu</span> 4. Catering Packages Per-Head Rates
                                        </h4>
                                        <p className="text-[10px] text-on-surface-variant font-bold opacity-80 mb-4">
                                            Set the standard per-plate charges for each of the meat types. The client-side cost estimator will fetch these dynamically to calculate wedding budgets.
                                        </p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 bg-surface-container-low p-6 rounded-[2rem] border border-outline-variant/30">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest px-1">Chicken Menu Price (Rs./head)</label>
                                                <input 
                                                    type="number" 
                                                    value={pricing.chickenPrice || 1400}
                                                    onChange={(e) => setPricing({ ...pricing, chickenPrice: parseFloat(e.target.value) || 0 })}
                                                    className="w-full bg-white border border-outline-variant/30 rounded-full px-6 py-4 focus:ring-1 focus:ring-primary text-on-surface font-black text-base shadow-sm" 
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest px-1">Beef Menu Price (Rs./head)</label>
                                                <input 
                                                    type="number" 
                                                    value={pricing.beefPrice || 2000}
                                                    onChange={(e) => setPricing({ ...pricing, beefPrice: parseFloat(e.target.value) || 0 })}
                                                    className="w-full bg-white border border-outline-variant/30 rounded-full px-6 py-4 focus:ring-1 focus:ring-primary text-on-surface font-black text-base shadow-sm" 
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest px-1">Mutton Menu Price (Rs./head)</label>
                                                <input 
                                                    type="number" 
                                                    value={pricing.muttonPrice || 3000}
                                                    onChange={(e) => setPricing({ ...pricing, muttonPrice: parseFloat(e.target.value) || 0 })}
                                                    className="w-full bg-white border border-outline-variant/30 rounded-full px-6 py-4 focus:ring-1 focus:ring-primary text-on-surface font-black text-base shadow-sm" 
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest px-1">Mehndi Menu Price (Rs./head)</label>
                                                <input 
                                                    type="number" 
                                                    value={pricing.mehndiPrice || 1200}
                                                    onChange={(e) => setPricing({ ...pricing, mehndiPrice: parseFloat(e.target.value) || 0 })}
                                                    className="w-full bg-white border border-outline-variant/30 rounded-full px-6 py-4 focus:ring-1 focus:ring-primary text-[#D6336C] font-black text-base shadow-sm" 
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action button inside Pricing Tab */}
                                    <div className="flex justify-end pt-6 border-t border-outline-variant/10 mt-6">
                                        <button 
                                            onClick={handleSaveChanges}
                                            disabled={isSaving}
                                            className="px-8 py-3.5 rounded-full text-xs font-black text-white bg-primary hover:bg-primary-dark transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-primary/20"
                                        >
                                            <span className="material-symbols-outlined text-sm">cloud_upload</span>
                                            {isSaving ? "Publishing Rates..." : "Publish Pricing to Database"}
                                        </button>
                                    </div>

                                </div>
                            </motion.div>
                        )}

                        {/* Tab 5: Menu Tab — Upgraded High-Fidelity Accordion Builder & Template Library */}
                        {activeTab === 'Menu' && (
                            <motion.div
                                key="Menu"
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                className="space-y-8"
                            >
                                {/* Header with Action Buttons */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-outline-variant/30 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-[#eedcff] p-3 rounded-2xl text-secondary flex items-center justify-center">
                                            <span className="material-symbols-outlined text-2xl font-black">restaurant_menu</span>
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-on-surface tracking-tight">Food & Beverage Menu</h3>
                                            <p className="text-xs text-on-surface-variant font-bold opacity-80 mt-0.5">Configure tiered template menus or start from a blank canvas</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <button 
                                            onClick={triggerAddCategoryModal}
                                            className="bg-secondary text-on-secondary px-5 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 hover:scale-105 transition-transform shadow-md cursor-pointer"
                                        >
                                            <span className="material-symbols-outlined text-sm">add_circle</span> Add Category
                                        </button>
                                    </div>
                                </div>

                                {/* Template Library Library Section */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-black text-outline uppercase tracking-widest flex items-center gap-2">
                                        <span className="material-symbols-outlined text-sm">collections_bookmark</span> Template Library
                                    </h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                                        {/* Chicken */}
                                        <div 
                                            onClick={() => loadTemplate('chicken')}
                                            className={`bg-white p-5 rounded-3xl border-2 hover:border-primary shadow-sm hover:shadow-md transition-all cursor-pointer group relative flex flex-col justify-between ${
                                                activePackageName.includes("Chicken") ? "border-primary ring-2 ring-primary/20" : "border-transparent"
                                            }`}
                                        >
                                            <span className="absolute top-3 right-3 bg-primary-fixed text-primary text-[8px] font-black px-2 py-0.5 rounded-full uppercase">Popular</span>
                                            <div className="w-10 h-10 rounded-full bg-primary-fixed text-primary flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                                <span className="material-symbols-outlined text-lg">lunch_dining</span>
                                            </div>
                                            <div>
                                                <h5 className="font-black text-sm text-on-surface">Chicken Menu</h5>
                                                <p className="text-[10px] text-on-surface-variant leading-relaxed mt-1">Signature rotisserie & savory curries</p>
                                            </div>
                                        </div>

                                        {/* Beef */}
                                        <div 
                                            onClick={() => loadTemplate('beef')}
                                            className={`bg-white p-5 rounded-3xl border-2 hover:border-secondary shadow-sm hover:shadow-md transition-all cursor-pointer group relative flex flex-col justify-between ${
                                                activePackageName.includes("Beef") ? "border-secondary ring-2 ring-secondary/20" : "border-transparent"
                                            }`}
                                        >
                                            <span className="absolute top-3 right-3 bg-secondary-fixed text-secondary text-[8px] font-black px-2 py-0.5 rounded-full uppercase">Premium</span>
                                            <div className="w-10 h-10 rounded-full bg-secondary-fixed text-secondary flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                                <span className="material-symbols-outlined text-lg">restaurant</span>
                                            </div>
                                            <div>
                                                <h5 className="font-black text-sm text-on-surface">Beef Menu</h5>
                                                <p className="text-[10px] text-on-surface-variant leading-relaxed mt-1">Premium steaks & slow-cooked stews</p>
                                            </div>
                                        </div>

                                        {/* Mutton */}
                                        <div 
                                            onClick={() => loadTemplate('mutton')}
                                            className={`bg-white p-5 rounded-3xl border-2 hover:border-tertiary shadow-sm hover:shadow-md transition-all cursor-pointer group relative flex flex-col justify-between ${
                                                activePackageName.includes("Mutton") ? "border-tertiary ring-2 ring-tertiary/20" : "border-transparent"
                                            }`}
                                        >
                                            <span className="absolute top-3 right-3 bg-tertiary-fixed text-tertiary text-[8px] font-black px-2 py-0.5 rounded-full uppercase">Deluxe</span>
                                            <div className="w-10 h-10 rounded-full bg-tertiary-fixed text-tertiary flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                                <span className="material-symbols-outlined text-lg">dinner_dining</span>
                                            </div>
                                            <div>
                                                <h5 className="font-black text-sm text-on-surface">Mutton Menu</h5>
                                                <p className="text-[10px] text-on-surface-variant leading-relaxed mt-1">Royal mutton qorma & saffron pilau</p>
                                            </div>
                                        </div>

                                        {/* Mehndi */}
                                        <div 
                                            onClick={() => loadTemplate('mehndi')}
                                            className={`bg-white p-5 rounded-3xl border-2 hover:border-error shadow-sm hover:shadow-md transition-all cursor-pointer group relative flex flex-col justify-between ${
                                                activePackageName.includes("Mehndi") ? "border-error ring-2 ring-error/20" : "border-transparent"
                                            }`}
                                        >
                                            <span className="absolute top-3 right-3 bg-error-container text-error text-[8px] font-black px-2 py-0.5 rounded-full uppercase">Event Special</span>
                                            <div className="w-10 h-10 rounded-full bg-error-container text-error flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                                <span className="material-symbols-outlined text-lg">celebration</span>
                                            </div>
                                            <div>
                                                <h5 className="font-black text-sm text-on-surface">Mehndi Special</h5>
                                                <p className="text-[10px] text-on-surface-variant leading-relaxed mt-1">Traditional street food & delights</p>
                                            </div>
                                        </div>

                                        {/* Build Your Own */}
                                        <div 
                                            onClick={() => loadTemplate('empty')}
                                            className={`bg-surface-container-lowest p-5 rounded-3xl border-2 border-dashed hover:border-primary shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col items-center justify-center text-center ${
                                                activePackageName.includes("Custom") ? "border-primary ring-2 ring-primary/20" : "border-outline-variant"
                                            }`}
                                        >
                                            <div className="w-10 h-10 rounded-full bg-outline-variant/20 text-on-surface-variant flex items-center justify-center mb-2 group-hover:bg-primary-container group-hover:text-primary transition-colors">
                                                <span className="material-symbols-outlined text-lg">add_circle</span>
                                            </div>
                                            <h5 className="font-black text-sm text-on-surface">Build Your Own</h5>
                                            <p className="text-[9px] text-outline font-bold uppercase tracking-wider mt-0.5">Start from scratch</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Active Package Builder Interface */}
                                <div className="bg-white rounded-[2rem] border border-outline-variant/30 shadow-sm overflow-hidden space-y-6">
                                    
                                    {/* Active Package Banner */}
                                    <div className="p-6 bg-surface-container-low border-b border-outline-variant/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-on-primary shadow-lg shadow-primary/20">
                                                <span className="material-symbols-outlined text-2xl">edit_note</span>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3">
                                                    <input 
                                                        type="text" 
                                                        value={activePackageName}
                                                        onChange={(e) => setActivePackageName(e.target.value)}
                                                        className="text-xl font-black text-on-surface bg-transparent border-b-2 border-transparent hover:border-outline focus:border-primary focus:ring-0 p-0 tracking-tight"
                                                    />
                                                    <div className="flex items-center bg-green-100 px-3 py-1 rounded-full gap-1.5 shrink-0">
                                                        <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                                                        <span className="text-[9px] font-black text-green-700 uppercase tracking-widest">Active Setup</span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-4 text-xs font-bold text-outline mt-1.5">
                                                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-base opacity-60 font-bold">inventory</span> {totalItemsCount} Active Items</span>
                                                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-base opacity-60 font-bold">category</span> {categories.length} Categories</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 border-t sm:border-t-0 pt-4 sm:pt-0 w-full sm:w-auto shrink-0 justify-between">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <span className="text-xs font-bold text-on-surface-variant">Menu Status</span>
                                                <div className="relative inline-flex items-center cursor-pointer">
                                                    <input 
                                                        checked={activePackageStatus}
                                                        onChange={(e) => setActivePackageStatus(e.target.checked)}
                                                        className="sr-only peer" 
                                                        type="checkbox"
                                                    />
                                                    <div className="w-11 h-6 bg-outline-variant rounded-full peer peer-checked:after:translate-x-5 peer-checked:bg-primary after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                                                </div>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Accordion Categories List */}
                                    <div className="divide-y divide-outline-variant/30 px-6 pb-6">
                                        {categories.map((cat) => {
                                            const isExpanded = expandedCategories[cat.id];
                                            const activeItems = cat.items.filter(it => it.active).length;
                                            const catSubtotal = cat.items.filter(it => it.active).reduce((sum, item) => sum + item.price, 0);

                                            return (
                                                <div key={cat.id} className="bg-white py-4 first:pt-0">
                                                    
                                                    {/* Accordion Trigger Header */}
                                                    <div 
                                                        className="flex items-center justify-between p-4 bg-surface-container/60 hover:bg-surface-container rounded-2xl cursor-pointer transition-colors"
                                                    >
                                                        <div 
                                                            onClick={() => toggleCategoryAccordion(cat.id)}
                                                            className="flex items-center gap-3 flex-1"
                                                        >
                                                            <span className="material-symbols-outlined text-outline select-none transition-transform duration-300" style={{ transform: isExpanded ? 'rotate(90deg)' : 'none' }}>chevron_right</span>
                                                            <div className="w-9 h-9 bg-primary-container rounded-xl flex items-center justify-center text-primary">
                                                                <span className="material-symbols-outlined text-lg">{cat.icon || 'restaurant'}</span>
                                                            </div>
                                                            
                                                            {editingCatId === cat.id ? (
                                                                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                                    <input 
                                                                        type="text" 
                                                                        value={editCatName}
                                                                        onChange={(e) => setEditCatName(e.target.value)}
                                                                        className="bg-white border border-outline px-3 py-1 rounded-full text-sm font-bold text-on-surface animate-pulse"
                                                                    />
                                                                    <button 
                                                                        onClick={() => saveCategoryName(cat.id)}
                                                                        className="material-symbols-outlined text-green-600 bg-green-50 p-1 rounded-full hover:scale-110 transition-transform"
                                                                    >
                                                                        check
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <div>
                                                                    <h4 className="font-black text-on-surface text-base">{cat.name}</h4>
                                                                    <div className="flex gap-2 text-[10px] font-black text-outline uppercase tracking-wider mt-0.5">
                                                                        <span>{activeItems} Items Active</span>
                                                                        <span>• Subtotal: Rs. {catSubtotal}</span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Category action buttons */}
                                                        <div className="flex items-center gap-3 shrink-0">
                                                            <button 
                                                                onClick={() => startEditCategory(cat.id, cat.name)}
                                                                className="px-3 py-1 bg-white hover:bg-primary-fixed hover:text-primary transition-all text-[10px] font-black uppercase rounded-full border border-outline-variant/30 cursor-pointer shadow-sm"
                                                            >
                                                                Edit Category Name
                                                            </button>
                                                            <button 
                                                                onClick={() => triggerDeleteCategoryModal(cat.id, cat.name)}
                                                                className="px-3 py-1 bg-white hover:bg-error-container hover:text-error transition-all text-[10px] font-black uppercase rounded-full border border-outline-variant/30 cursor-pointer shadow-sm text-outline"
                                                            >
                                                                Delete
                                                            </button>
                                                            <button 
                                                                onClick={() => triggerAddDishModal(cat.id)}
                                                                className="px-4 py-1 bg-primary text-white text-[10px] font-black uppercase rounded-full shadow-md shadow-primary/20 hover:scale-105 transition-transform cursor-pointer"
                                                            >
                                                                Add Dish
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Expanded items list container */}
                                                    <AnimatePresence>
                                                        {isExpanded && (
                                                            <motion.div 
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: 'auto', opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                className="overflow-x-auto mt-3 p-1"
                                                            >
                                                                <table className="w-full text-left border-collapse">
                                                                    <thead>
                                                                        <tr className="bg-surface-variant/40 text-on-surface-variant text-[9px] font-black uppercase tracking-widest">
                                                                            <th className="px-4 py-3 w-12 rounded-l-xl">No.</th>
                                                                            <th className="px-4 py-3">Dish Name</th>
                                                                            <th className="px-4 py-3">Ingredients / Description</th>
                                                                            <th className="px-4 py-3 w-28">Price (Rs.)</th>
                                                                            <th className="px-4 py-3 w-20 text-center">Status</th>
                                                                            <th className="px-4 py-3 w-28 text-right rounded-r-xl">Actions</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-outline-variant/20 text-xs font-bold text-on-surface">
                                                                        {cat.items.map((item, index) => {
                                                                            const isEditing = editingItemId === item.id;
                                                                            return (
                                                                                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                                                                    <td className="px-4 py-4 text-outline font-black">{String(index + 1).padStart(2, '0')}</td>
                                                                                    
                                                                                    <td className="px-4 py-4 font-black">
                                                                                        {isEditing ? (
                                                                                            <input 
                                                                                                type="text" 
                                                                                                value={editItemName} 
                                                                                                onChange={(e) => setEditItemName(e.target.value)} 
                                                                                                className="w-full bg-white border border-outline rounded-lg px-2.5 py-1.5 font-bold focus:ring-1 focus:ring-primary focus:border-transparent animate-pulse"
                                                                                            />
                                                                                        ) : (
                                                                                            <span className={item.active ? "text-on-surface" : "text-outline line-through"}>{item.name}</span>
                                                                                        )}
                                                                                    </td>

                                                                                    <td className="px-4 py-4 font-medium text-on-surface-variant max-w-[200px] truncate">
                                                                                        {isEditing ? (
                                                                                            <input 
                                                                                                type="text" 
                                                                                                value={editItemDesc} 
                                                                                                onChange={(e) => setEditItemDesc(e.target.value)} 
                                                                                                className="w-full bg-white border border-outline rounded-lg px-2.5 py-1.5 font-medium"
                                                                                            />
                                                                                        ) : (
                                                                                            <span>{item.description}</span>
                                                                                        )}
                                                                                    </td>

                                                                                    <td className="px-4 py-4 font-black text-primary">
                                                                                        {isEditing ? (
                                                                                            <input 
                                                                                                type="number" 
                                                                                                value={editItemPrice} 
                                                                                                onChange={(e) => setEditItemPrice(e.target.value)} 
                                                                                                className="w-20 bg-white border border-outline rounded-lg px-2.5 py-1.5 font-black text-primary focus:ring-1 focus:ring-primary focus:border-transparent"
                                                                                            />
                                                                                        ) : (
                                                                                            <span>Rs. {item.price}</span>
                                                                                        )}
                                                                                    </td>

                                                                                    <td className="px-4 py-4 text-center">
                                                                                        <label className="relative inline-flex items-center cursor-pointer">
                                                                                            <input 
                                                                                                type="checkbox" 
                                                                                                checked={item.active} 
                                                                                                onChange={() => handleToggleItemStatus(cat.id, item.id)}
                                                                                                className="sr-only peer"
                                                                                            />
                                                                                            <div className="w-9 h-5 bg-outline-variant rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                                                                                        </label>
                                                                                    </td>

                                                                                    <td className="px-4 py-4 text-right">
                                                                                        <div className="flex justify-end gap-1.5">
                                                                                            {isEditing ? (
                                                                                                <button 
                                                                                                    onClick={() => handleSaveItemChanges(cat.id, item.id)}
                                                                                                    className="p-1.5 hover:bg-green-50 text-green-600 rounded-full cursor-pointer flex items-center"
                                                                                                >
                                                                                                    <span className="material-symbols-outlined text-lg font-bold">check</span>
                                                                                                </button>
                                                                                            ) : (
                                                                                                <button 
                                                                                                    onClick={() => handleStartEditItem(item)}
                                                                                                    className="p-1.5 hover:bg-primary-container/20 text-[#7c52aa] rounded-full cursor-pointer flex items-center"
                                                                                                >
                                                                                                    <span className="material-symbols-outlined text-lg">edit</span>
                                                                                                </button>
                                                                                            )}
                                                                                            <button 
                                                                                                onClick={() => triggerDeleteItemModal(cat.id, item.id, item.name)}
                                                                                                className="p-1.5 hover:bg-error-container/20 text-error rounded-full cursor-pointer flex items-center"
                                                                                            >
                                                                                                <span className="material-symbols-outlined text-lg">delete</span>
                                                                                            </button>
                                                                                        </div>
                                                                                    </td>
                                                                                </tr>
                                                                            );
                                                                        })}
                                                                        {cat.items.length === 0 && (
                                                                            <tr>
                                                                                <td colSpan="6" className="text-center py-6 text-outline italic text-xs">No items in this category. Click 'Add Dish' to build your list.</td>
                                                                            </tr>
                                                                        )}
                                                                    </tbody>
                                                                </table>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>

                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Tab 6: Calendar — synced with /vendor-dashboard/availability */}
                        {activeTab === 'Calendar' && (
                            <motion.div
                                key="Calendar"
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                className="bg-white p-6 md:p-8 rounded-3xl border border-outline-variant/30 shadow-sm"
                            >
                                <VenueCalendarWorkspace
                                    variant="embedded"
                                    publishLabel="Publish Calendar"
                                />
                            </motion.div>
                        )}

                        {/* Tab 7: Location */}
                        {activeTab === 'Location' && (
                            <motion.div
                                key="Location"
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                className="bg-white p-8 rounded-3xl border border-outline-variant/30 shadow-sm space-y-8"
                            >
                                <div>
                                    <h3 className="text-2xl font-black text-on-surface tracking-tight">Location & Logistics</h3>
                                    <p className="text-sm font-medium text-on-surface-variant mt-1">Configure where your venue is located.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest px-1">Venue Street Address</label>
                                            <input
                                                type="text"
                                                value={streetAddress}
                                                onChange={(e) => setStreetAddress(e.target.value)}
                                                placeholder="Street address"
                                                className="w-full bg-surface-container-low border-2 border-transparent rounded-full px-6 py-4 focus:border-primary focus:ring-0 text-on-surface font-bold text-sm"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest px-1">City</label>
                                                <input
                                                    type="text"
                                                    value={city}
                                                    onChange={(e) => setCity(e.target.value)}
                                                    placeholder="City / area"
                                                    className="w-full bg-surface-container-low border-2 border-transparent rounded-full px-6 py-4 focus:border-primary focus:ring-0 text-on-surface font-bold text-sm"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest px-1">Postal Code</label>
                                                <input
                                                    type="text"
                                                    value={postalCode}
                                                    onChange={(e) => setPostalCode(e.target.value)}
                                                    placeholder="Postal code"
                                                    className="w-full bg-surface-container-low border-2 border-transparent rounded-full px-6 py-4 focus:border-primary focus:ring-0 text-on-surface font-bold text-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="relative rounded-[2rem] overflow-hidden shadow-md border-8 border-white ring-1 ring-outline-variant/30 h-72">
                                        <img 
                                            alt="Map Location" 
                                            className="w-full h-full object-cover" 
                                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuByUAxup7W5RNRb9YHJs3VnlPY-qDwX4s7NFqNjmjQPDoyx1eat5EMkztS18kdHecQHzYnG2itxOLBbm6tNDuoKEeRSQfB08LVmsp0FY17ncBPxfmp0i17gLD8F_KrCtN3FX4xXzDqTfKRHruhn-4z1_9XTf4cFNoMqt9ZY_TuJd-Q31Bwv6ZHKfaSpzgS9yp_kmwXMNcEUYGva-mW0zTxV4bY8fIEQEp0S_Dz7TlA3YEbZqzxchWY38-fzHpJPrcqvv88pyHpeJGY"
                                        />
                                        <div className="absolute inset-0 bg-black/10"></div>
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                            <span className="material-symbols-outlined text-primary text-5xl animate-bounce drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)]">location_on</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Tab 8: Reviews */}
                        {activeTab === 'Reviews' && (
                            <motion.div
                                key="Reviews"
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                className="bg-white p-8 rounded-3xl border border-outline-variant/30 shadow-sm space-y-8"
                            >
                                <div className="flex justify-between items-start flex-col md:flex-row gap-6">
                                    <div>
                                        <h3 className="text-2xl font-black text-on-surface tracking-tight">Customer Reviews</h3>
                                        <p className="text-sm font-medium text-on-surface-variant mt-1">Read and reply to feedback from clients.</p>
                                    </div>
                                    <div className="flex items-center gap-4 bg-surface-container-low px-6 py-3 rounded-full border border-outline-variant/20">
                                        <span className="font-black text-3xl text-primary">
                                            {venueStats.averageRating ? venueStats.averageRating.toFixed(1) : "—"}
                                        </span>
                                        <div className="text-left">
                                            <div className="flex text-yellow-500">
                                                {Array.from({ length: 5 }, (_, i) => (
                                                    <span key={i} className="material-symbols-outlined text-[16px] fill-1">star</span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {reviews.length === 0 && (
                                        <p className="text-sm font-medium text-on-surface-variant text-center py-12">
                                            No reviews for {businessName || "your venue"} yet. Reviews from clients will appear here.
                                        </p>
                                    )}
                                    {reviews.map((rev) => (
                                        <div key={rev.id} className="p-6 rounded-3xl bg-surface-container-low border border-outline-variant/20 space-y-4">
                                            <div className="flex justify-between items-start flex-col sm:flex-row gap-4">
                                                <div className="flex items-center gap-4">
                                                    <img src={rev.avatar} className="w-12 h-12 rounded-full border border-primary-container p-0.5" alt={rev.name} />
                                                    <div>
                                                        <h4 className="font-black text-on-surface text-sm">{rev.name}</h4>
                                                        <p className="text-[10px] text-outline font-bold uppercase tracking-widest mt-0.5">{rev.role}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-xs text-on-surface-variant font-medium leading-relaxed">{rev.comment}</p>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Tab 9: FAQs */}
                        {activeTab === 'FAQs' && (
                            <motion.div
                                key="FAQs"
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                className="bg-white p-8 rounded-3xl border border-outline-variant/30 shadow-sm space-y-8"
                            >
                                <div className="flex justify-between items-center flex-wrap gap-4 pb-4 border-b border-outline-variant/20">
                                    <div>
                                        <h3 className="text-2xl font-black text-on-surface tracking-tight flex items-center gap-2">
                                            <span className="material-symbols-outlined text-primary">live_help</span>
                                            Service FAQs Builder
                                        </h3>
                                        <p className="text-sm font-medium text-on-surface-variant mt-1">
                                            Create up to 10 frequently asked questions for clients visiting your venue page. ({faqs.length}/10 slots used)
                                        </p>
                                    </div>
                                    <div className="flex gap-3">
                                        <button 
                                            onClick={handleSaveChanges}
                                            className="px-6 py-3 rounded-full text-xs font-black text-white bg-secondary shadow-lg shadow-secondary/20 hover:scale-105 transition-all flex items-center gap-2 cursor-pointer"
                                        >
                                            <span className="material-symbols-outlined text-sm">cloud_upload</span>
                                            Save Changes
                                        </button>
                                        <button 
                                            onClick={triggerAddFaqModal}
                                            className="px-6 py-3 rounded-full text-xs font-black text-white bg-primary shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2 cursor-pointer"
                                        >
                                            <span className="material-symbols-outlined text-sm">add</span>
                                            Add New FAQ
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {faqs.length === 0 ? (
                                        <div className="p-12 text-center bg-surface-container-low rounded-3xl border-2 border-dashed border-outline-variant/40 space-y-4">
                                            <span className="material-symbols-outlined text-5xl text-outline-variant">help_outline</span>
                                            <p className="text-sm font-bold text-on-surface-variant">No FAQs created yet. Click "Add New FAQ" to get started!</p>
                                        </div>
                                    ) : (
                                        faqs.map((faq) => {
                                            const isOpen = faqOpen[faq.id];
                                            return (
                                                <div key={faq.id} className="bg-surface-container-low rounded-3xl border border-outline-variant/20 overflow-hidden transition-all duration-300 hover:shadow-md">
                                                    <div className="w-full p-6 text-left flex justify-between items-center gap-4 hover:bg-surface-variant/10 transition-colors">
                                                        <button 
                                                            onClick={() => toggleFaq(faq.id)}
                                                            className="flex-1 text-left flex items-center gap-3 font-black text-sm text-on-surface tracking-tight cursor-pointer"
                                                        >
                                                            <span className="text-primary font-bold text-xs">Q.</span>
                                                            {faq.question}
                                                        </button>
                                                        <div className="flex items-center gap-2 flex-shrink-0">
                                                            <button 
                                                                onClick={() => triggerEditFaqModal(faq)}
                                                                className="p-2 rounded-xl text-primary hover:bg-primary-container transition-colors flex items-center justify-center cursor-pointer"
                                                                title="Edit FAQ"
                                                            >
                                                                <span className="material-symbols-outlined text-[18px]">edit</span>
                                                            </button>
                                                            <button 
                                                                onClick={() => triggerDeleteFaqModal(faq.id, faq.question)}
                                                                className="p-2 rounded-xl text-red-500 hover:bg-red-50 transition-colors flex items-center justify-center cursor-pointer"
                                                                title="Delete FAQ"
                                                            >
                                                                <span className="material-symbols-outlined text-[18px]">delete</span>
                                                            </button>
                                                            <button 
                                                                onClick={() => toggleFaq(faq.id)}
                                                                className="p-2 rounded-xl text-outline hover:bg-surface-variant/30 transition-colors flex items-center justify-center cursor-pointer"
                                                            >
                                                                <span className={`material-symbols-outlined text-primary transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>expand_more</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <AnimatePresence>
                                                        {isOpen && (
                                                            <motion.div 
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: 'auto', opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                className="px-6 pb-6 text-xs font-medium text-on-surface-variant leading-relaxed"
                                                            >
                                                                <div className="pt-4 border-t border-outline-variant/20 leading-relaxed font-bold flex gap-3 text-slate-600">
                                                                    <span className="text-secondary font-black text-xs">A.</span>
                                                                    <span className="flex-1">{faq.answer}</span>
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </motion.div>
                        )}

                    </AnimatePresence>
                </div>
            </div>

            {/* Sticky Global Action Footer (Menu Tab Specific - Matches Mockup) */}
            {activeTab === 'Menu' && (
                <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t border-outline-variant/30 py-4 px-8 z-50 flex justify-between items-center shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
                    <div className="flex items-center gap-8">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-1">Active Items Included</span>
                            <span className="text-xl font-black text-on-surface">{totalItemsCount} Selections</span>
                        </div>
                        <div className="h-10 w-px bg-outline-variant/40"></div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-1">Estimated Setup Value</span>
                            <span className="text-xl font-black text-primary">Rs. {estimatedTotalMenuCost.toLocaleString()}</span>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <button 
                            onClick={triggerDiscardModal}
                            className="px-6 py-3 rounded-full font-bold text-on-surface-variant hover:bg-surface-container transition-colors text-xs cursor-pointer"
                        >
                            Discard Changes
                        </button>
                        <button 
                            onClick={handleSaveChanges}
                            className="bg-primary text-on-primary px-10 py-3 rounded-full font-black shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all text-xs cursor-pointer"
                        >
                            Save Menu Structure
                        </button>
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default MyServices;
