import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Save } from 'lucide-react';

const MoodboardButton = ({ onSave }) => {
    const [saved, setSaved] = useState(false);

    const handleClick = () => {
        setSaved(true);
        onSave();
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <motion.button
            whileTop={{ scale: 0.98 }}
            onClick={handleClick}
            className={`w-full py-4 rounded-2xl font-bold shadow-xl flex items-center justify-center gap-2 transition-all
            ${saved
                    ? "bg-green-500 text-white shadow-green-200"
                    : "bg-gray-900 text-white shadow-gray-200 hover:bg-gray-800"
                }`}
        >
            {saved ? (
                <>
                    <Check className="w-5 h-5" /> Saved to Moodboard!
                </>
            ) : (
                <>
                    <Save className="w-5 h-5" /> Save to Moodboard
                </>
            )}
        </motion.button>
    );
};

export default MoodboardButton;
