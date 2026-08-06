"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, auth } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from 'next/navigation';

const Header = () => {
    const router = useRouter();
    const [vendorName, setVendorName] = useState("Alex Rivera");
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                if (user.displayName) {
                    setVendorName(user.displayName);
                } else {
                    try {
                        const userDocRef = doc(db, "users", user.uid);
                        const userDocSnap = await getDoc(userDocRef);
                        if (userDocSnap.exists()) {
                            const userData = userDocSnap.data();
                            if (userData.name) {
                                setVendorName(userData.name);
                            }
                        }
                    } catch (err) {
                        console.error("Error fetching vendor name in header: ", err);
                    }
                }
            } else {
                setVendorName("Alex Rivera");
            }
        });
        return () => unsubscribe();
    }, []);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            router.push('/');
        } catch (err) {
            console.error("Sign out failed: ", err);
        }
    };

    return (
        <header className="fixed top-0 right-0 left-0 z-50 flex justify-between items-center px-8 h-20 bg-white/80 backdrop-blur-md ml-[260px] border-b border-outline-variant shadow-sm">
            <div className="flex items-center flex-1 max-w-xl">
                <div className="relative w-full">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary">search</span>
                    <input 
                        className="w-full h-12 pl-12 pr-6 bg-surface-container-low border-2 border-outline-variant rounded-full focus:ring-4 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
                        placeholder="Search analytics, bookings..." 
                        type="text"
                    />
                </div>
            </div>

            <div className="flex items-center gap-3 ml-6 shrink-0">
                <button
                    type="button"
                    onClick={() => router.push("/vendor-dashboard/settings/account")}
                    className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high hover:text-primary transition-colors border-0 bg-transparent cursor-pointer"
                    aria-label="Settings"
                >
                    <span className="material-symbols-outlined text-[22px]">settings</span>
                </button>
                <div className="h-8 w-px bg-outline-variant" />

                <div className="relative">
                    <div
                        onClick={() => setShowDropdown(!showDropdown)}
                        className="flex items-center gap-2 cursor-pointer group hover:bg-surface-container-high p-2 pr-3 rounded-full transition-colors"
                    >
                        <div className="h-10 w-10 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center font-black text-primary text-sm">
                            {vendorName.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-bold text-on-surface select-none">{vendorName}</span>
                        <span className="material-symbols-outlined text-on-surface-variant text-sm transition-transform group-hover:translate-y-0.5">keyboard_arrow_down</span>
                    </div>

                    <AnimatePresence>
                        {showDropdown && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)}></div>
                                <motion.div
                                    initial={{ opacity: 0, y: 15, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute right-0 mt-3 w-56 bg-white border border-outline-variant rounded-2xl shadow-lg p-2 z-50 flex flex-col gap-1"
                                >
                                    <div className="px-4 py-3 border-b border-outline-variant/20 mb-1">
                                        <p className="text-xs font-black text-primary uppercase tracking-widest">Active Profile</p>
                                        <p className="font-bold text-on-surface truncate">{vendorName}</p>
                                        <p className="text-xs text-on-surface-variant truncate">{auth.currentUser?.email || "Vendor Manager"}</p>
                                    </div>
                                    <button 
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-error rounded-xl hover:bg-error-container/20 transition-all font-bold text-sm text-left cursor-pointer"
                                    >
                                        <span className="material-symbols-outlined text-lg">logout</span>
                                        Sign Out Session
                                    </button>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </header>
    );
};

export default Header;
