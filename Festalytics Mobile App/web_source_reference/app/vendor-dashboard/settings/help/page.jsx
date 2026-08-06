"use client";
import React from 'react';
import { motion } from 'framer-motion';

const HelpSettings = () => {
    return (
        <div className="space-y-12">
            <header className="flex flex-col gap-2">
                <h1 className="text-4xl font-black text-on-background tracking-tighter">Help & Support</h1>
                <p className="text-on-surface-variant font-bold uppercase text-[10px] tracking-[0.2em]">How can we help your business thrive today?</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
                {/* FAQ Section */}
                <section className="lg:col-span-2 space-y-8">
                    <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-outline-variant/30 flex flex-col">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                            <h2 className="text-2xl font-black text-secondary tracking-tight">Frequently Asked Questions</h2>
                            <div className="relative w-full md:w-1/2">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-tertiary">search</span>
                                <input 
                                    className="w-full pl-12 pr-6 py-4 bg-tertiary-fixed/30 rounded-2xl border-none focus:ring-2 focus:ring-tertiary text-xs font-bold uppercase tracking-widest text-on-tertiary-fixed-variant" 
                                    placeholder="Search for answers..." 
                                    type="text"
                                />
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                            {[
                                { q: 'How do I update my payout settings?', a: "Navigate to the Payments tab in your sidebar. Click on 'Payout Methods' to add or edit your bank details and schedule preferences." },
                                { q: 'Can I change my subscription plan?', a: null },
                                { q: 'What are the fees for Festalytics?', a: null },
                                { q: 'How to set up automated taxes?', a: null },
                            ].map((faq, i) => (
                                <details key={i} className="group bg-surface-container-low rounded-3xl p-6 border-2 border-transparent hover:border-primary-fixed transition-all cursor-pointer">
                                    <summary className="flex items-center justify-between list-none font-black text-sm text-on-surface tracking-tight">
                                        {faq.q}
                                        <span className="material-symbols-outlined text-primary group-open:rotate-180 transition-transform">expand_more</span>
                                    </summary>
                                    {faq.a && <p className="mt-4 text-xs font-medium text-on-surface-variant leading-relaxed px-2 border-l-4 border-primary/20">{faq.a}</p>}
                                </details>
                            ))}
                        </div>
                    </div>

                    {/* Resource Library */}
                    <div className="bg-secondary-container p-10 rounded-[3rem] shadow-xl border border-secondary/10">
                        <h2 className="text-2xl font-black text-on-secondary-container mb-10 flex items-center gap-4 tracking-tight">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-secondary shadow-sm">
                                <span className="material-symbols-outlined fill-1">menu_book</span>
                            </div>
                            Resource Library
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[
                                { title: 'Video Tutorials', desc: 'Visual step-by-step guides', icon: 'play_circle', color: 'primary' },
                                { title: 'API Documentation', desc: 'For advanced integrations', icon: 'description', color: 'tertiary' },
                                { title: 'Getting Started', desc: 'Vendor portal basics', icon: 'article', color: 'secondary' },
                                { title: "What's New", desc: 'Latest features & updates', icon: 'new_releases', color: 'primary-container' },
                            ].map((res, i) => (
                                <motion.a 
                                    key={i}
                                    whileHover={{ x: 10, scale: 1.02 }}
                                    className="flex items-center gap-5 bg-white/50 hover:bg-white p-6 rounded-[2rem] transition-all shadow-sm border border-white/50 cursor-pointer group"
                                >
                                    <div className={`w-14 h-14 bg-${res.color} rounded-2xl flex items-center justify-center text-white shadow-lg shadow-${res.color}/20 group-hover:rotate-12 transition-transform`}>
                                        <span className="material-symbols-outlined text-2xl fill-1">{res.icon}</span>
                                    </div>
                                    <div>
                                        <p className="font-black text-on-secondary-container text-sm tracking-tight">{res.title}</p>
                                        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-1">{res.desc}</p>
                                    </div>
                                </motion.a>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Contact & Feedback */}
                <aside className="space-y-8">
                    {/* Contact Card */}
                    <section className="bg-primary text-on-primary p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                        <div className="relative z-10">
                            <h2 className="text-2xl font-black mb-8 tracking-tight">Contact Us</h2>
                            <div className="space-y-8">
                                <div className="flex items-center gap-5">
                                    <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                                        <span className="material-symbols-outlined text-xl fill-1">mail</span>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Email Support</p>
                                        <p className="font-black text-sm tracking-tight">support@festalytics.com</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-5">
                                    <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                                        <span className="material-symbols-outlined text-xl fill-1">call</span>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Hotline</p>
                                        <p className="font-black text-sm tracking-tight">+1 (888) FESTA-HELP</p>
                                    </div>
                                </div>
                                <motion.button 
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="w-full bg-white text-primary font-black py-5 rounded-[2rem] shadow-2xl flex items-center justify-center gap-3 text-xs uppercase tracking-[0.15em] border-2 border-white group"
                                >
                                    <span className="material-symbols-outlined text-xl group-hover:rotate-12 transition-transform">chat</span>
                                    START LIVE CHAT
                                </motion.button>
                            </div>
                        </div>
                        <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000"></div>
                    </section>

                    {/* Feature Request */}
                    <section className="bg-surface-container-high/50 p-10 rounded-[3rem] shadow-xl border border-outline-variant/30 flex flex-col gap-6">
                        <h3 className="text-lg font-black text-on-surface tracking-tight">Request a Feature</h3>
                        <p className="text-[11px] font-bold text-on-surface-variant leading-relaxed">Have an idea to make Festalytics better? We're listening!</p>
                        <div className="space-y-4">
                            <textarea 
                                className="w-full rounded-[2rem] border-2 border-transparent bg-white focus:border-primary focus:ring-0 text-sm font-bold p-6 shadow-inner resize-none" 
                                placeholder="I would love to see..." 
                                rows="4"
                            ></textarea>
                            <motion.button 
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="w-full bg-secondary text-white font-black py-4 rounded-full text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-secondary/30"
                            >
                                Submit Request
                            </motion.button>
                        </div>
                    </section>

                    {/* Support Image */}
                    <div className="rounded-[3rem] overflow-hidden h-56 relative shadow-2xl group">
                        <img 
                            alt="Customer Support" 
                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAWHx6MSW4ZKE8vyugmvS60Bx2HmdW-jyKMsqiT-dTXm8P1oZOFtE3ER9ZrgELdpkEJkEyLct_3vM7_siYemTChOkllgv0DwldzYd-FTQRVfc2CpTGdmTEOoYjsanp9uzHwQZUaObg3vg0ZM9Kg_4FUbPPz2EB5sn6S4xs24pXL0vIMicnxHI_ThHscY-OQRZjGkwmBQgNGPQXyzcGpAKsqG0XC-V5iUdk-_qnIsbhDoxhAnS5I9CvP88xG9Eoq1o1GcLdhnG9QK0g"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-secondary/90 via-secondary/20 to-transparent flex items-end p-8">
                            <p className="text-white font-black text-xs leading-relaxed uppercase tracking-widest">Our team is available 24/7 for Enterprise partners.</p>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default HelpSettings;
