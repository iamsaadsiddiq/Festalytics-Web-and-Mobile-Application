import React from 'react';
import { motion } from 'framer-motion';

const QuickActionButton = ({ icon: Icon, label, onClick }) => {
    return (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 shadow-sm hover:shadow-md hover:border-[#D6336C] hover:text-[#D6336C] transition-all whitespace-nowrap"
        >
            {Icon && <Icon className="w-4 h-4" />}
            {label}
        </motion.button>
    );
};

export default QuickActionButton;
