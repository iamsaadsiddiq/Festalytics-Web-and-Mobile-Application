"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import WizardProgress from '@/components/vendor/create-service/WizardProgress';
import Step1BasicInfo from '@/components/vendor/create-service/Step1BasicInfo';
import Step2Pricing from '@/components/vendor/create-service/Step2Pricing';
import Step3Gallery from '@/components/vendor/create-service/Step3Gallery';
import Step4Review from '@/components/vendor/create-service/Step4Review';

const CreateServicePage = () => {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        type: '',
        leadTime: 'At least 2 weeks notice',
        description: '',
        availability: 'All Year',
        pricingType: 'Fixed Price',
        basePrice: '',
        packages: [],
        featuredImage: null,
        gallery: []
    });

    const updateFormData = (newData) => {
        setFormData(prev => ({ ...prev, ...newData }));
    };

    const nextStep = () => setStep(s => Math.min(s + 1, 4));
    const prevStep = () => setStep(s => Math.max(s - 1, 1));

    const publishService = () => {
        // Logic to save to database would go here
        console.log("Publishing service:", formData);
        alert("Service Published Successfully!");
        router.push('/vendor-dashboard/my-services');
    };

    return (
        <div className="max-w-4xl mx-auto py-12">
            <header className="mb-12 flex justify-between items-center">
                <div>
                    <h2 className="text-4xl font-black text-on-surface tracking-tight">Create New Service</h2>
                    <p className="text-on-surface-variant font-medium text-lg mt-2">Step {step} of 4: {
                        step === 1 ? 'Tell us about what you offer.' :
                        step === 2 ? 'Set up your pricing structure.' :
                        step === 3 ? 'Showcase your work with photos.' :
                        'Final check before going live.'
                    }</p>
                </div>
                <div className="w-16 h-16 bg-surface-container-highest rounded-2xl flex items-center justify-center shadow-inner">
                    <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {step === 4 ? 'check_circle' : 'add_circle'}
                    </span>
                </div>
            </header>

            <WizardProgress currentStep={step} />

            <AnimatePresence mode="wait">
                {step === 1 && (
                    <Step1BasicInfo key="step1" formData={formData} updateFormData={updateFormData} nextStep={nextStep} />
                )}
                {step === 2 && (
                    <Step2Pricing key="step2" formData={formData} updateFormData={updateFormData} nextStep={nextStep} prevStep={prevStep} />
                )}
                {step === 3 && (
                    <Step3Gallery key="step3" formData={formData} updateFormData={updateFormData} nextStep={nextStep} prevStep={prevStep} />
                )}
                {step === 4 && (
                    <Step4Review key="step4" formData={formData} prevStep={prevStep} publishService={publishService} />
                )}
            </AnimatePresence>
        </div>
    );
};

export default CreateServicePage;
