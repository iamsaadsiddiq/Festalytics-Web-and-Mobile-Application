"use client";
import React from 'react';
import { motion } from 'framer-motion';

const NotificationsSettings = () => {
    return (
        <div className="space-y-10">
            <header>
                <h1 className="text-4xl font-black text-on-background tracking-tighter">Notification Preferences</h1>
                <p className="text-on-surface-variant font-bold uppercase text-[10px] tracking-[0.2em] mt-2">Control how and when you receive updates about your business events</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-20">
                {/* Email Notifications Section */}
                <section className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-primary-fixed/30 group hover:shadow-primary/10 transition-all">
                    <div className="flex items-center gap-4 mb-10">
                        <div className="w-14 h-14 rounded-2xl bg-primary-fixed flex items-center justify-center text-primary shadow-lg shadow-primary/10">
                            <span className="material-symbols-outlined text-2xl fill-1">mail</span>
                        </div>
                        <h3 className="text-2xl font-black text-on-surface tracking-tight">Email Notifications</h3>
                    </div>
                    
                    <div className="space-y-6">
                        {[
                            { label: 'New booking request', active: true },
                            { label: 'Booking confirmation', active: true },
                            { label: 'Cancellations', active: true },
                            { label: 'Customer message', active: true },
                            { label: 'New review received', active: false },
                            { label: 'Weekly summary digest', active: true },
                            { label: 'Marketing & promotions', active: false },
                        ].map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 rounded-2xl hover:bg-surface-container-low transition-colors group/item">
                                <span className="font-bold text-on-surface-variant text-sm group-hover/item:text-on-surface transition-colors">{item.label}</span>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" defaultChecked={item.active} className="sr-only peer" />
                                    <div className="w-14 h-7 bg-outline-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary shadow-inner"></div>
                                </label>
                            </div>
                        ))}
                    </div>
                </section>

                {/* SMS & In-App Section */}
                <div className="space-y-8">
                    {/* SMS Section */}
                    <section className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-secondary-fixed/30">
                        <div className="flex items-center justify-between mb-10">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-secondary-container flex items-center justify-center text-secondary shadow-lg shadow-secondary/10">
                                    <span className="material-symbols-outlined text-2xl fill-1">sms</span>
                                </div>
                                <h3 className="text-2xl font-black text-on-surface tracking-tight">SMS Alerts</h3>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" defaultChecked className="sr-only peer" />
                                <div className="w-16 h-8 bg-outline-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-[32px] rtl:peer-checked:after:-translate-x-[32px] peer-checked:after:border-white after:content-[''] after:absolute after:top-1.5 after:start-[6px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary shadow-inner"></div>
                            </label>
                        </div>
                        
                        <div className="mb-10 space-y-3">
                            <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1">Phone Number</label>
                            <input 
                                className="w-full bg-surface-container-low border-2 border-transparent focus:border-secondary rounded-2xl px-6 py-4 outline-none transition-all font-bold text-sm text-on-surface" 
                                placeholder="+1 (555) 000-0000" 
                                type="tel"
                                defaultValue="+1 (555) 0123-456"
                            />
                        </div>

                        <div className="space-y-4">
                            {[
                                { label: 'Booking request alerts', active: true },
                                { label: 'Event reminders', active: true },
                                { label: 'Direct messages', active: false },
                            ].map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 rounded-2xl hover:bg-surface-container-low transition-colors">
                                    <span className="font-bold text-on-surface-variant text-xs">{item.label}</span>
                                    <input type="checkbox" defaultChecked={item.active} className="w-5 h-5 rounded-lg text-secondary focus:ring-secondary border-outline-variant" />
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* App Behavior Section */}
                    <section className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-tertiary-fixed/30">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="w-14 h-14 rounded-2xl bg-tertiary-fixed flex items-center justify-center text-tertiary shadow-lg shadow-tertiary/10">
                                <span className="material-symbols-outlined text-2xl fill-1">apps</span>
                            </div>
                            <h3 className="text-2xl font-black text-on-surface tracking-tight">App Notifications</h3>
                        </div>
                        
                        <div className="space-y-6">
                            {[
                                { label: 'Notification sound', icon: 'volume_up', active: true },
                                { label: 'App icon badges', icon: 'counter_1', active: true },
                                { label: 'Desktop notifications', icon: 'desktop_windows', active: false },
                            ].map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 rounded-2xl hover:bg-surface-container-low transition-colors">
                                    <div className="flex items-center gap-4">
                                        <span className="material-symbols-outlined text-tertiary text-xl">{item.icon}</span>
                                        <span className="font-bold text-on-surface-variant text-sm">{item.label}</span>
                                    </div>
                                    <input type="checkbox" defaultChecked={item.active} className="w-6 h-6 rounded-full text-tertiary focus:ring-tertiary border-outline-variant transition-all cursor-pointer" />
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Delivery Timing Section */}
                <section className="lg:col-span-2 bg-primary-fixed/20 rounded-[2.5rem] p-10 border-4 border-dashed border-primary-container/40">
                    <div className="flex items-center gap-6 mb-8">
                        <div className="w-16 h-16 rounded-3xl bg-white flex items-center justify-center text-primary shadow-xl ring-1 ring-primary/10">
                            <span className="material-symbols-outlined text-3xl fill-1">schedule</span>
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-on-surface tracking-tight">Delivery Timing</h3>
                            <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mt-1">Choose how often you'd like to receive batched notifications</p>
                        </div>
                    </div>
                    
                    <div className="relative group max-w-xl">
                        <select className="w-full bg-white border-2 border-primary-container rounded-[2rem] px-8 py-5 outline-none appearance-none font-black text-primary cursor-pointer hover:bg-surface transition-all shadow-xl shadow-primary/5 text-sm uppercase tracking-widest">
                            <option>Instant (Real-time)</option>
                            <option>Hourly Summary</option>
                            <option>Daily Digest</option>
                        </select>
                        <span className="material-symbols-outlined absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none text-primary text-2xl">expand_more</span>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default NotificationsSettings;
