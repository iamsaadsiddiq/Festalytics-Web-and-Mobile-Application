"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';

const Step2Pricing = ({ formData, updateFormData, nextStep, prevStep }) => {
    const [newPackage, setNewPackage] = useState({ name: '', price: '', description: '' });

    const addPackage = () => {
        if (newPackage.name && newPackage.price) {
            const updatedPackages = [...(formData.packages || []), newPackage];
            updateFormData({ packages: updatedPackages });
            setNewPackage({ name: '', price: '', description: '' });
        }
    };

    const removePackage = (idx) => {
        const updatedPackages = formData.packages.filter((_, i) => i !== idx);
        updateFormData({ packages: updatedPackages });
    };

    return (
        <motion.section 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
        >
            <div className="grid grid-cols-12 gap-6">
                {/* Base Pricing Card */}
                <div className="col-span-12 lg:col-span-4 bg-white rounded-lg p-8 shadow-sm border border-outline-variant flex flex-col gap-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary-fixed rounded-lg text-primary">
                            <span className="material-symbols-outlined">payments</span>
                        </div>
                        <h3 className="text-xl font-black text-on-surface">Base Structure</h3>
                    </div>
                    <div>
                        <label className="block text-sm font-black text-on-surface-variant mb-4">Pricing Type</label>
                        <div className="space-y-3">
                            {['Fixed Price', 'Per Unit / Hour'].map(type => (
                                <label key={type} className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${formData.pricingType === type ? 'border-primary bg-primary-container/10' : 'border-outline-variant hover:border-secondary'}`}>
                                    <input 
                                        type="radio" 
                                        name="pricing_type" 
                                        className="w-5 h-5 text-primary border-outline focus:ring-primary" 
                                        checked={formData.pricingType === type}
                                        onChange={() => updateFormData({ pricingType: type })}
                                    />
                                    <span className={`font-bold ${formData.pricingType === type ? 'text-on-surface' : 'text-on-surface-variant'}`}>{type}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-black text-on-surface-variant mb-2">Base Amount (Rs.)</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-outline font-black">Rs.</span>
                            <input 
                                value={formData.basePrice || ''}
                                onChange={(e) => updateFormData({ basePrice: e.target.value })}
                                className="w-full pl-12 pr-4 py-4 rounded-full border-2 border-outline-variant focus:border-primary focus:ring-0 bg-surface font-black text-xl outline-none" 
                                placeholder="0" 
                                type="number"
                            />
                        </div>
                    </div>
                </div>

                {/* Package Table Card */}
                <div className="col-span-12 lg:col-span-8 bg-white rounded-lg p-8 shadow-sm border border-outline-variant">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-secondary-fixed rounded-lg text-secondary">
                                <span className="material-symbols-outlined">featured_play_list</span>
                            </div>
                            <h3 className="text-xl font-black text-on-surface">Tiered Packages</h3>
                        </div>
                    </div>
                    
                    {/* Package Entry */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-surface-container-low rounded-xl">
                        <input 
                            placeholder="Package Name" 
                            className="bg-white px-4 py-2 rounded-full text-sm outline-none border border-outline-variant focus:border-primary"
                            value={newPackage.name}
                            onChange={e => setNewPackage({...newPackage, name: e.target.value})}
                        />
                        <input 
                            placeholder="Price (Rs.)" 
                            type="number"
                            className="bg-white px-4 py-2 rounded-full text-sm outline-none border border-outline-variant focus:border-primary"
                            value={newPackage.price}
                            onChange={e => setNewPackage({...newPackage, price: e.target.value})}
                        />
                        <button 
                            onClick={addPackage}
                            className="bg-primary text-white rounded-full font-bold text-sm h-10 hover:scale-105 transition-all"
                        >Add Package</button>
                    </div>

                    <div className="overflow-hidden border border-outline-variant rounded-xl">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-surface-container-low border-b border-outline-variant">
                                    <th className="px-6 py-4 text-xs font-black text-outline uppercase tracking-widest">Package Name</th>
                                    <th className="px-6 py-4 text-xs font-black text-outline uppercase tracking-widest">Price</th>
                                    <th className="px-6 py-4 text-xs font-black text-outline uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant">
                                {(formData.packages || []).map((pkg, idx) => (
                                    <tr key={idx}>
                                        <td className="px-6 py-4 font-bold text-on-surface">{pkg.name}</td>
                                        <td className="px-6 py-4 font-black text-primary">Rs. {pkg.price}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={() => removePackage(idx)} className="p-2 text-outline hover:text-error transition-colors">
                                                <span className="material-symbols-outlined">delete</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {(!formData.packages || formData.packages.length === 0) && (
                                    <tr>
                                        <td colSpan="3" className="px-6 py-8 text-center text-outline italic">No packages added yet.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <footer class="pt-8 border-t border-outline-variant/30 flex justify-between items-center">
                <button 
                    onClick={prevStep}
                    className="flex items-center gap-2 px-8 py-4 text-secondary font-black hover:bg-secondary-container rounded-full transition-all"
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                    Back
                </button>
                <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={nextStep}
                    className="px-12 py-4 bg-primary text-on-primary rounded-full font-black shadow-lg shadow-primary/20 flex items-center gap-3"
                >
                    Continue to Gallery
                    <span className="material-symbols-outlined">arrow_forward</span>
                </motion.button>
            </footer>
        </motion.section>
    );
};

export default Step2Pricing;
