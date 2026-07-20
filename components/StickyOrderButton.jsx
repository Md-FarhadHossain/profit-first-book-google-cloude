"use client"
import React, { useState, useEffect } from 'react';

const StickyOrderButton = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    const orderSection = document.getElementById('order');
    
    if (!orderSection) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        setIsVisible(!entry.isIntersecting);
      },
      {
        root: null,
        threshold: 0,
        // Start hiding when order section is within 100px of viewport
        rootMargin: "100px 0px 0px 0px"
      }
    );

    observer.observe(orderSection);

    return () => {
      if (orderSection) observer.unobserve(orderSection);
    };
  }, []);

  if (!hasMounted) return null;

  return (
    <>
      <div 
        className={`fixed bottom-4 left-0 right-0 z-[99] flex justify-center pointer-events-none transition-all duration-300 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        <a 
          href="#order"
          className="pointer-events-auto w-[90%] max-w-sm bg-[#ff6b00] hover:bg-[#e66000] text-white font-extrabold text-center py-4 px-8 rounded-full text-2xl shadow-md ring-4 ring-[#ff6b00]/20 transition-colors"
        >
          অর্ডার করুন
        </a>
      </div>

      {/* FIXED SMALL CALL NOW BUTTON (GREEN) */}
      <a 
        href="tel:01629786168" 
        className={`fixed right-0 top-1/3 -translate-y-1/2 z-[100] bg-[#28a745] hover:bg-[#218838] text-white p-2 md:px-3 md:py-2 rounded-l-xl shadow-[0_4px_15px_rgba(40,167,69,0.4)] flex flex-col items-center gap-1 transition-all duration-300 hover:pr-4 border-2 border-r-0 border-white/20 group cursor-pointer ${
          isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10 pointer-events-none"
        }`}
        title="Call for details"
      >
        <i className="fas fa-phone-alt group-hover:animate-bounce text-lg md:text-xl"></i>
        <span className="text-[9px] md:text-[11px] font-black uppercase tracking-wider">Call Now</span>
      </a>
    </>
  );
};

export default StickyOrderButton;
