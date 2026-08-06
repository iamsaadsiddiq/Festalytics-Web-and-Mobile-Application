'use client'

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import image1 from '@/assets/image1.jpg';
import { 
  Search, Calculator, ScanSearch, 
  MessageCircle, CalendarCheck, MapPin,
  Sparkles, Brain, Eye, Bot
} from 'lucide-react';

function RevealOnScroll({ children, className = '', animation = 'animate-fadeInUp', delay = '0s' }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    // Disable heavy animations on mobile
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches || window.innerWidth < 768) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.15 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }
    return () => {
      if (ref.current) observer.unobserve(ref.current);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`${className} ${isVisible ? animation : 'opacity-0'}`}
      style={{ animationDelay: isVisible ? delay : '0s', animationFillMode: 'forwards' }}
    >
      {children}
    </div>
  );
}

export default function ServicesPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleRipple = (e) => {
    const btn = e.currentTarget;
    const circle = document.createElement('span');
    const diameter = Math.max(btn.clientWidth, btn.clientHeight);
    const radius = diameter / 2;
    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${e.clientX - btn.getBoundingClientRect().left - radius}px`;
    circle.style.top = `${e.clientY - btn.getBoundingClientRect().top - radius}px`;
    circle.classList.add('ripple');
    const existingRipple = btn.querySelector('.ripple');
    if (existingRipple) {
      existingRipple.remove();
    }
    btn.appendChild(circle);
  };

  return (
    <main className={`w-full overflow-x-hidden bg-[#fef7ff] transition-opacity duration-1000 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
      <style>{`
        html { scroll-behavior: smooth; }
        
        @keyframes fadeInLeft {
          from { opacity: 0; transform: translateX(-50px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeInRight {
          from { opacity: 0; transform: translateX(50px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(50px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes drawLine {
          from { width: 0; opacity: 0; }
          to { width: 100%; opacity: 1; }
        }
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes pulseSoft {
          0%, 100% { transform: scale(1) translateY(-8px); opacity: 0.9; }
          50% { transform: scale(1.02) translateY(-8px); opacity: 1; }
        }
        @keyframes pingRipple {
          0% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        @keyframes particleFloat {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
          50% { transform: translateY(-30px) scale(1.2); opacity: 0.7; }
        }
        @keyframes customFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        
        .animate-fadeInUp { animation: fadeInUp 0.8s ease forwards; }
        .animate-fadeInLeft { animation: fadeInLeft 0.8s ease forwards; }
        .animate-fadeInRight { animation: fadeInRight 0.8s ease forwards; }
        .animate-drawLine { animation: drawLine 1.5s ease-out forwards; }
        .animate-gradientShift { background-size: 200% 200%; animation: gradientShift 6s ease infinite; }
        
        .active-card-pulse {
          animation: pulseSoft 3s ease-in-out infinite;
        }
        .active-card-pulse:hover {
          animation: none;
          transform: translateY(-8px) scale(1.02);
        }
        
        .particle {
          position: absolute;
          border-radius: 50%;
          background-color: #D6336C;
          animation: particleFloat 6s ease-in-out infinite;
          pointer-events: none;
        }

        .ripple {
          position: absolute;
          border-radius: 50%;
          transform: scale(0);
          animation: ripple-anim 0.6s linear;
          background-color: rgba(214, 51, 108, 0.4);
          pointer-events: none;
        }
        @keyframes ripple-anim {
          to {
            transform: scale(4);
            opacity: 0;
          }
        }
      `}</style>
      
      <Navbar />
      
      {/* 1. HERO SECTION */}
      <section className="min-h-[60vh] flex items-center justify-center relative overflow-hidden before:content-[''] before:absolute before:inset-0 before:bg-gradient-to-b before:from-black/60 before:to-black/80 before:z-[1]">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-fixed z-0 scale-105"
          style={{ backgroundImage: `url(${image1.src})` }}
        ></div>
        
        <div className="absolute inset-0 z-[1] overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div 
              key={i} 
              className="particle" 
              style={{
                width: `${Math.random() * 6 + 2}px`,
                height: `${Math.random() * 6 + 2}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${Math.random() * 4 + 4}s`
              }}
            ></div>
          ))}
        </div>

        <div className="max-w-[1200px] mx-auto px-8 relative z-[2] text-center">
          <h1 className="text-[4rem] font-extrabold leading-[1.2] mb-4 max-md:text-[3rem] max-sm:text-[2.5rem] flex flex-wrap justify-center gap-4">
            <span className="block text-white opacity-0 animate-[fadeInUp_0.8s_ease_forwards]" style={{ animationDelay: '0.1s' }}>
              Our
            </span>
            <span className="block text-[#D6336C] opacity-0 animate-[fadeInUp_0.8s_ease_forwards]" style={{ animationDelay: '0.3s' }}>
              Services
            </span>
          </h1>
          <p className="text-xl text-gray-200 leading-[1.6] max-w-[600px] mx-auto opacity-0 animate-[fadeInUp_0.8s_ease_forwards]" style={{ animationDelay: '0.6s' }}>
            Intelligent tools designed to make your event planning seamless and stress-free
          </p>
        </div>
      </section>

      {/* 2. SERVICES INTRO */}
      <section className="py-24 px-8 bg-gradient-to-br from-[#fff5f8] to-[#ffffff] overflow-hidden">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <RevealOnScroll animation="animate-fadeInLeft">
            <h2 className="text-[3rem] font-bold mb-2 text-[#1a202c] max-md:text-[2.5rem]">
              Everything You Need
            </h2>
            <h3 className="text-[2rem] font-bold mb-6 text-[#D6336C]">
              In One Platform
            </h3>
            <p className="text-lg text-[#4a5568] leading-relaxed">
              Festalytics offers a complete suite of AI-powered tools to help you plan, organize, and execute perfect events every time.
            </p>
          </RevealOnScroll>
          <RevealOnScroll animation="animate-fadeInRight" delay="0.2s" className="relative flex justify-center">
             <div className="w-[300px] h-[300px] bg-gradient-to-tr from-[#D6336C] to-[#ff6eb4] rounded-[20px] shadow-[0_20px_60px_rgba(214,51,108,0.5)] flex items-center justify-center animate-[customFloat_6s_ease-in-out_infinite] transition-all duration-500 hover:scale-105 hover:shadow-[0_25px_70px_rgba(214,51,108,0.7)] group">
                <Sparkles className="w-[100px] h-[100px] text-white transition-transform duration-300 group-hover:scale-110" />
             </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* 3. MAIN SERVICES */}
      <section className="py-24 px-8 bg-white relative">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Card 1 */}
            <RevealOnScroll delay="0.1s" className="h-full">
              <div className="bg-white border border-[#D6336C]/15 p-8 rounded-[20px] shadow-[0_4px_20px_rgba(214,51,108,0.08)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_15px_30px_rgba(214,51,108,0.15)] hover:border-[#D6336C] group h-full flex flex-col">
                <div className="flex justify-between items-start mb-6">
                  <div className="bg-[#D6336C]/10 rounded-xl p-3">
                    <Search className="w-8 h-8 text-[#D6336C]" />
                  </div>
                  <span className="bg-[#D6336C] text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Core Feature
                  </span>
                </div>
                <h3 className="text-[22px] font-bold text-[#1a202c] mb-3">Smart Vendor Discovery</h3>
                <p className="text-[#4a5568] leading-relaxed">Browse and compare verified vendors based on your location, budget, and event type. Find the perfect match instantly.</p>
              </div>
            </RevealOnScroll>

            {/* Card 2 - Active */}
            <RevealOnScroll delay="0.2s" className="h-full">
              <div className="bg-gradient-to-br from-[#D6336C] to-[#ff6eb4] p-8 rounded-[20px] shadow-[0_20px_50px_rgba(214,51,108,0.4)] transition-all duration-500 hover:-translate-y-2 active-card-pulse group h-full flex flex-col">
                <div className="flex justify-between items-start mb-6">
                  <div className="bg-white rounded-xl p-3">
                    <Calculator className="w-8 h-8 text-[#D6336C]" />
                  </div>
                  <span className="bg-white/20 text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-sm">
                    AI Powered
                  </span>
                </div>
                <h3 className="text-[22px] font-bold text-white mb-3">AI Cost Estimation</h3>
                <p className="text-white/90 leading-relaxed flex-1">Get accurate event budget predictions powered by machine learning. Plan smarter with real-time cost breakdowns.</p>
              </div>
            </RevealOnScroll>

            {/* Card 3 */}
            <RevealOnScroll delay="0.3s" className="h-full">
              <div className="bg-white border border-[#D6336C]/15 p-8 rounded-[20px] shadow-[0_4px_20px_rgba(214,51,108,0.08)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_15px_30px_rgba(214,51,108,0.15)] hover:border-[#D6336C] group h-full flex flex-col">
                <div className="flex justify-between items-start mb-6">
                  <div className="bg-[#D6336C]/10 rounded-xl p-3">
                    <ScanSearch className="w-8 h-8 text-[#D6336C]" />
                  </div>
                  <span className="bg-[#D6336C] text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    AI Powered
                  </span>
                </div>
                <h3 className="text-[22px] font-bold text-[#1a202c] mb-3">Décor Matching</h3>
                <p className="text-[#4a5568] leading-relaxed">Upload a décor image and our computer vision AI finds visually similar decoration styles and vendor offerings.</p>
              </div>
            </RevealOnScroll>

            {/* Card 4 */}
            <RevealOnScroll delay="0.4s" className="h-full">
              <div className="bg-white border border-[#D6336C]/15 p-8 rounded-[20px] shadow-[0_4px_20px_rgba(214,51,108,0.08)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_15px_30px_rgba(214,51,108,0.15)] hover:border-[#D6336C] group h-full flex flex-col">
                <div className="flex justify-between items-start mb-6">
                  <div className="bg-[#D6336C]/10 rounded-xl p-3">
                    <MessageCircle className="w-8 h-8 text-[#D6336C]" />
                  </div>
                  <span className="bg-[#D6336C] text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    AI Powered
                  </span>
                </div>
                <h3 className="text-[22px] font-bold text-[#1a202c] mb-3">AI Chatbot Assistant</h3>
                <p className="text-[#4a5568] leading-relaxed">Get instant planning guidance through our intelligent NLP-powered chatbot available 24/7 for all your event queries.</p>
              </div>
            </RevealOnScroll>

            {/* Card 5 */}
            <RevealOnScroll delay="0.5s" className="h-full">
              <div className="bg-white border border-[#D6336C]/15 p-8 rounded-[20px] shadow-[0_4px_20px_rgba(214,51,108,0.08)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_15px_30px_rgba(214,51,108,0.15)] hover:border-[#D6336C] group h-full flex flex-col">
                <div className="flex justify-between items-start mb-6">
                  <div className="bg-[#D6336C]/10 rounded-xl p-3">
                    <CalendarCheck className="w-8 h-8 text-[#D6336C]" />
                  </div>
                  <span className="bg-[#D6336C] text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Core Feature
                  </span>
                </div>
                <h3 className="text-[22px] font-bold text-[#1a202c] mb-3">Booking Management</h3>
                <p className="text-[#4a5568] leading-relaxed">Easily book vendors, manage schedules, track confirmations, and receive automated reminders for every event milestone.</p>
              </div>
            </RevealOnScroll>

            {/* Card 6 */}
            <RevealOnScroll delay="0.6s" className="h-full">
              <div className="bg-white border border-[#D6336C]/15 p-8 rounded-[20px] shadow-[0_4px_20px_rgba(214,51,108,0.08)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_15px_30px_rgba(214,51,108,0.15)] hover:border-[#D6336C] group h-full flex flex-col">
                <div className="flex justify-between items-start mb-6">
                  <div className="bg-[#D6336C]/10 rounded-xl p-3">
                    <MapPin className="w-8 h-8 text-[#D6336C]" />
                  </div>
                  <span className="bg-[#D6336C] text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Core Feature
                  </span>
                </div>
                <h3 className="text-[22px] font-bold text-[#1a202c] mb-3">Location-Based Discovery</h3>
                <p className="text-[#4a5568] leading-relaxed">Discover nearby vendors tailored to your event needs using smart geolocation and Google Maps integration.</p>
              </div>
            </RevealOnScroll>

          </div>
        </div>
      </section>

      {/* 4. AI FEATURES HIGHLIGHT */}
      <section className="py-24 px-8 bg-[#111827]">
        <div className="max-w-[1200px] mx-auto">
          <RevealOnScroll className="text-center mb-16">
            <h2 className="text-[3rem] font-bold text-white max-md:text-[2.5rem] mb-2">Powered by</h2>
            <h3 className="text-[3rem] font-bold text-[#D6336C] max-md:text-[2.5rem]">Artificial Intelligence</h3>
          </RevealOnScroll>
          <div className="flex flex-col gap-6 max-w-[800px] mx-auto">
            {/* Pill 1 */}
            <RevealOnScroll delay="0.1s">
              <div className="bg-white/5 border border-white/10 border-l-4 border-l-[#D6336C] rounded-xl p-6 flex items-center gap-6 shadow-[0_10px_30px_rgba(0,0,0,0.3)] backdrop-blur-sm transition-all duration-300 hover:bg-white/10 hover:-translate-y-1">
                <div className="bg-[#D6336C]/20 p-3 rounded-lg">
                  <Brain className="w-8 h-8 text-[#D6336C]" />
                </div>
                <h4 className="text-white font-bold text-xl">Machine Learning Cost Prediction</h4>
              </div>
            </RevealOnScroll>
            {/* Pill 2 */}
            <RevealOnScroll delay="0.2s">
              <div className="bg-white/5 border border-white/10 border-l-4 border-l-[#D6336C] rounded-xl p-6 flex items-center gap-6 shadow-[0_10px_30px_rgba(0,0,0,0.3)] backdrop-blur-sm transition-all duration-300 hover:bg-white/10 hover:-translate-y-1">
                <div className="bg-[#D6336C]/20 p-3 rounded-lg">
                  <Eye className="w-8 h-8 text-[#D6336C]" />
                </div>
                <h4 className="text-white font-bold text-xl">Computer Vision Décor Matching</h4>
              </div>
            </RevealOnScroll>
            {/* Pill 3 */}
            <RevealOnScroll delay="0.3s">
              <div className="bg-white/5 border border-white/10 border-l-4 border-l-[#D6336C] rounded-xl p-6 flex items-center gap-6 shadow-[0_10px_30px_rgba(0,0,0,0.3)] backdrop-blur-sm transition-all duration-300 hover:bg-white/10 hover:-translate-y-1">
                <div className="bg-[#D6336C]/20 p-3 rounded-lg">
                  <Bot className="w-8 h-8 text-[#D6336C]" />
                </div>
                <h4 className="text-white font-bold text-xl">NLP Chatbot Assistance</h4>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* 5. CTA BANNER */}
      <section className="py-28 px-8 bg-gradient-to-r from-[#D6336C] via-[#ff6eb4] to-[#D6336C] relative overflow-hidden animate-gradientShift">
        <div className="absolute inset-0 bg-black/5 backdrop-blur-[1px]"></div>
        
        <RevealOnScroll className="max-w-[800px] mx-auto text-center relative z-10">
          <h2 className="text-[3.5rem] font-bold mb-6 text-white max-md:text-[2.5rem] tracking-tight">Ready to Plan Your Perfect Event?</h2>
          <p className="text-2xl text-white/95 leading-relaxed mb-12">
            Join Festalytics and experience the future of event planning
          </p>
          
          <button 
            onClick={(e) => {
              handleRipple(e);
              setTimeout(() => router.push('/signup'), 200);
            }}
            className="overflow-hidden relative bg-white text-[#D6336C] px-10 py-4 rounded-full font-bold text-lg shadow-[0_10px_25px_rgba(0,0,0,0.2)] hover:shadow-[0_15px_35px_rgba(0,0,0,0.3)] hover:scale-105 transition-all duration-300 active:scale-95"
          >
            Get Started
          </button>
        </RevealOnScroll>
      </section>

      <Footer />
    </main>
  );
}
