import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, User } from 'lucide-react';
import DecorAnalysisCard from './DecorAnalysisCard';
import VendorCard from './VendorCard';

const ChatBubble = ({ message }) => {
    const isAi = message.sender === 'ai';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={`flex gap-3 ${isAi ? 'flex-row' : 'flex-row-reverse'}`}
        >
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm
                ${isAi ? 'bg-gradient-to-br from-[#D6336C] to-purple-600 text-white' : 'bg-gray-200 text-gray-500'}
            `}>
                {isAi ? <Sparkles className="w-4 h-4" /> : <User className="w-5 h-5" />}
            </div>

            {/* Content Bubble */}
            <div className={`flex flex-col gap-2 max-w-[85%] sm:max-w-[70%] text-sm leading-relaxed
                ${isAi ? 'items-start' : 'items-end'}
            `}>
                {message.text && (
                    <div className={`rounded-2xl px-5 py-3 shadow-sm
                        ${isAi
                            ? 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
                            : 'bg-[#D6336C] text-white rounded-tr-none'
                        }
                    `}>
                        {message.text}
                    </div>
                )}

                {/* Render Special Cards if present */}
                {message.decorAnalysis && (
                    <DecorAnalysisCard analysis={message.decorAnalysis} />
                )}

                {message.vendorRecommendation && (
                    <VendorCard vendor={message.vendorRecommendation} />
                )}
            </div>
        </motion.div>
    );
};

export default ChatBubble;
