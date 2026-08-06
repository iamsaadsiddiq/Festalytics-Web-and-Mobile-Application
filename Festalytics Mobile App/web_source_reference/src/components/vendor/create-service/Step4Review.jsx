"use client";
import React from 'react';
import { motion } from 'framer-motion';

const Step4Review = ({ formData, prevStep, publishService }) => {
    return (
        <motion.section 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-12 gap-8"
        >
            {/* Left Column: Summary */}
            <div className="col-span-12 lg:col-span-7 space-y-6">
                {/* Basic Info Summary */}
                <div className="bg-white rounded-lg p-6 shadow-sm border border-outline-variant">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary">
                                <span className="material-symbols-outlined">info</span>
                            </div>
                            <h3 className="text-xl font-black text-on-surface">Basic Info</h3>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-y-4">
                        <div>
                            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Service Name</p>
                            <p className="text-on-surface font-medium">{formData.name || 'Untitled Service'}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Category</p>
                            <span className="px-3 py-1 bg-secondary-fixed text-on-secondary-fixed-variant rounded-full text-xs font-bold">{formData.category || 'Not set'}</span>
                        </div>
                        <div className="col-span-2">
                            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">Description</p>
                            <p className="text-on-surface-variant text-sm leading-relaxed">{formData.description || 'No description provided.'}</p>
                        </div>
                    </div>
                </div>

                {/* Pricing Summary */}
                <div className="bg-white rounded-lg p-6 shadow-sm border border-outline-variant">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-secondary">
                            <span className="material-symbols-outlined">payments</span>
                        </div>
                        <h3 className="text-xl font-black text-on-surface">Pricing & Packages</h3>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl">
                            <div>
                                <p className="font-bold text-on-surface">Base Pricing</p>
                                <p className="text-xs text-on-surface-variant">{formData.pricingType}</p>
                            </div>
                            <p className="text-2xl font-black text-primary">Rs. {formData.basePrice || '0'}</p>
                        </div>
                        {(formData.packages || []).map((pkg, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl">
                                <div>
                                    <p className="font-bold text-on-surface">{pkg.name}</p>
                                </div>
                                <p className="text-2xl font-black text-primary">Rs. {pkg.price}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Column: Preview & Finalize */}
            <div className="col-span-12 lg:col-span-5 space-y-8">
                <div className="sticky top-24">
                    <div className="bg-white rounded-lg overflow-hidden shadow-xl border border-outline-variant transform rotate-1 hover:rotate-0 transition-transform duration-500 max-w-sm mx-auto">
                        <div className="relative h-48 bg-surface-container">
                            {formData.featuredImage && <img src={formData.featuredImage} className="w-full h-full object-cover" alt="Preview" />}
                            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-black text-primary">
                                ★ 5.0 (New)
                            </div>
                        </div>
                        <div className="p-5">
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="text-lg font-black text-on-surface">{formData.name || 'Untitled Service'}</h4>
                                <span className="text-primary font-black text-xl">Rs. {formData.basePrice || '0'}+</span>
                            </div>
                            <div className="flex items-center gap-2 mb-6">
                                <span className="material-symbols-outlined text-tertiary text-sm">location_on</span>
                                <span className="text-xs font-medium text-on-surface-variant">Available for Booking</span>
                            </div>
                            <button className="w-full py-4 bg-primary text-white rounded-full font-black text-lg shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2" onClick={publishService}>
                                <span className="material-symbols-outlined">rocket_launch</span>
                                Publish Service
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <footer class="col-span-12 pt-8 border-t border-outline-variant/30 flex items-center justify-between">
                <button 
                    onClick={prevStep}
                    className="flex items-center gap-2 px-8 py-4 text-secondary font-black hover:bg-secondary-container rounded-full transition-all"
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                    Back
                </button>
                <span className="text-sm font-medium text-outline">All changes saved automatically</span>
            </footer>
        </motion.section>
    );
};

export default Step4Review;
