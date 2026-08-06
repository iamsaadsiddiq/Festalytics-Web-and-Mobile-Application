import React from 'react';
import { motion } from 'framer-motion';

const Loader = () => {
    return (
        <div className="flex flex-col items-center justify-center p-12 text-center space-y-6">
            <div className="relative w-24 h-24">
                <motion.div
                    className="absolute inset-0 rounded-full border-4 border-[#D6336C]/20"
                />
                <motion.div
                    className="absolute inset-0 rounded-full border-4 border-t-[#D6336C] border-r-transparent border-b-transparent border-l-transparent"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <motion.div
                    className="absolute inset-4 bg-pink-50 rounded-full flex items-center justify-center"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                >
                    <span className="text-2xl">✨</span>
                </motion.div>
            </div>

            <div className="space-y-2">
                <h3 className="text-xl font-bold text-gray-900">Scanning Aesthetics...</h3>
                <p className="text-gray-500 max-w-xs mx-auto">
                    Our AI is extracting colors, identifying styles, and matching you with perfect vendors.
                </p>
            </div>
        </div>
    );
};

export default Loader;
