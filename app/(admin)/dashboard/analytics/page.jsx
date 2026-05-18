"use client"

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, PieChart, Pie, Legend
} from 'recharts';
import { 
  ArrowUpRight, ArrowDownRight, Calendar, TrendingUp, 
  Package, DollarSign, Activity, MapPin, ChevronDown, 
  Smartphone, Cpu, Share2, Globe, ShieldCheck, CheckCircle, Send,
  Megaphone, Wallet, ShoppingBag, X, Clock
} from 'lucide-react';
import { format, subDays, isSameDay, startOfDay, isToday, isYesterday, isThisMonth, isThisYear, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { UAParser } from 'ua-parser-js'; 
import getAllOrders from '@/lib/getAllorders';
import getAllSessions from '@/lib/getAllSessions';
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// --- CONFIGURATION: MODEL MAPPING ---
const DEVICE_CODEX = {
  '23129RAA4G': 'Redmi Note 13 5G',
  '23124RA7EO': 'Redmi Note 13 4G',
  'SM-S918B': 'Galaxy S23 Ultra',
  'SM-S928B': 'Galaxy S24 Ultra',
  'SM-A546B': 'Galaxy A54 5G',
  'iPhone16,1': 'iPhone 15 Pro',
  'iPhone16,2': 'iPhone 15 Pro Max',
  'iPhone15,2': 'iPhone 14 Pro',
  'CPH2529': 'Oppo A78',
  'V2250': 'Vivo V27',
};

// --- DATE PRESET OPTIONS ---
const DATE_PRESETS = [
  { label: "Today", value: "today", getDateRange: () => {
    const today = new Date();
    return { from: today, to: today };
  }},
  { label: "Yesterday", value: "yesterday", getDateRange: () => {
    const yesterday = subDays(new Date(), 1);
    return { from: yesterday, to: yesterday };
  }},
  { label: "Last 7 Days", value: "last7days", getDateRange: () => {
    return { from: subDays(new Date(), 6), to: new Date() };
  }},
  { label: "Last 30 Days", value: "last30days", getDateRange: () => {
    return { from: subDays(new Date(), 29), to: new Date() };
  }},
  { label: "This Month", value: "thismonth", getDateRange: () => {
    return { from: startOfMonth(new Date()), to: endOfMonth(new Date()) };
  }},
  { label: "Last Month", value: "lastmonth", getDateRange: () => {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return { from: lastMonth, to: endOfMonth(lastMonth) };
  }},
  { label: "This Year", value: "thisyear", getDateRange: () => {
    return { from: startOfYear(new Date()), to: endOfYear(new Date()) };
  }},
  { label: "Custom Range", value: "custom", getDateRange: () => null },
];

// --- DATE RANGE PICKER COMPONENT ---
const DateRangePicker = ({ dateRange, onDateRangeChange, selectedPreset, onPresetChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const handlePresetClick = (preset) => {
    onPresetChange(preset.value);
    if (preset.value !== "custom") {
      const range = preset.getDateRange();
      onDateRangeChange(range);
      setIsOpen(false);
    }
  };

  const formatDateDisplay = (range) => {
    if (!range) return "Select dates";
    if (range.from && range.to) {
      if (range.from.getTime() === range.to.getTime()) {
        return format(range.from, "MMM dd, yyyy");
      }
      return `${format(range.from, "MMM dd")} - ${format(range.to, "MMM dd, yyyy")}`;
    }
    if (range.from) {
      return `${format(range.from, "MMM dd, yyyy")} - ...`;
    }
    return "Select dates";
  };

  return (
    <div className="flex items-center gap-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full md:w-auto justify-start text-left font-normal bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
          >
            <Calendar className="mr-2 h-4 w-4" />
            {formatDateDisplay(dateRange)}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700" align="start">
          <div className="flex flex-col md:flex-row gap-4 p-4">
            {/* Presets */}
            <div className="flex flex-col gap-2 min-w-[150px]">
              <h4 className="text-sm font-medium text-gray-400 mb-2">Quick Select</h4>
              {DATE_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => handlePresetClick(preset)}
                  className={`text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    selectedPreset === preset.value
                      ? "bg-blue-600 text-white"
                      : "text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            
            {/* Calendar */}
            <div>
              <CalendarComponent
                mode="range"
                selected={dateRange}
                onSelect={onDateRangeChange}
                numberOfMonths={2}
                className="bg-gray-800 text-white"
                classNames={{
                  day_selected: "bg-blue-600 text-white hover:bg-blue-700",
                  day_today: "bg-gray-700 text-white",
                  day_outside: "text-gray-500",
                  day_disabled: "text-gray-600",
                  day_range_middle: "bg-blue-900/50 text-white",
                  day_range_start: "bg-blue-600 text-white rounded-l-md",
                  day_range_end: "bg-blue-600 text-white rounded-r-md",
                }}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
      
      {dateRange && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            onDateRangeChange(null);
            onPresetChange(null);
          }}
          className="text-gray-400 hover:text-white"
        >
          <X size={16} />
        </Button>
      )}
    </div>
  );
};

// --- UI COMPONENTS ---

const Card = ({ children, className = "" }) => (
  <div className={`bg-gray-800/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 shadow-2xl flex flex-col ${className}`}>
    {children}
  </div>
);

// Improved Stat Card with Gradient Icons
const StatCard = ({ title, value, trend, trendValue, icon: Icon, theme = 'blue', isHero = false }) => {
  
  // Theme configurations for gradients and borders
  const themes = {
    blue: {
      iconBg: "from-blue-500/20 to-blue-600/5",
      iconText: "text-blue-400",
      border: "border-blue-500/20",
      glow: "shadow-[0_0_15px_rgba(59,130,246,0.15)]"
    },
    green: {
      iconBg: "from-emerald-500/20 to-emerald-600/5",
      iconText: "text-emerald-400",
      border: "border-emerald-500/20",
      glow: "shadow-[0_0_15px_rgba(16,185,129,0.15)]"
    },
    purple: {
      iconBg: "from-purple-500/20 to-purple-600/5",
      iconText: "text-purple-400",
      border: "border-purple-500/20",
      glow: "shadow-[0_0_15px_rgba(168,85,247,0.15)]"
    },
    orange: {
      iconBg: "from-orange-500/20 to-orange-600/5",
      iconText: "text-orange-400",
      border: "border-orange-500/20",
      glow: "shadow-[0_0_15px_rgba(249,115,22,0.15)]"
    },
    rose: {
      iconBg: "from-rose-500/20 to-rose-600/5",
      iconText: "text-rose-400",
      border: "border-rose-500/20",
      glow: "shadow-[0_0_15px_rgba(244,63,94,0.15)]"
    }
  };

  const currentTheme = themes[theme] || themes.blue;

  return (
    <div className={`relative overflow-hidden group bg-gray-800/40 backdrop-blur-md border border-gray-700/50 rounded-2xl p-5 hover:border-gray-600 transition-all duration-300 hover:-translate-y-1 ${isHero ? 'ring-1 ring-emerald-500/30 bg-emerald-900/10' : ''}`}>
      
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-linear-to-br from-white/5 to-transparent rounded-full blur-2xl pointer-events-none group-hover:from-white/10 transition-colors"></div>

      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className={`p-3.5 rounded-2xl bg-linear-to-br ${currentTheme.iconBg} ${currentTheme.iconText} border ${currentTheme.border} ${currentTheme.glow}`}>
          <Icon size={24} strokeWidth={2.5} />
        </div>
        
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-full border backdrop-blur-sm ${
            trend === 'up' 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
          }`}>
            {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {trendValue}
          </div>
        )}
      </div>
      
      <div className="relative z-10">
          <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">{title}</h3>
          <p className={`font-bold text-white tracking-tight ${isHero ? 'text-3xl' : 'text-2xl'}`}>
            {value}
          </p>
      </div>
    </div>
  );
};

// Shopify-style stats bar component — dark theme to match the dashboard
const ShopifyStatsBar = ({ sessionsCount, revenue, ordersCount, conversionRate, chartData }) => {
  // Only show conversion rate if sessions data is meaningful (more than 10 sessions collected)
  const isSessionDataMature = (sessionsCount || 0) >= 10;
  const displayConversion = isSessionDataMature ? `${conversionRate}%` : 'Collecting…';

  const items = [
    {
      label: 'Sessions',
      value: (sessionsCount || 0).toLocaleString(),
      isCurrency: false,
      badge: !isSessionDataMature ? 'Live tracking' : null,
      badgeColor: 'text-sky-400 bg-sky-400/10 border-sky-500/20',
      accentColor: '#38bdf8',
      strokeColor: '#0ea5e9',
    },
    {
      label: 'Gross Sales',
      value: `৳${(revenue || 0).toLocaleString()}`,
      isCurrency: false,
      badge: null,
      accentColor: '#34d399',
      strokeColor: '#10b981',
    },
    {
      label: 'Orders',
      value: (ordersCount || 0).toLocaleString(),
      isCurrency: false,
      badge: null,
      accentColor: '#a78bfa',
      strokeColor: '#7c3aed',
    },
    {
      label: 'Conversion Rate',
      value: displayConversion,
      isCurrency: false,
      badge: !isSessionDataMature ? 'Need more data' : null,
      badgeColor: 'text-amber-400 bg-amber-400/10 border-amber-500/20',
      accentColor: '#fb923c',
      strokeColor: '#ea580c',
    },
  ];

  return (
    <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/60 rounded-2xl mb-8 shadow-2xl overflow-hidden">
      {/* Header strip */}
      <div className="flex items-center gap-2 px-6 py-3 border-b border-gray-700/50 bg-gray-900/30">
        <Activity size={14} className="text-sky-400" />
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Conversion Overview</span>
        <span className="ml-auto flex items-center gap-1.5 text-[10px] font-medium text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
          Live
        </span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-gray-700/50">
        {items.map((item, index) => (
          <div
            key={index}
            className="group p-5 flex flex-col gap-3 hover:bg-gray-700/20 transition-colors duration-200"
          >
            {/* Label */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
                {item.label}
              </span>
              {item.badge && (
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${item.badgeColor}`}>
                  {item.badge}
                </span>
              )}
            </div>

            {/* Value + sparkline row */}
            <div className="flex items-end justify-between gap-2">
              <span className="text-2xl font-bold text-white tracking-tight leading-none">
                {item.value}
              </span>

              {/* Mini sparkline */}
              <div className="w-20 h-9 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData || []}>
                    <defs>
                      <linearGradient id={`dark-sparkline-${index}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={item.accentColor} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={item.accentColor} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="orders"
                      stroke={item.strokeColor}
                      strokeWidth={2}
                      fillOpacity={1}
                      fill={`url(#dark-sparkline-${index})`}
                      isAnimationActive={false}
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900/95 backdrop-blur-xl border border-gray-700 p-4 rounded-xl shadow-2xl z-50">
        <p className="text-gray-400 text-xs mb-2 font-mono uppercase tracking-wider border-b border-gray-700 pb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-3 mb-1 last:mb-0">
            <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{backgroundColor: entry.color || entry.fill}}></div>
            <div className="flex justify-between w-full gap-6">
              <span className="text-sm font-medium text-gray-200">{entry.name}</span>
              <span className="text-sm font-bold text-white font-mono">{entry.value.toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// --- HELPER: Aggregation ---
const aggregateCounts = (dataArray, keyFetcher, topLimit = 5) => {
  const counts = {};
  let total = 0;

  dataArray.forEach(item => {
    const key = keyFetcher(item) || 'Unknown';
    counts[key] = (counts[key] || 0) + 1;
    total++;
  });

  const sorted = Object.entries(counts)
    .map(([name, value]) => ({ name, value, percentage: ((value/total)*100).toFixed(1) }))
    .sort((a, b) => b.value - a.value);

  return sorted.slice(0, topLimit);
};

// --- DISTRICT NAME → SVG ID normalisation ---
// DB stores readable names; SVG uses CamelCase without apostrophes / spaces
const DISTRICT_NAME_TO_SVG_ID = {
  "Cox's Bazar":    'CoxsBazar',
  'Brahmanbaria':   'Brahmanbaria',
  'Chattogram':     'Chittagong',
  'Chittagong':     'Chittagong',
  'Moulvibazar':    'Moulvibazar',
  'Moulvibazar':    'Moulvibazar',
  'Jashore':        'Jessore',
  'Jessore':        'Jessore',
  'Jhalokati':      'Jhalokhati',
  'Jhalokhati':     'Jhalokhati',
  'Joypurhat':      'Joypurhat',
  'Kishoreganj':    'Kishorganj',
  'Kishorganj':     'Kishorganj',
  'Mymensingh':     'Mymansingh',
  'Netrokona':      'Netrokona',
  'Nawabganj':      'Nawabganj',
  'Narayanganj':    'Narayanganj',
  'Narsingdi':      'Narshingdi',
  'Narshingdi':     'Narshingdi',
  'Patuakhali':     'Patuakhali',
  'Pirojpur':       'Pirojpur',
  'Barisal':        'Barisal',
  'Barguna':        'Barguna',
  'Bhola':          'Bhola',
  'Lakshmipur':     'Lakshmipur',
  'Rajbari':        'Rajbari',
  'Shariatpur':     'Shariatpur',
  'Sunamganj':      'Sunamganj',
  'Habiganj':       'Habiganj',
  'Sylhet':         'Sylhet',
  'Thakurgaon':     'Thakurgaon',
  'Dinajpur':       'Dinajpur',
  'Rangpur':        'Rangpur',
  'Gaibandha':      'Gaibandha',
  'Nilphamari':     'Nilphamari',
  'Lalmonirhat':    'Lalmonirhat',
  'Kurigram':       'Kurigram',
  'Panchagarh':     'Panchaghar',
  'Panchaghar':     'Panchaghar',
  'Sirajganj':      'Sirajganj',
  'Pabna':          'Pabna',
  'Natore':         'Natore',
  'Naogaon':        'Naogaon',
  'Bogura':         'Bogra',
  'Bogra':          'Bogra',
  'Rajshahi':       'Rajshahi',
  'Chapainawabganj':'Nawabganj',
  'Joypurhat':      'Joypurhat',
  'Tangail':        'Tangail',
  'Jamalpur':       'Jamalpur',
  'Sherpur':        'Sherpur',
  'Mymansingh':     'Mymansingh',
  'Dhaka':          'Dhaka',
  'Dhaka City':     'Dhaka',
  'Dhaka Sub-Urban':'Dhaka',
  'Gazipur':        'Gazipur',
  'Manikganj':      'Manikganj',
  'Munshiganj':     'Munshiganj',
  'Narsingdi':      'Narshingdi',
  'Faridpur':       'Faridpur',
  'Gopalganj':      'Gopalganj',
  'Madaripur':      'Madaripur',
  'Khulna':         'Khulna',
  'Satkhira':       'Satkhira',
  'Shatkhira':      'Satkhira',  // typo alias found in order data
  'Bagerhat':       'Bagerhat',
  'Narail':         'Narail',
  'Jessore':        'Jessore',
  'Magura':         'Magura',
  'Jhenaidah':      'Jhenaidah',
  'Kushtia':        'Kushtia',
  'Chuadanga':      'Chuadanga',
  'Meherpur':       'Meherpur',
  'Comilla':        'Comilla',
  'Chandpur':       'Chandpur',
  'Feni':           'Feni',
  'Noakhali':       'Noakhali',
  'Lakshmipur':     'Lakshmipur',
  'Khagrachhari':   'Khagrachari',
  'Rangamati':      'Rangamati',
  'Bandarban':      'Bandarban',
  'Cumilla':        'Comilla',
};

function districtNameToSvgId(name) {
  if (!name) return null;
  // 1. Exact match table
  if (DISTRICT_NAME_TO_SVG_ID[name]) return DISTRICT_NAME_TO_SVG_ID[name];
  // 2. Fallback: strip spaces / apostrophes → CamelCase
  return name.replace(/[^a-zA-Z0-9]/g, '');
}

// --- COLOUR SCALE: vibrant multi-hue continuous scale ---
function heatColour(ratio) {
  if (ratio <= 0) return '#1e293b'; // slate-800 for empty
  if (ratio < 0.01) return 'rgb(30, 64, 175)'; // blue-800
  if (ratio <= 0.3) {
    const t = (ratio - 0.01) / 0.29;
    return `rgb(${Math.round(37 + (147-37)*t)}, ${Math.round(99 + (51-99)*t)}, ${Math.round(235 + (234-235)*t)})`; // blue-600 to purple-600
  }
  if (ratio <= 0.6) {
    const t = (ratio - 0.3) / 0.3;
    return `rgb(${Math.round(147 + (225-147)*t)}, ${Math.round(51 + (29-51)*t)}, ${Math.round(234 + (72-234)*t)})`; // purple-600 to rose-600
  }
  if (ratio <= 0.8) {
    const t = (ratio - 0.6) / 0.2;
    return `rgb(${Math.round(225 + (245-225)*t)}, ${Math.round(29 + (158-29)*t)}, ${Math.round(72 + (11-72)*t)})`; // rose-600 to amber-500
  }
  const t = (ratio - 0.8) / 0.2;
  return `rgb(${Math.round(245 + (253-245)*t)}, ${Math.round(158 + (224-158)*t)}, ${Math.round(11 + (71-11)*t)})`; // amber-500 to yellow-300
}

// --- BANGLADESH MAP COMPONENT ---
const BangladeshMapChart = ({ districtData }) => {
  const containerRef    = useRef(null);
  const [svgContent, setSvgContent] = useState('');
  const [tooltip, setTooltip]       = useState({ visible: false, x: 0, y: 0, data: null });
  const hoveredEl = useRef(null);

  // Zoom & Pan
  const [zoom, setZoom]         = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false); // drives cursor style via re-render
  const dragStart               = useRef({ x: 0, y: 0 });

  // district fill lookup: svgId → colour
  const fillMap = useMemo(() => {
    const map = {};
    const max = districtData.length > 0 ? districtData[0].orders : 1;
    districtData.forEach(({ svgId, orders }) => {
      map[svgId] = heatColour(max > 0 ? orders / max : 0);
    });
    return map;
  }, [districtData]);

  // 1. Fetch & sanitise SVG
  //    Strategy: strip only the fill+opacity CSS rules from the <style> block,
  //    then inject our own minimal style for clean modern text rendering.
  useEffect(() => {
    fetch('/BangladeshMap.svg')
      .then(r => r.text())
      .then(text => {
        let cleaned = text
          .replace(/<\?xml[^?]*\?>/g, '')
          // Strip the SVG's own <style> block
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<svg\b/, '<svg id="bangladesh-map-svg" width="100%" height="100%" style="overflow:visible;display:block;" ');

        // Inject our own style block right after opening <svg> tag.
        // We MUST prefix every rule with #bangladesh-map-svg, otherwise this injected <style>
        // will leak out and apply globally to the entire React application, hiding all Lucide icons and Recharts data.
        cleaned = cleaned.replace(
          /(<svg[^>]*>)/,
          `$1<style>
            /* ── Hide ALL baked-in legend paths and junk ── */
            #bangladesh-map-svg path:not([id$="_District"]),
            #bangladesh-map-svg polygon:not([id$="_District"]),
            #bangladesh-map-svg rect, 
            #bangladesh-map-svg circle, 
            #bangladesh-map-svg line, 
            #bangladesh-map-svg polyline {
              display: none !important;
            }
            
            /* Division groups */
            #bangladesh-map-svg g { fill: none !important; opacity: 1 !important; }
            
            /* District paths */
            #bangladesh-map-svg [id$="_District"] {
              stroke: rgba(255,255,255,0.15) !important;
              stroke-width: 0.5px !important;
              paint-order: stroke fill;
              transition: fill 0.15s, filter 0.15s;
            }
            
            /* District labels */
            #bangladesh-map-svg text, 
            #bangladesh-map-svg tspan {
              font-family: 'Inter', 'Segoe UI', system-ui, sans-serif !important;
              font-size: 10px !important;
              font-weight: 700 !important;
              fill: rgba(255,255,255,0.7) !important;
              stroke: none !important;
              pointer-events: none !important;
              text-shadow: 0 1px 4px rgba(0,0,0,0.9);
            }
          </style>`
        );

        setSvgContent(cleaned);
      })
      .catch(console.error);
  }, []);
  // 2. Dynamic Styles for Heatmap & Hover
  const dynamicStyles = useMemo(() => {
    const max = districtData.length > 0 ? districtData[0].orders : 1;
    let css = `
      #bangladesh-map-svg [id$="_District"] {
        cursor: pointer;
      }
      #bangladesh-map-svg [id$="_District"]:hover {
        filter: drop-shadow(0 0 10px rgba(255,255,255,0.5)) !important;
        stroke: rgba(255,255,255,0.9) !important;
        stroke-width: 1.5px !important;
      }
    `;

    districtData.forEach((entry) => {
      const color = fillMap[entry.svgId] || '#1e293b';
      const ratio = entry.orders / max;
      css += `
        #bangladesh-map-svg #${entry.svgId}_District {
          fill: ${color} !important;
          stroke: ${ratio > 0 ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.2)'} !important;
          ${ratio > 0.7 ? `filter: drop-shadow(0 0 5px ${color});` : ''}
        }
      `;
    });
    return css;
  }, [districtData, fillMap]);

  // 3. Tooltip hover — only active when not dragging
  const handleMouseMove = useCallback((e) => {
    if (dragging) return; // suppress tooltip while panning

    const target = e.target.closest('[id$="_District"]');

    if (!target) {
      setTooltip(t => ({ ...t, visible: false }));
      return;
    }

    const svgId = target.id.replace('_District', '');
    const entry = districtData.find(d => d.svgId === svgId);
    const rect  = containerRef.current.getBoundingClientRect();
    
    setTooltip({
      visible: true,
      x: e.clientX - rect.left + 14,
      y: e.clientY - rect.top  - 14,
      data: {
        name    : svgId.replace(/([A-Z])/g, ' $1').trim(),
        orders  : entry?.orders  ?? 0,
        revenue : entry?.revenue ?? 0,
        rank    : entry ? districtData.indexOf(entry) + 1 : null,
      }
    });
  }, [districtData, dragging]);

  const handleMouseLeave = useCallback(() => {
    setTooltip(t => ({ ...t, visible: false }));
  }, []);

  // ── Drag/Pan — window-level listeners so fast mouse moves don't drop the drag ──
  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return; // left click only
    e.preventDefault();

    setTooltip(t => ({ ...t, visible: false }));

    dragStart.current = { x: e.clientX, y: e.clientY };
    setDragging(true);

    const onMove = (ev) => {
      const dx = ev.clientX - dragStart.current.x;
      const dy = ev.clientY - dragStart.current.y;
      dragStart.current = { x: ev.clientX, y: ev.clientY };
      setPosition(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    };

    const onUp = () => {
      setDragging(false);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',   onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
  }, []);

  const handleMouseUp = () => {}; // handled by window listener above

  // ── Cursor-aware scroll-wheel zoom (like Google Maps) ──────────────────────
  // With transformOrigin:'center', the container center (W/2, H/2) is the scale pivot.
  // Visual position of a content point (lx,ly) in a WxH container:
  //   vx = W/2 + (lx - W/2)*zoom + pos.x
  //   vy = H/2 + (ly - H/2)*zoom + pos.y
  // To keep cursor point (cx,cy) fixed after zoom change (ratio = newZoom/oldZoom):
  //   newPos.x = (cx - W/2)*(1 - ratio) + oldPos.x*ratio
  //   newPos.y = (cy - H/2)*(1 - ratio) + oldPos.y*ratio
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      e.stopPropagation();

      const rect    = el.getBoundingClientRect();
      const cx      = e.clientX - rect.left;  // cursor relative to container
      const cy      = e.clientY - rect.top;
      const W       = rect.width;
      const H       = rect.height;
      const delta   = -e.deltaY * 0.0012;

      setZoom(oldZoom => {
        const newZoom = Math.min(5, Math.max(0.4, oldZoom + delta * oldZoom));
        const ratio   = newZoom / oldZoom;
        setPosition(pos => ({
          x: (cx - W / 2) * (1 - ratio) + pos.x * ratio,
          y: (cy - H / 2) * (1 - ratio) + pos.y * ratio,
        }));
        return newZoom;
      });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // Button zoom: pivot around current view center (cursor = container center)
  // With transformOrigin:'center', (cx - W/2) = 0 when cursor is at center, so pos scales with ratio
  const zoomTowards = (factor) => {
    setZoom(oldZoom => {
      const newZoom = Math.min(5, Math.max(0.4, oldZoom * factor));
      const ratio   = newZoom / oldZoom;
      // cursor at center → (cx - W/2) = 0 → newPos = oldPos * ratio
      setPosition(pos => ({ x: pos.x * ratio, y: pos.y * ratio }));
      return newZoom;
    });
  };
  const zoomIn    = () => zoomTowards(1.4);
  const zoomOut   = () => zoomTowards(1 / 1.4);
  const resetView = () => { setZoom(1); setPosition({ x: 0, y: 0 }); };

  const totalOrders = districtData.reduce((s, d) => s + d.orders, 0);

  return (
    <div className="relative w-full h-full flex flex-col">

      {/* ── Zoom Controls ── */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
        {[{ label: '+', fn: zoomIn, title: 'Zoom in' },
          { label: '−', fn: zoomOut, title: 'Zoom out' },
          { label: '⊙', fn: resetView, title: 'Reset view' }].map(btn => (
          <button
            key={btn.label}
            onClick={btn.fn}
            title={btn.title}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold
                       bg-slate-800/90 border border-slate-600/60 text-slate-300
                       hover:bg-indigo-600 hover:border-indigo-500 hover:text-white
                       transition-all duration-150 shadow-lg backdrop-blur"
          >
            {btn.label}
          </button>
        ))}
        {zoom !== 1 && (
          <div className="text-center text-[9px] text-slate-500 font-mono mt-0.5">
            {Math.round(zoom * 100)}%
          </div>
        )}
      </div>

      {/* ── Map Canvas ── */}
      <div
        ref={containerRef}
        className="relative w-full select-none"
        style={{ height: '520px', overflow: 'hidden', cursor: dragging ? 'grabbing' : 'grab' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseDown={handleMouseDown}
      >
        <style dangerouslySetInnerHTML={{ __html: dynamicStyles }} />
        <div
          className="w-full h-full"
          style={{
            transform      : `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
            transformOrigin: 'center',
            transition     : dragging ? 'none' : 'transform 0.12s ease-out',
          }}
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      </div>

      {/* ── Tooltip ── */}
      {tooltip.visible && tooltip.data && (
        <div
          className="pointer-events-none absolute z-50 min-w-[170px] rounded-xl
                     bg-slate-900/95 backdrop-blur-xl border border-slate-600/50
                     shadow-[0_8px_32px_rgba(0,0,0,0.5)] px-3.5 py-3"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-white tracking-wide">{tooltip.data.name}</p>
            {tooltip.data.rank && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                #{tooltip.data.rank}
              </span>
            )}
          </div>
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-slate-400">Orders</span>
              <span className="text-[11px] font-bold text-white font-mono">{tooltip.data.orders.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-slate-400">Revenue</span>
              <span className="text-[11px] font-bold text-indigo-300 font-mono">৳{tooltip.data.revenue.toLocaleString()}</span>
            </div>
            {totalOrders > 0 && tooltip.data.orders > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-400">Share</span>
                <span className="text-[11px] font-bold text-violet-300 font-mono">
                  {((tooltip.data.orders / totalOrders) * 100).toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Colour scale legend ── */}
      <div className="mt-4 flex items-center gap-3 px-1">
        <span className="text-[9px] text-slate-500 uppercase tracking-widest font-medium">No orders</span>
        <div
          className="flex-1 h-1.5 rounded-full"
          style={{
            background:
              'linear-gradient(to right, #1e293b, rgb(37,99,235), rgb(147,51,234), rgb(225,29,72), rgb(245,158,11), rgb(253,224,71))',
          }}
        />
        <span className="text-[9px] text-slate-500 uppercase tracking-widest font-medium">Highest</span>
      </div>
      <div className="flex justify-between mt-0.5 px-1">
        {['Low', 'Medium', 'High', 'Top'].map((l, i) => (
          <span key={l} className="text-[8px] text-slate-600" style={{ marginLeft: i === 0 ? '6%' : 0 }}>{l}</span>
        ))}
      </div>
    </div>
  );
};


// --- MAIN PAGE COMPONENT ---

export default function AnalyticsDashboard() {
  const [orders, setOrders] = useState([]);
  const [sessionsData, setSessionsData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Date filtering state - replacing the simple timeRange with date range
  const [dateRange, setDateRange] = useState(null);
  const [selectedPreset, setSelectedPreset] = useState("last30days");

  // 1. Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersData, sessionsFetch] = await Promise.all([
           getAllOrders(),
           getAllSessions()
        ]);
        setOrders(ordersData);
        setSessionsData(sessionsFetch);
      } catch (error) {
        console.error("Error fetching analytics data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 2. Process Data
  const analytics = useMemo(() => {
    if (!orders.length) return null;

    // --- CRITICAL CHANGE: FILTER OUT FAKE ORDERS ---
    // This ensures only real orders are used for ALL calculations below
    const validOrders = orders.filter(order => order.status !== 'Fake');
    
    // If no valid orders exist after filtering, handle gracefully
    if (validOrders.length === 0 && orders.length > 0) return {
        totalOrders: 0, rangeOrdersCount: 0, rangeRevenue: 0, rangeShippedCount: 0, 
        growth: '0%', 
        growthDirection: 'flat', chartData: [], statusData: [], locationData: [], 
        marketingData: [], insidePct: 0, paidPct: 0, osData: [], modelData: [], 
        androidVersions: [], appContextData: [], hourlyData: [], peakTimeLabel: 'N/A'
    };

    const today = startOfDay(new Date());
    
    // Calculate cutoff date based on selected date range or preset
    let cutoffDate;
    if (dateRange && dateRange.from) {
      cutoffDate = startOfDay(dateRange.from);
    } else if (selectedPreset) {
      const preset = DATE_PRESETS.find(p => p.value === selectedPreset);
      if (preset && preset.value !== "custom") {
        const range = preset.getDateRange();
        cutoffDate = startOfDay(range.from);
      } else {
        // Default to last 30 days if no valid preset
        cutoffDate = subDays(today, 29);
      }
    } else {
      // Default to last 30 days
      cutoffDate = subDays(today, 29);
    }

    // Calculate the number of days for the chart
    let timeRangeInDays;
    if (dateRange && dateRange.from && dateRange.to) {
      timeRangeInDays = Math.ceil((dateRange.to - dateRange.from) / (1000 * 60 * 60 * 24)) + 1;
    } else {
      timeRangeInDays = 30; // Default
    }

    // --- VARIABLES ---
    let totalRevenue = 0; 
    let rangeRevenue = 0; 
    let todayOrders = 0;
    let yesterdayOrders = 0;
    
    // Range Counters
    let rangeOrdersCount = 0;
    let rangeSessionsCount = 0;
    let rangeShippedCount = 0;
    let rangeDeliveredCount = 0;
    
    // Marketing Counters
    let paidCount = 0;
    let organicCount = 0;

    const statusDist = { Processing: 0, Shipped: 0, Delivered: 0, Cancelled: 0, Returned: 0 };
    const locationDist = { InsideDhaka: 0, OutsideDhaka: 0, Other: 0 };
    
    // --- TECH ANALYTICS STORAGE ---
    const uaDataList = [];
    
    // --- PEAK TIME STORAGE ---
    const hourlyCounts = new Array(24).fill(0);

    // --- CHART DATA SKELETON ---
    const endDateForChart = (dateRange && dateRange.to) 
       ? startOfDay(dateRange.to) 
       : startOfDay(new Date());

    const chartDataArr = Array.from({ length: timeRangeInDays }, (_, i) => {
      const d = subDays(endDateForChart, timeRangeInDays - 1 - i);
      return { 
        date: format(d, 'MMM dd'), 
        fullDate: d, 
        orders: 0, 
        shipped: 0, 
        delivered: 0,
        returned: 0,
        cancelled: 0 
      };
    });

    // Helper to evaluate if any date is within the selected bounds
    let actualEndDate = new Date(today);
    if (dateRange && dateRange.to) {
        actualEndDate = new Date(dateRange.to);
    }
    actualEndDate.setHours(23, 59, 59, 999);

    const isDateInRange = (d) => {
        if (!d) return false;
        return d >= cutoffDate && d <= actualEndDate;
    };

    // --- MAIN LOOP (Using validOrders) ---
    validOrders.forEach(order => {
      // 1. Parsing Dates
      const createdDate = new Date(order.createdAt);
      
      const isCreatedInRange = isDateInRange(createdDate);

      // 2. Revenue Calculation
      const orderValue = parseFloat(order.totalValue) || 0;
      totalRevenue += orderValue; 

      // 3. Growth Metrics 
      if (isSameDay(createdDate, today)) todayOrders++;
      if (isSameDay(createdDate, subDays(today, 1))) yesterdayOrders++;

      // 4. CHART POPULATION & RANGE COUNTS
      
      // A. Order Creation Logic
      if (isCreatedInRange) {
         rangeOrdersCount++;
         rangeRevenue += orderValue;

         const dayStat = chartDataArr.find(d => isSameDay(d.fullDate, createdDate));
         if (dayStat) dayStat.orders += 1;

         // Location
         const shippingCost = parseFloat(order.shippingCost) || 0;
         if (shippingCost === 60) locationDist.InsideDhaka++;
         else if (shippingCost === 99) locationDist.OutsideDhaka++;
         else locationDist.Other++;

         // Status
         const status = order.status || 'Processing';
         if (statusDist[status] !== undefined) statusDist[status]++;
         else statusDist['Processing']++;

         // --- PAID VS ORGANIC LOGIC ---
         const marketing = order.marketing;
         const isPaid = !marketing || marketing.utm_medium === 'paid';

         if (isPaid) {
            paidCount++;
         } else {
            organicCount++;
         }

         // --- HOURLY BREAKDOWN ---
         const hour = createdDate.getHours();
         hourlyCounts[hour]++;
      }

      // B. Shipped Logic
      if (['In Review', 'Shipped', 'Delivered', 'Returned'].includes(order.status)) {
        const shippedDate = order.shippedAt ? new Date(order.shippedAt) : createdDate;
        if (isDateInRange(shippedDate)) {
            rangeShippedCount++;
        }
        const dayStat = chartDataArr.find(d => isSameDay(d.fullDate, shippedDate));
        if (dayStat) dayStat.shipped += 1;
      }

      // C. Delivered Logic
      if (order.status === 'Delivered') {
        const deliveredDate = order.deliveredAt ? new Date(order.deliveredAt) : createdDate;
        if (isDateInRange(deliveredDate)) {
            rangeDeliveredCount++;
        }
        const dayStat = chartDataArr.find(d => isSameDay(d.fullDate, deliveredDate));
        if (dayStat) dayStat.delivered += 1;
      }

      // D. Returned Logic
      if (order.status === 'Returned') {
        const returnedDate = order.returnedAt ? new Date(order.returnedAt) : createdDate;
        const dayStat = chartDataArr.find(d => isSameDay(d.fullDate, returnedDate));
        if (dayStat) dayStat.returned += 1;
      }

      // 5. UA Parsing 
      const uaString = order.clientInfo?.userAgent || order.userAgent || '';
      if (uaString) {
        const parser = new UAParser(uaString);
        const res = parser.getResult();
        
        const rawModel = res.device.model;
        const marketingName = DEVICE_CODEX[rawModel] || rawModel || 'Generic';
        
        let appType = 'Browser';
        if (uaString.includes('FB_IAB') || uaString.includes('FB4A')) appType = 'Facebook App';
        else if (uaString.includes('Instagram')) appType = 'Instagram App';
        else if (uaString.includes('wv') || (res.os.name === 'Android' && uaString.includes('Version/'))) appType = 'WebView';

        uaDataList.push({
          os: res.os.name || 'Desktop',
          osVersion: res.os.version, 
          vendor: res.device.vendor || 'Unknown',
          model: marketingName,
          browser: res.browser.name,
          appType: appType
        });
      }
    });

    // --- AGGREGATE TECH DATA ---
    const osData = aggregateCounts(uaDataList, (item) => item.os, 4).map(i => ({
      ...i, 
      color: i.name === 'Android' ? '#10B981' : i.name === 'iOS' ? '#94A3B8' : i.name === 'Windows' ? '#3B82F6' : '#6366F1'
    }));

    const modelData = aggregateCounts(uaDataList.filter(i => i.model !== 'Generic'), (item) => item.model, 6);
    
    const androidVersions = aggregateCounts(uaDataList.filter(i => i.os === 'Android'), (item) => {
        return `Android ${item.osVersion ? item.osVersion.split('.')[0] : 'Old'}`;
    }, 5);

    const appContextData = aggregateCounts(uaDataList, (item) => item.appType, 4).map(i => ({
      ...i,
      color: i.name.includes('Facebook') ? '#1877F2' : i.name.includes('Instagram') ? '#E1306C' : i.name === 'Browser' ? '#F59E0B' : '#6B7280'
    }));

    // --- FINAL CALCULATIONS ---
    const growth = yesterdayOrders === 0 ? 100 : ((todayOrders - yesterdayOrders) / yesterdayOrders) * 100;
    const totalLocations = locationDist.InsideDhaka + locationDist.OutsideDhaka + locationDist.Other;
    const insidePct = totalLocations > 0 ? ((locationDist.InsideDhaka / totalLocations) * 100).toFixed(0) : 0;
    
    // --- DISTRICT AGGREGATION ---
    const districtMap = {};
    validOrders.forEach(order => {
      if (!isDateInRange(new Date(order.createdAt))) return;
      const rawName = order.district;
      if (!rawName) return;
      const svgId = districtNameToSvgId(rawName);
      if (!svgId) return;
      if (!districtMap[svgId]) {
         const cleanName = svgId.replace(/([A-Z])/g, ' $1').trim();
         districtMap[svgId] = { orders: 0, revenue: 0, displayName: cleanName };
      }
      districtMap[svgId].orders++;
      districtMap[svgId].revenue += parseFloat(order.totalValue) || 0;
    });
    const districtDataArr = Object.entries(districtMap)
      .map(([svgId, val]) => ({ svgId, ...val }))
      .sort((a, b) => b.orders - a.orders);

    const totalMarketing = paidCount + organicCount;
    const paidPct = totalMarketing > 0 ? ((paidCount / totalMarketing) * 100).toFixed(0) : 0;

    // --- HOURLY DATA ---
    const hourlyData = hourlyCounts.map((count, hour) => {
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const h = hour % 12 || 12;
        return { name: `${h} ${ampm}`, value: count };
    });
    
    // Find Peak Time
    let maxOrders = 0;
    let peakHourIndex = 0;
    hourlyCounts.forEach((count, idx) => {
        if (count > maxOrders) {
            maxOrders = count;
            peakHourIndex = idx;
        }
    });
    const peakAmpm = peakHourIndex >= 12 ? 'PM' : 'AM';
    const peakH = peakHourIndex % 12 || 12;
    const peakTimeLabel = maxOrders > 0 ? `${peakH} ${peakAmpm}` : "N/A";

    // --- SESSIONS & CONVERSION LOGIC ---
    sessionsData.forEach(session => {
        const sessionDate = new Date(session.date);
        if (isDateInRange(sessionDate)) {
           rangeSessionsCount++;
        }
    });

    const conversionRate = rangeSessionsCount > 0 
      ? ((rangeOrdersCount / rangeSessionsCount) * 100).toFixed(1) 
      : '0.0';

    return {
      totalOrders: validOrders.length,
      rangeOrdersCount,
      rangeSessionsCount,
      conversionRate,
      rangeRevenue, 
      rangeShippedCount,
      rangeDeliveredCount,
      totalRevenue,
      todayOrders,
      growth: growth.toFixed(1) + '%',
      growthDirection: growth >= 0 ? 'up' : 'down',
      chartData: chartDataArr,
      statusData: Object.entries(statusDist).map(([name, value]) => {
          const colors = { Processing: '#3B82F6', Shipped: '#A855F7', Delivered: '#10B981', Cancelled: '#EF4444', Returned: '#F97316' };
          return { name, value, color: colors[name] || '#9CA3AF' };
      }).filter(i => i.value > 0),
      locationData: [
        { name: 'Inside Dhaka', value: locationDist.InsideDhaka, color: '#14B8A6' }, 
        { name: 'Outside Dhaka', value: locationDist.OutsideDhaka, color: '#F59E0B' }, 
      ],
      marketingData: [
        { name: 'Paid Ads', value: paidCount, color: '#F43F5E' }, 
        { name: 'Organic', value: organicCount, color: '#10B981' }
      ],
      insidePct,
      paidPct,
      osData,
      modelData,
      androidVersions,
      appContextData,
      hourlyData,
      peakTimeLabel,
      districtData: districtDataArr,
    };
  }, [orders, dateRange, selectedPreset]);

  if (loading) return <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center text-white"><Activity className="animate-pulse mr-2" /> Loading Analytics...</div>;

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 p-4 md:p-8 font-sans w-full">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Analytics Dashboard</h1>
          <p className="text-gray-400 mt-2 text-sm">
            {dateRange ? (
              <>
                Overview for <span className="text-blue-400 font-bold bg-blue-400/10 px-2 py-0.5 rounded-md">
                  {dateRange.from && dateRange.to ? (
                    dateRange.from.getTime() === dateRange.to.getTime() ? (
                      format(dateRange.from, "MMM dd, yyyy")
                    ) : (
                      `${format(dateRange.from, "MMM dd")} - ${format(dateRange.to, "MMM dd, yyyy")}`
                    )
                  ) : "Custom range"
                  }
                </span>
              </>
            ) : selectedPreset ? (
              <>
                Overview for <span className="text-blue-400 font-bold bg-blue-400/10 px-2 py-0.5 rounded-md">
                  {DATE_PRESETS.find(p => p.value === selectedPreset)?.label || "Selected period"}
                </span>
              </>
            ) : (
              <>
                Overview for the last <span className="text-blue-400 font-bold bg-blue-400/10 px-2 py-0.5 rounded-md">30 days</span>
              </>
            )}
          </p>
        </div>
        
        {/* Date Range Picker - replacing the simple dropdown */}
        <div className="w-full md:w-auto">
          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            selectedPreset={selectedPreset}
            onPresetChange={setSelectedPreset}
          />
        </div>
      </header>

      {/* Shopify-style Stats Bar */}
      <ShopifyStatsBar 
        sessionsCount={analytics?.rangeSessionsCount}
        revenue={analytics?.rangeRevenue}
        ordersCount={analytics?.rangeOrdersCount}
        conversionRate={analytics?.conversionRate}
        chartData={analytics?.chartData}
      />

      {/* KPI CARDS (Updated Icons & UI) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5 mb-8">
        <StatCard 
          title="Total Revenue" 
          value={`৳${analytics?.rangeRevenue?.toLocaleString() || 0}`} 
          icon={Wallet}
          theme="green"
          isHero={true}
        />
        <StatCard 
          title="Orders" 
          value={analytics?.rangeOrdersCount} 
          icon={ShoppingBag}
          theme="blue"
        />
        <StatCard 
          title="Shipped" 
          value={analytics?.rangeShippedCount} 
          icon={Send}
          theme="purple"
        />
        <StatCard 
          title="Delivered" 
          value={analytics?.rangeDeliveredCount} 
          icon={CheckCircle}
          theme="green"
        />
        <StatCard 
          title="Today's Volume" 
          value={analytics?.todayOrders} 
          icon={Activity}
          theme="orange"
          trend={analytics?.growthDirection} 
          trendValue={analytics?.growth}
        />
      </div>

      {/* MAIN CHART */}
      <div className="mb-8">
        <Card className="min-h-[420px]">
          <div className="flex justify-between items-center mb-8">
             <div>
                <h3 className="text-lg font-bold text-white">Performance Trend</h3>
                <p className="text-xs text-gray-500 mt-1">Order lifecycle metrics over time</p>
             </div>
             <div className="flex gap-2">
               {['Orders', 'Shipped', 'Delivered', 'Returned'].map(status => (
                 <div key={status} className="flex items-center gap-2 px-3 py-1 bg-gray-900/50 rounded-lg border border-gray-700/50">
                    <div className={`w-2 h-2 rounded-full ${status === 'Orders' ? 'bg-blue-500' : status === 'Shipped' ? 'bg-purple-500' : status === 'Delivered' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                    <span className="text-xs font-medium text-gray-300">{status}</span>
                 </div>
               ))}
             </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics?.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorShipped" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#A855F7" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#A855F7" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorDelivered" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorReturned" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#F43F5E" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
                <XAxis dataKey="date" stroke="#6B7280" tick={{fontSize: 11, fontWeight: 500}} tickLine={false} axisLine={false} dy={15} />
                <YAxis stroke="#6B7280" tick={{fontSize: 11, fontWeight: 500}} tickLine={false} axisLine={false} dx={-10} />
                <Tooltip content={<CustomTooltip />} />
                
                <Area type="monotone" dataKey="orders" stroke="#3B82F6" strokeWidth={3} fill="url(#colorOrders)" activeDot={{r: 6, strokeWidth: 0}} />
                <Area type="monotone" dataKey="shipped" stroke="#A855F7" strokeWidth={3} fill="url(#colorShipped)" activeDot={{r: 6, strokeWidth: 0}} />
                <Area type="monotone" dataKey="delivered" stroke="#10B981" strokeWidth={3} fill="url(#colorDelivered)" activeDot={{r: 6, strokeWidth: 0}} />
                <Area type="monotone" dataKey="returned" stroke="#F43F5E" strokeWidth={3} fill="url(#colorReturned)" activeDot={{r: 6, strokeWidth: 0}} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>



      {/* PEAK TIME ANALYSIS */}
      <div className="mb-8">
        <Card className="min-h-[400px]">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-bold text-white">Peak Ordering Times</h3>
                    <p className="text-xs text-gray-500 mt-1">
                        Most active hours of the day. Peak time: <span className="text-blue-400 font-bold">{analytics?.peakTimeLabel}</span>
                    </p>
                </div>
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 border border-blue-500/20">
                    <Clock size={20} />
                </div>
            </div>
            <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={analytics?.hourlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorHourly" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.2}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
                        <XAxis 
                            dataKey="name" 
                            stroke="#6B7280" 
                            tick={{fontSize: 10, fontWeight: 500}} 
                            tickLine={false} 
                            axisLine={false} 
                            dy={10} 
                            interval={1} 
                        />
                        <YAxis stroke="#6B7280" tick={{fontSize: 11, fontWeight: 500}} tickLine={false} axisLine={false} dx={-10} />
                        <Tooltip 
                            content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                return (
                                    <div className="bg-gray-900/95 backdrop-blur-xl border border-gray-700 p-3 rounded-xl shadow-2xl z-50">
                                        <p className="text-gray-400 text-xs mb-1 font-mono uppercase">{label}</p>
                                        <p className="text-lg font-bold text-white">{payload[0].value} Orders</p>
                                    </div>
                                );
                                }
                                return null;
                            }} 
                            cursor={{fill: '#374151', opacity: 0.2}}
                        />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={24} fill="url(#colorHourly)" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
      </div>

      {/* GEOGRAPHY MAP — full width */}
      <div className="mb-8">
        <Card>
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-bold text-white">Order Geography</h3>
              <p className="text-xs text-slate-500 mt-1">District-level order density · hover to inspect · scroll or drag to explore</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Quick summary pills */}
              <div className="hidden md:flex items-center gap-2">
                {(analytics?.districtData || []).slice(0, 3).map((d, i) => (
                  <div
                    key={d.svgId}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-medium"
                    style={{
                      background: `${['#1e3a5f','#2d1f5e','#3d1a5e'][i]}60`,
                      borderColor: `${['#3b82f6','#6366f1','#a855f7'][i]}40`,
                      color: ['#93c5fd','#a5b4fc','#c084fc'][i],
                    }}
                  >
                    <span className="font-bold">#{i+1}</span>
                    <span>{d.displayName}</span>
                    <span className="opacity-60">·</span>
                    <span>{d.orders}</span>
                  </div>
                ))}
              </div>
              <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 border border-indigo-500/20">
                <MapPin size={20} />
              </div>
            </div>
          </div>

          {/* Main grid: map (wider) + sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">

            {/* ── Map ── */}
            <div className="relative">
              <BangladeshMapChart districtData={analytics?.districtData || []} />
            </div>

            {/* ── Sidebar ── */}
            <div className="flex flex-col gap-0">

              {/* Inside / Outside Dhaka summary badges */}
              <div className="flex gap-3 mb-5">
                {analytics?.locationData.map((item, i) => (
                  <div
                    key={item.name}
                    className="flex-1 rounded-xl p-3 border"
                    style={{
                      background: `${item.color}12`,
                      borderColor: `${item.color}30`,
                    }}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-[9px] text-slate-400 uppercase tracking-widest font-medium">{item.name}</span>
                    </div>
                    <p className="text-xl font-bold text-white">{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Top districts leaderboard */}
              <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold mb-3">Top Districts by Orders</p>
              <div className="space-y-2.5 overflow-y-auto flex-1 pr-1" style={{ maxHeight: '400px' }}>
                {(analytics?.districtData || []).map((item, idx) => {
                  const maxOrders   = analytics?.districtData?.[0]?.orders || 1;
                  const pct         = ((item.orders / maxOrders) * 100);
                  const barColour   = heatColour(idx === 0 ? 1 : pct / 100);
                  return (
                    <div key={item.svgId}>
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-2">
                          <span
                            className="text-[9px] font-bold w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                            style={{ background: `${barColour}22`, color: barColour, border: `1px solid ${barColour}44` }}
                          >
                            {idx + 1}
                          </span>
                          <span className="text-xs font-medium text-slate-200 truncate max-w-[110px]" title={item.displayName}>
                            {item.displayName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-[10px] text-slate-400 font-mono">৳{(item.revenue/1000).toFixed(0)}k</span>
                          <span className="text-[11px] font-bold text-white font-mono">{item.orders}</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-700/30 rounded-full h-1">
                        <div
                          className="h-1 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, background: barColour, boxShadow: `0 0 6px ${barColour}66` }}
                        />
                      </div>
                    </div>
                  );
                })}
                {(analytics?.districtData || []).length === 0 && (
                  <p className="text-xs text-slate-500 text-center mt-8">No district data for selected period</p>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* SECONDARY STATS - 3 COLUMNS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">

        {/* 2. ACQUISITION SOURCE */}
        <Card className="min-h-[300px]">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-white">Traffic Source</h3>
                <div className="p-2 bg-gray-700/30 rounded-lg"><Megaphone size={16} className="text-gray-400" /></div>
            </div>
            <div className="flex flex-col items-center justify-center h-full gap-6">
                <div className="w-48 h-48 relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={analytics?.marketingData} innerRadius={60} outerRadius={80} paddingAngle={6} dataKey="value" stroke="none">
                                {analytics?.marketingData.map((e, i) => <Cell key={i} fill={e.color} />)}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                        <span className="text-3xl font-bold text-white tracking-tighter">{analytics?.paidPct}%</span>
                        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mt-1">Paid Ads</span>
                    </div>
                </div>
                <div className="flex gap-6">
                    {analytics?.marketingData.map((item) => (
                        <div key={item.name} className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: item.color}}></div>
                            <div className="flex flex-col">
                                <span className="text-xs text-gray-400 font-medium">{item.name}</span>
                                <span className="text-lg font-bold text-white">{item.value}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Card>

        {/* 3. STATUS */}
        <Card className="min-h-[300px]">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-white">Order Status</h3>
                <div className="p-2 bg-gray-700/30 rounded-lg"><Package size={16} className="text-gray-400" /></div>
            </div>
            <div className="w-full h-60">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics?.statusData} layout="vertical" margin={{ left: 0, right: 20 }}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={80} tick={{fill: '#9CA3AF', fontSize: 11, fontWeight: 500}} tickLine={false} axisLine={false} />
                        <Tooltip content={<CustomTooltip />} cursor={{fill: '#374151', opacity: 0.2}} />
                        <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={24}>
                            {analytics?.statusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>

      </div>

      {/* --- TECH INTELLIGENCE SECTION --- */}
      <div className="mb-6 flex items-center gap-4">
        <div className="p-3 bg-linear-to-br from-indigo-500/20 to-purple-500/10 rounded-xl text-indigo-400 border border-indigo-500/20 shadow-lg shadow-indigo-500/10">
            <Cpu size={24} />
        </div>
        <div>
            <h2 className="text-2xl font-bold text-white">Tech Intelligence</h2>
            <p className="text-sm text-gray-400">Device, OS, and Browser analytics derived from User Agents.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
         {/* OS Market Share */}
         <Card className="col-span-1 lg:col-span-1 border-t-4 border-t-indigo-500">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">OS Share</h3>
                <Smartphone size={16} className="text-gray-500" />
            </div>
            <div className="w-full h-[180px] relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={analytics?.osData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="value" stroke="none">
                            {analytics?.osData.map((e, i) => <Cell key={i} fill={e.color} />)}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                     <span className="text-xl font-bold text-white">{analytics?.osData[0]?.percentage || 0}%</span>
                     <span className="text-[10px] text-gray-500 uppercase font-bold">{analytics?.osData[0]?.name || 'N/A'}</span>
                </div>
            </div>
         </Card>

         {/* Top Device Models */}
         <Card className="col-span-1 lg:col-span-1 border-t-4 border-t-rose-500">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Top Devices</h3>
                <ShieldCheck size={16} className="text-gray-500" />
            </div>
            <div className="space-y-3 overflow-y-auto max-h-[220px] pr-2 custom-scrollbar">
                {analytics?.modelData.map((item, idx) => (
                    <div key={idx} className="group">
                        <div className="flex justify-between items-center mb-1.5">
                            <span className="text-xs font-medium text-white truncate max-w-[140px]" title={item.name}>
                                {idx+1}. {item.name}
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono">{item.percentage}%</span>
                        </div>
                        <div className="w-full bg-gray-700/30 rounded-full h-1.5">
                            <div 
                                className="h-1.5 rounded-full bg-rose-500 group-hover:bg-rose-400 transition-colors shadow-[0_0_10px_rgba(244,63,94,0.3)]"
                                style={{ width: `${item.percentage}%` }}
                            ></div>
                        </div>
                    </div>
                ))}
            </div>
         </Card>

         {/* Android Fragmentation */}
         <Card className="col-span-1 lg:col-span-1 border-t-4 border-t-emerald-500">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Android Versions</h3>
                <div className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">Health</div>
            </div>
            <div className="w-full h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics?.androidVersions} layout="vertical" margin={{ left: 0, right: 20, top: 10 }}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={70} tick={{fill: '#9CA3AF', fontSize: 10, fontWeight: 500}} tickLine={false} axisLine={false} />
                        <Tooltip content={<CustomTooltip />} cursor={{fill: '#374151', opacity: 0.3}} />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={14} fill="#10B981">
                            {analytics?.androidVersions.map((entry, index) => (
                                <Cell key={`cell-${index}`} fillOpacity={1 - (index * 0.15)} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
         </Card>

         {/* App Context */}
         <Card className="col-span-1 lg:col-span-1 border-t-4 border-t-blue-500">
             <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Platform</h3>
                <Share2 size={16} className="text-gray-500" />
            </div>
             <div className="space-y-3">
                 {analytics?.appContextData.map((item) => (
                     <div key={item.name} className="flex items-center justify-between p-3 rounded-xl bg-gray-900/30 border border-gray-700/30 hover:bg-gray-800/50 transition-colors">
                         <div className="flex items-center gap-3">
                             <div className={`p-2 rounded-lg ${item.name.includes('Facebook') ? 'bg-blue-600/20 text-blue-400' : item.name.includes('Instagram') ? 'bg-pink-600/20 text-pink-400' : 'bg-orange-500/20 text-orange-400'}`}>
                                 {item.name.includes('Browser') ? <Globe size={14} /> : <Share2 size={14} />}
                             </div>
                             <div>
                                 <p className="text-xs font-bold text-white">{item.name}</p>
                                 <p className="text-[10px] text-gray-500">{item.value} users</p>
                             </div>
                         </div>
                         <span className="text-xs font-bold text-gray-300 bg-gray-700/50 px-2 py-1 rounded-md">{item.percentage}%</span>
                     </div>
                 ))}
             </div>
         </Card>
      </div>

    </div>
  );
}
