"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, auth } from "@/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

const AccountSettings = () => {
    const [userId, setUserId] = useState(null);
    const [email, setEmail] = useState("vendor@festalytics.com");
    const [fullName, setFullName] = useState("Ukasha Khan");
    const [phone, setPhone] = useState("03104804228");
    const [bio, setBio] = useState("Owner and Operations Lead. Managing wedding venues and vendor relations since 2021.");
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState({ show: false, message: "", type: "success" });

    // Toast helper
    const triggerToast = (message, type = "success") => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3500);
    };

    // Load dynamic account details from Firestore
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUserId(user.uid);
                setEmail(user.email || "vendor@festalytics.com");
                
                try {
                    const userDocRef = doc(db, "users", user.uid);
                    const userDocSnap = await getDoc(userDocRef);
                    
                    if (userDocSnap.exists()) {
                        const userData = userDocSnap.data();
                        setFullName(userData.fullName || userData.name || fullName);
                        setPhone(userData.mobileNumber || userData.phone || phone);
                        if (userData.bio) setBio(userData.bio);
                    }
                } catch (err) {
                    console.error("Error fetching user account profile: ", err);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setIsLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    // Save changes to Firebase Firestore
    const handleSaveChanges = async () => {
        if (!userId) {
            triggerToast("You must be logged in to save changes!", "error");
            return;
        }
        setIsSaving(true);
        try {
            const userDocRef = doc(db, "users", userId);
            await setDoc(userDocRef, {
                fullName,
                name: fullName,
                mobileNumber: phone,
                phone: phone,
                bio: bio,
                updatedAt: new Date().toISOString()
            }, { merge: true });

            triggerToast("Account settings saved successfully!");
        } catch (err) {
            console.error("Error saving account profile: ", err);
            triggerToast(`Save Failed: ${err.code === "permission-denied" ? "Missing database permissions. Please log in." : err.message}`, "error");
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
                            toast.type === 'error' ? 'bg-error shadow-error/20' : 
                            toast.type === 'info' ? 'bg-secondary shadow-secondary/20' : 'bg-primary shadow-primary/20'
                        }`}
                    >
                        <span className="material-symbols-outlined">
                            {toast.type === 'error' ? 'error' : toast.type === 'info' ? 'info' : 'check_circle'}
                        </span>
                        {toast.message}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Page Header */}
            <header>
                <h1 className="text-4xl font-black text-on-background tracking-tighter">Account Settings</h1>
                <p className="text-on-surface-variant font-bold uppercase text-[10px] tracking-[0.2em] mt-2">Manage your personal profile and account preferences</p>
            </header>

            {isLoading ? (
                <div className="flex justify-center items-center py-20">
                    <span className="material-symbols-outlined animate-spin text-primary text-5xl">loading</span>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Profile Information Card */}
                    <section className="lg:col-span-2 bg-white rounded-[2.5rem] p-10 shadow-xl border border-outline-variant/30">
                        <h2 className="text-xl font-black text-primary flex items-center gap-3 mb-10 tracking-tight">
                            <span className="material-symbols-outlined text-2xl fill-1">badge</span>
                            Profile Information
                        </h2>
                        
                        <div className="flex flex-col md:flex-row gap-12">
                            <div className="flex flex-col items-center gap-6">
                                <div className="relative group">
                                    <div className="w-40 h-40 rounded-[2.5rem] bg-primary/10 border-4 border-primary shadow-2xl flex items-center justify-center font-black text-primary text-4xl">
                                        {fullName.slice(0, 2).toUpperCase()}
                                    </div>
                                </div>
                                <span className="text-[10px] font-black text-primary uppercase tracking-widest">Verified Account</span>
                            </div>

                            <div className="flex-1 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest px-1">Full Name</label>
                                        <input 
                                            className="w-full bg-surface-container-low border-2 border-transparent rounded-2xl px-6 py-4 focus:border-primary focus:ring-0 text-on-surface font-bold text-sm outline-none transition-all" 
                                            type="text" 
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest px-1">Phone Number</label>
                                        <input 
                                            className="w-full bg-surface-container-low border-2 border-transparent rounded-2xl px-6 py-4 focus:border-primary focus:ring-0 text-on-surface font-bold text-sm outline-none transition-all" 
                                            type="tel" 
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                        />
                                    </div>
                                </div>
                                
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest px-1">Email Address</label>
                                    <div className="w-full bg-surface-container-highest/30 text-on-surface-variant/70 rounded-2xl px-6 py-4 font-bold text-sm flex items-center justify-between border-2 border-dashed border-outline-variant/30">
                                        <div className="flex items-center gap-3">
                                            <span className="material-symbols-outlined text-lg">lock</span>
                                            {email}
                                        </div>
                                        <span className="text-[8px] font-black uppercase tracking-widest bg-outline-variant/20 px-2 py-1 rounded">Primary</span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest px-1">Professional Bio</label>
                                    <textarea 
                                        className="w-full bg-surface-container-low border-2 border-transparent rounded-3xl px-6 py-4 focus:border-primary focus:ring-0 text-on-surface font-bold text-sm resize-none outline-none transition-all" 
                                        rows="4" 
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                    ></textarea>
                                </div>

                                <div className="pt-6">
                                    <motion.button 
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleSaveChanges}
                                        disabled={isSaving}
                                        className="px-10 py-4 bg-primary text-on-primary rounded-full font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                    >
                                        {isSaving ? "Saving..." : "Save Profile"}
                                    </motion.button>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Account Status Card */}
                    <section className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-outline-variant/30 flex flex-col">
                        <h2 className="text-xl font-black text-secondary flex items-center gap-3 mb-8 tracking-tight">
                            <span className="material-symbols-outlined text-2xl fill-1">analytics</span>
                            Account Health
                        </h2>
                        
                        <div className="space-y-8 flex-1">
                            {[
                                { label: 'Account Type', value: 'Business', color: 'secondary' },
                                { label: 'Created Date', value: 'March 1, 2024', color: 'on-surface' },
                                { label: 'Last Login', value: 'Today, 2:15 PM', color: 'on-surface' },
                            ].map((stat, i) => (
                                <div key={i} className="flex justify-between items-center py-4 border-b border-outline-variant/20">
                                    <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">{stat.label}</span>
                                    <span className={`text-sm font-black text-${stat.color} ${stat.label === 'Account Type' ? 'bg-secondary-fixed px-4 py-1 rounded-full' : ''}`}>
                                        {stat.value}
                                    </span>
                                </div>
                            ))}
                            
                            <div className="flex justify-between items-center pt-2">
                                <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Status</span>
                                <div className="flex items-center gap-3 bg-emerald-100 text-emerald-700 px-5 py-2 rounded-full font-black text-xs uppercase tracking-wider">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                                    Active
                                </div>
                            </div>
                        </div>
                        
                        <div className="mt-10 p-6 bg-tertiary-fixed/30 rounded-3xl border border-tertiary-fixed/50">
                            <div className="flex gap-4">
                                <span className="material-symbols-outlined text-tertiary text-2xl fill-1">verified</span>
                                <p className="text-[11px] text-on-tertiary-fixed-variant leading-relaxed font-bold">
                                    Your account is in good standing. You've completed 100% of your verification requirements.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Danger Zone */}
                    <section className="lg:col-span-3 bg-primary/5 rounded-[2.5rem] p-10 border-2 border-dashed border-primary/20">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                            <div className="space-y-3">
                                <h2 className="text-xl font-black text-primary flex items-center gap-3 tracking-tight">
                                    <span className="material-symbols-outlined text-2xl fill-1">warning</span>
                                    Danger Zone
                                </h2>
                                <p className="text-on-surface-variant font-bold text-sm max-w-2xl leading-relaxed">
                                    Deleting your account is permanent. This action will immediately remove all access to your shop, transaction history, and customer data. This cannot be undone.
                                </p>
                            </div>
                            <motion.button 
                                whileHover={{ scale: 1.05, backgroundColor: '#e11d48' }}
                                whileTap={{ scale: 0.95 }}
                                className="bg-primary text-on-primary px-10 py-5 rounded-full font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 flex items-center justify-center gap-3 whitespace-nowrap transition-colors cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-xl">delete_forever</span>
                                Delete Account
                            </motion.button>
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

export default AccountSettings;
