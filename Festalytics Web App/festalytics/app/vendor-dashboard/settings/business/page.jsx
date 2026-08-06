"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from "@/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useVendorVenue } from "@/hooks/useVendorVenue";

const BusinessSettings = () => {
    const [userId, setUserId] = useState(null);
    const { venueId, isLoading: venueLoading } = useVendorVenue();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState({ show: false, message: "", type: "success" });

    // Business operational details states
    const [venueName, setVenueName] = useState("Zaydan Banquet Hall");
    const [regNumber, setRegNumber] = useState("REG-9920334-X");
    const [website, setWebsite] = useState("https://festalytics.com/venue/zaydan-banquet-hall");
    const [venueType, setVenueType] = useState("Banquet Hall");
    const [categories, setCategories] = useState(["BANQUET HALL", "CATERING", "DECOR"]);
    const [description, setDescription] = useState("Premium elegant wedding hall offering customized setups, royal floral decor, and bespoke catering services for all luxurious celebrations.");
    const [streetAddress, setStreetAddress] = useState("Zaydan Hall Ground, Johar Town Block A");
    const [city, setCity] = useState("Lahore");
    const [postalCode, setPostalCode] = useState("54000");
    const [capacity, setCapacity] = useState(500);

    // Toast helper
    const triggerToast = (message, type = "success") => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3500);
    };

    useEffect(() => {
        if (!venueId || venueLoading) {
            if (!venueLoading) setIsLoading(false);
            return;
        }

        const loadVenue = async () => {
            try {
                    const venueDocRef = doc(db, "venues", venueId);
                    const venueDocSnap = await getDoc(venueDocRef);
                    if (venueDocSnap.exists()) {
                        const venueData = venueDocSnap.data();
                        if (venueData.name) setVenueName(venueData.name);
                        if (venueData.regNumber) setRegNumber(venueData.regNumber);
                        if (venueData.website) setWebsite(venueData.website);
                        if (venueData.venueType) setVenueType(venueData.venueType);
                        if (venueData.categories) setCategories(venueData.categories);
                        if (venueData.description) setDescription(venueData.description);
                        if (venueData.streetAddress) setStreetAddress(venueData.streetAddress);
                        if (venueData.city) setCity(venueData.city);
                        if (venueData.postalCode) setPostalCode(venueData.postalCode);
                        if (venueData.capacity !== undefined) setCapacity(venueData.capacity);
                        if (venueData.profile?.hall_name) setVenueName(venueData.profile.hall_name);
                        if (venueData.profile?.address) setStreetAddress(venueData.profile.address);
                        if (venueData.profile?.area) setCity(venueData.profile.area);
                    }
                } catch (err) {
                    console.error("Error fetching business/venue profile: ", err);
                } finally {
                    setIsLoading(false);
                }
        };

        loadVenue();
    }, [venueId, venueLoading]);

    // Save business changes
    const handleSaveChanges = async () => {
        if (!venueId) return;
        setIsSaving(true);
        try {
            const venueDocRef = doc(db, "venues", venueId);
            const websiteUrl = website || `https://festalytics.com/venue/${venueId}`;
            await setDoc(venueDocRef, {
                name: venueName,
                hallName: venueName,
                regNumber: regNumber,
                website: websiteUrl,
                venueType: venueType,
                categories: categories,
                description: description,
                streetAddress: streetAddress,
                city: city,
                postalCode: postalCode,
                capacity: parseInt(capacity) || 500,
                profile: {
                    hall_name: venueName,
                    address: streetAddress,
                    area: city,
                    phone_1: "",
                    capacity: parseInt(capacity) || 500,
                    description: description,
                },
                updatedAt: new Date().toISOString()
            }, { merge: true });

            triggerToast("Venue business profile updated successfully!");
        } catch (err) {
            console.error("Error saving venue business data: ", err);
            triggerToast(`Update Failed: ${err.code === "permission-denied" ? "Missing write permissions. Please log in." : err.message}`, "error");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-10 min-h-screen pb-20 relative">
            
            {/* Dynamic Toast Feedback Notification */}
            <AnimatePresence>
                {toast.show && (
                    <motion.div 
                        initial={{ opacity: 0, y: -40, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.9 }}
                        className={`fixed top-6 right-6 z-[9999] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl text-white font-bold text-sm ${
                            toast.type === 'error' ? 'bg-error shadow-error/20' : 'bg-primary shadow-primary/20'
                        }`}
                    >
                        <span className="material-symbols-outlined">
                            {toast.type === 'error' ? 'error' : 'check_circle'}
                        </span>
                        {toast.message}
                    </motion.div>
                )}
            </AnimatePresence>

            <header>
                <h1 className="text-4xl font-black text-on-background tracking-tighter">Business Information</h1>
                <p className="text-on-surface-variant font-bold uppercase text-[10px] tracking-[0.2em] mt-2">Manage your brand presence and operational logistics</p>
            </header>

            {isLoading ? (
                <div className="flex justify-center items-center py-20">
                    <span className="material-symbols-outlined animate-spin text-primary text-5xl">loading</span>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Core Details */}
                    <section className="lg:col-span-8 bg-white rounded-[2.5rem] p-10 shadow-xl border border-outline-variant/30">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="w-12 h-12 bg-primary-fixed rounded-2xl flex items-center justify-center text-primary">
                                <span className="material-symbols-outlined text-2xl fill-1">info</span>
                            </div>
                            <h2 className="text-2xl font-black text-on-surface tracking-tight">Core Details</h2>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest px-1">Business Name</label>
                                <input 
                                    className="w-full rounded-2xl border-2 border-transparent bg-surface-container-low px-6 py-4 focus:border-primary focus:ring-0 font-bold text-sm outline-none transition-all" 
                                    type="text" 
                                    value={venueName}
                                    onChange={(e) => setVenueName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest px-1">Registration Number</label>
                                <input 
                                    className="w-full rounded-2xl border-2 border-transparent bg-surface-container-low px-6 py-4 focus:border-primary focus:ring-0 font-bold text-sm outline-none transition-all" 
                                    type="text" 
                                    value={regNumber}
                                    onChange={(e) => setRegNumber(e.target.value)}
                                />
                            </div>
                            <div className="space-y-3 md:col-span-2">
                                <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest px-1">Website URL</label>
                                <input 
                                    className="w-full rounded-2xl border-2 border-transparent bg-surface-container-low px-6 py-4 focus:border-primary focus:ring-0 font-bold text-sm outline-none transition-all" 
                                    type="url" 
                                    value={website}
                                    onChange={(e) => setWebsite(e.target.value)}
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest px-1">Business Type</label>
                                <select 
                                    value={venueType}
                                    onChange={(e) => setVenueType(e.target.value)}
                                    className="w-full rounded-2xl border-2 border-transparent bg-surface-container-low px-6 py-4 focus:border-primary focus:ring-0 font-bold text-sm appearance-none cursor-pointer outline-none transition-all"
                                >
                                    <option value="Banquet Hall">Banquet Hall & Events Venue</option>
                                    <option value="Catering Company">Premium Catering Merchant</option>
                                    <option value="Decor Services">Wedding Decorator Agency</option>
                                </select>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest px-1">Maximum Guest Capacity</label>
                                <input 
                                    className="w-full rounded-2xl border-2 border-transparent bg-surface-container-low px-6 py-4 focus:border-primary focus:ring-0 font-bold text-sm outline-none transition-all" 
                                    type="number" 
                                    value={capacity}
                                    onChange={(e) => setCapacity(e.target.value)}
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest px-1">Categories</label>
                                <div className="flex flex-wrap gap-2 bg-surface-container-low rounded-2xl p-3 border-2 border-transparent">
                                    {categories.map((cat, idx) => (
                                        <span key={idx} className="bg-primary text-white text-[10px] font-black py-2 px-4 rounded-full flex items-center gap-2 shadow-lg shadow-primary/20">
                                            {cat} 
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-3 md:col-span-2">
                                <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest px-1">Business Description</label>
                                <textarea 
                                    className="w-full rounded-3xl border-2 border-transparent bg-surface-container-low px-6 py-4 focus:border-primary focus:ring-0 font-bold text-sm resize-none outline-none transition-all" 
                                    rows="4" 
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                ></textarea>
                            </div>
                        </div>
                    </section>

                    {/* Operating Hours */}
                    <section className="lg:col-span-4 bg-white rounded-[2.5rem] p-10 shadow-xl border border-outline-variant/30 flex flex-col">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="w-12 h-12 bg-secondary-container rounded-2xl flex items-center justify-center text-secondary">
                                <span className="material-symbols-outlined text-2xl fill-1">schedule</span>
                            </div>
                            <h2 className="text-2xl font-black text-on-surface tracking-tight">Operating Hours</h2>
                        </div>
                        
                        <div className="space-y-6 flex-1">
                            {[
                                { day: 'Mon - Fri', hours: '09:00 - 18:00', active: true },
                                { day: 'Saturday', hours: '10:00 - 16:00', active: true },
                                { day: 'Sunday', hours: 'Closed', active: false },
                            ].map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between group">
                                    <span className="font-black text-on-surface-variant text-[10px] uppercase tracking-widest">{item.day}</span>
                                    <div className="flex items-center gap-4">
                                        {item.active ? (
                                            <div className="flex items-center gap-3 bg-surface-container-low px-4 py-2 rounded-full border border-outline-variant/30">
                                                <span className="text-sm font-black text-on-surface">{item.hours}</span>
                                            </div>
                                        ) : (
                                            <span className="text-xs font-black text-outline uppercase tracking-[0.2em] bg-surface-container-highest/30 px-6 py-2 rounded-full">Closed</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-10 pt-8 border-t-2 border-dashed border-outline-variant/30">
                            <h3 className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-4">Venue Slot Timings</h3>
                            <div className="flex items-center justify-between bg-secondary-container/50 p-4 rounded-2xl border border-secondary/10">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-secondary text-xl fill-1">restaurant</span>
                                    <span className="text-[10px] font-black text-on-secondary-container uppercase tracking-widest">Setup & Catering</span>
                                </div>
                                <span className="text-[10px] font-black text-on-secondary-container">12:30 - 23:30</span>
                            </div>
                        </div>
                    </section>

                    {/* Business Address */}
                    <section className="lg:col-span-12 bg-white rounded-[2.5rem] p-10 shadow-xl border border-outline-variant/30">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div className="space-y-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-tertiary-fixed rounded-2xl flex items-center justify-center text-tertiary">
                                        <span className="material-symbols-outlined text-2xl fill-1">location_on</span>
                                    </div>
                                    <h2 className="text-2xl font-black text-on-surface tracking-tight">Business Address</h2>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="col-span-2 space-y-3">
                                        <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest px-1">Street Address</label>
                                        <input 
                                            className="w-full rounded-2xl border-2 border-transparent bg-surface-container-low px-6 py-4 focus:border-tertiary focus:ring-0 font-bold text-sm outline-none transition-all" 
                                            type="text" 
                                            value={streetAddress}
                                            onChange={(e) => setStreetAddress(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest px-1">City</label>
                                        <input 
                                            className="w-full rounded-2xl border-2 border-transparent bg-surface-container-low px-6 py-4 focus:border-tertiary focus:ring-0 font-bold text-sm outline-none transition-all" 
                                            type="text" 
                                            value={city}
                                            onChange={(e) => setCity(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest px-1">Postal Code</label>
                                        <input 
                                            className="w-full rounded-2xl border-2 border-transparent bg-surface-container-low px-6 py-4 focus:border-tertiary focus:ring-0 font-bold text-sm outline-none transition-all" 
                                            type="text" 
                                            value={postalCode}
                                            onChange={(e) => setPostalCode(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <motion.button 
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleSaveChanges}
                                    disabled={isSaving}
                                    className="bg-tertiary text-white font-black text-xs uppercase tracking-widest py-4 px-10 rounded-full shadow-xl shadow-tertiary/30 flex items-center gap-3 cursor-pointer disabled:opacity-50"
                                >
                                    <span className="material-symbols-outlined text-lg">save</span> 
                                    {isSaving ? "SAVING..." : "UPDATE PROFILE"}
                                </motion.button>
                            </div>
                            
                            <div className="relative min-h-[400px] rounded-[2rem] overflow-hidden shadow-2xl border-8 border-white ring-1 ring-outline-variant/30 group bg-surface-container-low flex items-center justify-center">
                                <iframe 
                                    src={`https://maps.google.com/maps?q=${encodeURIComponent(streetAddress + ", " + city)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                                    className="w-full h-full border-0 rounded-[1.5rem]" 
                                    allowFullScreen="" 
                                    loading="lazy"
                                ></iframe>
                                <div className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-md p-6 rounded-3xl shadow-2xl flex items-center gap-4 border border-outline-variant/30">
                                    <div className="p-3 bg-primary-fixed rounded-2xl shadow-sm">
                                        <span className="material-symbols-outlined text-primary text-2xl fill-1">store</span>
                                    </div>
                                    <div>
                                        <p className="font-black text-on-surface text-sm tracking-tight">{venueName}</p>
                                        <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest mt-0.5">Verified Location</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            )}

            {/* Sticky Save Button */}
            {!isLoading && (
                <div className="fixed bottom-10 right-10 z-[100]">
                    <motion.button 
                        whileHover={{ scale: 1.1, rotate: 2 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleSaveChanges}
                        disabled={isSaving}
                        className="bg-primary text-white flex items-center gap-4 px-10 py-5 rounded-full font-black text-lg shadow-[0_15px_40px_rgba(224,64,160,0.4)] border-2 border-white/20 backdrop-blur-md cursor-pointer disabled:opacity-50"
                    >
                        <span className="material-symbols-outlined text-2xl fill-1">save</span>
                        {isSaving ? "SAVING..." : "SAVE CHANGES"}
                    </motion.button>
                </div>
            )}
        </div>
    );
};

export default BusinessSettings;
