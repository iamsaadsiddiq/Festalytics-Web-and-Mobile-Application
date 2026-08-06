import React from 'react';
import Link from 'next/link';
import {
    FaXTwitter,
    FaFacebookF,
    FaLinkedinIn,
    FaInstagram,
    FaTiktok,
} from 'react-icons/fa6';

const primary = '#D6336C';

const Footer = () => {
    return (
        <footer className="bg-gray-50 border-t border-gray-200 font-sans mt-auto">
            <div className="mx-auto w-full max-w-7xl px-6 py-16 lg:px-8">
                <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">

                    {/* Brand & Newsletter Section */}
                    <div className="w-full lg:w-1/3 space-y-8">
                        <div>
                            <div className="text-3xl font-bold text-[#D6336C] tracking-tight">
                                Festalytics
                            </div>
                            <p className="mt-4 text-sm leading-6 text-gray-600">
                                Planning your dream event made simple, seamless, and smarter with AI.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">Stay Updated</h3>
                            <div className="relative max-w-md">
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    className="w-full rounded-full border border-gray-200 bg-white px-5 py-3 pr-36 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:border-[#D6336C] focus:outline-none focus:ring-1 focus:ring-[#D6336C] transition-colors"
                                />
                                <button
                                    style={{ backgroundColor: primary }}
                                    className="absolute right-1.5 top-1.5 bottom-1.5 rounded-full px-5 text-sm font-semibold text-white shadow-sm hover:brightness-110 active:scale-95 transition-all"
                                >
                                    Subscribe
                                </button>
                            </div>
                        </div>

                        {/* Feedback (Minimalist) */}
                        <div className="space-y-2">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Feedback</p>
                            <a href="#" className="text-sm text-[#D6336C] hover:text-[#B02A58] transition-colors flex items-center gap-1 font-medium">
                                Share your suggestions &rarr;
                            </a>
                        </div>
                    </div>

                    {/* Links Grid */}
                    <div className="w-full lg:w-2/3 grid grid-cols-2 md:grid-cols-4 gap-8">
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">Company</h3>
                            <ul className="space-y-3">
                                {[
                                    { label: 'About Us', href: '#' },
                                    { label: 'Contact Us', href: '#' },
                                    { label: 'Vendor Login', href: '/login?type=vendor' },
                                    { label: 'Register Your Venue', href: '/signup?role=vendor' },
                                ].map((item) => (
                                    <li key={item.label}>
                                        {item.href.startsWith('/') ? (
                                            <Link href={item.href} className="text-sm text-gray-600 hover:text-[#D6336C] transition-colors">
                                                {item.label}
                                            </Link>
                                        ) : (
                                            <a href={item.href} className="text-sm text-gray-600 hover:text-[#D6336C] transition-colors">
                                                {item.label}
                                            </a>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="space-y-4 col-span-2 sm:col-span-1">
                            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">Services</h3>
                            <ul className="space-y-3">
                                {[
                                    'Venue Booking',
                                    'Event Management',
                                    'Vendor Discovery',
                                    'AI Décor Matching',
                                    'Budget Calculator',
                                    'Smart Recs',
                                ].map((item) => (
                                    <li key={item}>
                                        <a href="#" className="text-sm text-gray-600 hover:text-[#D6336C] transition-colors">
                                            {item}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">Legal</h3>
                            <ul className="space-y-3">
                                {['Terms & Conditions', 'Privacy Policy', 'Cookie Policy', 'Licenses'].map((item) => (
                                    <li key={item}>
                                        <a href="#" className="text-sm text-gray-600 hover:text-[#D6336C] transition-colors">
                                            {item}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase">Download</h3>
                            <ul className="space-y-3">
                                <li>
                                    <a href="#" className="text-sm text-gray-600 hover:text-[#D6336C] transition-colors">
                                        iOS App
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="text-sm text-gray-600 hover:text-[#D6336C] transition-colors">
                                        Android App
                                    </a>
                                </li>
                            </ul>
                        </div>

                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-16 border-t border-gray-200 pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
                    <p className="text-xs text-gray-500">
                        &copy; 2025 Festalytics. All rights reserved.
                    </p>
                    <div className="flex items-center gap-6">
                        <a href="#" className="text-gray-400 hover:text-[#D6336C] transition-colors" aria-label="Facebook">
                            <FaFacebookF size={18} />
                        </a>
                        <a href="#" className="text-gray-400 hover:text-[#D6336C] transition-colors" aria-label="Instagram">
                            <FaInstagram size={18} />
                        </a>
                        <a href="#" className="text-gray-400 hover:text-[#D6336C] transition-colors" aria-label="LinkedIn">
                            <FaLinkedinIn size={18} />
                        </a>
                        <a href="#" className="text-gray-400 hover:text-[#D6336C] transition-colors" aria-label="Twitter">
                            <FaXTwitter size={18} />
                        </a>
                        <a href="#" className="text-gray-400 hover:text-[#D6336C] transition-colors" aria-label="TikTok">
                            <FaTiktok size={18} />
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
