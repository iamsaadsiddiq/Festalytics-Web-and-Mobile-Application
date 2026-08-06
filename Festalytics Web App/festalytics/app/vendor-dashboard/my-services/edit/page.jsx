"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import VenueCalendarWorkspace from '@/components/vendor/availability/VenueCalendarWorkspace';

const EditServicePage = () => {
    const [activeTab, setActiveTab] = useState('Overview');
    const [serviceActive, setServiceActive] = useState(true);
    const [faqOpen, setFaqOpen] = useState({ 0: true });

    // State for Images tab
    const [images, setImages] = useState([
        { id: 1, url: "/Marriage_hall/Zaydan Banquet Hall/2.webp", label: "Zaydan Banquet Hall Main Entrance", isPrimary: true },
        { id: 2, url: "/Marriage_hall/Zaydan Banquet Hall/1.webp", label: "Zaydan Banquet Royal Ballroom", isPrimary: false },
        { id: 3, url: "/Marriage_hall/Zaydan Banquet Hall/3.jpg", label: "Royal floral setting & logistics", isPrimary: false }
    ]);

    // State for description features
    const [features, setFeatures] = useState([
        "Premium Sound System", "Custom Mood Lighting", "Valet Parking Access", "Integrated Stage", "Full Bar Setup"
    ]);
    const [newFeature, setNewFeature] = useState("");

    // State for Pricing tiers
    const [pricingPackages, setPricingPackages] = useState([
        { id: 1, name: "Bronze Package", price: "Rs. 250,000", description: "Standard venue hire with basic sound and lighting.", features: ["4 Hours Venue Access", "Basic Setup Assistance", "Standard Lighting"] },
        { id: 2, name: "Silver Package", price: "Rs. 450,000", description: "Perfect for formal receptions and mid-sized banquets.", features: ["6 Hours Venue Access", "Premium Sound & Lights", "Stage Access", "1 Dedicated Assistant"] },
        { id: 3, name: "Gold Package", price: "Rs. 680,000", description: "Our ultimate premium offering with all services included.", features: ["Full Day Access (12h)", "UHD Projectors & Screen", "Valet Parking Access", "2 Dedicated Assistants", "Pre-event Foyer Drinks"] }
    ]);

    // State for Add-ons Menu
    const [addons, setAddons] = useState([
        { id: 1, name: "Gourmet Catering Service", price: "Rs. 2,850/guest", desc: "Chef-selected menus with premium buffet options.", icon: "restaurant" },
        { id: 2, name: "Floral Arrangements & Decor", price: "Rs. 120,000", desc: "Floral design customized to your event theme colors.", icon: "temp_preferences_custom" },
        { id: 3, name: "State-of-the-Art AV Pack", price: "Rs. 25,000", desc: "Concert-grade speakers, wireless microphones, and dynamic laser lighting.", icon: "volume_up" }
    ]);
    const [newAddon, setNewAddon] = useState({ name: '', price: '', desc: '', icon: 'add' });

    // Tab items
    const tabs = ['Overview', 'Images', 'Description', 'Pricing', 'Menu', 'Calendar', 'Location', 'Reviews', 'FAQs'];

    const toggleFaq = (idx) => {
        setFaqOpen(prev => ({ ...prev, [idx]: !prev[idx] }));
    };

    const handleAddFeature = (e) => {
        e.preventDefault();
        if (!newFeature.trim()) return;
        setFeatures([...features, newFeature.trim()]);
        setNewFeature("");
    };

    const handleRemoveFeature = (idx) => {
        setFeatures(features.filter((_, i) => i !== idx));
    };

    const handleAddAddon = (e) => {
        e.preventDefault();
        if (!newAddon.name || !newAddon.price) return;
        setAddons([...addons, { ...newAddon, id: Date.now() }]);
        setNewAddon({ name: '', price: '', desc: '', icon: 'add' });
    };

    const handleDiscard = () => {
        if (confirm("Are you sure you want to discard your changes?")) {
            window.location.reload();
        }
    };

    const handleSaveChanges = () => {
        alert("Changes saved successfully!");
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8 max-w-7xl mx-auto w-full"
        >
            {/* Breadcrumbs & Header Actions */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                    <nav className="flex items-center gap-2 text-xs font-bold text-outline uppercase tracking-widest">
                        <Link href="/vendor-dashboard" className="hover:text-primary transition-colors">Dashboard</Link>
                        <span className="material-symbols-outlined text-xs">chevron_right</span>
                        <Link href="/vendor-dashboard/my-services" className="hover:text-primary transition-colors">My Services</Link>
                        <span className="material-symbols-outlined text-xs text-primary">chevron_right</span>
                        <span className="text-primary">Edit Service</span>
                    </nav>
                    <h2 className="text-3xl font-black text-on-surface tracking-tight">Edit Service: <span className="text-secondary">Zaydan Banquet Hall</span></h2>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={handleDiscard}
                        className="px-6 py-2.5 rounded-full font-bold text-secondary bg-surface-container-high hover:bg-secondary-container transition-colors bouncy-microinteraction cursor-pointer"
                    >
                        Discard
                    </button>
                    <button 
                        onClick={handleSaveChanges}
                        className="px-8 py-2.5 rounded-full font-bold text-on-primary bg-primary shadow-[0_4px_16px_rgba(224,64,160,0.3)] hover:scale-105 transition-all bouncy-microinteraction cursor-pointer"
                    >
                        Save Changes
                    </button>
                </div>
            </div>

            {/* Sub-Navigation Tabs */}
            <div className="bg-surface-container rounded-full p-1.5 flex flex-wrap items-center shadow-sm overflow-x-auto gap-1">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab;
                    return (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all cursor-pointer ${
                                isActive 
                                    ? 'bg-primary text-on-primary shadow-md' 
                                    : 'text-on-surface-variant hover:text-primary'
                            }`}
                        >
                            {tab}
                        </button>
                    );
                })}
            </div>

            {/* Dashboard Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Metrics Sidebar (Left - Always Active/Unchanged) */}
                <div className="md:col-span-4 space-y-6">
                    {/* Status Card */}
                    <div className="bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-outline-variant/30 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-outline uppercase tracking-wider">Service Status</p>
                            <h4 className="text-xl font-black text-on-surface">{serviceActive ? 'Currently Active' : 'Currently Paused'}</h4>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                checked={serviceActive} 
                                onChange={(e) => setServiceActive(e.target.checked)} 
                                className="sr-only peer" 
                                type="checkbox"
                            />
                            <div className="w-14 h-8 bg-surface-container-highest peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-primary shadow-inner"></div>
                        </label>
                    </div>

                    {/* Quick Metrics */}
                    <div className="bg-primary/5 p-6 rounded-3xl border border-primary-fixed-dim">
                        <h4 className="text-sm font-bold text-primary-fixed-variant mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-lg">insights</span> Lifetime Performance
                        </h4>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-on-surface-variant font-medium">Total Bookings</span>
                                <span className="font-black text-primary text-xl">142</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-on-surface-variant font-medium">Total Revenue</span>
                                <span className="font-black text-secondary text-xl">Rs. 12,450</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-on-surface-variant font-medium">Average Rating</span>
                                <div className="flex items-center gap-1">
                                    <span className="font-black text-tertiary text-xl">4.9</span>
                                    <span className="material-symbols-outlined text-tertiary text-sm fill-1">star</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Booking Trends Mini-Chart Simulation */}
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-outline-variant/30">
                        <p className="text-xs font-bold text-outline uppercase mb-4">Weekly Engagement</p>
                        <div className="flex items-end gap-2 h-24">
                            <div className="flex-1 bg-primary/20 rounded-t-full" style={{ height: '40%' }}></div>
                            <div className="flex-1 bg-primary/40 rounded-t-full" style={{ height: '65%' }}></div>
                            <div className="flex-1 bg-primary rounded-t-full" style={{ height: '85%' }}></div>
                            <div className="flex-1 bg-primary/60 rounded-t-full" style={{ height: '50%' }}></div>
                            <div className="flex-1 bg-primary/30 rounded-t-full" style={{ height: '30%' }}></div>
                            <div className="flex-1 bg-primary/80 rounded-t-full" style={{ height: '75%' }}></div>
                            <div className="flex-1 bg-primary rounded-t-full shadow-[0_-4px_12px_rgba(224,64,160,0.2)]" style={{ height: '100%' }}></div>
                        </div>
                        <div className="flex justify-between mt-2 text-[10px] font-bold text-outline">
                            <span>MON</span><span>WED</span><span>FRI</span><span>SUN</span>
                        </div>
                    </div>
                </div>

                {/* Main Dynamic Content Area (Right side changes on tab click) */}
                <div className="md:col-span-8 space-y-6">
                    <AnimatePresence mode="wait">
                        
                        {/* Tab 1: Overview */}
                        {activeTab === 'Overview' && (
                            <motion.div
                                key="Overview"
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                className="space-y-6"
                            >
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    {/* Main Preview Image */}
                                    <div className="sm:col-span-2 relative h-72 rounded-3xl overflow-hidden group shadow-lg">
                                        <img 
                                            alt="A luxurious grand ballroom" 
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBuy0BVHC2XjRTH_fSoFFFDSRO22xmDudYl8wK5pitHccWAdmbEOIckxmIuxol0j21-WqmYYPLB9yB_HQPA58PLV0U1G-K6e_dV0zoVCxo5q_GS4sQW7YACzr_EHVk4mH8OJGUeZPA0GaXYnAyltwWVP6H3JskBpYtLfl9VWOeqGlDbCWi5YHqoNIUdpe2DvVXJrIyfr4ZBo429xthALp5xmyfDaICOTNubnEHNB9Z6e2K_ZN_-sPDhzSZpjVFenK2puDppwqG1y7k"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                        <div className="absolute bottom-6 left-6 text-white">
                                            <h3 className="text-2xl font-black">Main Banner Image</h3>
                                            <p className="text-sm opacity-90">First impression for potential clients</p>
                                        </div>
                                        <button 
                                            onClick={() => setActiveTab('Images')}
                                            className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white/40 transition-colors cursor-pointer"
                                        >
                                            <span className="material-symbols-outlined text-white">edit</span>
                                        </button>
                                    </div>

                                    {/* Info Card 1 */}
                                    <div className="bg-white p-6 rounded-3xl border border-outline-variant/30 hover:border-primary/50 transition-colors shadow-sm">
                                        <div className="flex items-center gap-3 mb-4">
                                            <span className="material-symbols-outlined text-primary p-2 bg-primary-fixed rounded-full">info</span>
                                            <h5 className="font-black text-on-surface">Basic Info</h5>
                                        </div>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-[10px] font-bold text-outline uppercase tracking-wider">Service Name</label>
                                                <p className="font-bold text-secondary text-sm">Zaydan Banquet Hall</p>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-outline uppercase tracking-wider">Category</label>
                                                <p className="font-bold text-on-surface text-sm">Luxury Venue</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Info Card 2 */}
                                    <div className="bg-white p-6 rounded-3xl border border-outline-variant/30 hover:border-tertiary/50 transition-colors shadow-sm">
                                        <div className="flex items-center gap-3 mb-4">
                                            <span className="material-symbols-outlined text-tertiary p-2 bg-tertiary-fixed rounded-full">groups</span>
                                            <h5 className="font-black text-on-surface">Capacity & Fit</h5>
                                        </div>
                                        <div className="space-y-3">
                                            <div>
                                                <label className="text-[10px] font-bold text-outline uppercase tracking-wider">Max Guests</label>
                                                <p className="font-bold text-secondary text-sm">500 People</p>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-outline uppercase tracking-wider">Min Duration</label>
                                                <p className="font-bold text-on-surface text-sm">4 Hours</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Recent Activity Section */}
                                <div className="bg-surface-container-low p-8 rounded-3xl border border-outline-variant/20 shadow-sm">
                                    <div className="flex items-center justify-between mb-6">
                                        <h4 className="text-xl font-black text-on-surface">Activity Log</h4>
                                        <button className="text-xs font-bold text-primary hover:underline">View History</button>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="flex items-start gap-4">
                                            <div className="w-2.5 h-2.5 rounded-full bg-primary mt-2 shadow-[0_0_8px_rgba(224,64,160,0.4)]"></div>
                                            <div>
                                                <p className="text-sm font-bold text-on-surface">Pricing Updated</p>
                                                <p className="text-xs text-outline font-medium mt-0.5">You changed the base price from Rs. 250,000 to Rs. 280,000 • 2 hours ago</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <div className="w-2.5 h-2.5 rounded-full bg-secondary mt-2 shadow-[0_0_8px_rgba(124,82,170,0.4)]"></div>
                                            <div>
                                                <p className="text-sm font-bold text-on-surface">New Review Received</p>
                                                <p className="text-xs text-outline font-medium mt-0.5">Sarah J. left a 5-star rating for 'Wedding Reception' • Yesterday</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <div className="w-2.5 h-2.5 rounded-full bg-tertiary mt-2 shadow-[0_0_8px_rgba(0,150,204,0.4)]"></div>
                                            <div>
                                                <p className="text-sm font-bold text-on-surface">Service Draft Saved</p>
                                                <p className="text-xs text-outline font-medium mt-0.5">Description edits were autosaved • 3 days ago</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Actions Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <button className="p-5 bg-white rounded-3xl border border-outline-variant/30 flex flex-col items-center gap-2 hover:bg-primary-container/20 group transition-all cursor-pointer shadow-sm">
                                        <span className="material-symbols-outlined text-primary group-hover:scale-125 transition-transform text-2xl">visibility</span>
                                        <span className="text-xs font-bold text-on-surface">View Live Page</span>
                                    </button>
                                    <button className="p-5 bg-white rounded-3xl border border-outline-variant/30 flex flex-col items-center gap-2 hover:bg-secondary-container/30 group transition-all cursor-pointer shadow-sm">
                                        <span className="material-symbols-outlined text-secondary group-hover:scale-125 transition-transform text-2xl">share</span>
                                        <span className="text-xs font-bold text-on-surface">Share Link</span>
                                    </button>
                                    <button className="p-5 bg-white rounded-3xl border border-outline-variant/30 flex flex-col items-center gap-2 hover:bg-error-container group transition-all cursor-pointer shadow-sm">
                                        <span className="material-symbols-outlined text-error group-hover:scale-125 transition-transform text-2xl">delete</span>
                                        <span className="text-xs font-bold text-on-surface">Archive Service</span>
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* Tab 2: Images */}
                        {activeTab === 'Images' && (
                            <motion.div
                                key="Images"
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                className="bg-white p-8 rounded-3xl border border-outline-variant/30 shadow-sm space-y-8"
                            >
                                <div>
                                    <h3 className="text-2xl font-black text-on-surface tracking-tight">Service Gallery</h3>
                                    <p className="text-sm font-medium text-on-surface-variant mt-1">Manage the visual assets for your service. Drag and drop to reorder.</p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                    {images.map((img) => (
                                        <div key={img.id} className="relative group rounded-2xl overflow-hidden border border-outline-variant/30 h-44 shadow-sm bg-surface-container-low">
                                            <img src={img.url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-115" alt={img.label} />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                                {!img.isPrimary && (
                                                    <button 
                                                        onClick={() => setImages(images.map(i => ({ ...i, isPrimary: i.id === img.id })))}
                                                        className="p-2 bg-white text-primary rounded-full hover:scale-110 transition-transform cursor-pointer"
                                                        title="Set as Primary"
                                                    >
                                                        <span className="material-symbols-outlined text-lg fill-1">star</span>
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={() => setImages(images.filter(i => i.id !== img.id))}
                                                    className="p-2 bg-white text-error rounded-full hover:scale-110 transition-transform cursor-pointer"
                                                    title="Delete Image"
                                                >
                                                    <span className="material-symbols-outlined text-lg">delete</span>
                                                </button>
                                            </div>
                                            <div className="absolute bottom-3 left-3 right-3 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-xl text-white text-[10px] font-black uppercase tracking-wider flex justify-between items-center">
                                                <span className="truncate max-w-[120px]">{img.label}</span>
                                                {img.isPrimary && <span className="text-primary font-black">PRIMARY</span>}
                                            </div>
                                        </div>
                                    ))}

                                    <div className="border-4 border-dashed border-outline-variant/50 hover:border-primary/50 transition-colors rounded-2xl h-44 flex flex-col items-center justify-center gap-3 text-outline hover:text-primary cursor-pointer bg-surface-container-low/50 group shadow-inner">
                                        <span className="material-symbols-outlined text-4xl group-hover:rotate-90 transition-transform">add_a_photo</span>
                                        <p className="text-[10px] font-black uppercase tracking-widest">Upload New Photo</p>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Tab 3: Description */}
                        {activeTab === 'Description' && (
                            <motion.div
                                key="Description"
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                className="bg-white p-8 rounded-3xl border border-outline-variant/30 shadow-sm space-y-8"
                            >
                                <div>
                                    <h3 className="text-2xl font-black text-on-surface tracking-tight">Service Description</h3>
                                    <p className="text-sm font-medium text-on-surface-variant mt-1">Provide clear details of what your luxury venue offers clients.</p>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest px-1">Detailed Description</label>
                                        <textarea 
                                            rows="6" 
                                            className="w-full bg-surface-container-low border-2 border-transparent rounded-3xl px-6 py-4 focus:border-primary focus:ring-0 text-on-surface font-bold text-sm resize-none transition-all"
                                            defaultValue="A luxurious, sun-drenched grand ballroom with high ceilings, massive crystal chandeliers, and expansive floor-to-ceiling windows showing a lush garden view. The room is decorated with vibrant floral arrangements, creating a joyful and energetic atmosphere. Soft, warm natural light spills across polished marble floors, highlighting the elegant table settings."
                                        />
                                        <p className="text-[9px] text-outline font-black uppercase text-right tracking-wider px-2">350 / 1000 Characters</p>
                                    </div>

                                    {/* Key Features checklist builder */}
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest px-1">Key Amenities & Features</label>
                                        <div className="flex flex-wrap gap-2.5 bg-surface-container-low p-4 rounded-3xl border border-outline-variant/20">
                                            {features.map((feature, i) => (
                                                <span key={i} className="bg-white text-secondary text-xs font-black py-2 px-4 rounded-full flex items-center gap-2 shadow-sm border border-outline-variant/30">
                                                    {feature}
                                                    <span 
                                                        onClick={() => handleRemoveFeature(i)}
                                                        className="material-symbols-outlined text-[16px] cursor-pointer hover:text-error transition-colors"
                                                    >
                                                        close
                                                    </span>
                                                </span>
                                            ))}
                                        </div>

                                        <form onSubmit={handleAddFeature} className="flex gap-4">
                                            <input 
                                                type="text" 
                                                value={newFeature}
                                                onChange={(e) => setNewFeature(e.target.value)}
                                                placeholder="Add new amenity (e.g. In-house catering)" 
                                                className="flex-1 bg-surface-container-low border-2 border-transparent rounded-full px-6 py-4 focus:border-primary focus:ring-0 text-on-surface font-bold text-xs"
                                            />
                                            <button 
                                                type="submit"
                                                className="px-8 bg-secondary text-white font-black text-xs uppercase tracking-wider rounded-full shadow-lg shadow-secondary/20 hover:scale-105 transition-transform cursor-pointer"
                                            >
                                                Add
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Tab 4: Pricing */}
                        {activeTab === 'Pricing' && (
                            <motion.div
                                key="Pricing"
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                className="space-y-6"
                            >
                                <div className="bg-white p-8 rounded-3xl border border-outline-variant/30 shadow-sm">
                                    <h3 className="text-2xl font-black text-on-surface tracking-tight mb-2">Base Pricing Details</h3>
                                    <p className="text-sm font-medium text-on-surface-variant mb-6">Manage base price defaults and active packages tiers.</p>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest px-1">Base Price per Event</label>
                                            <div className="relative">
                                                <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-primary">Rs.</span>
                                                <input type="text" className="w-full bg-surface-container-low border-2 border-transparent rounded-full pl-16 pr-6 py-4 focus:border-primary focus:ring-0 text-on-surface font-black text-lg transition-all" defaultValue="250,000" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest px-1">Pricing Scheme</label>
                                            <select className="w-full bg-surface-container-low border-2 border-transparent rounded-full px-6 py-4 focus:border-primary focus:ring-0 text-on-surface font-bold text-sm appearance-none cursor-pointer">
                                                <option>Fixed Rate per Event</option>
                                                <option>Hourly Rate</option>
                                                <option>Per Guest Rate</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Custom Packages Configurator */}
                                <div className="bg-white p-8 rounded-3xl border border-outline-variant/30 shadow-sm space-y-6">
                                    <h3 className="text-2xl font-black text-on-surface tracking-tight">Active Packages</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                        {pricingPackages.map((pkg) => (
                                            <div key={pkg.id} className="p-6 rounded-2xl bg-surface-container-low border border-outline-variant/40 flex flex-col justify-between h-[320px] shadow-sm relative group hover:border-primary/50 transition-colors">
                                                <div>
                                                    <div className="flex justify-between items-start mb-4">
                                                        <h4 className="font-black text-secondary text-sm uppercase tracking-wider">{pkg.name}</h4>
                                                        <span className="font-black text-xl text-primary">{pkg.price}</span>
                                                    </div>
                                                    <p className="text-xs text-on-surface-variant font-medium leading-relaxed mb-4">{pkg.description}</p>
                                                    <ul className="space-y-1.5">
                                                        {pkg.features.map((f, i) => (
                                                            <li key={i} className="text-[10px] font-bold text-on-surface flex items-center gap-2">
                                                                <span className="material-symbols-outlined text-[14px] text-tertiary">check_circle</span>
                                                                {f}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                                <button className="w-full py-2.5 bg-white border border-outline-variant/50 text-secondary text-[10px] font-black uppercase tracking-widest rounded-full hover:bg-secondary hover:text-white transition-colors cursor-pointer mt-4">
                                                    Configure Tier
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Tab 5: Menu */}
                        {activeTab === 'Menu' && (
                            <motion.div
                                key="Menu"
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                className="bg-white p-8 rounded-3xl border border-outline-variant/30 shadow-sm space-y-8"
                            >
                                <div>
                                    <h3 className="text-2xl font-black text-on-surface tracking-tight">Service Add-ons & Menu</h3>
                                    <p className="text-sm font-medium text-on-surface-variant mt-1">Configure additional packages or sub-services that users can purchase during checkout.</p>
                                </div>

                                <div className="space-y-4">
                                    {addons.map((addon) => (
                                        <div key={addon.id} className="p-6 rounded-2xl bg-surface-container-low border border-outline-variant/20 flex items-center justify-between gap-6 hover:shadow-md transition-shadow">
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 bg-white text-primary rounded-xl flex items-center justify-center shadow-sm">
                                                    <span className="material-symbols-outlined text-2xl">{addon.icon}</span>
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-on-surface text-base">{addon.name}</h4>
                                                    <p className="text-xs text-on-surface-variant font-medium mt-1">{addon.desc}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <span className="font-black text-lg text-secondary whitespace-nowrap">{addon.price}</span>
                                                <button 
                                                    onClick={() => setAddons(addons.filter(a => a.id !== addon.id))}
                                                    className="p-3 bg-white text-error rounded-xl hover:scale-105 transition-transform cursor-pointer border border-outline-variant/30 shadow-sm"
                                                >
                                                    <span className="material-symbols-outlined text-lg">delete</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <form onSubmit={handleAddAddon} className="p-6 bg-surface-container-low rounded-3xl border-2 border-dashed border-outline-variant/50 space-y-4">
                                    <h4 className="text-[10px] font-black text-secondary uppercase tracking-[0.2em]">Add New Sub-Service/Add-on</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <input 
                                            type="text" 
                                            placeholder="Add-on Name"
                                            value={newAddon.name}
                                            onChange={(e) => setNewAddon({ ...newAddon, name: e.target.value })}
                                            className="bg-white border-2 border-transparent rounded-full px-5 py-3 focus:border-primary focus:ring-0 text-xs font-bold"
                                        />
                                        <input 
                                            type="text" 
                                            placeholder="Price (e.g. Rs. 2,850/guest or Rs. 20,000)"
                                            value={newAddon.price}
                                            onChange={(e) => setNewAddon({ ...newAddon, price: e.target.value })}
                                            className="bg-white border-2 border-transparent rounded-full px-5 py-3 focus:border-primary focus:ring-0 text-xs font-bold"
                                        />
                                        <select 
                                            value={newAddon.icon}
                                            onChange={(e) => setNewAddon({ ...newAddon, icon: e.target.value })}
                                            className="bg-white border-2 border-transparent rounded-full px-5 py-3 focus:border-primary focus:ring-0 text-xs font-bold"
                                        >
                                            <option value="restaurant">Food & Beverage (restaurant)</option>
                                            <option value="temp_preferences_custom">Flowers/Decor (decor)</option>
                                            <option value="volume_up">Audio/Visual (speaker)</option>
                                            <option value="directions_car">Valet (car)</option>
                                        </select>
                                    </div>
                                    <div className="flex gap-4 items-center">
                                        <input 
                                            type="text" 
                                            placeholder="Description of the add-on service"
                                            value={newAddon.desc}
                                            onChange={(e) => setNewAddon({ ...newAddon, desc: e.target.value })}
                                            className="flex-1 bg-white border-2 border-transparent rounded-full px-5 py-3 focus:border-primary focus:ring-0 text-xs font-bold"
                                        />
                                        <button 
                                            type="submit"
                                            className="px-8 py-3 bg-primary text-white font-black text-xs uppercase tracking-wider rounded-full shadow-lg shadow-primary/20 hover:scale-105 transition-transform cursor-pointer"
                                        >
                                            Add Add-on
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        )}

                        {/* Tab 6: Calendar — synced with Availability page */}
                        {activeTab === 'Calendar' && (
                            <motion.div
                                key="Calendar"
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                className="bg-white p-6 md:p-8 rounded-3xl border border-outline-variant/30 shadow-sm"
                            >
                                <VenueCalendarWorkspace variant="embedded" publishLabel="Publish Calendar" />
                            </motion.div>
                        )}

                        {/* Tab 7: Location */}
                        {activeTab === 'Location' && (
                            <motion.div
                                key="Location"
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                className="bg-white p-8 rounded-3xl border border-outline-variant/30 shadow-sm space-y-8"
                            >
                                <div>
                                    <h3 className="text-2xl font-black text-on-surface tracking-tight">Location & Logistics</h3>
                                    <p className="text-sm font-medium text-on-surface-variant mt-1">Configure where your venue is located or your service radius parameters.</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest px-1">Venue Street Address</label>
                                            <input type="text" className="w-full bg-surface-container-low border-2 border-transparent rounded-full px-6 py-4 focus:border-primary focus:ring-0 text-on-surface font-bold text-sm" defaultValue="123 Confectionery Lane" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest px-1">City</label>
                                                <input type="text" className="w-full bg-surface-container-low border-2 border-transparent rounded-full px-6 py-4 focus:border-primary focus:ring-0 text-on-surface font-bold text-sm" defaultValue="Sugarland" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest px-1">Postal Code</label>
                                                <input type="text" className="w-full bg-surface-container-low border-2 border-transparent rounded-full px-6 py-4 focus:border-primary focus:ring-0 text-on-surface font-bold text-sm" defaultValue="77478" />
                                            </div>
                                        </div>
                                        <div className="p-6 bg-surface-container-low rounded-2xl border border-outline-variant/30">
                                            <h4 className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-2">Travel Fees (For Mobile Vendors)</h4>
                                            <p className="text-xs text-on-surface-variant font-medium leading-relaxed">As a fixed location venue, travel fees do not apply to this service.</p>
                                        </div>
                                    </div>

                                    {/* Map representation */}
                                    <div className="relative rounded-[2rem] overflow-hidden shadow-md border-8 border-white ring-1 ring-outline-variant/30 h-72">
                                        <img 
                                            alt="Map Location" 
                                            className="w-full h-full object-cover" 
                                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuByUAxup7W5RNRb9YHJs3VnlPY-qDwX4s7NFqNjmjQPDoyx1eat5EMkztS18kdHecQHzYnG2itxOLBbm6tNDuoKEeRSQfB08LVmsp0FY17ncBPxfmp0i17gLD8F_KrCtN3FX4xXzDqTfKRHruhn-4z1_9XTf4cFNoMqt9ZY_TuJd-Q31Bwv6ZHKfaSpzgS9yp_kmwXMNcEUYGva-mW0zTxV4bY8fIEQEp0S_Dz7TlA3YEbZqzxchWY38-fzHpJPrcqvv88pyHpeJGY"
                                        />
                                        <div className="absolute inset-0 bg-black/10"></div>
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                            <span className="material-symbols-outlined text-primary text-5xl animate-bounce drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)]">location_on</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Tab 8: Reviews */}
                        {activeTab === 'Reviews' && (
                            <motion.div
                                key="Reviews"
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                className="bg-white p-8 rounded-3xl border border-outline-variant/30 shadow-sm space-y-8"
                            >
                                <div className="flex justify-between items-start flex-col md:flex-row gap-6">
                                    <div>
                                        <h3 className="text-2xl font-black text-on-surface tracking-tight">Customer Reviews</h3>
                                        <p className="text-sm font-medium text-on-surface-variant mt-1">Read and reply to feedback from clients who booked Zaydan Banquet Hall.</p>
                                    </div>
                                    <div className="flex items-center gap-4 bg-surface-container-low px-6 py-3 rounded-full border border-outline-variant/20">
                                        <span className="font-black text-3xl text-primary">4.9</span>
                                        <div className="text-left">
                                            <div className="flex text-yellow-500">
                                                {Array.from({ length: 5 }, (_, i) => (
                                                    <span key={i} className="material-symbols-outlined text-[16px] fill-1">star</span>
                                                ))}
                                            </div>
                                            <p className="text-[9px] text-outline font-black uppercase mt-0.5 tracking-wider">142 TOTAL REVIEWS</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {[
                                        { id: 1, name: "Sarah Jenkins", role: "Wedding Bride", rating: 5, date: "Yesterday, 3:15 PM", comment: "Zaydan Banquet Hall was the absolute venue of my dreams! The lighting was magical, the team assisted with every setup request, and our guests were in complete awe of the elegant layout.", avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDgeLzlA5XtTQ0l7oEDflZ9ehbgwu8VjwxLrQjx-DwpUVzYU2pZZeOId8YywmTI0NvAtf9WhK9jIZKAMkzkgG18NQO6nVwSAiZcNsGWY55P9jk_dVBQjkebW4kgCG4qGAGdboi11VYpcAm99fbugNHi8CLrYlaLXBxyjdJkRD8lBqSl-GTmZkfauEwzWFJ03TnYnlZuoieR-QgTwGX886iKkyzagbvPko2mjaW98hZOijtwwWugXcCTxA6JBXv_CeOYiY2Z0sLEhDc" },
                                        { id: 2, name: "Michael Vance", role: "Corporate Organizer", rating: 4.8, date: "4 days ago", comment: "Exceptional service and extremely grand visual vibes. Setup was extremely easy due to the loading dock access, and the stage was perfect for our presenters.", avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAYUMlYd8vgXmXeltCVhXJqBDEO7JKFTHvr46Dx2AnfEgje7RwkAibYGG0JyrjT5fnMTosjoz9t-PoDwOSGB4KrEuc8eKSnd6IAm3bPm2ESr0xHDHUB9cJGt-pFYhfmXPqN1pWthQsFXcC2DPlHgakce5A_s1qbyI3WJoSU8GxbwBX5zzOEH2CDbjH4HTgRuHy9rcWixL-MUHTTXbdL7BA-mmZ3g_i0jrc0ZjPZaNf3L3JXLQmc-ukc0m7jICMGsxBIM2Oln1RuiNw" }
                                    ].map((rev) => (
                                        <div key={rev.id} className="p-6 rounded-3xl bg-surface-container-low border border-outline-variant/20 space-y-4">
                                            <div className="flex justify-between items-start flex-col sm:flex-row gap-4">
                                                <div className="flex items-center gap-4">
                                                    <img src={rev.avatar} className="w-12 h-12 rounded-full border border-primary-container p-0.5" alt={rev.name} />
                                                    <div>
                                                        <h4 className="font-black text-on-surface text-sm">{rev.name}</h4>
                                                        <p className="text-[10px] text-outline font-bold uppercase tracking-widest mt-0.5">{rev.role}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="flex text-yellow-500 justify-end">
                                                        {Array.from({ length: 5 }, (_, i) => (
                                                            <span key={i} className="material-symbols-outlined text-[14px] fill-1">star</span>
                                                        ))}
                                                    </div>
                                                    <p className="text-[9px] text-outline font-black uppercase mt-1 tracking-widest">{rev.date}</p>
                                                </div>
                                            </div>
                                            <p className="text-xs text-on-surface-variant font-medium leading-relaxed">{rev.comment}</p>
                                            <div className="bg-white p-4 rounded-2xl border border-outline-variant/30 flex items-center gap-4">
                                                <span className="material-symbols-outlined text-secondary">reply</span>
                                                <input type="text" placeholder="Write a public reply to Sarah..." className="flex-1 border-none bg-transparent text-xs font-bold text-on-surface outline-none placeholder:text-outline" />
                                                <button className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline cursor-pointer">POST REPLY</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Tab 9: FAQs */}
                        {activeTab === 'FAQs' && (
                            <motion.div
                                key="FAQs"
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                className="bg-white p-8 rounded-3xl border border-outline-variant/30 shadow-sm space-y-8"
                            >
                                <div>
                                    <h3 className="text-2xl font-black text-on-surface tracking-tight">Service FAQs</h3>
                                    <p className="text-sm font-medium text-on-surface-variant mt-1">Manage frequently asked questions specific to the Zaydan Banquet Hall.</p>
                                </div>

                                <div className="space-y-4">
                                    {[
                                        { q: "Is catering included in the base venue hire price?", a: "Catering is not included in the base venue rate of Rs. 250,000. You can choose to add our Gourmet Catering Service from the 'Menu' tab or work with one of our certified external catering partners." },
                                        { q: "What is the venue's cancellation policy?", a: "Cancellations made more than 30 days prior to the event date receive a full refund minus a 10% administrative fee. Cancellations under 30 days are subject to a 50% cancellation fee." },
                                        { q: "Do you have physical parking facilities?", a: "Yes, we have private parking space for up to 150 vehicles. Custom valet services can be added as a sub-service package during setup." }
                                    ].map((faq, idx) => {
                                        const isOpen = faqOpen[idx];
                                        return (
                                            <div key={idx} className="bg-surface-container-low rounded-3xl border border-outline-variant/20 overflow-hidden">
                                                <button 
                                                    onClick={() => toggleFaq(idx)}
                                                    className="w-full p-6 text-left flex justify-between items-center font-black text-sm text-on-surface tracking-tight hover:bg-surface-variant/30 transition-colors cursor-pointer"
                                                >
                                                    {faq.q}
                                                    <span className={`material-symbols-outlined text-primary transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>expand_more</span>
                                                </button>
                                                <AnimatePresence>
                                                    {isOpen && (
                                                        <motion.div 
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className="px-6 pb-6 text-xs font-medium text-on-surface-variant leading-relaxed"
                                                        >
                                                            <div className="pt-2 border-t border-outline-variant/20 leading-relaxed font-bold">
                                                                {faq.a}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        );
                                    })}
                                </div>

                                <button className="w-full py-4 border-2 border-dashed border-outline-variant/50 hover:border-primary/50 text-outline hover:text-primary transition-colors font-black text-xs uppercase tracking-widest rounded-3xl flex items-center justify-center gap-2 cursor-pointer bg-surface-container-low/50">
                                    <span className="material-symbols-outlined">add</span>
                                    Add New FAQ
                                </button>
                            </motion.div>
                        )}

                    </AnimatePresence>
                </div>
            </div>

            {/* Sticky Save Button (as shown in HTML) */}
            <div className="fixed bottom-10 right-10 z-[100] flex items-center gap-4">
                {/* Floating Add Sub-Service (FAB) button */}
                <motion.button 
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    className="w-16 h-16 bg-secondary text-white rounded-full shadow-[0_8px_24px_rgba(124,82,170,0.4)] flex items-center justify-center cursor-pointer border-2 border-white/20"
                    onClick={() => setActiveTab('Menu')}
                    title="Add Sub-Service"
                >
                    <span className="material-symbols-outlined text-3xl">add</span>
                </motion.button>

                <motion.button 
                    whileHover={{ scale: 1.1, rotate: 2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleSaveChanges}
                    className="bg-primary text-white flex items-center gap-4 px-10 py-5 rounded-full font-black text-lg shadow-[0_15px_40px_rgba(224,64,160,0.4)] border-2 border-white/20 backdrop-blur-md cursor-pointer"
                >
                    <span className="material-symbols-outlined text-2xl fill-1">save</span>
                    SAVE CHANGES
                </motion.button>
            </div>

            {/* Footer Shell */}
            <footer className="py-6 border-t border-outline-variant/30 text-center mt-12 bg-white/20 rounded-[2rem]">
                <p className="text-xs font-bold text-outline">© 2024 Festalytics Vendor Portal • Version 4.2.1-Candy</p>
            </footer>
        </motion.div>
    );
};

export default EditServicePage;
