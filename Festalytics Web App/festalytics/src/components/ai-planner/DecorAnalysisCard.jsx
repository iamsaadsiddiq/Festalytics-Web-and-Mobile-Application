import React from 'react';
import { Tag, Palette } from 'lucide-react';
import VendorCard from './VendorCard';

const DecorAnalysisCard = ({ analysis }) => {
    return (
        <div className="bg-gray-50 rounded-2xl p-4 space-y-4 max-w-sm sm:max-w-md w-full">
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">✨</span>
                <h3 className="font-bold text-gray-900 text-sm">Decor Analysis</h3>
            </div>

            {/* Tags */}
            <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                    <Tag className="w-3.5 h-3.5" /> Detected Styles
                </div>
                <div className="flex flex-wrap gap-1.5">
                    {analysis.tags.map(tag => (
                        <span key={tag} className="px-3 py-1 bg-white border border-gray-100 rounded-full text-xs text-gray-700 shadow-sm">
                            #{tag}
                        </span>
                    ))}
                </div>
            </div>

            {/* Palette */}
            <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600">
                    <Palette className="w-3.5 h-3.5" /> Color Palette
                </div>
                <div className="flex h-8 rounded-lg overflow-hidden shadow-sm ring-1 ring-black/5">
                    {analysis.colors.map(color => (
                        <div key={color} className="flex-1" style={{ backgroundColor: color }} title={color}></div>
                    ))}
                </div>
            </div>

            {/* Recommendations */}
            {analysis.vendors && analysis.vendors.length > 0 && (
                <div className="space-y-2">
                    <div className="text-xs font-semibold text-gray-600">Recommended Vendors</div>
                    <div className="flex gap-3 overflow-x-auto pb-2 snap-x no-scrollbar">
                        {analysis.vendors.map(vendor => (
                            <div key={vendor.id} className="snap-center">
                                <VendorCard vendor={vendor} />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DecorAnalysisCard;
