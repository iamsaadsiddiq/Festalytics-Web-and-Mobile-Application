"use client";
import React from 'react';
import { motion } from 'framer-motion';

const ServiceFilters = () => {
    return (
        <div className="bg-surface-container-highest p-4 rounded-3xl mb-8 flex flex-col lg:flex-row gap-4 items-center shadow-sm">
            <div className="relative flex-1 w-full">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">search</span>
                <input 
                    className="w-full bg-surface border-none rounded-full py-3 pl-12 pr-4 focus:ring-4 focus:ring-primary focus:ring-opacity-20 font-body transition-shadow outline-none" 
                    placeholder="Search services by name, category..." 
                    type="text"
                />
            </div>
            <div className="flex items-center gap-4 w-full lg:w-auto">
                <div className="relative w-full lg:w-48">
                    <select className="w-full appearance-none bg-surface border-none rounded-full py-3 px-6 focus:ring-4 focus:ring-primary focus:ring-opacity-20 font-bold text-secondary cursor-pointer outline-none">
                        <option>All Services</option>
                        <option>Wedding</option>
                        <option>Corporate</option>
                        <option>Private Party</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-secondary">expand_more</span>
                </div>
                <div className="relative w-full lg:w-48">
                    <select className="w-full appearance-none bg-surface border-none rounded-full py-3 px-6 focus:ring-4 focus:ring-primary focus:ring-opacity-20 font-bold text-secondary cursor-pointer outline-none">
                        <option>Sort by: Newest</option>
                        <option>Price: Low to High</option>
                        <option>Price: High to Low</option>
                        <option>Popularity</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-secondary">sort</span>
                </div>
                <div className="flex p-1 bg-surface-container-low rounded-full gap-1 border border-outline-variant">
                    <button className="w-10 h-10 flex items-center justify-center rounded-full bg-primary text-white shadow-md">
                        <span className="material-symbols-outlined">grid_view</span>
                    </button>
                    <button className="w-10 h-10 flex items-center justify-center rounded-full text-outline hover:bg-surface-variant transition-colors">
                        <span className="material-symbols-outlined">format_list_bulleted</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ServiceFilters;
