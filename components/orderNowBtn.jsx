import Link from 'next/link';
import React from 'react';

/**
 * A high-urgency "Order Now" button component with active animations.
 * Features gradient animation, pulsing effect, and shimmer animation.
 */
const OrderNowBtn = () => {
  return (
    <Link href='#order' className="relative inline-block w-full mt-4">
      {/* Pulsing glow effect */}
      <div className="absolute inset-0 bg-linear-to-r from-red-500 via-red-600 to-orange-500 rounded-lg blur-md opacity-75 animate-pulse"></div>
      
      <button
        className="
          relative
          w-full
          px-8 py-4
          font-bold text-white text-3xl
          bg-linear-to-r from-red-500 via-red-600 to-orange-500
          rounded-lg
          shadow-lg
          hover:shadow-xl
          hover:scale-105
          focus:outline-none
          focus:ring-2
          focus:ring-red-400
          focus:ring-offset-2
          active:scale-95
          active:shadow-inner
          transition-all
          duration-200
          ease-in-out
          transform
          overflow-hidden
        "
        style={{
          animation: 'gradientShift 3s ease infinite'
        }}
      >
        {/* Shimmer effect */}
        <span 
          className="absolute inset-0 bg-linear-to-r from-transparent via-white to-transparent opacity-30"
          style={{
            animation: 'shimmer 2s infinite',
            transform: 'translateX(-100%)'
          }}
        ></span>
        
        {/* Button text with subtle bounce */}
        <span 
          className="relative z-10"
          style={{
            animation: 'textBounce 2s ease-in-out infinite'
          }}
        >
          এখনই অর্ডার করুন
        </span>
      </button>

      <style>{`
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

        button {
          background-size: 200% 200%;
        }
      `}</style>
    </Link>
  );
};

export default OrderNowBtn;