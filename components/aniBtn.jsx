import React from 'react';

/**
 * A high-urgency "Order Now" button component styled with Tailwind CSS.
 * Features a bold gradient, prominent text, and enhanced animations including
 * pulsing effect, gradient animation, and interactive states.
 */
const AniOrderNowBtn = () => {
  return (
    <button
      className="
        inline-block
        w-full
        px-8 py-4 
        font-bold text-white text-3xl 
        
        /* Animated gradient background */
        bg-linear-to-r from-red-500 via-red-600 to-orange-500 
        bg-size-[200%_200%]
        animate-gradient-shift
        
        /* Base styling */
        rounded-lg 
        shadow-lg 
        
        /* Hover effects */
        hover:shadow-xl 
        hover:scale-105
        hover:bg-linear-to-r hover:from-orange-500 hover:via-red-600 hover:to-red-500
        
        /* Focus effects */
        focus:outline-none 
        focus:ring-2 
        focus:ring-red-400 
        focus:ring-offset-2 
        
        /* Active effects */
        active:scale-95 
        active:shadow-inner
        
        /* Pulsing animation for continuous attention */
        animate-pulse-slow
        
        /* Smooth transitions */
        transition-all 
        duration-200 
        ease-in-out
        transform
        
        /* Spacing */
        mt-4
        
        /* Glow effect */
        before:absolute before:inset-0 before:rounded-lg before:bg-linear-to-r
        before:from-red-400 before:via-orange-400 before:to-yellow-400 
        before:opacity-0 before:blur-md before:transition-all before:duration-300
        hover:before:opacity-30 hover:before:scale-110
        
        /* Relative positioning for pseudo-elements */
        relative
        overflow-hidden
      "
    >
      {/* Animated sparkle effect */}
      <span className="absolute inset-0 overflow-hidden rounded-lg">
        <span className="absolute top-1/4 left-1/4 w-1 h-1 bg-white rounded-full animate-sparkle-1 opacity-0"></span>
        <span className="absolute top-1/3 right-1/3 w-1 h-1 bg-white rounded-full animate-sparkle-2 opacity-0"></span>
        <span className="absolute bottom-1/4 left-1/2 w-1 h-1 bg-white rounded-full animate-sparkle-3 opacity-0"></span>
      </span>
      
      {/* Button text with subtle animation */}
      <span className="relative z-10 inline-block animate-text-glow">
        এখনই অর্ডার করুন
      </span>
      
      {/* Ripple effect container */}
      <span className="absolute inset-0 rounded-lg overflow-hidden">
        <span className="absolute inset-0 bg-white opacity-0 scale-0 rounded-lg animate-ripple-origin"></span>
      </span>
    </button>
  );
};

export default AniOrderNowBtn;