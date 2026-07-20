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
    <div 
      className={`fixed bottom-0 left-0 right-0 z-[99] flex justify-center pointer-events-none transition-transform duration-300 ease-in-out ${
        isVisible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <a 
        href="#order"
        className="relative pointer-events-auto w-full bg-linear-to-r from-red-500 via-orange-500 to-red-500 text-white font-bold text-center py-4 px-8 text-2xl shadow-[0_-4px_15px_rgba(0,0,0,0.15)] transition-all overflow-hidden block"
        style={{
          backgroundSize: '200% 200%',
          animation: 'gradientShift 3s ease infinite'
        }}
      >
        {/* Shimmer effect */}
        <span 
          className="absolute inset-0 bg-linear-to-r from-transparent via-white to-transparent opacity-30 pointer-events-none"
          style={{
            animation: 'shimmer 2s infinite',
            transform: 'translateX(-100%)'
          }}
        ></span>

        <span 
          className="relative z-10 inline-block"
          style={{
            animation: 'textBounce 2s ease-in-out infinite'
          }}
        >
          অর্ডার করুন
        </span>
      </a>

      <style jsx>{`
        @keyframes gradientShift {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(200%);
          }
        }

        @keyframes textBounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-2px);
          }
        }
      `}</style>
    </div>
  );
};

export default StickyOrderButton;
