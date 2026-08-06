'use client'

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import image1 from '@/assets/image1.jpg';
import { SearchX, TrendingUp, CalendarX2, ClipboardList, Search, CalendarCheck } from 'lucide-react';
import { 
  FaSearch, 
  FaRobot, 
  FaImage, 
  FaComments, 
  FaCalendarCheck, 
  FaMapMarkerAlt,
  FaEdit,
  FaSearchPlus,
  FaCheckCircle,
  FaQuoteLeft
} from 'react-icons/fa';

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

export default function AboutPage() {
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
          0%, 100% { transform: scale(1) translateY(-16px); opacity: 0.9; }
          50% { transform: scale(1.02) translateY(-16px); opacity: 1; }
        }
        @keyframes pingRipple {
          0% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        @keyframes particleFloat {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
          50% { transform: translateY(-30px) scale(1.2); opacity: 0.7; }
        }
        
        .animate-fadeInLeft { animation: fadeInLeft 0.8s ease forwards; }
        .animate-fadeInRight { animation: fadeInRight 0.8s ease forwards; }
        .animate-drawLine { animation: drawLine 1.5s ease-out forwards; }
        .animate-gradientShift { background-size: 200% 200%; animation: gradientShift 6s ease infinite; }
        
        /* Adjusted active card pulse with hover states included */
        .active-card-pulse {
          animation: pulseSoft 3s ease-in-out infinite;
        }
        .active-card-pulse:hover {
          animation: none;
          transform: translateY(-20px) scale(1.02);
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
        
        .service-card {
          position: relative;
        }
        .service-card::before {
          content: '';
          position: absolute;
          inset: -2px;
          border-radius: 22px;
          background: linear-gradient(135deg, #D6336C, #ff6eb4);
          z-index: -1;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .service-card:hover::before {
          opacity: 1;
        }
      `}</style>
      
      <Navbar />
      
      {/* 1. HERO */}
      <section className="min-h-[60vh] flex items-center justify-center relative overflow-hidden before:content-[''] before:absolute before:inset-0 before:bg-gradient-to-b before:from-black/60 before:to-black/80 before:z-[1]">
        {/* Parallax Background */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-fixed z-0 scale-105"
          style={{ backgroundImage: `url(${image1.src})` }}
        ></div>
        
        {/* Particles Effect */}
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
              About
            </span>
            <span className="block text-[#D6336C] opacity-0 animate-[fadeInUp_0.8s_ease_forwards]" style={{ animationDelay: '0.3s' }}>
              Festalytics
            </span>
          </h1>
          <p className="text-xl text-gray-200 leading-[1.6] max-w-[600px] mx-auto opacity-0 animate-[fadeInUp_0.8s_ease_forwards]" style={{ animationDelay: '0.6s' }}>
            Simplifying event planning through the power of Artificial Intelligence
          </p>
        </div>
      </section>

      {/* 2. WHAT IS FESTALYTICS */}
      <section className="py-24 px-8 bg-gradient-to-br from-[#fff5f8] to-[#ffffff] overflow-hidden">
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <RevealOnScroll animation="animate-fadeInLeft">
            <h2 className="text-[3rem] font-bold mb-6 text-[#1a202c] max-md:text-[2.5rem] flex items-end flex-wrap">
              What is Festalytics?
              <span className="inline-block w-[12px] h-[12px] bg-[#D6336C] rounded-full ml-2 mb-3"></span>
              <span className="inline-block w-[40px] h-[4px] bg-[#D6336C] rounded-full ml-1 mb-3"></span>
            </h2>
            <p className="text-lg text-[#4a5568] leading-relaxed">
              Festalytics is an AI-powered event management platform designed to make event planning easier, faster, and more organized. Whether you are planning a wedding, birthday, or private celebration, Festalytics brings everything you need onto one smart platform — from finding trusted vendors to estimating your budget automatically.
            </p>
          </RevealOnScroll>
          <RevealOnScroll animation="animate-fadeInRight" delay="0.2s" className="relative flex justify-center">
             <div className="w-[300px] h-[300px] bg-gradient-to-tr from-[#D6336C] to-[#ff6eb4] rounded-[20px] shadow-[0_20px_60px_rgba(214,51,108,0.5)] flex items-center justify-center animate-[float_6s_ease-in-out_infinite] transition-all duration-500 hover:scale-105 hover:shadow-[0_25px_70px_rgba(214,51,108,0.7)] group">
                <FaRobot className="text-[100px] text-white transition-transform duration-300 group-hover:scale-110" />
             </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* 3. THE PROBLEM WE SOLVE */}
      <section className="py-24 px-8 bg-[#111827]">
        <div className="max-w-[1200px] mx-auto">
          <RevealOnScroll className="text-center mb-16">
            <h2 className="text-[3rem] font-bold mb-4 text-white max-md:text-[2.5rem]">Why Festalytics?</h2>
            <p className="text-xl text-gray-400">Traditional event planning is stressful. We fix that.</p>
          </RevealOnScroll>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Card 1 */}
            <RevealOnScroll delay="0.1s">
              <div className="bg-white/10 backdrop-blur-xl border border-white/10 p-10 rounded-[20px] shadow-[0_10px_30px_rgba(0,0,0,0.3)] text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_15px_40px_rgba(214,51,108,0.3)] group h-full">
                <div className="mb-6 flex justify-center transition-transform duration-300 group-hover:scale-110">
                  <div className="p-2">
                    <SearchX className="w-12 h-12 text-white drop-shadow-[0_4px_8px_rgba(255,255,255,0.2)]" />
                  </div>
                </div>
                <p className="text-lg text-white font-medium">Finding trusted vendors is difficult and time consuming</p>
              </div>
            </RevealOnScroll>
            {/* Card 2 - Active Gradient */}
            <RevealOnScroll delay="0.2s">
              <div className="bg-gradient-to-br from-[#D6336C] to-[#ff6eb4] p-10 rounded-[20px] shadow-[0_20px_50px_rgba(214,51,108,0.4)] text-center transition-all duration-500 transform md:-translate-y-4 active-card-pulse h-full group">
                <div className="mb-6 flex justify-center transition-transform duration-300 group-hover:scale-110">
                  <div className="p-2">
                    <TrendingUp className="w-12 h-12 text-white drop-shadow-[0_4px_12px_rgba(255,255,255,0.4)]" />
                  </div>
                </div>
                <p className="text-lg text-white font-medium">Estimating event costs accurately is nearly impossible</p>
              </div>
            </RevealOnScroll>
            {/* Card 3 */}
            <RevealOnScroll delay="0.3s">
              <div className="bg-white/10 backdrop-blur-xl border border-white/10 p-10 rounded-[20px] shadow-[0_10px_30px_rgba(0,0,0,0.3)] text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_15px_40px_rgba(214,51,108,0.3)] group h-full">
                <div className="mb-6 flex justify-center transition-transform duration-300 group-hover:scale-110">
                  <div className="p-2">
                    <CalendarX2 className="w-12 h-12 text-white drop-shadow-[0_4px_8px_rgba(255,255,255,0.2)]" />
                  </div>
                </div>
                <p className="text-lg text-white font-medium">Managing multiple vendors and bookings leads to confusion</p>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* 4. OUR SERVICES */}
      <section className="py-24 px-8 bg-[#f8f9fa]">
        <div className="max-w-[1200px] mx-auto">
          <RevealOnScroll>
            <h2 className="text-center text-[3rem] font-bold mb-16 text-[#1a202c]">What We Offer</h2>
          </RevealOnScroll>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {/* Service 1 */}
            <RevealOnScroll delay="0.1s">
              <div className="service-card bg-white p-10 rounded-[20px] shadow-[0_4px_15px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_15px_30px_rgba(214,51,108,0.15)] group relative z-10 h-full">
                <div className="text-[2.5rem] mb-6 text-[#D6336C] transition-transform duration-300 group-hover:animate-bounce">
                  <FaSearch />
                </div>
                <h3 className="text-xl font-bold mb-3 text-[#1a202c]">Smart Vendor Discovery</h3>
                <p className="text-[#4a5568] leading-relaxed">Browse and compare verified vendors based on your location, budget, and event type</p>
              </div>
            </RevealOnScroll>
            {/* Service 2 */}
            <RevealOnScroll delay="0.2s">
              <div className="service-card bg-white p-10 rounded-[20px] shadow-[0_4px_15px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_15px_30px_rgba(214,51,108,0.15)] group relative z-10 h-full">
                <div className="text-[2.5rem] mb-6 text-[#D6336C] transition-transform duration-300 group-hover:animate-bounce">
                  <FaRobot />
                </div>
                <h3 className="text-xl font-bold mb-3 text-[#1a202c]">AI Cost Estimation</h3>
                <p className="text-[#4a5568] leading-relaxed">Get accurate event budget predictions powered by machine learning</p>
              </div>
            </RevealOnScroll>
            {/* Service 3 */}
            <RevealOnScroll delay="0.3s">
              <div className="service-card bg-white p-10 rounded-[20px] shadow-[0_4px_15px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_15px_30px_rgba(214,51,108,0.15)] group relative z-10 h-full">
                <div className="text-[2.5rem] mb-6 text-[#D6336C] transition-transform duration-300 group-hover:animate-bounce">
                  <FaImage />
                </div>
                <h3 className="text-xl font-bold mb-3 text-[#1a202c]">Décor Matching</h3>
                <p className="text-[#4a5568] leading-relaxed">Upload a décor image and our AI finds visually similar decoration styles for you</p>
              </div>
            </RevealOnScroll>
            {/* Service 4 */}
            <RevealOnScroll delay="0.4s">
              <div className="service-card bg-white p-10 rounded-[20px] shadow-[0_4px_15px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_15px_30px_rgba(214,51,108,0.15)] group relative z-10 h-full">
                <div className="text-[2.5rem] mb-6 text-[#D6336C] transition-transform duration-300 group-hover:animate-bounce">
                  <FaComments />
                </div>
                <h3 className="text-xl font-bold mb-3 text-[#1a202c]">AI Chatbot Assistant</h3>
                <p className="text-[#4a5568] leading-relaxed">Get instant planning guidance through our intelligent event planning chatbot</p>
              </div>
            </RevealOnScroll>
            {/* Service 5 */}
            <RevealOnScroll delay="0.5s">
              <div className="service-card bg-white p-10 rounded-[20px] shadow-[0_4px_15px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_15px_30px_rgba(214,51,108,0.15)] group relative z-10 h-full">
                <div className="text-[2.5rem] mb-6 text-[#D6336C] transition-transform duration-300 group-hover:animate-bounce">
                  <FaCalendarCheck />
                </div>
                <h3 className="text-xl font-bold mb-3 text-[#1a202c]">Booking Management</h3>
                <p className="text-[#4a5568] leading-relaxed">Easily book vendors, manage schedules, and receive automated reminders</p>
              </div>
            </RevealOnScroll>
            {/* Service 6 */}
            <RevealOnScroll delay="0.6s">
              <div className="service-card bg-white p-10 rounded-[20px] shadow-[0_4px_15px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_15px_30px_rgba(214,51,108,0.15)] group relative z-10 h-full">
                <div className="text-[2.5rem] mb-6 text-[#D6336C] transition-transform duration-300 group-hover:animate-bounce">
                  <FaMapMarkerAlt />
                </div>
                <h3 className="text-xl font-bold mb-3 text-[#1a202c]">Location-Based Recommendations</h3>
                <p className="text-[#4a5568] leading-relaxed">Discover nearby vendors tailored to your event needs and preferences</p>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* 5. HOW IT WORKS */}
      <section className="py-20 px-8 bg-gradient-to-b from-[#fff5f8] to-[#ffffff] relative overflow-hidden">
        <div className="max-w-[800px] mx-auto">
          <RevealOnScroll className="flex flex-col items-center text-center mb-16">
            <h2 className="text-[3rem] font-bold text-[#1a202c]">How It Works</h2>
            <div className="w-[60px] h-[4px] bg-[#D6336C] rounded-full mt-4"></div>
          </RevealOnScroll>
          
          <div className="flex flex-col">
            {/* Step 1 */}
            <div className="flex w-full">
              {/* LEFT: Stepper UI */}
              <div className="flex flex-col items-center mr-6 md:mr-8">
                <div className="relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-[#D6336C] to-[#ff6eb4] text-white font-bold text-[20px] z-10 shadow-lg">
                  <div className="absolute inset-0 bg-[#D6336C] rounded-full opacity-20 animate-[pingRipple_2s_infinite]"></div>
                  1
                </div>
                {/* Vertical Dotted Line */}
                <div className="w-0 h-[60px] border-l-2 border-dashed border-[#D6336C] opacity-40 my-2"></div>
              </div>
              
              {/* RIGHT: Card Content */}
              <RevealOnScroll animation="animate-fadeInRight" delay="0.1s" className="flex-1 pb-4">
                <div className="bg-white border border-[#D6336C]/15 rounded-[16px] p-6 shadow-[0_4px_20px_rgba(214,51,108,0.08)] hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(214,51,108,0.15)] hover:border-[#D6336C] transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-[#D6336C]/10 rounded-xl p-[10px]">
                      <ClipboardList className="w-8 h-8 text-[#D6336C]" />
                    </div>
                    <span className="text-sm font-medium text-gray-400">Step 1</span>
                  </div>
                  <h3 className="text-[18px] font-bold text-[#1a202c] mb-2">Create Your Event</h3>
                  <p className="text-[14px] text-gray-500 leading-relaxed">Enter your event details, type, date, and budget to get started with smart planning</p>
                </div>
              </RevealOnScroll>
            </div>

            {/* Step 2 */}
            <div className="flex w-full">
              {/* LEFT: Stepper UI */}
              <div className="flex flex-col items-center mr-6 md:mr-8">
                <div className="relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-[#D6336C] to-[#ff6eb4] text-white font-bold text-[20px] z-10 shadow-lg">
                  <div className="absolute inset-0 bg-[#D6336C] rounded-full opacity-20 animate-[pingRipple_2s_infinite]" style={{ animationDelay: '0.5s' }}></div>
                  2
                </div>
                {/* Vertical Dotted Line */}
                <div className="w-0 h-[60px] border-l-2 border-dashed border-[#D6336C] opacity-40 my-2"></div>
              </div>
              
              {/* RIGHT: Card Content */}
              <RevealOnScroll animation="animate-fadeInRight" delay="0.2s" className="flex-1 pb-4">
                <div className="bg-white border border-[#D6336C]/15 rounded-[16px] p-6 shadow-[0_4px_20px_rgba(214,51,108,0.08)] hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(214,51,108,0.15)] hover:border-[#D6336C] transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-[#D6336C]/10 rounded-xl p-[10px]">
                      <Search className="w-8 h-8 text-[#D6336C]" />
                    </div>
                    <span className="text-sm font-medium text-gray-400">Step 2</span>
                  </div>
                  <h3 className="text-[18px] font-bold text-[#1a202c] mb-2">Discover & Compare Vendors</h3>
                  <p className="text-[14px] text-gray-500 leading-relaxed">Browse AI-recommended verified vendors and compare services, pricing, and availability</p>
                </div>
              </RevealOnScroll>
            </div>

            {/* Step 3 */}
            <div className="flex w-full">
              {/* LEFT: Stepper UI */}
              <div className="flex flex-col items-center mr-6 md:mr-8">
                <div className="relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-[#D6336C] to-[#ff6eb4] text-white font-bold text-[20px] z-10 shadow-lg">
                  <div className="absolute inset-0 bg-[#D6336C] rounded-full opacity-20 animate-[pingRipple_2s_infinite]" style={{ animationDelay: '1s' }}></div>
                  3
                </div>
                {/* No line below last step */}
              </div>
              
              {/* RIGHT: Card Content */}
              <RevealOnScroll animation="animate-fadeInRight" delay="0.3s" className="flex-1 pb-4">
                <div className="bg-white border border-[#D6336C]/15 rounded-[16px] p-6 shadow-[0_4px_20px_rgba(214,51,108,0.08)] hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(214,51,108,0.15)] hover:border-[#D6336C] transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-[#D6336C]/10 rounded-xl p-[10px]">
                      <CalendarCheck className="w-8 h-8 text-[#D6336C]" />
                    </div>
                    <span className="text-sm font-medium text-gray-400">Step 3</span>
                  </div>
                  <h3 className="text-[18px] font-bold text-[#1a202c] mb-2">Book & Relax</h3>
                  <p className="text-[14px] text-gray-500 leading-relaxed">Confirm your booking and let Festalytics handle reminders, updates, and communication</p>
                </div>
              </RevealOnScroll>
            </div>
          </div>
        </div>
      </section>

      {/* 6. MISSION BANNER */}
      <section className="py-28 px-8 bg-gradient-to-r from-[#D6336C] via-[#ff6eb4] to-[#D6336C] relative overflow-hidden animate-gradientShift">
        <FaQuoteLeft className="absolute top-8 left-8 md:top-12 md:left-24 text-[8rem] md:text-[12rem] text-white/10 rotate-[-10deg]" />
        <div className="absolute inset-0 bg-black/5 backdrop-blur-[1px]"></div>
        
        <RevealOnScroll className="max-w-[800px] mx-auto text-center relative z-10">
          <h2 className="text-[3.5rem] font-bold mb-8 text-white max-md:text-[2.5rem] tracking-tight">Our Mission</h2>
          <p className="text-2xl md:text-3xl text-white/95 leading-relaxed font-medium italic drop-shadow-md">
            "To reduce the stress of event planning, make decision-making smarter, and create a modern solution that brings convenience to both customers and service providers."
          </p>
          
          <button 
            onClick={(e) => {
              handleRipple(e);
              setTimeout(() => router.push('/signup'), 200);
            }}
            className="mt-12 overflow-hidden relative bg-white text-[#D6336C] px-10 py-4 rounded-[50px] font-bold text-lg shadow-[0_10px_25px_rgba(0,0,0,0.2)] hover:shadow-[0_15px_35px_rgba(0,0,0,0.3)] hover:-translate-y-1 transition-all duration-300 active:scale-95"
          >
            Get Started Free
          </button>
        </RevealOnScroll>
      </section>

      <Footer />
    </main>
  );
}
