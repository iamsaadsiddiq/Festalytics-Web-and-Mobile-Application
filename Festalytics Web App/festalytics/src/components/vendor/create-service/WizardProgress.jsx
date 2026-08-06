"use client";
import React from 'react';
import { motion } from 'framer-motion';

const WizardProgress = ({ currentStep }) => {
    const steps = [
        { id: 1, label: 'Basic Info', shortLabel: 'STEP 01' },
        { id: 2, label: 'Pricing', shortLabel: 'STEP 02' },
        { id: 3, label: 'Gallery', shortLabel: 'STEP 03' },
        { id: 4, label: 'Review', shortLabel: 'STEP 04' },
    ];

    return (
        <div className="mb-12">
            <div className="grid grid-cols-4 gap-4 relative">
                {steps.map((step) => {
                    const isActive = currentStep === step.id;
                    const isCompleted = currentStep > step.id;
                    
                    return (
                        <div key={step.id} className="flex flex-col gap-2">
                            <div className={`h-2 rounded-full transition-all duration-500 ${
                                isActive ? 'bg-tertiary shadow-[0_4px_16px_rgba(0,150,204,0.3)]' : 
                                isCompleted ? 'bg-green-500' : 'bg-outline-variant'
                            }`}></div>
                            <div className="flex items-center gap-2">
                                <span className={`text-[12px] font-black uppercase tracking-widest ${
                                    isActive ? 'text-tertiary' : isCompleted ? 'text-green-600' : 'text-outline'
                                }`}>
                                    {step.shortLabel}
                                </span>
                                <span className={`text-[12px] font-bold ${
                                    isActive || isCompleted ? 'text-on-surface' : 'text-outline'
                                }`}>
                                    {step.label}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default WizardProgress;
