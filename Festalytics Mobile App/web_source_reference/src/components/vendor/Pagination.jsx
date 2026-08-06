"use client";
import React from 'react';
import { motion } from 'framer-motion';

const Pagination = ({ current, total }) => {
    return (
        <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-6 bg-surface-container-low p-6 rounded-3xl border border-outline-variant">
            <p className="text-on-surface-variant font-medium">
                Showing <span className="font-black text-primary">{current}</span> of <span className="font-black text-primary">{total}</span> services
            </p>
            <div className="flex items-center gap-2">
                <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="w-12 h-12 flex items-center justify-center rounded-full border-2 border-outline-variant text-outline hover:border-primary hover:text-primary transition-all"
                >
                    <span className="material-symbols-outlined">chevron_left</span>
                </motion.button>
                <div className="flex items-center gap-1">
                    <button className="w-12 h-12 flex items-center justify-center rounded-full bg-primary text-on-primary font-black shadow-lg">1</button>
                    <button className="w-12 h-12 flex items-center justify-center rounded-full text-secondary font-bold hover:bg-primary-fixed transition-colors">2</button>
                    <button className="w-12 h-12 flex items-center justify-center rounded-full text-secondary font-bold hover:bg-primary-fixed transition-colors">3</button>
                </div>
                <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="w-12 h-12 flex items-center justify-center rounded-full border-2 border-outline-variant text-outline hover:border-primary hover:text-primary transition-all"
                >
                    <span className="material-symbols-outlined">chevron_right</span>
                </motion.button>
            </div>
        </div>
    );
};

export default Pagination;
