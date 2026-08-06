"use client";
import React from 'react';
import { motion } from 'framer-motion';

const Step3Gallery = ({ formData, updateFormData, nextStep, prevStep }) => {
    // Note: In a real production app, this would handle file uploads to Firebase Storage or S3.
    // Here we simulate the state management for the UI.

    const handleFileUpload = (e) => {
        // Mock upload
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            const updatedGallery = [...(formData.gallery || []), url];
            updateFormData({ gallery: updatedGallery });
        }
    };

    const removeImage = (idx) => {
        const updatedGallery = formData.gallery.filter((_, i) => i !== idx);
        updateFormData({ gallery: updatedGallery });
    };

    return (
        <motion.section 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
        >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Featured Image */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-outline-variant h-full">
                        <h3 className="font-headline font-bold text-lg mb-4 flex items-center gap-2">
                            <span className="text-primary material-symbols-outlined">star</span>
                            Featured Image
                        </h3>
                        <div className="relative aspect-square w-full rounded-lg bg-surface-container-low border-2 border-dashed border-primary/30 flex flex-col items-center justify-center overflow-hidden group cursor-pointer hover:border-primary transition-colors">
                            {formData.featuredImage ? (
                                <img src={formData.featuredImage} className="w-full h-full object-cover" alt="Featured" />
                            ) : (
                                <div className="text-center p-4">
                                    <span className="material-symbols-outlined text-4xl text-outline mb-2">add_a_photo</span>
                                    <p className="text-xs font-bold text-outline uppercase">Upload Main Image</p>
                                </div>
                            )}
                            <input 
                                type="file" 
                                className="absolute inset-0 opacity-0 cursor-pointer" 
                                onChange={(e) => {
                                    const file = e.target.files[0];
                                    if(file) updateFormData({ featuredImage: URL.createObjectURL(file) });
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Gallery */}
                <div className="lg:col-span-2">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-outline-variant h-full">
                        <h3 className="font-headline font-bold text-lg mb-4 flex items-center gap-2">
                            <span className="text-secondary material-symbols-outlined">collections</span>
                            Service Gallery
                        </h3>
                        <div className="relative w-full p-10 rounded-lg bg-secondary-container/20 border-2 border-dashed border-secondary/40 flex flex-col items-center justify-center mb-8 hover:bg-secondary-container/30 transition-colors cursor-pointer group">
                            <div className="w-16 h-16 rounded-full bg-secondary-fixed flex items-center justify-center text-secondary mb-4 shadow-sm">
                                <span className="material-symbols-outlined text-3xl">add_a_photo</span>
                            </div>
                            <p className="font-headline font-bold text-on-secondary-container text-lg">Upload gallery images</p>
                            <input type="file" multiple className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileUpload} />
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {(formData.gallery || []).map((img, idx) => (
                                <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-outline-variant shadow-sm transition-transform duration-300 hover:scale-[1.03]">
                                    <img src={img} className="w-full h-full object-cover" alt={`Gallery ${idx}`} />
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => removeImage(idx)} className="w-8 h-8 rounded-full bg-white/90 text-primary shadow-md flex items-center justify-center">
                                            <span className="material-symbols-outlined text-sm">delete</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
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
                    Continue to Review
                    <span className="material-symbols-outlined">arrow_forward</span>
                </motion.button>
            </footer>
        </motion.section>
    );
};

export default Step3Gallery;
