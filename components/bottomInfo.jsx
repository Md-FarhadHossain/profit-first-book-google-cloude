"use client";
import React from 'react';
import Image from "next/image";
import heroBookCover from "@/components/assets/hero-book-cover.webp";

export default function HeroSection() {
  // Load Fonts and Icons
  // Load Fonts and Icons
  // useEffect(() => {
    // FontAwesome is now loaded in layout.tsx
    // Google Fonts is replaced by next/font in layout.tsx
  // }, []);

  return (
    <div className="w-full min-h-screen bg-white text-[#495057] font-hind leading-relaxed overflow-x-hidden">
      
      {/* Custom Styles for Animation */}
      <style>{`
        @keyframes pulse-orange {
          0% { transform: scale(1); text-shadow: 0 0 5px rgba(230, 81, 0, 0.3); }
          50% { transform: scale(1.03); text-shadow: 0 0 15px rgba(230, 81, 0, 0.5); }
          100% { transform: scale(1); text-shadow: 0 0 5px rgba(230, 81, 0, 0.3); }
        }
        .animate-pulse-orange {
          animation: pulse-orange 1.5s infinite;
        }
        /* Custom scrollbar hiding if needed */
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      <header className="bg-white py-8 lg:py-16 flex items-center justify-center min-h-[90vh] lg:min-h-screen">
        <div className="container mx-auto px-4 lg:px-8 max-w-[1200px]">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            
            {/* --- LEFT COLUMN: Book Showcase --- */}
            <div className="order-1 lg:order-1 flex flex-col items-center lg:items-center relative">
              {/* Desktop Decorative Blob (Optional background effect) */}
              <div className="hidden lg:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-50 rounded-full blur-3xl -z-10 opacity-60"></div>

              <div className="relative group perspective-1000">
                <Image 
                  src={heroBookCover} 
                  alt="Book Cover" 
                  priority
                  className="w-full max-w-[280px] sm:max-w-[320px] lg:max-w-[420px] h-auto mx-auto rounded-xl shadow-[0_20px_40px_rgba(0,0,0,0.2)] transition-transform duration-500 hover:scale-[1.02] hover:-translate-y-2 block"
                />
              </div>

              <a 
                href="#read" 
                className="mt-6 inline-block w-full max-w-[280px] sm:max-w-[320px] lg:max-w-[420px] p-3.5 rounded-xl bg-[linear-gradient(45deg,#6842ff,#ff4ce1)] text-white no-underline font-semibold text-lg shadow-[0_4px_10px_rgba(104,66,255,0.3)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(104,66,255,0.4)] cursor-pointer text-center border-none"
              >
                <i className="fas fa-book-open mr-2"></i> কয়েকটি পৃষ্ঠা পড়ে দেখুন
              </a>
            </div>

            {/* --- RIGHT COLUMN: Content --- */}
            <div className="order-2 lg:order-2 text-center lg:text-left flex flex-col items-center lg:items-start">
              
              {/* Rating Badge */}
              <div className="bg-[#FFFBEB] rounded-lg px-4 py-2 mb-4 border border-[#FFE5B4] inline-flex items-center gap-2 shadow-sm">
                <div className="text-[#ffc107] text-sm lg:text-base flex gap-1">
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star-half-alt"></i>
                </div>
                <div className="h-4 w-px bg-gray-300 mx-1"></div>
                <p className="font-semibold text-[#856404] text-sm lg:text-base m-0">
                  <strong>4.8</strong> (১,৭০০+ রিভিউ)
                </p>
              </div>

              {/* Headline */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl lg:leading-[1.2] font-bold text-[#343a40] mb-2 lg:mb-4">
                প্রফিট ফার্স্ট ফর <br className="hidden lg:block" />
                <span className="text-[#2b2f35]">এফ-কমার্স বিজনেস</span>
              </h1>
              <p className="text-lg lg:text-xl text-[#6b7280] font-medium mb-6 lg:mb-8">
                (হার্ড কভার এডিশন)
              </p>

              {/* Price Box */}
              <div className="bg-white lg:bg-[#F0FFF4]/50 border-2 border-dashed border-[#28a745] rounded-2xl p-4 lg:p-6 mb-8 relative w-full max-w-[400px] lg:max-w-none lg:w-auto lg:inline-block">
                <div className="absolute -top-4 left-1/2 lg:left-8 -translate-x-1/2 lg:translate-x-0 bg-[#dc3545] text-white py-1 px-4 rounded-full text-sm font-bold shadow-md whitespace-nowrap">
                  ২৫% ছাড়!
                </div>
                <div className="flex justify-center lg:justify-start items-end gap-4 pt-2">
                  <span className="text-4xl lg:text-5xl font-bold text-[#28a745]">৳ ৪৯০</span>
                  <span className="text-2xl lg:text-3xl line-through text-gray-400 mb-1">৳ ৭৯০</span>
                </div>
              </div>

              {/* Scarcity / Stock Info */}
              <div className="bg-linear-to-br from-[#fffde7] to-[#fff3e0] border-l-4 border-[#FFB74D] shadow-lg rounded-xl p-5 mb-8 text-center lg:text-left w-full max-w-[500px]">
                <div className="text-[#15803D] font-semibold text-lg mb-1 flex items-center justify-center lg:justify-start gap-2">
                  <i className="fas fa-check-circle"></i> স্টক সীমিত
                </div>
                <div className="animate-pulse-orange text-[#c2410c] font-bold text-2xl lg:text-3xl mb-2">
                  🔥 দ্রুত করুন মাত্র <strong>৩</strong> কপি বাকি!
                </div>
                <div className="text-gray-700 font-medium text-lg">
                  ⚡ অফার শেষ হয়ে যাবে দ্রুত করুন
                </div>
              </div>

              {/* Main CTA Button */}
              <a 
                href="#order" 
                className="group relative overflow-hidden inline-flex items-center justify-center w-full sm:w-auto min-w-[280px] bg-[#FF6F61] text-white py-4 px-8 text-xl lg:text-2xl font-bold rounded-xl transition-all duration-300 shadow-[0_8px_20px_rgba(255,111,97,0.4)] hover:bg-[#fa5a4b] hover:-translate-y-1 hover:shadow-[0_12px_25px_rgba(255,111,97,0.5)]"
              >
                <span className="relative z-10 flex items-center gap-3">
                  <i className="fas fa-shopping-cart group-hover:animate-bounce"></i> 
                  অর্ডার করতে ক্লিক করুন
                </span>
                {/* Button Shine Effect */}
                <div className="absolute top-0 -left-full w-full h-full bg-linear-to-r from-transparent via-white/20 to-transparent skew-x-30 transition-all duration-700 group-hover:left-full"></div>
              </a>
              
              <p className="mt-4 text-sm text-gray-500">
                <i className="fas fa-lock mr-1"></i> ক্যাশ অন ডেলিভারি সুবিধা আছে
              </p>

            </div>
          </div>
        </div>
      </header>
    </div>
  );
}