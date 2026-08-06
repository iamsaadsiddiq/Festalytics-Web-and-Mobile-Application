import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag, Palette, Store, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import VendorCard from './VendorCard';
import MoodboardButton from './MoodboardButton';

const SectionHeader = ({ icon: Icon, title, subtitle, isOpen, toggle }) => (
    <div
        onClick={toggle}
        className="flex items-center justify-between cursor-pointer p-4 hover:bg-gray-50 rounded-2xl transition-colors"
    >
        <div className="flex items-center gap-3">
            <div className="p-2.5 bg-pink-50 rounded-xl text-[#D6336C]">
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <h3 className="font-bold text-gray-900 leading-tight">{title}</h3>
                <p className="text-xs text-gray-500">{subtitle}</p>
            </div>
        </div>
        <div className="text-gray-400">
            {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
    </div>
);

const AnalysisResult = ({ result, onSave }) => {
    const [sections, setSections] = useState({ tags: true, colors: true, vendors: true });

    const toggleSection = (key) => {
        setSections(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4 h-full flex flex-col overflow-y-auto pr-2 custom-scrollbar"
        >
            {/* 1. Tags Analysis */}
            <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
                <SectionHeader
                    icon={Tag}
                    title="Detected Aesthetic"
                    subtitle="Key styles identified"
                    isOpen={sections.tags}
                    toggle={() => toggleSection('tags')}
                />
                <AnimatePresence>
                    {sections.tags && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="p-4 pt-0 flex flex-wrap gap-2">
                                {result.tags.map((tag, idx) => (
                                    <motion.span
                                        key={tag}
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="px-4 py-1.5 bg-gray-50 text-gray-700 font-semibold rounded-full text-sm border border-gray-200 hover:border-[#D6336C] hover:text-[#D6336C] transition-colors cursor-default"
                                    >
                                        #{tag}
                                    </motion.span>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* 2. Color Palette */}
            <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
                <SectionHeader
                    icon={Palette}
                    title="Color Palette"
                    subtitle="Dominant colors extracted"
                    isOpen={sections.colors}
                    toggle={() => toggleSection('colors')}
                />
                <AnimatePresence>
                    {sections.colors && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="p-4 pt-0">
                                <div className="flex h-20 rounded-2xl overflow-hidden shadow-inner ring-1 ring-gray-100">
                                    {result.colors.map(color => (
                                        <div
                                            key={color}
                                            className="flex-1 flex items-end justify-center pb-3 group relative cursor-pointer hover:flex-[1.5] transition-all duration-300"
                                            style={{ backgroundColor: color }}
                                        >
                                            <span className="text-[10px] font-mono font-bold bg-white/90 backdrop-blur-sm px-2 py-1 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 uppercase">
                                                {color}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* 3. Recommended Vendors - Horizontal Scroll */}
            <div className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">
                <SectionHeader
                    icon={Store}
                    title="Matched Vendors"
                    subtitle="Based on your style"
                    isOpen={sections.vendors}
                    toggle={() => toggleSection('vendors')}
                />
                <AnimatePresence>
                    {sections.vendors && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="p-4 pt-0">
                                <div className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x no-scrollbar">
                                    {result.vendors.map(vendor => (
                                        <div key={vendor.id} className="min-w-[280px] snap-center">
                                            <VendorCard vendor={vendor} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="pt-2 mt-auto">
                <MoodboardButton onSave={onSave} />
            </div>
        </motion.div>
    );
};

export default AnalysisResult;
