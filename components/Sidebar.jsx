"use client"
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  BarChart3, 
  ChevronLeft, 
  ChevronRight, 
  Menu, 
  Package, 
  X,
  ShoppingCart,
  HatGlasses,
  TrendingUp,
  PackagePlus,
  Activity
} from 'lucide-react';

export default function Sidebar({ initialCollapsed = false }) {
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();

  // Load from local storage and cookie as fallback/sync
  useEffect(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    if (saved !== null && JSON.parse(saved) !== isCollapsed) {
      setIsCollapsed(JSON.parse(saved));
      document.cookie = `sidebarCollapsed=${JSON.parse(saved)}; path=/; max-age=31536000`;
    }
  }, []);

  // Wrapper to handle toggle and save to localStorage/cookie
  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("sidebarCollapsed", JSON.stringify(newState));
    document.cookie = `sidebarCollapsed=${newState}; path=/; max-age=31536000`;
  };

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const navItems = [
    { 
      label: 'Dashboard', 
      path: '/dashboard', 
      icon: LayoutDashboard 
    },
    { 
      label: 'Analytics', 
      path: '/dashboard/analytics', 
      icon: BarChart3 
    },
    // 2. Added the new path here
    { 
      label: 'Abandoned Orders', 
      path: '/dashboard/abandoned-orders', 
      icon: ShoppingCart 
    },
    {
      label: 'Parcel Performance',
      path: '/dashboard/parcel-performance',
      icon: Activity
    },
    { 
      label: 'Stock Management', 
      path: '/dashboard/StockManagement', 
      icon: TrendingUp 
    },
    { 
      label: 'Add Order', 
      path: '/dashboard/add-order', 
      icon: PackagePlus 
    },
    { 
      label: 'Block User', 
      path: '/dashboard/block-scammer', 
      icon: HatGlasses 
    },
  ];

  const isActive = (path) => pathname === path;

  return (
    <>
      {/* ============================================================
          MOBILE BOTTOM NAVIGATION BAR
          Replaces the hamburger button — no more overlay blocking the screen
      ============================================================ */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-md border-t border-gray-800 safe-area-inset-bottom">
        <div className="flex items-stretch justify-around px-1 pt-1 pb-safe">
          {navItems.slice(0, 5).map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`
                  flex flex-col items-center justify-center gap-0.5 px-1.5 py-2 rounded-xl flex-1 min-w-0 transition-all duration-200 relative
                  ${active
                    ? 'text-blue-400'
                    : 'text-gray-500 hover:text-gray-300'
                  }
                `}
              >
                {active && (
                  <span className="absolute top-0.5 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-blue-500 rounded-full" />
                )}
                <item.icon
                  size={20}
                  className={`shrink-0 transition-all duration-200 ${active ? 'text-blue-400' : 'text-gray-500'}`}
                />
                <span className={`text-[10px] font-medium truncate w-full text-center leading-tight ${active ? 'text-blue-400' : 'text-gray-500'}`}>
                  {item.label.split(' ')[0]}
                </span>
              </Link>
            );
          })}

          {/* More button to open full sidebar drawer */}
          <button
            onClick={() => setIsMobileOpen(true)}
            className={`flex flex-col items-center justify-center gap-0.5 px-1.5 py-2 rounded-xl flex-1 min-w-0 transition-all duration-200 relative
              ${navItems.slice(5).some(item => isActive(item.path))
                ? 'text-blue-400'
                : 'text-gray-500 hover:text-gray-300'
              }
            `}
          >
            <Menu size={20} className="shrink-0" />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>

      {/* MOBILE BACKDROP OVERLAY (for "More" drawer) */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-in fade-in duration-200 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* SIDEBAR DRAWER (mobile: slides in for "More" overflow items) */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-50
          h-screen bg-gray-900 border-r border-gray-800
          transition-all duration-300 ease-in-out
          flex flex-col
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          ${isCollapsed ? 'w-64 md:w-20' : 'w-64'}
        `}
      >
        {/* LOGO AREA */}
        <div className={`h-16 flex items-center ${isCollapsed ? 'justify-between px-6 md:justify-center md:px-0' : 'justify-between px-6'} border-b border-gray-800`}>
          
          {/* Expanded Logo */}
          <div className={`items-center gap-3 overflow-hidden whitespace-nowrap ${isCollapsed ? 'flex md:hidden' : 'flex'}`}>
            <div className="p-1.5 bg-blue-600 rounded-lg shrink-0">
              <Package size={20} className="text-white" />
            </div>
            <span className="font-bold text-xl text-white tracking-tight">
              BookOrder
            </span>
          </div>
          
          {/* Collapsed Logo */}
          <div className={`p-1.5 bg-blue-600 rounded-lg ${isCollapsed ? 'hidden md:block' : 'hidden'}`}>
             <Package size={20} className="text-white" />
          </div>

          {/* Mobile Close Button */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="text-gray-400 hover:text-white transition-colors md:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* NAVIGATION ITEMS */}
        <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto scrollbar-hide">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`
                  relative flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group
                  ${active
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }
                  ${isCollapsed ? 'md:justify-center' : ''}
                `}
              >
                <item.icon size={22} className={`${active ? 'text-white' : 'text-gray-400 group-hover:text-white'} shrink-0`} />
                
                <span className={`font-medium text-sm whitespace-nowrap ${isCollapsed ? 'md:hidden' : ''}`}>
                  {item.label}
                </span>

                {/* Tooltip for Collapsed Mode Desktop Only */}
                {isCollapsed && (
                  <div className="absolute left-full ml-4 px-2 py-1 bg-gray-800 text-white text-xs rounded hidden md:group-hover:block whitespace-nowrap z-50 border border-gray-700 shadow-xl">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* FOOTER / COLLAPSE TRIGGER (Desktop Only) */}
        <div className="p-4 border-t border-gray-800 hidden md:flex justify-end">
          <button
            onClick={toggleCollapse}
            className="p-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>
      </aside>
    </>
  );
}