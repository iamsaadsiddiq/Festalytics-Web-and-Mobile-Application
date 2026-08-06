import React from 'react';
import { Star, MapPin } from 'lucide-react';

const VendorCard = ({ vendor }) => {
    return (
        <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all group cursor-pointer hover:border-pink-100">
            <div className="w-20 h-20 rounded-xl overflow-hidden shadow-sm">
                <img
                    src={vendor.image}
                    alt={vendor.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                    <h4 className="font-bold text-gray-900 group-hover:text-[#D6336C] transition-colors truncate">
                        {vendor.name}
                    </h4>
                    <span className="flex items-center gap-1 text-xs font-bold text-[#D6336C] bg-pink-50 px-2 py-0.5 rounded-full">
                        {vendor.match} Match
                    </span>
                </div>

                <p className="text-xs text-gray-500 mb-2">{vendor.type}</p>

                <div className="flex items-center gap-3 text-xs text-gray-400">
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
