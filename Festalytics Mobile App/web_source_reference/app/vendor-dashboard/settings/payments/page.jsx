"use client";
import React from 'react';
import { motion } from 'framer-motion';

const PaymentsSettings = () => {
    return (
        <div className="space-y-10">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div>
                    <h1 className="text-4xl font-black text-on-background tracking-tighter">Payment Methods</h1>
                    <p className="text-on-surface-variant font-bold uppercase text-[10px] tracking-[0.2em] mt-2">Manage where your earnings are sent and track your payouts</p>
                </div>
                <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center justify-center gap-3 px-10 py-5 bg-primary text-white rounded-full font-black text-xs uppercase tracking-[0.15em] shadow-[0_12px_32px_rgba(224,64,160,0.3)]"
                >
                    <span className="material-symbols-outlined text-xl">add</span>
                    Add Payment Method
                </motion.button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
                {/* Primary Account Card */}
                <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] shadow-xl border border-outline-variant/30 group">
                    <div className="flex items-center justify-between mb-10">
                        <h2 className="text-2xl font-black text-secondary tracking-tight">Primary Payout Account</h2>
                        <span className="px-5 py-2 bg-primary-fixed text-on-primary-fixed-variant rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">ACTIVE</span>
                    </div>
                    
                    <div className="p-10 bg-surface-container-low rounded-[2.5rem] border-2 border-primary-container relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 flex gap-4">
                            <button className="p-3 bg-white rounded-2xl text-on-surface-variant shadow-lg hover:text-primary transition-all">
                                <span className="material-symbols-outlined text-xl">edit</span>
                            </button>
                            <button className="p-3 bg-white rounded-2xl text-on-surface-variant shadow-lg hover:text-error transition-all">
                                <span className="material-symbols-outlined text-xl">delete</span>
                            </button>
                        </div>
                        
                        <div className="flex items-start gap-10">
                            <div className="mt-2">
                                <div className="w-8 h-8 rounded-full border-4 border-primary bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                                    <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                                </div>
                            </div>
                            <div className="space-y-8">
                                <div>
                                    <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-2">Bank Institution</p>
                                    <p className="text-3xl font-black text-on-surface tracking-tight">Global Horizon Trust</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-2">Account Details</p>
                                    <div className="flex items-center gap-6">
                                        <span className="text-2xl font-mono tracking-[0.2em] text-on-surface/80">•••• •••• •••• 8824</span>
                                        <button className="text-tertiary hover:scale-110 transition-transform">
                                            <span className="material-symbols-outlined text-2xl fill-1">visibility</span>
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-2">Beneficiary Name</p>
                                    <p className="text-xl font-bold text-on-surface">Sweet Treats Collective LLC</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Withdrawal Settings Card */}
                <div className="bg-secondary-container p-10 rounded-[3rem] shadow-xl space-y-10 flex flex-col border border-secondary/10">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white rounded-3xl flex items-center justify-center text-secondary shadow-lg">
                            <span className="material-symbols-outlined text-2xl fill-1">account_balance_wallet</span>
                        </div>
                        <h2 className="text-2xl font-black text-on-secondary-container tracking-tight">Withdrawal</h2>
                    </div>
                    
                    <div className="space-y-8">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-on-secondary-container uppercase tracking-widest ml-1">Minimum Payout</label>
                            <div className="relative">
                                <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-secondary text-lg">Rs.</span>
                                <input className="w-full pl-16 pr-6 py-5 rounded-[2rem] border-none focus:ring-4 focus:ring-primary/20 bg-white font-black text-on-surface text-lg shadow-inner" type="number" defaultValue="50000.00"/>
                            </div>
                        </div>
                        
                        <div className="flex items-center justify-between p-6 bg-white/60 rounded-3xl backdrop-blur-md shadow-sm border border-white/50">
                            <span className="font-black text-on-secondary-container text-xs uppercase tracking-widest">Auto-withdrawal</span>
                            <button className="w-16 h-9 bg-primary rounded-full relative p-1.5 transition-all shadow-lg shadow-primary/20">
                                <div className="w-6 h-6 bg-white rounded-full absolute right-1.5 shadow-md"></div>
                            </button>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-on-secondary-container uppercase tracking-widest ml-1">Transfer Frequency</label>
                            <div className="relative">
                                <select className="w-full px-8 py-5 rounded-[2rem] border-none focus:ring-4 focus:ring-primary/20 bg-white font-black text-xs uppercase tracking-widest text-on-surface appearance-none cursor-pointer shadow-sm">
                                    <option>Weekly (Mondays)</option>
                                    <option>Bi-weekly</option>
                                    <option>Monthly</option>
                                    <option>Manual Only</option>
                                </select>
                                <span className="material-symbols-outlined absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-secondary">expand_more</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-auto pt-8 border-t border-white/30">
                        <div className="flex items-start gap-4 p-5 bg-white/40 rounded-3xl border border-white/50 shadow-sm">
                            <span className="material-symbols-outlined text-secondary fill-1">info</span>
                            <p className="text-[10px] font-black text-on-secondary-container leading-relaxed uppercase tracking-widest">
                                Next transfer: <br/>
                                <span className="text-sm font-black text-secondary mt-1 block tracking-tight">Monday, Oct 14th</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Payout History Table Card */}
                <div className="lg:col-span-3 bg-white rounded-[3rem] shadow-xl border border-outline-variant/30 overflow-hidden mt-8">
                    <div className="p-10 border-b border-outline-variant/20 flex justify-between items-center bg-surface-container-low/30">
                        <h2 className="text-2xl font-black text-on-surface tracking-tight">Payout History</h2>
                        <button className="text-primary font-black text-[10px] uppercase tracking-widest hover:underline">Download CSV</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-surface-container-low/50 text-left">
                                    <th className="px-10 py-6 text-[10px] font-black text-outline-variant uppercase tracking-[0.2em]">Processing Date</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-outline-variant uppercase tracking-[0.2em]">Net Amount</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-outline-variant uppercase tracking-[0.2em]">Status</th>
                                    <th className="px-10 py-6 text-[10px] font-black text-outline-variant uppercase tracking-[0.2em] text-right">Receipt</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant/10">
                                {[
                                    { date: 'Oct 07, 2024', amount: 'Rs. 1,450.80', status: 'Completed', color: 'tertiary' },
                                    { date: 'Sep 30, 2024', amount: 'Rs. 2,890.00', status: 'Completed', color: 'tertiary' },
                                    { date: 'Sep 23, 2024', amount: 'Rs. 940.15', status: 'Pending', color: 'secondary' },
                                ].map((payout, i) => (
                                    <tr key={i} className="hover:bg-surface-container-low/50 transition-colors group">
                                        <td className="px-10 py-8 font-bold text-on-surface text-sm tracking-tight">{payout.date}</td>
                                        <td className="px-10 py-8 font-black text-2xl text-on-surface tracking-tighter">{payout.amount}</td>
                                        <td className="px-10 py-8">
                                            <span className={`inline-flex items-center gap-3 px-6 py-2 rounded-full bg-${payout.color}-fixed text-${payout.color} text-[10px] font-black uppercase tracking-widest border border-${payout.color}/10 shadow-sm`}>
                                                <span className={`w-2.5 h-2.5 rounded-full bg-${payout.color} ${payout.status === 'Pending' ? 'animate-pulse' : ''}`}></span>
                                                {payout.status}
                                            </span>
                                        </td>
                                        <td className="px-10 py-8 text-right">
                                            <motion.button 
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.9 }}
                                                className="p-4 text-on-surface-variant hover:text-primary hover:bg-primary-fixed rounded-2xl transition-all shadow-sm border border-outline-variant/10"
                                            >
                                                <span className="material-symbols-outlined text-2xl">receipt_long</span>
                                            </motion.button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="p-8 bg-surface-container-low/20 flex justify-center border-t border-outline-variant/10">
                        <button className="text-primary font-black text-[10px] uppercase tracking-widest hover:underline px-10 py-2">View Full Transaction History</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentsSettings;
