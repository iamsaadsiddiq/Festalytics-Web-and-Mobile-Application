"use client";
import React from 'react';
import { motion } from 'framer-motion';

const Step1BasicInfo = ({ formData, updateFormData, nextStep }) => {
    const categories = ["Production & Technical", "Food & Beverage", "Decor & Arts", "Security & Logistics"];
    const types = ["Lighting Design", "Sound Engineering", "Visual Projections", "Stage Construction"];
    const leadTimes = ["At least 2 weeks notice", "1 month in advance", "3 months in advance", "Flexible"];

    return (
        <motion.section 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-surface-container-lowest rounded-lg p-8 shadow-sm border border-outline-variant/30"
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                {/* Service Name */}
                <div className="col-span-2 md:col-span-1">
                    <label className="block text-[12px] font-black text-on-surface mb-2 tracking-wide uppercase">Service Name</label>
                    <input 
                        value={formData.name || ''}
                        onChange={(e) => updateFormData({ name: e.target.value })}
                        className="w-full bg-surface-container-low border-none rounded-full px-6 py-4 text-on-surface focus:ring-2 focus:ring-primary-container transition-all text-sm placeholder:text-outline/50 outline-none" 
                        placeholder="e.g. Neon Dreams Stage Lighting" 
                        type="text"
                    />
                    <p className="mt-2 text-[11px] text-outline font-medium">Create a catchy name that stands out in searches.</p>
                </div>

                {/* Service Category */}
                <div className="col-span-2 md:col-span-1">
                    <label className="block text-[12px] font-black text-on-surface mb-2 tracking-wide uppercase">Service Category</label>
                    <div className="relative">
                        <select 
                            value={formData.category || ''}
                            onChange={(e) => updateFormData({ category: e.target.value })}
                            className="w-full bg-surface-container-low border-none rounded-full px-6 py-4 text-on-surface focus:ring-2 focus:ring-primary-container transition-all text-sm appearance-none cursor-pointer outline-none"
                        >
                            <option value="">Select Category</option>
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-outline">expand_more</span>
                    </div>
                </div>

                {/* Service Type */}
                <div className="col-span-2 md:col-span-1">
                    <label className="block text-[12px] font-black text-on-surface mb-2 tracking-wide uppercase">Service Type</label>
                    <div className="relative">
                        <select 
                            value={formData.type || ''}
                            onChange={(e) => updateFormData({ type: e.target.value })}
                            className="w-full bg-surface-container-low border-none rounded-full px-6 py-4 text-on-surface focus:ring-2 focus:ring-primary-container transition-all text-sm appearance-none cursor-pointer outline-none"
                        >
                            <option value="">Select Type</option>
                            {types.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-outline">expand_more</span>
                    </div>
                </div>

                {/* Lead Time */}
                <div className="col-span-2 md:col-span-1">
                    <label className="block text-[12px] font-black text-on-surface mb-2 tracking-wide uppercase">Lead Time</label>
                    <div className="relative">
                        <select 
                            value={formData.leadTime || ''}
                            onChange={(e) => updateFormData({ leadTime: e.target.value })}
                            className="w-full bg-surface-container-low border-none rounded-full px-6 py-4 text-on-surface focus:ring-2 focus:ring-primary-container transition-all text-sm appearance-none cursor-pointer outline-none"
                        >
                            {leadTimes.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                        <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-outline">schedule</span>
                    </div>
                </div>

                {/* Description */}
                <div className="col-span-2">
                    <div className="flex justify-between items-center mb-2">
                        <label className="block text-[12px] font-black text-on-surface tracking-wide uppercase">Description</label>
                        <span className="text-[10px] font-bold text-outline uppercase tracking-tighter">
                            {(formData.description || '').length} / 500 characters
                        </span>
                    </div>
                    <textarea 
                        value={formData.description || ''}
                        onChange={(e) => updateFormData({ description: e.target.value })}
                        className="w-full bg-surface-container-low border-none rounded-lg px-6 py-4 text-on-surface focus:ring-2 focus:ring-primary-container transition-all text-sm placeholder:text-outline/50 resize-none outline-none" 
                        placeholder="Describe the magic you bring to festivals..." 
                        rows="4"
                    ></textarea>
                </div>

                {/* Availability */}
                <div className="col-span-2">
                    <label className="block text-[12px] font-black text-on-surface mb-4 tracking-wide uppercase">Service Availability</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {['All Year', 'Seasonal', 'Custom'].map((opt) => (
                            <label key={opt} className={`relative flex items-center p-4 bg-surface-container-low rounded-xl cursor-pointer hover:bg-surface-variant transition-all border-2 ${formData.availability === opt ? 'border-tertiary' : 'border-transparent'} group`}>
                                <input 
                                    type="radio" 
                                    name="availability" 
                                    className="hidden" 
                                    checked={formData.availability === opt}
                                    onChange={() => updateFormData({ availability: opt })}
                                />
                                <div className="flex items-center gap-3">
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${formData.availability === opt ? 'border-tertiary bg-tertiary' : 'border-outline'}`}>
                                        <div className="w-2 h-2 bg-white rounded-full"></div>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-on-surface">{opt}</span>
                                        <span className="text-[10px] text-outline font-medium">
                                            {opt === 'All Year' ? 'Available for any date' : opt === 'Seasonal' ? 'Specific months only' : 'Manual calendar control'}
                                        </span>
                                    </div>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between pt-8 mt-8 border-t border-outline-variant/30">
                <button className="px-8 py-3 rounded-full text-secondary font-black text-sm hover:bg-secondary-container transition-all">Cancel</button>
                <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={nextStep}
                    className="px-10 py-4 bg-primary text-on-primary rounded-full font-black text-sm shadow-lg shadow-primary/20 flex items-center gap-2"
                >
                    Continue <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </motion.button>
            </div>
        </motion.section>
    );
};

export default Step1BasicInfo;
