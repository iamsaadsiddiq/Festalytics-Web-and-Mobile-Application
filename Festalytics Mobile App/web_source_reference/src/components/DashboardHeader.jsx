import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { signOut, onAuthStateChanged } from 'firebase/auth'; // Import auth listener
import { auth } from '../firebase';
import { LogOut, User as UserIcon, Sparkles, Menu, X, Sun, SunDim, Moon, Palette } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DashboardHeader = () => {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    // Greeting Logic
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) return { text: 'Good Morning', icon: Sun, color: 'text-amber-500' };
        if (hour >= 12 && hour < 18) return { text: 'Good Afternoon', icon: SunDim, color: 'text-orange-500' };
        return { text: 'Good Evening', icon: Moon, color: 'text-indigo-500' };
    };
    const { text: greetingText, icon: GreetingIcon, color: greetingColor } = getGreeting();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
            }
        });
        return () => unsubscribe();
    }, []);

    const confirmLogout = async () => {
        try {
            await signOut(auth);
            router.push('/');
        } catch (error) {
            console.error("Logout Error: ", error);
        }
        setShowLogoutModal(false);
    };

    const isActive = (path) => pathname === path;
    const displayName = user?.displayName || 'User';

    const NavLink = ({ path, label, icon: Icon }) => (
        <button
            onClick={() => router.push(path)}
            className={`font-medium transition-colors flex items-center gap-1 ${isActive(path) ? 'text-[#D6336C] font-bold relative after:content-[""] after:absolute after:-bottom-2 after:left-0 after:w-full after:h-0.5 after:bg-[#D6336C]' : 'text-gray-500 hover:text-gray-900'}`}
        >
            {Icon && <Icon className={`w-3 h-3 ${isActive(path) ? 'text-[#D6336C]' : 'text-gray-400 group-hover:text-gray-600'}`} />}
            {label}
        </button>
    );

    return (
        <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">

                    {/* 1. Logo Section & Mobile Toggle */}
                    <div className="flex items-center gap-4">
                        {/* Mobile Menu Toggle */}
                        <button
                            className="md:hidden text-gray-600 hover:text-[#D6336C] transition-colors"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>

                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/user-dashboard')}>
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center transform rotate-3 shadow-lg" style={{ backgroundColor: '#D6336C' }}>
                                <Sparkles className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 hidden lg:block">
                                Festalytics
                            </span>
                        </div>
                    </div>

                    {/* 2. Center Menu Options (Desktop) */}
                    <div className="hidden md:flex items-center space-x-8">
                        <NavLink path="/user-dashboard" label="Dashboard" />
                        <NavLink path="/my-events" label="My Events" />
                        <NavLink path="/service-discovery" label="Vendors" />
                        <NavLink path="/find-decor" label="Find My Decor" icon={Palette} />
                        <NavLink path="/ai-planner" label="AI Planner" icon={Sparkles} />


                    </div>

                    {/* 3. Right Side: Profile */}
                    <div className="flex items-center gap-4 sm:gap-6">
                        {/* User Info & Profile */}
                        <div className="flex items-center gap-3">
                            <div className="text-right hidden lg:block">
                                <div className="flex items-center justify-end gap-1.5 mb-0.5">
                                    <GreetingIcon className={`w-3.5 h-3.5 ${greetingColor}`} />
                                    <span className="text-xs font-medium text-gray-500">{greetingText},</span>
                                </div>
                                <p className="text-sm font-bold text-gray-900 leading-tight">{displayName}</p>
                            </div>

                            {/* Profile Picture */}
                            <div className="h-10 w-10 relative rounded-full p-[2px]" style={{ background: `linear-gradient(to right, #D6336C, #be185d)` }}>
                                <div className="h-full w-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                                    {user?.photoURL ? (
                                        <img
                                            src={user.photoURL}
                                            alt={displayName}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <UserIcon className="w-5 h-5 text-gray-400" />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Logout Button */}
                        <button
                            onClick={() => setShowLogoutModal(true)}
                            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-all hover:shadow-md border border-transparent hover:border-pink-100"
                            style={{ backgroundColor: '#fdf2f8', color: '#D6336C' }}
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="hidden lg:inline">Logout</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {isMenuOpen && (
                <div className="md:hidden absolute top-20 left-0 w-full bg-white border-b border-gray-100 shadow-xl py-4 px-6 flex flex-col gap-4 animate-in slide-in-from-top-2 duration-200 z-40">
                    <button onClick={() => router.push('/user-dashboard')} className={`text-left font-medium py-2 pl-4 rounded-md ${isActive('/user-dashboard') ? 'text-[#D6336C] bg-pink-50 border-l-4 border-[#D6336C]' : 'text-gray-600 hover:bg-gray-50'}`}>Dashboard</button>
                    <button onClick={() => router.push('/create-event')} className={`text-left font-medium py-2 pl-4 rounded-md ${isActive('/create-event') ? 'text-[#D6336C] bg-pink-50 border-l-4 border-[#D6336C]' : 'text-gray-600 hover:bg-gray-50'}`}>My Events</button>
                    <button onClick={() => router.push('/service-discovery')} className={`text-left font-medium py-2 pl-4 rounded-md ${isActive('/service-discovery') ? 'text-[#D6336C] bg-pink-50 border-l-4 border-[#D6336C]' : 'text-gray-600 hover:bg-gray-50'}`}>Vendors</button>
                    <button onClick={() => router.push('/ai-planner')} className={`text-left font-medium py-2 pl-4 rounded-md ${isActive('/ai-planner') ? 'text-[#D6336C] bg-pink-50 border-l-4 border-[#D6336C]' : 'text-gray-600 hover:bg-gray-50'}`}>AI Planner</button>
                    <div className="border-t border-gray-100 my-2"></div>
                    <button
                        onClick={() => setShowLogoutModal(true)}
                        className="flex items-center gap-2 text-red-500 font-medium py-2 pl-4"
                    >
                        <LogOut className="w-4 h-4" /> Logout
                    </button>
                </div>
            )}

            {/* Logout Confirmation Modal */}
            <AnimatePresence>
                {showLogoutModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowLogoutModal(false)}
                            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 10 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm z-10 flex flex-col items-center text-center"
                        >
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                                <LogOut className="w-8 h-8 text-red-500" />
                            </div>

                            <h2 className="text-xl font-bold text-gray-900 mb-2">Confirm Logout</h2>
                            <p className="text-gray-500 mb-6">
                                Are you sure you really want to log out of Festalytics?
                            </p>

                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={() => setShowLogoutModal(false)}
                                    className="flex-1 py-2.5 rounded-xl text-gray-700 font-semibold bg-gray-100 hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmLogout}
                                    className="flex-1 py-2.5 rounded-xl text-white font-semibold bg-[#D6336C] hover:brightness-110 shadow-lg shadow-pink-200 transition-all"
                                >
                                    Logout
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </nav>
    );
};

export default DashboardHeader;
