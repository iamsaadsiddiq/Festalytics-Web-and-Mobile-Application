"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Star, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

const HallCard = ({ venue, index, imagePath }) => {
  const router = useRouter();
  const [match, setMatch] = React.useState('90%');
  const [rating, setRating] = React.useState('4.5');

  React.useEffect(() => {
    // Set random values only on client to avoid hydration mismatch
    setMatch(venue.match || `${Math.floor(Math.random() * 20) + 80}%`);
    setRating(venue.rating || (Math.random() * (5.0 - 4.0) + 4.0).toFixed(1));
  }, [venue.match, venue.rating]);

  // Use dynamically passed imagePath prop, ensuring underscore for the main folder
  const imageSrc = (imagePath || '/images/placeholder-hall.jpg').replace('/Marriage Hall/', '/Marriage_hall/');

    const handleCardClick = () => {
    const slug =
      venue.isFromDb && venue.hall_id
        ? venue.hall_id
        : venue.hall_id?.toString() || venue.hall_name?.toLowerCase().replace(/\s+/g, '-');
    router.push(`/venue/${slug}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: (index % 10) * 0.05 }}
      onClick={handleCardClick}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow group flex flex-col h-full cursor-pointer"
    >
      {/* Image Container */}
      <div className="h-48 relative bg-gray-200 shrink-0">
        <img 
          src={imageSrc} 
          alt={venue.hall_name} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
          onError={(e) => {
            e.target.onerror = null; 
            e.target.src = 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?q=80&w=2698&auto=format&fit=crop';
          }}
        />
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold text-[#D6336C] shadow-sm z-10">
          {match} Match
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-2 gap-2">
          <h3 className="text-sm font-bold text-gray-900 line-clamp-2 p-0 m-0">{venue.hall_name}</h3>
          <div className="flex items-center gap-1 bg-gray-50 px-1.5 py-0.5 rounded text-xs font-semibold text-gray-700 shrink-0">
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            {rating}
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-3">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span className="line-clamp-2">{venue.full_address || venue.area || 'Lahore'}</span>
        </div>

        <div className="mt-auto pt-3 border-t border-gray-50 flex items-center justify-between">
          <span className="text-sm font-bold text-[#D6336C]">
            {venue.price_range ? venue.price_range.split(' ')[1] || venue.price_range : 'Contact for price'}
          </span>
          <button className="text-xs font-bold text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg transition-colors group-hover:bg-[#D6336C] group-hover:text-white group-hover:border-[#D6336C]">
            View Details
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default HallCard;
