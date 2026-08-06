import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { renderToStaticMarkup } from 'react-dom/server';
import { Search, MapPin, Navigation, Phone, Star, Filter, Home, Camera, Utensils, Music, Coffee, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import PublicSiteHeader from './PublicSiteHeader';

// Fix for default Leaflet marker icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// --- Custom Map Styling & Icons ---

// Helper to Create Custom Marker Icons
const createVendorIcon = (category) => {
    let IconComponent = Home; // Default
    if (category === 'Photographer') IconComponent = Camera;
    if (category === 'Caterer') IconComponent = Utensils;
    if (category === 'Music') IconComponent = Music;

    const iconHtml = renderToStaticMarkup(
        <div className="relative flex items-center justify-center w-10 h-10">
            <div className="absolute inset-0 bg-[#D6336C] rounded-full shadow-lg border-2 border-white transform hover:scale-110 transition-transform duration-300"></div>
            <div className="relative z-10 text-white">
                <IconComponent size={18} strokeWidth={2.5} />
            </div>
        </div>
    );

    return L.divIcon({
        html: iconHtml,
        className: 'custom-vendor-marker', // Add this class for any extra css needs or pulse effects
        iconSize: [40, 40],
        iconAnchor: [20, 40], // Center bottom
        popupAnchor: [0, -40]
    });
};

const UserLocationIcon = L.divIcon({
    html: renderToStaticMarkup(
        <div className="relative flex items-center justify-center w-6 h-6">
            <div className="absolute inset-0 bg-blue-500 rounded-full opacity-30 animate-ping"></div>
            <div className="absolute inset-2 bg-blue-600 rounded-full border-2 border-white shadow-md"></div>
        </div>
    ),
    className: 'custom-user-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12]
});


// Mock Lahore Areas for Autocomplete
const LAHORE_AREAS = [
    { name: 'Gulberg', lat: 31.5204, lng: 74.3587 },
    { name: 'DHA Phase 5', lat: 31.4646, lng: 74.4069 },
    { name: 'Johar Town', lat: 31.4697, lng: 74.2728 },
    { name: 'Model Town', lat: 31.4805, lng: 74.3239 },
    { name: 'Bahria Town', lat: 31.3668, lng: 74.1856 },
    { name: 'Wapda Town', lat: 31.4332, lng: 74.2644 }
];

// Helper to pan map smoothly
const RecenterAutomatically = ({ lat, lng }) => {
    const map = useMap();
    useEffect(() => {
        map.flyTo([lat, lng], 14, {
            duration: 1.5,
            easeLinearity: 0.25
        });
    }, [lat, lng, map]);
    return null;
};

const ServiceDiscovery = () => {
    // Default to Lahore Center 
    const [userLocation, setUserLocation] = useState({ lat: 31.5204, lng: 74.3587 });
    const [vendors, setVendors] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredVendors, setFilteredVendors] = useState([]);
    const [selectedVendor, setSelectedVendor] = useState(null);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // Mock initial vendors 
    const MOCK_VENDORS = [
        { id: 'v1', name: 'Gourmet Catering', category: 'Caterer', lat: 31.5304, lng: 74.3487, rating: 4.5, image: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&q=80&w=100' },
        { id: 'v2', name: 'PC Hotel', category: 'Venue', lat: 31.5254, lng: 74.3687, rating: 5.0, image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=100' },
        { id: 'v3', name: 'Studio X Photography', category: 'Photographer', lat: 31.5104, lng: 74.3387, rating: 4.8, image: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&q=80&w=100' },
        { id: 'v4', name: 'DHA Event Complex', category: 'Venue', lat: 31.4746, lng: 74.4169, rating: 4.6, image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=100' },
        { id: 'v5', name: 'Spice Bazaar', category: 'Caterer', lat: 31.5004, lng: 74.3499, rating: 4.7, image: 'https://images.unsplash.com/photo-1507048331197-7d4def5e3744?auto=format&fit=crop&q=80&w=100' }
    ];

    useEffect(() => {
        // 1. Get User Location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                (error) => console.log("Geolocation error use defaults:", error),
                { enableHighAccuracy: true }
            );
        }

        // 2. Fetch Vendors (Mock + FireStore placeholder)
        const fetchVendors = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, 'vendors'));
                const dbVendors = [];
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    if (data.lat && data.lng) {
                        dbVendors.push({ id: doc.id, ...data });
                    }
                });
                if (dbVendors.length === 0) {
                    setVendors(MOCK_VENDORS);
                } else {
                    setVendors([...MOCK_VENDORS, ...dbVendors]);
                }
            } catch (err) {
                console.error("Error loading vendors:", err);
                setVendors(MOCK_VENDORS);
            }
        };
        fetchVendors();
    }, []);

    // Filter Logic
    useEffect(() => {
        if (!userLocation) return;

        const results = vendors.map(v => {
            const dist = calculateDistance(userLocation.lat, userLocation.lng, v.lat, v.lng);
            return { ...v, distance: dist.toFixed(1) };
        }).sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));

        setFilteredVendors(results);
    }, [userLocation, vendors]);

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371; // km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const handleSearchSelect = (area) => {
        setUserLocation({ lat: area.lat, lng: area.lng });
        setSearchQuery(area.name);
        setShowSuggestions(false);
    };

    return (
        <div className="flex flex-col h-screen bg-white font-sans text-gray-800">
            {/* Header */}
            <PublicSiteHeader />

            <div className="flex flex-1 overflow-hidden relative">

                {/* Sidebar (List) */}
                <div className="w-full md:w-1/3 bg-white z-20 flex flex-col shadow-xl border-r border-gray-100">
                    <div className="p-6 border-b border-gray-100">
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Discovery</h1>

                        {/* Search Bar */}
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                <Search className="w-5 h-5" />
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-[#D6336C] focus:border-[#D6336C] transition-colors"
                                placeholder="Search Lahore Area..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setShowSuggestions(true);
                                }}
                                onFocus={() => setShowSuggestions(true)}
                            />

                            {/* Autocomplete Suggestions */}
                            {showSuggestions && (
                                <div className="absolute top-full left-0 w-full bg-white border border-gray-100 rounded-b-xl shadow-lg mt-1 z-50 max-h-48 overflow-y-auto">
                                    {LAHORE_AREAS.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase())).map((area, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleSearchSelect(area)}
                                            className="w-full text-left px-4 py-3 hover:bg-pink-50 text-sm text-gray-700 font-medium transition-colors"
                                        >
                                            {area.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Filters (Optional Pills) */}
                    <div className="px-6 py-4 flex gap-2 overflow-x-auto no-scrollbar">
                        {['All', 'Venues', 'Photographers', 'Caterers'].map(cat => (
                            <button key={cat} className="px-4 py-1.5 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold hover:bg-gray-200 whitespace-nowrap">
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Results List */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {filteredVendors.map(vendor => (
                            <motion.div
                                key={vendor.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                onClick={() => {
                                    setSelectedVendor(vendor);
                                    setUserLocation({ lat: vendor.lat, lng: vendor.lng });
                                }}
                                className={`p-4 rounded-2xl border transition-all cursor-pointer ${selectedVendor?.id === vendor.id ? 'border-[#D6336C] bg-pink-50 shadow-md' : 'border-gray-100 hover:border-gray-300 hover:shadow-sm'}`}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-gray-900">{vendor.name}</h3>
                                        <p className="text-sm text-gray-500">{vendor.category}</p>
                                    </div>
                                    <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-gray-100 shadow-sm">
                                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                        <span className="text-xs font-bold">{vendor.rating}</span>
                                    </div>
                                </div>
                                <div className="mt-3 flex items-center justify-between text-xs text-gray-400 font-medium">
                                    <span className="flex items-center gap-1">
                                        <MapPin className="w-3 h-3" /> {vendor.distance} km away
                                    </span>
                                    <button className="text-[#D6336C] hover:underline">View Details</button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Map Area */}
                <div className="w-full md:w-2/3 h-64 md:h-auto relative">

                    {/* Modern Filter Overlay */}
                    <div className="absolute top-4 left-4 right-4 z-[400] flex justify-center pointer-events-none md:justify-start">
                        <button className="pointer-events-auto flex items-center gap-2 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border border-white/50 text-sm font-semibold text-gray-700 hover:bg-white transition-all">
                            <Filter className="w-4 h-4" />
                            Filter Map
                        </button>
                    </div>

                    <MapContainer center={[userLocation.lat, userLocation.lng]} zoom={13} scrollWheelZoom={true} className="h-full w-full bg-gray-50">
                        {/* Light/Silver Theme */}
                        <TileLayer
                            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                        />

                        <RecenterAutomatically lat={userLocation.lat} lng={userLocation.lng} />

                        {/* User Marker */}
                        <Marker position={[userLocation.lat, userLocation.lng]} icon={UserLocationIcon}>
                            <Popup className="custom-popup">You are Here</Popup>
                        </Marker>

                        {/* Vendor Markers */}
                        {vendors.map(vendor => (
                            <Marker
                                key={vendor.id}
                                position={[vendor.lat, vendor.lng]}
                                icon={createVendorIcon(vendor.category)}
                                eventHandlers={{
                                    click: () => {
                                        setSelectedVendor(vendor);
                                    },
                                }}
                            >
                                {/* Interactive InfoWindow / Popup */}
                                <Popup className="custom-popup" closeButton={false}>
                                    <div className="p-1 min-w-[200px]">
                                        <div className="flex gap-3">
                                            <img src={vendor.image} alt={vendor.name} className="w-12 h-12 rounded-lg object-cover bg-gray-100" />
                                            <div>
                                                <h3 className="text-sm font-bold text-gray-900 leading-tight mb-1">{vendor.name}</h3>
                                                <div className="flex items-center gap-1 mb-2">
                                                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                                    <span className="text-xs font-bold text-gray-700">{vendor.rating}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button className="w-full mt-2 bg-[#D6336C] text-white text-xs font-bold py-1.5 rounded-md hover:bg-[#B02A58] transition-colors">
                                            View Profile
                                        </button>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>

                    {/* Floating Action Popup on Map (Bottom) */}
                    {selectedVendor && (
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-white rounded-2xl shadow-2xl p-6 w-11/12 max-w-sm z-[1000] border-t-4 border-[#D6336C]"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">{selectedVendor.name}</h3>
                                    <p className="text-sm text-gray-500">{selectedVendor.category}</p>
                                </div>
                                <button onClick={() => setSelectedVendor(null)} className="text-gray-400 hover:text-gray-600">
                                    <div className='w-6 h-6 flex items-center justify-center'><X className="w-4 h-4" /></div>
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button className="flex items-center justify-center gap-2 bg-[#D6336C] text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-[#B02A58] transition-colors shadow-lg shadow-pink-200">
                                    <Navigation className="w-4 h-4" /> Get Directions
                                </button>
                                <button className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors">
                                    <Phone className="w-4 h-4" /> Contact
                                </button>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ServiceDiscovery;
