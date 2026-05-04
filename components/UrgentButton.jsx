import React from 'react';

const UrgentButton = ({ 
  children, 
  onClick, 
  disabled = false, 
  variant = 'primary',
  size = 'default',
  className = 'w-full' 
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-bold rounded-lg transition-all duration-200 ease-in-out transform focus:outline-none focus:ring-4 focus:ring-opacity-50';
  
  const variants = {
    primary: 'bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white hover:from-orange-600 hover:via-red-600 hover:to-pink-600 active:scale-95 focus:ring-orange-300 shadow-lg hover:shadow-xl',
    secondary: 'bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white hover:from-purple-700 hover:via-blue-700 hover:to-indigo-700 active:scale-95 focus:ring-purple-300 shadow-lg hover:shadow-xl',
    success: 'bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-white hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 active:scale-95 focus:ring-green-300 shadow-lg hover:shadow-xl',
    warning: 'bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 text-white hover:from-yellow-600 hover:via-amber-600 hover:to-orange-600 active:scale-95 focus:ring-yellow-300 shadow-lg hover:shadow-xl'
  };

  const sizes = {
    small: 'px-4 py-2 text-sm',
    default: 'px-6 py-3 text-base',
    large: 'px-8 py-4 text-lg',
    xl: 'px-10 py-5 text-xl'
  };

  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${disabledClasses} ${className}`}
    >
      <span className="relative z-10">
        {children}
      </span>
      <div className="absolute inset-0 bg-white opacity-0 hover:opacity-10 transition-opacity duration-200 rounded-lg"></div>
    </button>
  );
};

export default UrgentButton;