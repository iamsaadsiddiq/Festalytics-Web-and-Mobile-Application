"use client";
import React from 'react';
import { motion } from 'framer-motion';

import Link from 'next/link';

const ServiceCard = ({ title, category, price, bookings, rating, status, imageUrl, badgeColor }) => {
    const statusConfig = {
        Active: { icon: 'fiber_manual_record', color: 'bg-green-500', pulse: true },
        Draft: { icon: '', color: 'bg-outline', pulse: false },
        Pending: { icon: 'history', color: 'bg-orange-400', pulse: false },
    };

    const currentStatus = statusConfig[status] || statusConfig.Active;

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -8, scale: 1.02 }}
            className="group relative bg-surface-container-lowest rounded-[2rem] overflow-hidden shadow-[0_8px_32px_rgba(124,82,170,0.08)] transition-all duration-300"
        >
            <div className="relative h-56 w-full overflow-hidden">
                <img 
                    alt={title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                    src={imageUrl}
                />
                <div className={`absolute top-4 left-4 ${currentStatus.color} text-white px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg`}>
                    {currentStatus.pulse && <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>}
                    {currentStatus.icon && <span className="material-symbols-outlined text-[14px]">{currentStatus.icon}</span>}
                    {status}
                </div>
                
                {/* Hover Actions Overlay */}
                <div className="absolute inset-0 bg-primary/20 backdrop-blur-[2px] flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Link href="/vendor-dashboard/my-services/edit" className="w-12 h-12 bg-white text-primary rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined">edit</span>
                    </Link>
                    <button className="w-12 h-12 bg-white text-tertiary rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform"><span className="material-symbols-outlined">visibility</span></button>
                    <button className="w-12 h-12 bg-white text-error rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform"><span className="material-symbols-outlined">delete</span></button>
                </div>
            </div>

            <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                    <span className={`${badgeColor} px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider`}>{category}</span>
                    <div className="flex items-center gap-1 text-secondary font-bold">
                        <span className="material-symbols-outlined text-yellow-500" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        <span>{rating || 'N/A'}</span>
                    </div>
                </div>
                <h3 className="text-xl font-black text-on-surface mb-2">{title}</h3>
                <p className="text-on-surface-variant text-sm line-clamp-2 mb-4">Professional event service designed to deliver exceptional experiences for your guests.</p>
                <div className="flex items-center justify-between pt-4 border-t border-outline-variant">
                    <div>
                        <p className="text-xs text-outline font-bold uppercase tracking-widest">Base Price</p>
                        <p className="text-lg font-black text-primary">{price}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-outline font-bold uppercase tracking-widest">Bookings</p>
                        <p className="text-lg font-black text-on-surface">{bookings}</p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default ServiceCard;
