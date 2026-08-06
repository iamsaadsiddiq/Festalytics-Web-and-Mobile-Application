import React from 'react';
import { Star, MapPin } from 'lucide-react';

const VendorCard = ({ vendor }) => {
    return (
        <div className="flex-shrink-0 w-64 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer group">
            <div className="h-32 relative overflow-hidden">
                <img
                    src={vendor.image}
                    alt={vendor.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full text-[10px] font-bold text-[#D6336C]">
                    {vendor.match} Match
                </div>
            </div>
            <div className="p-3">
                <h4 className="font-bold text-gray-900 text-sm mb-1 truncate">{vendor.name}</h4>
                <p className="text-xs text-gray-500 mb-2">{vendor.type}</p>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" /> 4.9
                    </span>
                    <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> Lahore
                    </span>
                </div>
            </div>
        </div>
    );
};

export default VendorCard;
