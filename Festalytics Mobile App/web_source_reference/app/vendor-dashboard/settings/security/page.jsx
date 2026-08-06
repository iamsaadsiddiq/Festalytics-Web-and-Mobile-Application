"use client";
import React from 'react';
import { motion } from 'framer-motion';

const SecuritySettings = () => {
    return (
        <div className="space-y-10">
            <header>
                <h1 className="text-4xl font-black text-on-background tracking-tighter">Security</h1>
                <p className="text-on-surface-variant font-bold uppercase text-[10px] tracking-[0.2em] mt-2">Manage your account protection and active sessions</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Password & 2FA */}
                <section className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-primary-fixed/20 flex flex-col justify-between space-y-8 group hover:shadow-primary/10 transition-all">
                    <div>
                        <div className="w-14 h-14 bg-primary-fixed rounded-2xl flex items-center justify-center text-primary mb-6 shadow-lg shadow-primary/10 transition-transform group-hover:rotate-12">
                            <span className="material-symbols-outlined text-2xl fill-1">lock_reset</span>
                        </div>
                        <h3 className="text-xl font-black text-on-surface mb-3 tracking-tight">Password</h3>
                        <p className="text-xs font-bold text-on-surface-variant leading-relaxed">Last updated 3 months ago. We recommend a unique, strong password for optimal protection.</p>
                    </div>
                    <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-full py-4 border-2 border-primary text-primary rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-primary-fixed transition-all"
                    >
                        Change Password
                    </motion.button>
                </section>

                <section className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-secondary-fixed/20 flex flex-col justify-between space-y-8 group hover:shadow-secondary/10 transition-all">
                    <div>
                        <div className="flex justify-between items-start">
                            <div className="w-14 h-14 bg-secondary-fixed rounded-2xl flex items-center justify-center text-secondary mb-6 shadow-lg shadow-secondary/10 transition-transform group-hover:-rotate-12">
                                <span className="material-symbols-outlined text-2xl fill-1">shield_lock</span>
                            </div>
                            <span className="bg-error-container text-on-error-container px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">DISABLED</span>
                        </div>
                        <h3 className="text-xl font-black text-on-surface mb-3 tracking-tight">Two-Factor Auth</h3>
                        <p className="text-xs font-bold text-on-surface-variant leading-relaxed">Add an extra layer of security to your vendor account using TOTP apps like Google Authenticator.</p>
                    </div>
                    <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-full py-4 bg-secondary text-on-secondary rounded-full font-black text-[10px] uppercase tracking-widest shadow-lg shadow-secondary/30"
                    >
                        Enable 2FA
                    </motion.button>
                </section>

                {/* Security Alerts */}
                <section className="lg:row-span-2 bg-surface-container-high/50 rounded-[3rem] p-10 shadow-xl border border-outline-variant/30 flex flex-col">
                    <h3 className="text-xl font-black text-on-surface mb-10 flex items-center gap-4 tracking-tight">
                        <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-md">
                            <span className="material-symbols-outlined text-tertiary fill-1">notifications_active</span>
                        </div>
                        Security Alerts
                    </h3>
                    <div className="space-y-6 flex-1">
                        {[
                            { label: 'New login detected', active: true },
                            { label: 'Password changed', active: true },
                            { label: '2FA status updated', active: true },
                            { label: 'Account recovery attempt', active: false },
                        ].map((alert, i) => (
                            <label key={i} className="flex items-center justify-between p-5 bg-white rounded-3xl border-2 border-transparent hover:border-primary transition-all cursor-pointer group shadow-sm">
                                <span className="text-xs font-black text-on-surface-variant group-hover:text-on-surface uppercase tracking-widest">{alert.label}</span>
                                <div className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" defaultChecked={alert.active} className="sr-only peer" />
                                    <div className="w-12 h-6 bg-outline-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 rtl:peer-checked:after:-translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                                </div>
                            </label>
                        ))}
                    </div>
                    <div className="pt-8 mt-8 border-t border-outline-variant/30 italic text-[9px] font-black text-on-surface-variant uppercase tracking-[0.2em] leading-relaxed">
                        CRITICAL ALERTS ARE ALWAYS SENT TO YOUR REGISTERED MERCHANT EMAIL.
                    </div>
                </section>

                {/* Login Activity */}
                <section className="md:col-span-2 bg-white rounded-[3rem] p-10 shadow-xl border border-outline-variant/30">
                    <div className="flex items-center justify-between mb-10">
                        <h3 className="text-xl font-black text-on-surface tracking-tight">Recent Sessions</h3>
                        <button className="text-[10px] font-black text-error hover:underline uppercase tracking-widest">Sign out all sessions</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="text-outline text-[10px] font-black uppercase tracking-[0.2em] border-b border-outline-variant/20">
                                <tr>
                                    <th className="pb-6 px-4">Device & Browser</th>
                                    <th className="pb-6 px-4">Location</th>
                                    <th className="pb-6 px-4">Timestamp</th>
                                    <th className="pb-6 px-4 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant/10">
                                <tr>
                                    <td className="py-6 px-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-primary-fixed/30 rounded-2xl flex items-center justify-center text-primary shadow-sm">
                                                <span className="material-symbols-outlined text-2xl">laptop_mac</span>
                                            </div>
                                            <div>
                                                <div className="font-black text-sm text-on-surface tracking-tight">MacBook Pro 16"</div>
                                                <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-1">Chrome • macOS</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-6 px-4">
                                        <div className="font-bold text-sm text-on-surface">New York, USA</div>
                                        <div className="text-[10px] text-outline font-black mt-1 uppercase tracking-widest">192.168.1.45</div>
                                    </td>
                                    <td className="py-6 px-4 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Today, 14:30</td>
                                    <td className="py-6 px-4 text-right">
                                        <span className="bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                            Current
                                        </span>
                                    </td>
                                </tr>
                                <tr>
                                    <td className="py-6 px-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-secondary-fixed/30 rounded-2xl flex items-center justify-center text-secondary shadow-sm">
                                                <span className="material-symbols-outlined text-2xl">smartphone</span>
                                            </div>
                                            <div>
                                                <div className="font-black text-sm text-on-surface tracking-tight">iPhone 15 Pro</div>
                                                <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-1">Safari • iOS</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-6 px-4 text-sm font-bold text-on-surface">London, UK</td>
                                    <td className="py-6 px-4 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Oct 22, 09:15</td>
                                    <td className="py-6 px-4 text-right">
                                        <span className="text-[10px] font-black text-outline uppercase tracking-widest">Logged Out</span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Connected Apps */}
                <section className="lg:col-span-3 bg-white rounded-[3rem] p-10 shadow-xl border border-outline-variant/30">
                    <h3 className="text-xl font-black text-on-surface mb-10 tracking-tight">Connected Apps</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            { name: 'MailConnect Pro', access: '2h ago', perms: ['Email Access', 'Stats'], img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAlRhx5ek3B_ACwKFWS_NHyPEEF-nqfjb_2xOvD5TFBFEr58fPaad1RWfL5lRIp8HJx1G5t7OojSQHi8G7-xL1p5FetCXzfI4-I1cAH6oh11o-sjYPu_jYPajIZXLFFWlOxhJ4bYYgJXZJWUO-pjNdjugMQygYLn-nx3RkkVDO7dJpYHCTsYbJnjLjPKIQ-Y0kFhT-5wvMpHe7cHJdnd3Bcw1cVI781EYtMdAm8n1145GlPc_aBAQP12UQbOppy30s-f0JrHI6MehQ' },
                            { name: 'DataCruncher', access: 'Oct 15', perms: ['Sales History'], emoji: '📊' },
                        ].map((app, i) => (
                            <div key={i} className="bg-surface-container-low rounded-3xl p-6 border-2 border-transparent hover:border-primary transition-all group cursor-pointer shadow-sm">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg border border-outline-variant/10 overflow-hidden">
                                        {app.img ? <img src={app.img} className="w-full h-full object-cover" /> : <span className="text-2xl">{app.emoji}</span>}
                                    </div>
                                    <button className="text-[10px] font-black text-error hover:bg-error-container p-2 rounded-xl transition-colors uppercase tracking-widest">Revoke</button>
                                </div>
                                <h4 className="font-black text-on-surface text-sm mb-1 tracking-tight">{app.name}</h4>
                                <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest mb-4">Accessed: {app.access}</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {app.perms.map(p => (
                                        <span key={p} className="text-[8px] font-black bg-white px-2.5 py-1 rounded-full uppercase tracking-widest border border-outline-variant/10">{p}</span>
                                    ))}
                                </div>
                            </div>
                        ))}
                        <button className="bg-surface-container-low rounded-3xl p-8 border-2 border-dashed border-outline-variant/30 flex flex-col items-center justify-center gap-3 text-outline hover:text-primary hover:border-primary transition-all group shadow-sm">
                            <span className="material-symbols-outlined text-3xl group-hover:rotate-90 transition-transform">add</span>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Connect App</span>
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default SecuritySettings;
