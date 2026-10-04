"use client";

import React, { useEffect, useState, useMemo } from "react";
import { getParcelPerformance } from "../../../actions/performance";
import {
  Activity,
  Package,
  Truck,
  CheckCircle,
  RotateCcw,
  XCircle,
  Clock,
  Loader2,
  Calendar,
  X
} from "lucide-react";
import { format, parseISO, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear, startOfDay, endOfDay } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

// --- CUSTOM BAR SHAPE FOR TOP-ONLY RADIUS ---
const CustomBarShape = (props) => {
  const { x, y, width, height, fill, payload, dataKey } = props;
  
  if (height === 0 || !payload) return null;

  // Determine if this bar is the highest non-zero segment in the stack
  let isTop = false;
  
  if (dataKey === 'canceled' && payload.canceled > 0) {
    isTop = true;
  } else if (dataKey === 'returned' && payload.returned > 0 && (!payload.canceled || payload.canceled === 0)) {
    isTop = true;
  } else if (dataKey === 'pending' && payload.pending > 0 && (!payload.returned || payload.returned === 0) && (!payload.canceled || payload.canceled === 0)) {
    isTop = true;
  } else if (dataKey === 'shipped' && payload.shipped > 0 && (!payload.pending || payload.pending === 0) && (!payload.returned || payload.returned === 0) && (!payload.canceled || payload.canceled === 0)) {
    isTop = true;
  } else if (dataKey === 'delivered' && payload.delivered > 0 && (!payload.shipped || payload.shipped === 0) && (!payload.pending || payload.pending === 0) && (!payload.returned || payload.returned === 0) && (!payload.canceled || payload.canceled === 0)) {
    isTop = true;
  }

  const radius = isTop ? 6 : 0;

  if (radius === 0) {
    return <rect x={x} y={y} width={width} height={height} fill={fill} />;
  }

  const r = Math.min(radius, height);

  const path = `
    M${x},${y + height}
    L${x},${y + r}
    Q${x},${y} ${x + r},${y}
    L${x + width - r},${y}
    Q${x + width},${y} ${x + width},${y + r}
    L${x + width},${y + height}
    Z
  `;

  return <path d={path} fill={fill} />;
};

// --- CUSTOM TOOLTIP ---
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900/95 backdrop-blur-xl border border-gray-700 p-4 rounded-xl shadow-2xl z-50 min-w-[200px]">
        <p className="text-gray-400 text-xs mb-3 font-semibold uppercase tracking-wider border-b border-gray-700/50 pb-2">
          {label}
        </p>
        <div className="space-y-2">
          {/* Reverse payload so top of stack (Canceled) is at the top of the tooltip */}
          {[...payload].reverse().map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full shadow-sm" 
                  style={{backgroundColor: entry.color || entry.fill}} 
                />
                <span className="text-sm font-medium text-gray-300">{entry.name}</span>
              </div>
              <span className="text-sm font-bold text-white">
                {entry.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
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

export default function ParcelPerformancePage() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Default to Last 30 Days
  const [dateRange, setDateRange] = useState(() => {
    return { from: subDays(new Date(), 29), to: new Date() };
  });
  const [selectedPreset, setSelectedPreset] = useState("last30days");

  // Client-side date filter
  const filteredData = useMemo(() => {
    if (!dateRange || !dateRange.from) return data;
    
    const start = startOfDay(dateRange.from);
    const end = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);
    
    return data.filter(row => {
      if (!row.orderDate) return false;
      const rowDate = parseISO(row.orderDate);
      return rowDate >= start && rowDate <= end;
    });
  }, [data, dateRange]);

  useEffect(() => {
    async function loadData() {
      try {
        const result = await getParcelPerformance();
        setData(result);
      } catch (error) {
        console.error("Failed to load parcel performance data", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Calculate totals
  const totals = filteredData.reduce(
    (acc, row) => ({
      totalOrders: acc.totalOrders + row.totalOrders,
      shipped: acc.shipped + row.shipped,
      delivered: acc.delivered + row.delivered,
      returned: acc.returned + row.returned,
      canceled: acc.canceled + row.canceled,
      pending: acc.pending + row.pending,
    }),
    {
      totalOrders: 0,
      shipped: 0,
      delivered: 0,
      returned: 0,
      canceled: 0,
      pending: 0,
    }
  );

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <Activity className="h-8 w-8 text-blue-500" />
            Parcel Performance
          </h1>
          <p className="text-gray-400 mt-2">
            Analyze the lifecycle and success rates of orders based on the original date they were placed.
          </p>
        </div>
        <DateRangePicker 
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          selectedPreset={selectedPreset}
          onPresetChange={setSelectedPreset}
        />
      </div>

      {/* SUMMARY CARDS */}
      {!isLoading && filteredData.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <StatCard
            title="Total Orders"
            value={totals.totalOrders}
            icon={<Package size={20} />}
            color="bg-indigo-500/10 text-indigo-500 border-indigo-500/20"
          />
          <StatCard
            title="Total Shipped"
            value={totals.shipped}
            icon={<Truck size={20} />}
            color="bg-purple-500/10 text-purple-500 border-purple-500/20"
          />
          <StatCard
            title="Total Delivered"
            value={totals.delivered}
            icon={<CheckCircle size={20} />}
            color="bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
          />
          <StatCard
            title="Total Returned"
            value={totals.returned}
            icon={<RotateCcw size={20} />}
            color="bg-blue-500/10 text-blue-500 border-blue-500/20"
          />
          <StatCard
            title="Total Canceled"
            value={totals.canceled}
            icon={<XCircle size={20} />}
            color="bg-red-500/10 text-red-500 border-red-500/20"
          />
          <StatCard
            title="Total Pending"
            value={totals.pending}
            icon={<Clock size={20} />}
            color="bg-amber-500/10 text-amber-500 border-amber-500/20"
          />
        </div>
      )}

      {/* CHART SECTION */}
      {!isLoading && filteredData.length > 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-xl p-6 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%" minHeight={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: "Delivered", value: totals.delivered, color: "#10b981" },
                    { name: "Shipped", value: totals.shipped, color: "#a855f7" },
                    { name: "Returned", value: totals.returned, color: "#3b82f6" },
                    { name: "Canceled", value: totals.canceled, color: "#ef4444" },
                    { name: "Pending", value: totals.pending, color: "#f59e0b" },
                  ].filter((d) => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {[
                    { name: "Delivered", value: totals.delivered, color: "#10b981" },
                    { name: "Shipped", value: totals.shipped, color: "#a855f7" },
                    { name: "Returned", value: totals.returned, color: "#3b82f6" },
                    { name: "Canceled", value: totals.canceled, color: "#ef4444" },
                    { name: "Pending", value: totals.pending, color: "#f59e0b" },
                  ].filter((d) => d.value > 0).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '0.5rem', color: '#f3f4f6' }}
                  itemStyle={{ color: '#f3f4f6' }}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 w-full space-y-4">
            <h3 className="text-xl font-bold text-white mb-2">Overall Outcome Distribution</h3>
            <p className="text-gray-400">
              This chart shows the absolute final outcome of all your orders. Because we enforced strict priority routing, these metrics add up exactly to your <strong>Total Orders</strong> ({totals.totalOrders}).
            </p>
            <div className="space-y-3 mt-4">
              <div className="flex justify-between items-center bg-gray-750 p-3 rounded-lg border border-gray-700">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <span className="text-gray-300">Delivered</span>
                </div>
                <span className="font-semibold text-white">{totals.totalOrders > 0 ? ((totals.delivered / totals.totalOrders) * 100).toFixed(1) : 0}%</span>
              </div>
              <div className="flex justify-between items-center bg-gray-750 p-3 rounded-lg border border-gray-700">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  <span className="text-gray-300">Shipped (In Transit)</span>
                </div>
                <span className="font-semibold text-white">{totals.totalOrders > 0 ? ((totals.shipped / totals.totalOrders) * 100).toFixed(1) : 0}%</span>
              </div>
              <div className="flex justify-between items-center bg-gray-750 p-3 rounded-lg border border-gray-700">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-gray-300">Returned</span>
                </div>
                <span className="font-semibold text-white">{totals.totalOrders > 0 ? ((totals.returned / totals.totalOrders) * 100).toFixed(1) : 0}%</span>
              </div>
              <div className="flex justify-between items-center bg-gray-750 p-3 rounded-lg border border-gray-700">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-gray-300">Canceled</span>
                </div>
                <span className="font-semibold text-white">{totals.totalOrders > 0 ? ((totals.canceled / totals.totalOrders) * 100).toFixed(1) : 0}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STACKED BAR CHART SECTION */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-xl p-6">
        <h3 className="text-xl font-bold text-white mb-6">Daily Performance</h3>
        {isLoading ? (
          <div className="flex justify-center items-center h-[400px]">
             <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : filteredData.length === 0 ? (
          <div className="flex justify-center items-center h-[400px] text-gray-400">
             No order data found for the selected date range.
          </div>
        ) : (
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%" minHeight={400}>
              <BarChart
                data={[...filteredData].reverse().map(row => ({
                  ...row,
                  formattedDate: row.orderDate ? format(parseISO(row.orderDate), "d MMM") : 'Unknown'
                }))}
                margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis 
                  dataKey="formattedDate" 
                  stroke="#9ca3af" 
                  tick={{fill: '#9ca3af', fontSize: 12}} 
                  axisLine={{stroke: '#4b5563'}}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#9ca3af" 
                  tick={{fill: '#9ca3af', fontSize: 12}} 
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{fill: '#374151', opacity: 0.4}}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                <Bar dataKey="delivered" name="Delivered" stackId="a" fill="#10b981" shape={(props) => <CustomBarShape {...props} dataKey="delivered" />} />
                <Bar dataKey="shipped" name="Shipped (In Transit)" stackId="a" fill="#a855f7" shape={(props) => <CustomBarShape {...props} dataKey="shipped" />} />
                <Bar dataKey="pending" name="Pending (Processing)" stackId="a" fill="#f59e0b" shape={(props) => <CustomBarShape {...props} dataKey="pending" />} />
                <Bar dataKey="returned" name="Returned" stackId="a" fill="#3b82f6" shape={(props) => <CustomBarShape {...props} dataKey="returned" />} />
                <Bar dataKey="canceled" name="Canceled" stackId="a" fill="#ef4444" shape={(props) => <CustomBarShape {...props} dataKey="canceled" />} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  return (
    <div className={`p-4 rounded-xl border flex flex-col gap-3 ${color}`}>
      <div className="flex items-center gap-2 text-sm font-medium opacity-80">
        {icon}
        {title}
      </div>
      <div className="text-2xl font-bold">
        {value.toLocaleString()}
      </div>
    </div>
  );
}
