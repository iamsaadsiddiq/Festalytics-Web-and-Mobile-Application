"use client";
import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Sidebar = () => {
    const pathname = usePathname();
    
    const navItems = [
        { icon: 'dashboard', label: 'Dashboard', href: '/vendor-dashboard' },
        { icon: 'inventory_2', label: 'My Services', href: '/vendor-dashboard/my-services' },
        { icon: 'inventory', label: 'My Inventory', href: '/vendor-dashboard/my-inventory' },
        { icon: 'event_available', label: 'Bookings', href: '/vendor-dashboard/bookings' },
        { icon: 'handshake', label: 'Borrow Hub', href: '/vendor-dashboard/borrow-hub' },
        { icon: 'calendar_today', label: 'Availability', href: '/vendor-dashboard/availability' },
        { icon: 'chat', label: 'Messages', href: '/vendor-dashboard/messages' },
        { icon: 'monitoring', label: 'Analytics', href: '/vendor-dashboard/analytics' },
    ];

    const bottomItems = [
        { icon: 'settings', label: 'Settings', href: '/vendor-dashboard/settings/account' },
        { icon: 'help', label: 'Help & Support', href: '/vendor-dashboard/settings/help' },
    ];

    return (
        <aside className="fixed left-0 top-0 bottom-0 w-[260px] flex flex-col py-6 z-[60] bg-surface border-r border-outline-variant">
            <div className="px-8 mb-16 flex items-center gap-2">
                <div className="h-10 w-10 bg-primary rounded-full flex items-center justify-center text-white font-bold text-xl shadow-[0_4px_12px_rgba(224,64,160,0.3)]">F</div>
                <div>
                    <h1 className="text-2xl font-black text-primary tracking-tight leading-none">Festalytics</h1>
                    <p className="text-[10px] font-bold text-secondary uppercase tracking-widest mt-1">Vendor Portal</p>
                </div>
            </div>

            <nav className="flex-1 space-y-2 px-4">
                {navItems.map((item, idx) => {
                    const isActive =
                        pathname === item.href ||
                        (item.href !== '/vendor-dashboard' && pathname?.startsWith(item.href));
                    return (
                        <Link key={idx} href={item.href}>
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`${
                                    isActive 
                                    ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                                    : 'text-on-surface-variant hover:bg-primary-fixed'
                                } rounded-full px-6 py-3 flex items-center gap-4 group cursor-pointer transition-all duration-300 mb-1`}
                            >
                                <span className={`material-symbols-outlined ${isActive ? 'fill-1' : ''}`} style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
                                    {item.icon}
                                </span>
                                <span className="font-bold">{item.label}</span>
                            </motion.div>
                        </Link>
                    );
                })}
            </nav>

            <div className="mt-auto border-t border-outline-variant pt-8 space-y-2 px-4">
                {bottomItems.map((item, idx) => (
                    <Link key={idx} href={item.href}>
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="text-on-surface-variant px-6 py-3 flex items-center gap-4 hover:bg-primary-fixed rounded-full group cursor-pointer transition-all duration-300"
                        >
                            <span className="material-symbols-outlined">{item.icon}</span>
                            <span className="font-bold">{item.label}</span>
                        </motion.div>
                    </Link>
                ))}
            </div>
        </aside>
    );
};

export default Sidebar;
