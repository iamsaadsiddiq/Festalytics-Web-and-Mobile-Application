"use client";
import React from 'react';
import SettingsSidebar from '@/components/vendor/settings/SettingsSidebar';
import { motion } from 'framer-motion';

const SettingsLayout = ({ children }) => {
    return (
        <div className="flex gap-10 items-start">
            <SettingsSidebar />
            <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex-1"
            >
                {children}
            </motion.div>
        </div>
    );
};

export default SettingsLayout;
