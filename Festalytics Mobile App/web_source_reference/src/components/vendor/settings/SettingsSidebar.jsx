"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { db } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useVendorVenue } from "@/hooks/useVendorVenue";

const SettingsSidebar = () => {
    const pathname = usePathname();
    const { venueId } = useVendorVenue();
    const [businessName, setBusinessName] = useState("Your venue");

    useEffect(() => {
        if (!venueId) return;
        const load = async () => {
            try {
                const venueDocSnap = await getDoc(doc(db, "venues", venueId));
                if (venueDocSnap.exists()) {
                    const venueData = venueDocSnap.data();
                    setBusinessName(
                        venueData.profile?.hall_name || venueData.name || venueData.hallName || "Your venue"
                    );
                }
            } catch (err) {
                console.error("Error loading sidebar business details: ", err);
            }
        };
        load();
    }, [venueId]);

    const navItems = [
        { label: 'Account', icon: 'person', href: '/vendor-dashboard/settings/account' },
        { label: 'Business', icon: 'storefront', href: '/vendor-dashboard/settings/business' },
        { label: 'Notifications', icon: 'notifications_active', href: '/vendor-dashboard/settings/notifications' },
        { label: 'Payments', icon: 'payments', href: '/vendor-dashboard/settings/payments' },
        { label: 'Security', icon: 'verified_user', href: '/vendor-dashboard/settings/security' },
        { label: 'Help & Support', icon: 'help_center', href: '/vendor-dashboard/settings/help' },
    ];

    return (
        <aside className="w-72 flex flex-col gap-6 sticky top-0 h-fit">
            <div className="bg-white p-8 rounded-[2.5rem] border border-outline-variant shadow-xl">
                <div className="flex items-center gap-4 mb-10 px-2">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 border-2 border-primary flex items-center justify-center font-black text-primary text-base shadow-sm">
                        {businessName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-secondary leading-tight tracking-tight max-w-[150px] truncate">{businessName}</h3>
                        <p className="text-[9px] text-on-surface-variant font-black uppercase tracking-[0.15em] mt-1 opacity-70">Verified Venue</p>
                    </div>
                </div>

                <nav className="space-y-2">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link 
                                key={item.href} 
                                href={item.href}
                                className={`flex items-center gap-4 px-6 py-4 rounded-full transition-all group ${
                                    isActive 
                                    ? 'bg-primary text-white shadow-lg shadow-primary/30 font-black' 
                                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-primary font-bold'
                                }`}
                            >
                                <span className={`material-symbols-outlined text-xl ${isActive ? 'fill-1' : ''}`}>
                                    {item.icon}
                                </span>
                                <span className="text-sm tracking-tight">{item.label}</span>
                                {isActive && (
                                    <motion.div 
                                        layoutId="activeSetting"
                                        className="ml-auto w-1.5 h-1.5 bg-white rounded-full"
                                    />
                                )}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Support Contact Quick Info */}
            <div className="bg-primary text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden group">
                <div className="relative z-10">
                    <h4 className="font-black text-lg mb-2 tracking-tight">Need Help?</h4>
                    <p className="text-xs font-medium opacity-90 leading-relaxed mb-6">Our dedicated support team is available 24/7 to assist with your business growth.</p>
                    <button className="bg-white text-primary px-6 py-3 rounded-full font-black text-[10px] uppercase tracking-widest shadow-lg">
                        Contact Support
                    </button>
                </div>
                <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
            </div>
        </aside>
    );
};

export default SettingsSidebar;
