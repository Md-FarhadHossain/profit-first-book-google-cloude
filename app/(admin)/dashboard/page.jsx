"use client";
import React, { useState, useMemo, useEffect, useRef } from "react";
 

import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Package,
  Truck,
  CheckCircle,
  CircleDot,
  MapPin,
  Clock,
  XCircle,
  RotateCcw,
  Eye,
  X,
  User,
  Phone,
  Calendar,
  DollarSign,
  PhoneCall,
  PhoneOff,
  Check,
  Smartphone,
  Globe,
  Share2,
  Zap,
  Info,
  Shield,
  ShieldCheck,
  AlertTriangle,
  ArrowLeftCircle,
  StickyNote,
  Save,
  Edit,
  Ghost,
  ClipboardCheck,
  Send,
  Loader2,
  RefreshCw
} from "lucide-react";

import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { sendToSteadfast, sendBulkToSteadfast } from "../../actions/courier";
import hubsData from "../../../steadfast_hubs.json";

// --- CONFIGURATION ---
const ACTION_OPTIONS = [
  { label: "Processing", value: "Processing" },
  { label: "In Review", value: "In Review" },
  { label: "Shipped", value: "Shipped" },
  { label: "Delivered", value: "Delivered" },
  { label: "Cancel", value: "Cancelled" },
  { label: "Return", value: "Returned" },
  { label: "👻 Fake Customer", value: "Fake" },
  { label: "⚠️ Send to Abandoned", value: "Abandoned" },
];
const CALL_OPTIONS = [
  { label: "Pending", value: "Pending" },
  { label: "Confirmed", value: "Confirmed" },
  { label: "No Answer", value: "No Answer" },
];
const SHIPPING_METHOD_OPTIONS = [
  { label: "Inside Dhaka", value: "Inside Dhaka", cost: 60 },
  { label: "Outside Dhaka", value: "Outside Dhaka", cost: 99 },
];
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
// --- HELPER: MODEL MAPPING ---
const DEVICE_CODEX = {
  "23129RAA4G": "Redmi Note 13 5G",
  "23124RA7EO": "Redmi Note 13 4G",
  "SM-S918B": "Galaxy S23 Ultra",
  "SM-S908B": "Galaxy S22 Ultra",
  "iPhone16,1": "iPhone 15 Pro",
  "iPhone16,2": "iPhone 15 Pro Max",
};
import DeviceDetector from "device-detector-js";

// --- ADVANCED USER AGENT PARSER ---
const getDeepUserAgentInfo = (uaString) => {
  if (!uaString) return null;
  const detector = new DeviceDetector();
  const result = detector.parse(uaString);
  
  const rawModel = result.device?.model || "";
  const vendor = result.device?.brand || "Generic";
  
  // Device Detector JS already handles a lot of marketing names out of the box.
  // We can still use DEVICE_CODEX as a fallback, but we'll prioritize the parsed model.
  const marketingName = DEVICE_CODEX[rawModel] || rawModel || "Unknown Device";

  let appSource = {
    name: "External Browser",
    code: "Browser",
    version: result.client?.version || "Unknown",
    insight: "User is browsing via a standard web browser.",
  };

  if (uaString.includes("FB_IAB") || uaString.includes("FB4A") || result.client?.name?.includes("Facebook")) {
    const fbavMatch = uaString.match(/FBAV\/([\d.]+)/);
    appSource = {
      name: "Facebook App",
      code: "FB_IAB",
      version: fbavMatch ? fbavMatch[1] : (result.client?.version || "Unknown"),
      insight: "User clicked a link inside the Facebook App.",
    };
  } else if (uaString.includes("Instagram") || result.client?.name?.includes("Instagram")) {
    appSource = {
      name: "Instagram App",
      code: "Instagram",
      version: result.client?.version || "Latest",
      insight: "User came from Instagram.",
    };
  }
  
  const isWebView =
    uaString.includes("wv") ||
    result.client?.type === "mobile app" ||
    (result.os?.name === "Android" && uaString.includes("Version/"));
    
  const environment = {
    type: isWebView ? "WebView (In-App)" : "Standalone Browser",
    code: isWebView ? "wv" : "Standard",
    insight: isWebView
      ? "Viewing inside another app."
      : "Using a dedicated browser.",
  };
  
  const osName = result.os?.name || "Unknown OS";
  const osVersion = result.os?.version || "";
  const browserName = result.client?.name || "Unknown Browser";

  const summary = `${vendor} ${marketingName}, ${osName}. Source: ${appSource.name}.`;
  
  return {
    raw: result,
    device: {
      marketingName,
      rawModel,
      vendor,
      os: `${osName} ${osVersion}`.trim(),
    },
    browser: {
      name: browserName,
      engine: result.client?.engine || "Unknown",
      version: result.client?.version || "Unknown",
    },
    appSource,
    environment,
    summary,
  };
};

// --- UPDATED FRAUD CHECKER BADGE (Full Width for Action Column) ---



// --- HELPER COMPONENTS ---
const StatusBadge = ({ status }) => {
  const statusConfig = {
    Processing: { icon: <CircleDot size={14} />, color: "bg-blue-600" },
    "In Review": { icon: <Eye size={14} />, color: "bg-indigo-600" },
    Shipped: { icon: <Truck size={14} />, color: "bg-purple-600" },
    Delivered: { icon: <CheckCircle size={14} />, color: "bg-green-600" },
    Cancelled: { icon: <XCircle size={14} />, color: "bg-red-600" },
    Returned: { icon: <RotateCcw size={14} />, color: "bg-orange-600" },
    Fake: { icon: <Ghost size={14} />, color: "bg-slate-600" },
    Abandoned: { icon: <AlertTriangle size={14} />, color: "bg-yellow-600" },
  };
  const config = statusConfig[status] || statusConfig.Processing;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-white ${config.color} shadow-sm`}
    >
      {config.icon}
      {status}
    </span>
  );
};
const CallStatusDropdown = ({ currentStatus, onStatusChange }) => {
  const statusStyles = {
    Confirmed:
      "border-green-500/50 bg-green-500/20 text-green-200 focus:border-green-500",
    "No Answer":
      "border-rose-500/50 bg-rose-500/20 text-rose-200 focus:border-rose-500",
    Pending:
      "border-yellow-500/50 bg-yellow-500/20 text-yellow-200 focus:border-yellow-500",
  };
  const currentStyle = statusStyles[currentStatus] || statusStyles["Pending"];
  const getIcon = () => {
    if (currentStatus === "Confirmed") return <Check size={12} />;
    if (currentStatus === "No Answer") return <PhoneOff size={12} />;
    return <PhoneCall size={12} />;
  };
  return (
    <div className="relative min-w-[110px] flex-1 sm:flex-none sm:w-36">
      <select
        value={currentStatus}
        onChange={(e) => onStatusChange(e.target.value)}
        className={`appearance-none w-full rounded-md border py-1.5 pl-7 pr-2 text-xs font-medium shadow-sm focus:outline-none focus:ring-1 ${currentStyle} transition-colors cursor-pointer`}
      >
        {CALL_OPTIONS.map((option) => (
          <option
            key={option.value}
            value={option.value}
            className="bg-gray-800 text-white"
          >
            {option.label}
          </option>
        ))}
      </select>
      <div
        className={`pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 opacity-80 text-currentColor`}
      >
        {getIcon()}
      </div>
    </div>
  );
};
const ActionDropdown = ({ currentStatus, onStatusChange }) => {
  const statusStyles = {
    "In Review":
      "border-indigo-500/50 bg-indigo-900/20 text-indigo-200 focus:border-indigo-500 focus:ring-indigo-500",
    Shipped:
      "border-purple-500/50 bg-purple-900/20 text-purple-200 focus:border-purple-500 focus:ring-purple-500",
    Delivered:
      "border-green-500/50 bg-green-900/20 text-green-200 focus:border-green-500 focus:ring-green-500",
    Cancelled:
      "border-red-500/50 bg-red-900/20 text-red-200 focus:border-red-500 focus:ring-red-500",
    Returned:
      "border-orange-500/50 bg-orange-900/20 text-orange-200 focus:border-orange-500 focus:ring-orange-500",
    Fake: "border-slate-500/50 bg-slate-900/20 text-slate-200 focus:border-slate-500 focus:ring-slate-500",
    Abandoned:
      "border-yellow-500/50 bg-yellow-900/20 text-yellow-200 focus:border-yellow-500 focus:ring-yellow-500",
    Default:
      "border-gray-600 bg-gray-700 text-white focus:border-blue-500 focus:ring-blue-500",
  };
  const currentStyle = statusStyles[currentStatus] || statusStyles.Default;
  return (
    <div className="relative w-40">
      <select
        value={currentStatus}
        onChange={(e) => onStatusChange(e.target.value)}
        className={`appearance-none w-full rounded-md border py-1.5 pl-3 pr-8 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-gray-800 ${currentStyle}`}
      >
        {ACTION_OPTIONS.map((option) => (
          <option
            key={option.value}
            value={option.value}
            className="bg-gray-800 text-white"
          >
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        className={`pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 opacity-70 text-currentColor`}
      />
    </div>
  );
};
const ShippingMethodDropdown = ({ currentMethod, onMethodChange }) => {
  const methodStyles = {
    "Inside Dhaka":
      "border-green-500/50 bg-green-900/20 text-green-200 focus:border-green-500 focus:ring-green-500",
    "Outside Dhaka":
      "border-orange-500/50 bg-orange-900/20 text-orange-200 focus:border-orange-500 focus:ring-orange-500",
    Default:
      "border-gray-600 bg-gray-700 text-white focus:border-blue-500 focus:ring-blue-500",
  };
  const currentStyle = methodStyles[currentMethod] || methodStyles.Default;
  return (
    <div className="relative w-40">
      <select
        value={currentMethod}
        onChange={(e) => onMethodChange(e.target.value)}
        className={`appearance-none w-full rounded-md border py-1.5 pl-3 pr-8 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-gray-800 ${currentStyle}`}
      >
        {SHIPPING_METHOD_OPTIONS.map((option) => (
          <option
            key={option.value}
            value={option.value}
            className="bg-gray-800 text-white"
          >
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        className={`pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 opacity-70 text-currentColor`}
      />
    </div>
  );
};
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
// --- ABANDON CONFIRMATION MODAL ---
const AbandonConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  customerName,
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-sm w-full shadow-2xl transform scale-100">
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center text-yellow-500 mb-4">
            <ArrowLeftCircle size={24} />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">
            Move to Abandoned?
          </h3>
          <p className="text-sm text-gray-400 mb-6">
            Are you sure you want to move <strong>{customerName}</strong> back
            to the Abandoned list?
            <br />
            <br />
            <span className="text-xs text-red-400">
              This will remove it from this dashboard.
            </span>
          </p>
          <div className="flex gap-3 w-full">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white text-sm font-bold rounded-lg transition-colors"
            >
              Yes, Move
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
// --- NOTE MODAL COMPONENT ---
const NoteModal = ({ isOpen, onClose, onSave, order, initialNote }) => {
  const [noteText, setNoteText] = useState("");
  // Reset text when modal opens
  useEffect(() => {
    if (isOpen) {
      setNoteText(initialNote || "");
    }
  }, [isOpen, initialNote]);
  if (!isOpen || !order) return null;
  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gray-800/50 px-6 py-4 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-500">
              <StickyNote size={20} />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Order Note</h3>
              <p className="text-xs text-gray-400">For {order.customer?.name || order.name || 'N/A'}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        {/* Body */}
        <div className="p-6">
          <label className="block text-sm text-gray-400 mb-2">
            Special instructions or details:
          </label>
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            className="w-full h-32 bg-gray-950 border border-gray-700 rounded-lg p-3 text-gray-200 text-sm focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 resize-none"
            placeholder="e.g. Customer requested price reduction, deliver after 5PM..."
          />
          <div className="mt-4 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 font-medium transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(order.id, noteText)}
              className="flex-1 py-2.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-500 font-bold transition-colors text-sm flex items-center justify-center gap-2"
            >
              <Save size={16} /> Save Note
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- COURIER CONFIRMATION MODAL ---
const CourierModal = ({ isOpen, onClose, onConfirm, order, isSending }) => {
  if (!isOpen || !order) return null;
  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-gray-900 border border-indigo-500/30 rounded-xl w-full max-w-md shadow-2xl overflow-hidden shadow-indigo-500/10">
        {/* Header */}
        <div className="bg-gray-800/80 px-6 py-4 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
              <Truck size={20} />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Send to Steadfast</h3>
              <p className="text-xs text-gray-400">Review Courier Details</p>
            </div>
          </div>
          <button onClick={onClose} disabled={isSending} className="text-gray-400 hover:text-white disabled:opacity-50">
            <X size={20} />
          </button>
        </div>
        {/* Body */}
        <div className="p-6 space-y-4">
           {/* Payload Overview */}
           <div className="bg-gray-950 border border-gray-800 rounded-lg p-4 space-y-3">
             <div className="flex justify-between items-start border-b border-gray-800 pb-2">
                 <span className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Customer Name</span>
                 <span className="text-sm text-gray-200 font-medium text-right">{order?.customer?.name || order?.name || 'N/A'}</span>
             </div>
             <div className="flex justify-between items-start border-b border-gray-800 pb-2">
                 <span className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Phone Number</span>
                 <span className="text-sm text-gray-200 font-medium text-right">{order?.customer?.phone || order?.number || 'N/A'}</span>
             </div>
             <div className="flex justify-between items-start border-b border-gray-800 pb-2">
                 <span className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Address</span>
                 <span className="text-sm text-gray-300 text-right max-w-[200px] leading-snug">{order?.address}</span>
             </div>
             <div className="flex justify-between items-center bg-indigo-950/30 p-2 rounded border border-indigo-900/50">
                 <span className="text-xs text-indigo-300 uppercase font-bold tracking-wider">COD Amount</span>
                 <span className="text-lg text-indigo-400 font-bold">{order.totalValue} ৳</span>
             </div>
           </div>
           
           <p className="text-xs text-gray-400 text-center italic">
              Once sent, the order status will be updated to "Shipped" and tracked via Steadfast.
           </p>

          <div className="mt-4 flex gap-3">
            <button
              onClick={onClose}
              disabled={isSending}
              className="flex-1 py-2.5 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 font-medium transition-colors text-sm disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(order.orderId)}
              disabled={isSending}
              className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 font-bold transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSending ? <><Loader2 size={16} className="animate-spin" /> Sending...</> : <><Send size={16} /> Confirm Send</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- GENERIC ORDER IDS MODAL ---
const OrderIdsModal = ({ isOpen, onClose, orderIdsText, title, subtitle }) => {
  const [copied, setCopied] = React.useState(false);
  if (!isOpen) return null;
  const handleCopy = () => {
    navigator.clipboard.writeText(orderIdsText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gray-800/50 px-6 py-4 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
              <Package size={20} />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">{title || 'Consignment IDs'}</h3>
              <p className="text-xs text-gray-400">{subtitle || 'Comma-separated list'}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        {/* Body */}
        <div className="p-6">
          <textarea
            readOnly
            value={orderIdsText}
            className="w-full h-40 bg-gray-950 border border-gray-700 rounded-lg p-4 text-gray-200 text-sm font-mono focus:outline-none resize-none leading-relaxed"
          />
          <div className="mt-6">
            <button
              onClick={handleCopy}
              className={`w-full py-2.5 font-bold transition-all text-sm rounded-lg flex items-center justify-center gap-2 ${
                copied
                  ? 'bg-green-600 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
              }`}
            >
              {copied ? <><Check size={16} /> Copied!</> : 'Copy to Clipboard'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- UPDATED ORDER MODAL ---
const OrderModal = ({
  order,
  onClose,
  onStatusChange,
  onCallStatusChange,
  onShippingMethodChange,
  onPriceChange,
  onLocationChange,
  onCustomerInfoChange,
}) => {
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [tempPrice, setTempPrice] = useState(order?.totalValue || 0);
  
  // LOCATION STATE
  const [address, setAddress] = useState(order?.address || "");
  const [district, setDistrict] = useState(order?.district || "");
  const [thana, setThana] = useState(order?.thana || "");
  const [isEditingLocation, setIsEditingLocation] = useState(false);

  // CUSTOMER STATE
  const [customerName, setCustomerName] = useState(order?.customer?.name || order?.name || "");
  const [customerPhone, setCustomerPhone] = useState(order?.customer?.phone || order?.number || "");
  const [isEditingCustomer, setIsEditingCustomer] = useState(false);

  const updateAddressWithLocation = (currentAddress, newDistrict, newThana) => {
    if (!currentAddress) currentAddress = "";
    let baseAddress = currentAddress
      .replace(/\s*\(জেলা:.*?\)/g, "")
      .replace(/\s*\(থানা:.*?\)/g, "")
      .trim();
    
    let prefixes = [];
    if (newDistrict) prefixes.push(`(জেলা: ${newDistrict})`);
    if (newThana) prefixes.push(`(থানা: ${newThana})`);
    
    return prefixes.length > 0 ? `${prefixes.join(" ")} ${baseAddress}`.trim() : baseAddress;
  };
  
  const availableThanas = useMemo(() => {
    if (!district) return [];
    const found = hubsData.districts.find(d => d.name === district);
    return found ? found.steadfast_hubs : [];
  }, [district]);

  useEffect(() => {
    setTempPrice(order?.totalValue || 0);
    setAddress(order?.address || "");
    setDistrict(order?.district || "");
    setThana(order?.thana || "");
    setCustomerName(order?.customer?.name || order?.name || "");
    setCustomerPhone(order?.customer?.phone || order?.number || "");
  }, [order]);
  
  const handleSavePrice = () => {
    if (tempPrice < 0) return;
    onPriceChange(tempPrice);
    setIsEditingPrice(false);
  };
  
  if (!order) return null;
  const uaData = getDeepUserAgentInfo(
    order.clientInfo?.userAgent || order.userAgent || ""
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md transition-all text-gray-200">
      <div className="absolute inset-0" onClick={onClose}></div>
      <div className="relative w-full max-w-5xl bg-gray-900 rounded-2xl md:rounded-3xl border border-gray-700 shadow-2xl overflow-hidden animate-in fade-in slide-in-bottom-4 duration-300 flex flex-col max-h-[96vh] md:max-h-[92vh]">
        
        {/* HEADER & TOP CONTROLS */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700 shrink-0 shadow-sm relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between px-4 md:px-6 py-4 md:py-5 gap-3 md:gap-4 relative">
            <div className="flex items-start md:items-center gap-3 md:gap-4 pr-10 md:pr-0">
              <div className="p-2 md:p-3 bg-indigo-500/10 rounded-xl md:rounded-2xl border border-indigo-500/20 shadow-inner hidden sm:block">
                <Package className="text-indigo-400" size={24} />
              </div>
              <div className="w-full">
                <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-1.5">
                  <h2 className="text-lg md:text-xl font-bold text-white tracking-tight break-words">Order #{order.orderId}</h2>
                  <StatusBadge status={order.status} />
                  <div className="flex flex-wrap gap-2 items-center w-full sm:w-auto mt-1 sm:mt-0">
                    {(order.trackingCode || order.consignmentId) && (
                      <div 
                        className="flex items-center gap-1.5 px-2 md:px-2.5 py-1 bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-[10px] md:text-xs font-bold tracking-wider rounded-md shadow-sm cursor-copy hover:bg-indigo-500/30 transition-all"
                        title="Click to copy Courier ID"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(order.trackingCode || order.consignmentId);
                          const el = e.currentTarget.querySelector('.copy-text-tracking');
                          if (el) {
                            const original = el.innerText;
                            el.innerText = 'COPIED!';
                            setTimeout(() => {
                              if (el) el.innerText = original;
                            }, 1500);
                          }
                        }}
                      >
                        <Truck size={12} className="md:w-3.5 md:h-3.5" />
                        <span className="copy-text-tracking">{order.trackingCode || order.consignmentId}</span>
                      </div>
                    )}
                    {(order.trackingCode && order.consignmentId && order.trackingCode !== order.consignmentId) && (
                      <div 
                        className="flex items-center gap-1.5 px-2 md:px-2.5 py-1 bg-fuchsia-500/20 border border-fuchsia-500/40 text-fuchsia-300 text-[10px] md:text-xs font-bold tracking-wider rounded-md shadow-sm cursor-copy hover:bg-fuchsia-500/30 transition-all"
                        title="Click to copy Parcel ID"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(order.consignmentId);
                          const el = e.currentTarget.querySelector('.copy-text-parcel');
                          if (el) {
                            const original = el.innerText;
                            el.innerText = 'COPIED!';
                            setTimeout(() => {
                              if (el) el.innerText = original;
                            }, 1500);
                          }
                        }}
                      >
                        <Package size={12} className="md:w-3.5 md:h-3.5" />
                        <span className="copy-text-parcel">{order.consignmentId.startsWith('#') ? order.consignmentId : `#${order.consignmentId}`}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 md:gap-3 text-[10px] md:text-xs font-medium text-gray-400">
                  <span className="flex items-center gap-1 md:gap-1.5 bg-gray-800 px-1.5 md:px-2 py-0.5 md:py-1 rounded-md"><Calendar size={10} className="md:w-3 md:h-3 text-gray-500"/> {new Date(order.date).toLocaleString()}</span>
                  <span className="flex items-center gap-1 md:gap-1.5 bg-gray-800 px-1.5 md:px-2 py-0.5 md:py-1 rounded-md"><Globe size={10} className="md:w-3 md:h-3 text-gray-500"/> {order.ip || "No IP Available"}</span>
                </div>
              </div>
            </div>
            
            <div className="absolute top-4 right-4 md:static">
              <button onClick={onClose} className="p-1.5 md:p-2 text-gray-400 hover:text-white hover:bg-red-500/20 hover:border-red-500/30 rounded-lg md:rounded-xl transition-all bg-gray-800 border border-gray-700 shadow-sm">
                <X size={16} className="md:w-5 md:h-5" />
              </button>
            </div>
          </div>
          
          {/* INSTANT QUICK ACTIONS BAR - No scrolling Needed! */}
          <div className="px-4 md:px-6 py-2.5 md:py-3 bg-gray-800/60 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 md:gap-4 border-t border-gray-700/50 shadow-inner">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest hidden sm:flex items-center gap-1"><Zap size={12} className="text-yellow-500"/> Action Center</span>
            
            <div className="flex items-center justify-between sm:justify-start gap-2 bg-gray-900/80 px-2.5 md:px-3 py-1.5 rounded-lg border border-gray-700 shadow-sm focus-within:border-indigo-500/50 transition-colors w-full sm:w-auto">
              <span className="text-[10px] md:text-[11px] font-semibold text-gray-400 uppercase tracking-wide shrink-0">Ship Method:</span>
              <ShippingMethodDropdown currentMethod={order.shippingMethod} onMethodChange={onShippingMethodChange} />
            </div>

            <div className="flex items-center justify-between sm:justify-start gap-2 bg-gray-900/80 px-2.5 md:px-3 py-1.5 rounded-lg border border-gray-700 shadow-sm focus-within:border-indigo-500/50 transition-colors w-full sm:w-auto ml-0 sm:ml-auto md:ml-0">
              <span className="text-[10px] md:text-[11px] font-semibold text-gray-400 uppercase tracking-wide shrink-0">Status:</span>
              <ActionDropdown currentStatus={order.status} onStatusChange={onStatusChange} />
            </div>
          </div>
        </div>

        {/* MAIN MODAL BODY SCROLL AREA */}
        <div className="p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 overflow-y-auto custom-scrollbar flex-1 bg-gray-900/50">
          
          {/* LEFT SIDE (Main Details) */}
          <div className="col-span-1 lg:col-span-8 space-y-6">
            
            {/* SPECIAL NOTE HIGHLIGHT */}
            {order.note && (
              <div className="bg-yellow-900/10 border-l-4 border-yellow-500 rounded-r-xl p-4 flex gap-4 shadow-sm">
                <div className="bg-yellow-500/20 p-2 rounded-lg shrink-0 h-fit">
                  <StickyNote className="text-yellow-500" size={20} />
                </div>
                <div>
                  <h4 className="text-yellow-500 font-bold text-[11px] uppercase tracking-wider mb-1">Customer Note / Instructions</h4>
                  <p className="text-gray-200 text-sm leading-relaxed overflow-hidden text-ellipsis italic">"{order.note}"</p>
                </div>
              </div>
            )}

            {/* LOGISTICS & ROUTING CARD */}
            <div className="bg-gray-800/40 backdrop-blur-sm rounded-xl md:rounded-2xl border border-gray-700/60 overflow-hidden shadow-lg">
              <div className="px-4 md:px-5 py-3 border-b border-gray-700/50 bg-gray-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-rose-400 md:w-4 md:h-4 w-3.5 h-3.5" />
                  <h3 className="text-xs md:text-sm font-semibold text-gray-200">Delivery Address & Routing</h3>
                </div>
                {!isEditingLocation && (
                  <button onClick={() => setIsEditingLocation(true)} className="flex items-center gap-1 md:gap-1.5 px-2.5 md:px-3 py-1 md:py-1.5 bg-gray-700 hover:bg-gray-600 border border-gray-600 shadow-sm rounded-lg text-[10px] md:text-xs font-semibold transition-all hover:shadow-md text-white">
                    <Edit size={10} className="md:w-3 md:h-3" /> Edit Details
                  </button>
                )}
              </div>
              
              <div className="p-4 md:p-5 flex flex-col gap-4 md:gap-6">
                {/* Visual Address representation */}
                <div className="bg-gray-900/60 p-4 md:p-5 rounded-lg md:rounded-xl border border-gray-700/80 shadow-inner">
                  {isEditingLocation ? (
                    <div className="space-y-3 md:space-y-4 animate-in fade-in duration-200">
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 md:mb-2 flex items-center gap-1.5"><Edit size={12} className="text-indigo-400" /> Manual Address Override</p>
                        <textarea 
                          value={address} 
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="Type detailed apartment, street, block, etc."
                          className="w-full bg-gray-950 text-gray-200 border border-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none h-28 custom-scrollbar shadow-inner"
                        />
                      </div>
                      <div className="flex gap-3 justify-end">
                        <button onClick={() => { setIsEditingLocation(false); setAddress(order?.address || ""); }} className="text-xs text-gray-300 font-semibold px-4 py-2 hover:bg-gray-800 border border-transparent hover:border-gray-600 rounded-lg transition-all">Cancel</button>
                        <button onClick={() => { onLocationChange(district, thana, address); setIsEditingLocation(false); }} className="text-xs text-white px-5 py-2 bg-indigo-500 hover:bg-indigo-600 rounded-lg font-bold transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2">
                          <Check size={14} /> Save Text
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Printing Label Address</p>
                      <p className="text-base text-gray-100 leading-relaxed font-medium">
                        {order.address || "Address missing or deleted"}
                      </p>
                    </div>
                  )}
                </div>

                {/* Always-on Courier Dropdowns */}
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Package size={12} /> Courier Routing Zones</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-900/30 p-4 rounded-xl border border-gray-700/50">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-300">District / City</label>
                      <select 
                        value={district} 
                        onChange={(e) => { 
                          const newDistrict = e.target.value;
                          setDistrict(newDistrict); 
                          setThana(""); 
                          const newRawAddr = updateAddressWithLocation(order.address, newDistrict, "");
                          setAddress(newRawAddr);
                          onLocationChange(newDistrict, "", newRawAddr);
                          
                          if (newDistrict) {
                            const autoMethod = newDistrict === "Dhaka City" ? "Inside Dhaka" : "Outside Dhaka";
                            if (order.shippingMethod !== autoMethod) {
                              onShippingMethodChange(autoMethod);
                            }
                          }
                        }}
                        className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5 text-sm text-white hover:border-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer shadow-sm appearance-none"
                        style={{backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1em'}}
                      >
                        <option value="">-- Select a District --</option>
                        {hubsData.districts.map(d => (
                          <option key={d.name} value={d.name}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-300">Thana / Area</label>
                      <select 
                        value={thana} 
                        onChange={(e) => {
                          const newThana = e.target.value;
                          setThana(newThana);
                          const newRawAddr = updateAddressWithLocation(order.address, district, newThana);
                          setAddress(newRawAddr);
                          onLocationChange(district, newThana, newRawAddr);
                        }}
                        className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2.5 text-sm text-white hover:border-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer shadow-sm appearance-none disabled:opacity-40 disabled:bg-gray-900 disabled:cursor-not-allowed"
                        style={{backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1em'}}
                        disabled={!district}
                      >
                        <option value="">-- Select a Thana --</option>
                        {availableThanas.map(t => (
                           <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CUSTOMER CONTACT CARD */}
            <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl border border-gray-700/60 overflow-hidden shadow-lg">
              <div className="px-5 py-3 border-b border-gray-700/50 bg-gray-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User size={16} className="text-blue-400" />
                  <h3 className="text-sm font-semibold text-gray-200">Customer Identity</h3>
                </div>
                {!isEditingCustomer && (
                  <button onClick={() => setIsEditingCustomer(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 border border-gray-600 shadow-sm rounded-lg text-xs font-semibold transition-all hover:shadow-md text-white">
                    <Edit size={12} /> Edit Details
                  </button>
                )}
              </div>
              <div className="p-5 flex flex-col gap-6">
                {isEditingCustomer ? (
                  <div className="space-y-4 animate-in fade-in duration-200 bg-gray-900/60 p-5 rounded-xl border border-gray-700/80 shadow-inner">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><User size={12} className="text-blue-400" /> Full Name</label>
                        <input
                          type="text"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="w-full bg-gray-950 text-gray-200 border border-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><Phone size={12} className="text-green-400" /> Phone Number</label>
                        <input
                          type="text"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          className="w-full bg-gray-950 text-gray-200 border border-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all shadow-inner"
                        />
                      </div>
                    </div>
                    <div className="flex gap-3 justify-end mt-4">
                      <button onClick={() => { setIsEditingCustomer(false); setCustomerName(order?.customer?.name || order?.name || ""); setCustomerPhone(order?.customer?.phone || order?.number || ""); }} className="text-xs text-gray-300 font-semibold px-4 py-2 hover:bg-gray-800 border border-transparent hover:border-gray-600 rounded-lg transition-all">Cancel</button>
                      <button onClick={() => { onCustomerInfoChange(customerName, customerPhone); setIsEditingCustomer(false); }} className="text-xs text-white px-5 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg font-bold transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2">
                        <Check size={14} /> Save Details
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-6">
                    <div className="flex-1 bg-gray-900/40 p-3 rounded-xl border border-gray-700/30">
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><User size={10} /> Full Name</p>
                      <p className="font-semibold text-white text-base truncate">{order.customer?.name || order.name || 'Anonymous'}</p>
                    </div>
                    <div className="flex-1 bg-gray-900/40 p-3 rounded-xl border border-gray-700/30">
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Phone size={10} /> Phone Number</p>
                      <p className="font-semibold text-white text-base flex items-center gap-2">
                        {order.customer?.phone || order.number || 'No Phone Number'}
                        {order.smsStatus === "Sent" && (
                          <span title="SMS Delivered" className="flex items-center gap-1 text-[10px] uppercase font-bold text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded-full border border-green-400/20"><CheckCircle size={10} /> Verified</span>
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* RIGHT SIDE (Summary & Context) */}
          <div className="col-span-1 lg:col-span-4 space-y-6">
            
            {/* PAYMENT & FINANCIAL SUMMARY */}
            <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-sm rounded-2xl border border-gray-700/60 overflow-hidden shadow-xl">
              <div className="px-5 py-3 border-b border-gray-700/50 flex items-center gap-2">
                <DollarSign size={16} className="text-emerald-400" />
                <h3 className="text-sm font-semibold text-gray-200">Financial Summary</h3>
              </div>
              <div className="p-5">
                <div className="space-y-3 pb-4 border-b border-gray-700/50 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">Subtotal</span>
                    <span className="font-semibold text-gray-300">{order.items ? (order.totalValue - order.shippingCost) : "N/A"} ৳</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2 text-xs font-medium text-gray-400 uppercase tracking-widest">
                      Shipping 
                      <span className="text-[9px] font-bold bg-gray-700/80 text-gray-300 px-1.5 py-0.5 rounded-md border border-gray-600">{order.shippingMethod}</span>
                    </span>
                    <span className={`font-bold ${order.shippingCost === 60 ? 'text-green-400' : 'text-orange-400'}`}>+{order.shippingCost} ৳</span>
                  </div>
                </div>
                
                  <div className="flex flex-col pt-3 mt-1 border-t border-gray-700/50">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">To Be Collected</span>
                    
                    {isEditingPrice ? (
                      <div className="flex flex-col gap-3 mt-1 animate-in slide-in-bottom-2 duration-200">
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">৳</span>
                          <input
                            type="number"
                            value={tempPrice}
                            onChange={(e) => setTempPrice(Number(e.target.value))}
                            className="w-full bg-gray-900 border-2 border-indigo-500 rounded-lg pl-8 pr-3 py-2 text-lg font-black text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-inner"
                            autoFocus
                          />
                        </div>
                        <div className="flex gap-2 w-full">
                          <button onClick={() => { setIsEditingPrice(false); setTempPrice(order.totalValue); }} className="flex-1 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-600 text-gray-300 transition-colors text-xs font-bold">
                            Cancel
                          </button>
                          <button onClick={handleSavePrice} className="flex-1 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-colors text-xs font-bold shadow-lg shadow-emerald-500/20 flex justify-center items-center gap-1.5">
                            <Check size={14} /> Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between group">
                        <span className="text-emerald-400 text-2xl font-bold tracking-tight">{order.totalValue} <span className="text-lg">৳</span></span>
                        <button onClick={() => setIsEditingPrice(true)} className="mb-0.5 w-7 h-7 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-500 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition-all shadow-sm">
                          <Edit size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            {/* SECURITY / FOOTPRINT CARD */}
            {uaData && (
              <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl border border-gray-700/60 overflow-hidden shadow-lg">
                <div className="px-5 py-3 border-b border-gray-700/50 bg-gray-800/80 flex items-center gap-2">
                  <Shield size={16} className="text-purple-400" />
                  <h3 className="text-sm font-semibold text-gray-200">Security & Source</h3>
                </div>
                <div className="p-5 flex flex-col gap-4">
                  <div className="flex items-center gap-3 bg-gray-900/40 p-3 rounded-xl border border-gray-700/30">
                    <Smartphone size={16} className="text-gray-500 shrink-0" />
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-0.5 font-bold">Client Device</p>
                      <p className="text-sm font-semibold text-gray-200">{uaData.device.vendor} <span className="text-blue-400">{uaData.device.marketingName}</span></p>
                      <p className="text-[10px] text-gray-400 mt-0.5 font-medium">{uaData.device.os}</p>
                    </div>
                  </div>
                  
                  {order.deviceId && (
                    <div className="flex items-center gap-3 bg-gray-900/40 p-3 rounded-xl border border-gray-700/30">
                      <Zap size={16} className="text-indigo-500 shrink-0" />
                      <div>
                        <p className="text-[10px] text-indigo-400/80 uppercase tracking-widest mb-0.5 font-bold">Device Fingerprint</p>
                        <p className="text-xs font-mono text-gray-300 break-all">{order.deviceId}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 bg-gray-900/40 p-3 rounded-xl border border-gray-700/30">
                    <Share2 size={16} className="text-gray-500 shrink-0" />
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-0.5 font-bold">Acquisition</p>
                      <p className="text-sm font-semibold text-gray-200">{uaData.appSource.name}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ORDER JOURNEY TIMELINE */}
            <div className="bg-gray-800/40 backdrop-blur-sm rounded-2xl border border-gray-700/60 overflow-hidden shadow-lg">
              <div className="px-5 py-3 border-b border-gray-700/50 bg-gray-800/80 flex items-center gap-2">
                <Clock size={16} className="text-cyan-400" />
                <h3 className="text-sm font-semibold text-gray-200">Order Journey</h3>
              </div>
              <div className="p-5 flex flex-col gap-4">
                <div className="relative border-l-2 border-gray-700/50 ml-2 space-y-7 py-2">
                  {order.date && (
                    <div className="relative pl-6">
                      <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-gray-900 border-2 border-blue-500 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                      </div>
                      <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-0.5">Order Placed</p>
                      <p className="text-sm font-semibold text-gray-200">{new Date(order.date).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                    </div>
                  )}
                  {order.shippedAt && (
                    <div className="relative pl-6">
                      <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-gray-900 border-2 border-purple-500 flex items-center justify-center shadow-[0_0_8px_rgba(168,85,247,0.4)]">
                        <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                      </div>
                      <p className="text-[10px] text-purple-400 font-bold uppercase tracking-widest mb-0.5 shadow-sm">Shipped via Courier</p>
                      <p className="text-sm font-semibold text-gray-200">{new Date(order.shippedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                    </div>
                  )}
                  {order.deliveredAt && (
                    <div className="relative pl-6">
                      <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-gray-900 border-2 border-green-500 flex items-center justify-center shadow-[0_0_8px_rgba(34,197,94,0.4)]">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                      </div>
                      <p className="text-[10px] text-green-400 font-bold uppercase tracking-widest mb-0.5">Delivered to Customer</p>
                      <p className="text-sm font-semibold text-gray-200">{new Date(order.deliveredAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                    </div>
                  )}
                  {order.returnedAt && (
                    <div className="relative pl-6">
                      <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-gray-900 border-2 border-orange-500 flex items-center justify-center shadow-[0_0_8px_rgba(249,115,22,0.4)]">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                      </div>
                      <p className="text-[10px] text-orange-400 font-bold uppercase tracking-widest mb-0.5">Returned</p>
                      <p className="text-sm font-semibold text-gray-200">{new Date(order.returnedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
};
// --- LOGIC HELPERS ---
const getShippingLocation = (shippingCost) => {
  if (shippingCost === 60)
    return { location: "Inside Dhaka", color: "text-green-400" };
  if (shippingCost === 99)
    return { location: "Outside Dhaka", color: "text-orange-400" };
  return { location: "N/A", color: "text-gray-400" };
};
const formatTimeAgo = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.round((now - date) / 1000);
  if (isNaN(seconds) || seconds < 0) return "Just now";
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);
  if (seconds < 60) return `${seconds} sec ago`;
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hr ago`;
  return `${days} days ago`;
};
// --- MAIN COMPONENT ---
export default function App() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [stats, setStats] = useState({ today: 0, yesterday: 0, thisMonth: 0 });
  const [searchTerm, setSearchTerm] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentTime, setCurrentTime] = useState(new Date());
   
  // Date filtering state
  const [dateRange, setDateRange] = useState(null);
  const [selectedPreset, setSelectedPreset] = useState(null);
   
  // Abandon State
  const [showAbandonConfirm, setShowAbandonConfirm] = useState(false);
  const [orderToAbandon, setOrderToAbandon] = useState(null);
   
  // Note Modal State
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteOrder, setNoteOrder] = useState(null);
   
  const [isCourierModalOpen, setIsCourierModalOpen] = useState(false);
  const [courierOrder, setCourierOrder] = useState(null);
  const [isSendingCourier, setIsSendingCourier] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Pause background polling during active modifications
  const activeRequestsRef = useRef(0);

  // Status filter state
  const [statusFilter, setStatusFilter] = useState(null);
   
  // Bulk Courier Modal State
  const [isBulkCourierModalOpen, setIsBulkCourierModalOpen] = useState(false);
  const [isSendingBulkCourier, setIsSendingBulkCourier] = useState(false);
  const [bulkOrdersCount, setBulkOrdersCount] = useState(0);

  // In Review Order IDs Modal State
  const [isOrderIdsModalOpen, setIsOrderIdsModalOpen] = useState(false);
  const [orderIdsText, setOrderIdsText] = useState("");
  const [orderIdsModalConfig, setOrderIdsModalConfig] = useState({ title: 'In Review Consignment IDs', subtitle: 'Comma-separated list' });

  // Pinned / Working Row Highlight State
  const [pinnedOrderId, setPinnedOrderId] = useState(null);

  // COLLAPSIBLE STATE (Only for the Status Widgets now)
  const [isStatusWidgetOpen, setIsStatusWidgetOpen] = useState(false);
  // Calculate Status Counts
  const statusCounts = useMemo(() => {
    const counts = {
      Processing: 0,
      "In Review": 0,
      Shipped: 0,
      Delivered: 0,
      Cancelled: 0,
      Returned: 0,
      Fake: 0,
      "No Answer": 0,
      "ConfirmedProcessing": 0, // NEW: Count for Ready to Ship
    };
    orders.forEach((order) => {
      // Standard Status Count
      if (counts[order.status] !== undefined) {
        counts[order.status]++;
      } else if (order.status === "Fake") {
        counts.Fake++;
      } else {
        counts.Processing++;
      }
      // NEW: Specific Call Status Count - EXCLUDING Fake, Cancelled, Returned, Abandoned
      if (order.callStatus === "No Answer" && !["Fake", "Cancelled", "Returned", "Abandoned"].includes(order.status)) {
        counts["No Answer"]++;
      }
       
      // NEW: Ready to Ship Logic (Processing AND Confirmed)
      if (order.status === "Processing" && order.callStatus === "Confirmed") {
        counts["ConfirmedProcessing"]++;
      }
    });
    return counts;
  }, [orders]);
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    const fetchOrders = async (isBackground = false) => {
      // Prevent background polling from overwriting optimistic UI updates
      if (isBackground && activeRequestsRef.current > 0) return;

      try {
        const res = await fetch("/api/orders");
        const data = await res.json();
        const transformedData = data.map((order, index) => ({
          ...order,
          id: order._id || order.id || index,
          customer: order.customer || { name: order.name || "N/A", phone: order.number || "N/A" },
          address: order.address || "N/A",
          shippingMethod: (() => {
            let sm = order.shippingMethod || order.shipping || "";
            if (sm === "ঢাকার বাইরে" || sm === "Outside Dhaka") return "Outside Dhaka";
            if (sm === "ঢাকার ভিতরে" || sm === "Inside Dhaka") return "Inside Dhaka";
            if (order.shippingCost === 99 || order.shippingCost > 60) return "Outside Dhaka";
            if (order.shippingCost === 60) return "Inside Dhaka";
            if (order.district && order.district !== "Dhaka City") return "Outside Dhaka";
            return "Inside Dhaka";
          })(),
          shippingCost: order.shippingCost || 0,
          totalValue: order.totalValue || 0,
          status: order.status || "Processing",
          callStatus: order.callStatus || order.phoneCallStatus || "Pending",
          orderId: order.orderId,
          clientInfo: order.clientInfo || {},
          ip: order.ip || order.clientInfo?.ip || "N/A",
          userAgent: order.clientInfo?.userAgent || order.userAgent || "",
          date: order.date || order.createdAt || new Date().toISOString(),
          note: order.note || "",
          smsStatus: order.smsStatus || "Pending",
          trackingCode: order.trackingCode || null,
          consignmentId: order.consignmentId || null,
          courierStatus: order.courierStatus || "pending",
        }));
        
        // Use functional state update to only replace if data changed (prevent unnecessary re-renders)
        setOrders(prevOrders => {
           // Simple check: if lengths are different, or if the first item's status changed, it's likely changed. 
           // In a real app we'd deep compare or rely on Last-Modified, but this avoids some re-renders
           if (!isBackground) return transformedData;
           if (prevOrders.length !== transformedData.length) return transformedData;
           // If lengths match, do a quick stringify check (could be heavy for very large arrays, but okay for typical dashboards)
           const prevStr = JSON.stringify(prevOrders.map(o => ({id: o.id, status: o.status, callStatus: o.callStatus, totalValue: o.totalValue, address: o.address})));
           const currStr = JSON.stringify(transformedData.map(o => ({id: o.id, status: o.status, callStatus: o.callStatus, totalValue: o.totalValue, address: o.address})));
           return prevStr !== currStr ? transformedData : prevOrders;
        });

        const now = new Date();
        const today = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        setStats({
          today: transformedData.filter((o) => new Date(o.date) >= today)
            .length,
          yesterday: transformedData.filter((o) => {
            const d = new Date(o.date);
            return d >= yesterday && d < today;
          }).length,
          thisMonth: transformedData.filter(
            (o) => new Date(o.date) >= startOfMonth
          ).length,
        });
      } catch (error) {
        console.error("Failed to fetch orders", error);
      }
    };
    
    // Initial fetch
    fetchOrders(false);

    // Set up polling interval every 10 seconds
    const intervalId = setInterval(() => {
      fetchOrders(true);
    }, 10000);

    return () => clearInterval(intervalId);
  }, []);
  // --- HANDLERS ---
  const handleStatusChange = async (id, newStatus) => {
    if (newStatus === "Abandoned") {
      const order = orders.find((o) => o.id === id);
      if (order) {
        setOrderToAbandon(order);
        setShowAbandonConfirm(true);
      }
      return;
    }
    
    activeRequestsRef.current++;
    
    const now = new Date().toISOString();
    const timestampPatch = {};
    const existingOrder = orders.find((o) => o.id === id);
    if (newStatus === 'Shipped' && !existingOrder?.shippedAt) timestampPatch.shippedAt = now;
    if (newStatus === 'Delivered' && !existingOrder?.deliveredAt) timestampPatch.deliveredAt = now;
    if (newStatus === 'Returned' && !existingOrder?.returnedAt) timestampPatch.returnedAt = now;

    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: newStatus, ...timestampPatch } : o))
    );
    if (selectedOrder?.id === id)
      setSelectedOrder((prev) => ({ ...prev, status: newStatus, ...timestampPatch }));
    try {
      await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => { activeRequestsRef.current = Math.max(0, activeRequestsRef.current - 1); }, 2000);
    }
  };
  const proceedWithAbandon = async () => {
    if (!orderToAbandon) return;
    if (
      typeof orderToAbandon.id === "number" ||
      orderToAbandon.id.length < 10
    ) {
      alert("Error: Invalid Order ID. Cannot migrate.");
      return;
    }
    try {
      const res = await fetch(
        `/api/orders/${orderToAbandon.id}/move-to-abandoned`,
        {
          method: "POST",
        }
      );
      const contentType = res.headers.get("content-type");
      if (
        !res.ok ||
        !contentType ||
        !contentType.includes("application/json")
      ) {
        const text = await res.text();
        console.error("Migration Failed. Server Response:", text);
        alert(
          `Server returned status ${res.status}. Please check console for details.`
        );
        return;
      }
      const data = await res.json();
      if (data.success) {
        setOrders((prev) => prev.filter((o) => o.id !== orderToAbandon.id));
        setShowAbandonConfirm(false);
        setOrderToAbandon(null);
        setSelectedOrder(null);
        alert("Order moved to Abandoned successfully");
      } else {
        alert(data.message || "Failed to move order");
      }
    } catch (error) {
      console.error("Error moving to abandoned:", error);
      alert("A network or server error occurred. Check console.");
    }
  };

  // --- COURIER INTEGRATION HANDLERS ---
  const handleOpenCourierModal = (order) => {
    setCourierOrder(order);
    setIsCourierModalOpen(true);
  };

  const handleConfirmCourierSend = async (orderId) => {
    if (!courierOrder) return;
    setIsSendingCourier(true);
    try {
       const data = await sendToSteadfast(orderId);

       if (data.success) {
          // Update the localized row with tracking information to reflect success visually.
          setOrders(prev => prev.map(o => 
             o.id === courierOrder.id 
               ? { ...o, trackingCode: data.trackingCode, consignmentId: data.consignmentId, status: "In Review" } 
               : o
          ));
          setIsCourierModalOpen(false);
          setCourierOrder(null);
          // Show success popup with the tracking/consignment ID for easy copying
          setOrderIdsText(data.consignmentId || data.trackingCode || orderId);
          setOrderIdsModalConfig({ title: '✅ Courier Sent Successfully!', subtitle: 'Copy the consignment ID below' });
          setIsOrderIdsModalOpen(true);
       } else {
          alert(`Failed to send to courier: ${data.message || 'Unknown error'}`);
       }
    } catch (e) {
       console.error("Courier error:", e);
       alert("An error occurred while sending to the Steadfast Courier.");
    } finally {
       setIsSendingCourier(false);
    }
  };

  const handleOpenBulkCourierModal = () => {
    // Only dispatch orders that do not already have a tracking code
    const eligibleOrders = filteredOrders.filter(o => !o.trackingCode && o.status !== "Fake" && o.status !== "Cancelled" && o.status !== "Abandoned");
    setBulkOrdersCount(eligibleOrders.length);
    if (eligibleOrders.length > 0) {
       setIsBulkCourierModalOpen(true);
    } else {
       alert("No eligible pending orders to send.");
    }
  };

  const handleConfirmBulkCourierSend = async () => {
     setIsSendingBulkCourier(true);
     try {
       const eligibleOrders = filteredOrders.filter(o => !o.trackingCode && o.status !== "Fake" && o.status !== "Cancelled" && o.status !== "Abandoned");
       const orderIds = eligibleOrders.map(o => o.orderId);
       
       if (orderIds.length === 0) {
         alert("No eligible pending orders to send.");
         return;
       }

       if (orderIds.length > 500) {
         alert("Steadfast only allows sending up to 500 orders per bulk dispatch. Please utilize pagination filters to limit the current batch.");
         return;
       }

       const response = await sendBulkToSteadfast(orderIds);
       
       if (response.success) {
           // Update states of locally tracked successful updates
           const updateMap = new Map();
           response.successfulUpdates.forEach(u => updateMap.set(u.orderId, u));

           setOrders(prev => prev.map(o => {
               if (updateMap.has(o.orderId)) {
                   const update = updateMap.get(o.orderId);
                   return {
                       ...o,
                       consignmentId: update.consignmentId,
                       trackingCode: update.trackingCode,
                       courierStatus: 'pending',
                       status: 'In Review'
                   };
               }
               return o;
           }));

           // Show popup with all consignment IDs for easy copying
           const consignmentIds = response.successfulUpdates.map(u => u.consignmentId).join(', ');
           setOrderIdsText(consignmentIds || 'No IDs returned');
           const failInfo = response.errorCount > 0 ? ` (${response.errorCount} failed)` : '';
           setOrderIdsModalConfig({
             title: `✅ Bulk Sent: ${response.successCount} Orders${failInfo}`,
             subtitle: 'Copy the consignment IDs below'
           });
           setIsOrderIdsModalOpen(true);
       } else {
           alert(`Failed to send bulk courier dispatch: ${response.message}`);
       }
     } catch (e) {
       console.error("Bulk Courier Error:", e);
       alert("An error occurred while dispatching bulk order to Courier.");
     } finally {
       setIsSendingBulkCourier(false);
       setIsBulkCourierModalOpen(false);
     }
  };

  const handleCallStatusChange = async (id, newCallStatus) => {
    activeRequestsRef.current++;
    
    // Save original state for rollback
    const originalOrder = orders.find(o => o.id === id);
    const originalCallStatus = originalOrder?.callStatus;

    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, callStatus: newCallStatus } : o))
    );
    if (selectedOrder?.id === id)
      setSelectedOrder((prev) => ({ ...prev, callStatus: newCallStatus }));
      
    try {
      const res = await fetch(
        `/api/orders/${id}/call-status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ callStatus: newCallStatus }),
        }
      );
      if (!res.ok) throw new Error("Server failed to save status");
    } catch (e) {
      console.error(e);
      // Rollback
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, callStatus: originalCallStatus } : o))
      );
      if (selectedOrder?.id === id)
        setSelectedOrder((prev) => ({ ...prev, callStatus: originalCallStatus }));
        
      alert("Network error: Failed to save call status. Please try again.");
    } finally {
      // Delay resuming background poll to ensure DB read is consistent
      setTimeout(() => { activeRequestsRef.current = Math.max(0, activeRequestsRef.current - 1); }, 2000);
    }
  };
  const handleShippingMethodChange = async (id, newMethod) => {
    const selectedOption = SHIPPING_METHOD_OPTIONS.find(
      (option) => option.value === newMethod
    );
    if (!selectedOption) return;
    
    activeRequestsRef.current++;
    const newCost = selectedOption.cost;
    setOrders((prev) =>
      prev.map((o) =>
        o.id === id
          ? {
              ...o,
              shippingMethod: newMethod,
              shippingCost: newCost,
              totalValue: o.totalValue - o.shippingCost + newCost,
            }
          : o
      )
    );
    if (selectedOrder?.id === id)
      setSelectedOrder((prev) => ({
        ...prev,
        shippingMethod: newMethod,
        shippingCost: newCost,
        totalValue: prev.totalValue - prev.shippingCost + newCost,
      }));
    try {
      await fetch(
        `/api/orders/${id}/shipping-method`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            shippingMethod: newMethod,
            shippingCost: newCost,
          }),
        }
      );
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => { activeRequestsRef.current = Math.max(0, activeRequestsRef.current - 1); }, 2000);
    }
  };
  const handlePriceChange = async (id, newPrice) => {
    const price = Number(newPrice);
    if (isNaN(price)) return;
    activeRequestsRef.current++;
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, totalValue: price } : o))
    );
    if (selectedOrder?.id === id) {
      setSelectedOrder((prev) => ({
        ...prev,
        totalValue: price,
      }));
    }
    try {
      await fetch(`/api/orders/${id}/price`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totalValue: price }),
      });
    } catch (e) {
      console.error("Failed to update price", e);
    } finally {
      setTimeout(() => { activeRequestsRef.current = Math.max(0, activeRequestsRef.current - 1); }, 2000);
    }
  };
  const handleLocationChange = async (id, district, thana, address) => {
    activeRequestsRef.current++;
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, district, thana, address } : o))
    );
    if (selectedOrder?.id === id) {
      setSelectedOrder((prev) => ({
        ...prev,
        district,
        thana,
        address,
      }));
    }
    try {
      await fetch(`/api/orders/${id}/location`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ district, thana, address }),
      });
    } catch (e) {
      console.error("Failed to update location", e);
      alert("Failed to update location to server");
    } finally {
      setTimeout(() => { activeRequestsRef.current = Math.max(0, activeRequestsRef.current - 1); }, 2000);
    }
  };
  const handleCustomerInfoChange = async (id, name, phone) => {
    activeRequestsRef.current++;
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, customer: { ...o.customer, name, phone }, name, number: phone } : o))
    );
    if (selectedOrder?.id === id) {
      setSelectedOrder((prev) => ({
        ...prev,
        customer: { ...prev.customer, name, phone },
        name,
        number: phone,
      }));
    }
    try {
      await fetch(`/api/orders/${id}/customer-info`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });
    } catch (e) {
      console.error("Failed to update customer info", e);
      alert("Failed to update customer info to server");
    } finally {
      setTimeout(() => { activeRequestsRef.current = Math.max(0, activeRequestsRef.current - 1); }, 2000);
    }
  };
  const handleSaveNote = async (id, noteText) => {
    activeRequestsRef.current++;
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, note: noteText } : o))
    );
    if (selectedOrder?.id === id) {
      setSelectedOrder((prev) => ({ ...prev, note: noteText }));
    }
    setIsNoteModalOpen(false);
    setNoteOrder(null);
    try {
      await fetch(`/api/orders/${id}/note`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: noteText }),
      });
    } catch (e) {
      console.error("Failed to update note", e);
      alert("Failed to save note to server");
    } finally {
      setTimeout(() => { activeRequestsRef.current = Math.max(0, activeRequestsRef.current - 1); }, 2000);
    }
  };
  const openNoteModal = (order) => {
    setNoteOrder(order);
    setIsNoteModalOpen(true);
  };
  const handleStatusWidgetClick = (statusKey) => {
    if (statusFilter === statusKey) {
      setStatusFilter(null);
    } else {
      setStatusFilter(statusKey);
    }
    setCurrentPage(1);
  };
  // --- UPDATED FILTER LOGIC FOR NO ANSWER AND READY TO SHIP ---
  const filteredOrders = useMemo(() => {
    let filtered = orders.filter(
      (o) =>
        o.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.customer?.phone?.includes(searchTerm) ||
        o.id?.toString().includes(searchTerm)
    );
     
    // Apply date range filter
    if (dateRange && dateRange.from) {
      const fromDate = new Date(dateRange.from);
      fromDate.setHours(0, 0, 0, 0);
       
      const toDate = dateRange.to ? new Date(dateRange.to) : new Date(dateRange.from);
      toDate.setHours(23, 59, 59, 999);
       
      filtered = filtered.filter((o) => {
        const orderDate = new Date(o.date);
        return orderDate >= fromDate && orderDate <= toDate;
      });
    }
     
    if (statusFilter === "No Answer") {
      // Logic for the specific No Answer tab: Call Status is No Answer AND Status is NOT Fake/Cancelled/Returned
      filtered = filtered.filter((o) => 
        o.callStatus === "No Answer" && 
        !["Fake", "Cancelled", "Returned", "Abandoned"].includes(o.status)
      );
    } else if (statusFilter === "ConfirmedProcessing") {
      // Logic for Ready to Ship (Processing + Confirmed)
      filtered = filtered.filter((o) => o.status === "Processing" && o.callStatus === "Confirmed");
    } else if (statusFilter) {
      // Logic for standard status tabs
      filtered = filtered.filter((o) => o.status === statusFilter);
    }
    return filtered;
  }, [orders, searchTerm, statusFilter, dateRange]);
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(start, start + itemsPerPage);
  }, [filteredOrders, currentPage, itemsPerPage]);
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(startItem + itemsPerPage - 1, filteredOrders.length);
  // --- UPDATED WIDGETS CONFIGURATION ---
  const statusWidgets = [
    {
      label: "Processing",
      key: "Processing",
      icon: CircleDot,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
    },
    // NEW IN REVIEW WIDGET
    {
      label: "In Review",
      key: "In Review",
      icon: Eye,
      color: "text-indigo-400",
      bg: "bg-indigo-500/10",
      border: "border-indigo-500/20",
    },
    // NEW READY TO SHIP WIDGET (Confirmed Processing)
    {
      label: "Ready",
      key: "ConfirmedProcessing",
      icon: ClipboardCheck,
      color: "text-teal-400",
      bg: "bg-teal-500/10",
      border: "border-teal-500/20",
    },
    {
      label: "No Answer",
      key: "No Answer",
      icon: PhoneOff,
      color: "text-rose-400",
      bg: "bg-rose-500/10",
      border: "border-rose-500/20",
    },
    {
      label: "Shipped",
      key: "Shipped",
      icon: Truck,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
    },
    {
      label: "Delivered",
      key: "Delivered",
      icon: CheckCircle,
      color: "text-green-400",
      bg: "bg-green-500/10",
      border: "border-green-500/20",
    },
    {
      label: "Cancelled",
      key: "Cancelled",
      icon: XCircle,
      color: "text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-500/20",
    },
    {
      label: "Returned",
      key: "Returned",
      icon: RotateCcw,
      color: "text-orange-400",
      bg: "bg-orange-500/10",
      border: "border-orange-500/20",
    },
    {
      label: "Fake",
      key: "Fake",
      icon: Ghost,
      color: "text-slate-400",
      bg: "bg-slate-500/10",
      border: "border-slate-500/20",
    },
  
  ];
  return (
    <div className="inter-font bg-gray-900 text-gray-100 min-h-screen p-4 md:p-8 relative">
      <style>{`.inter-font { font-family: "Inter", sans-serif; } .custom-scrollbar::-webkit-scrollbar { width: 6px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #374151; border-radius: 4px; }`}</style>
      <AbandonConfirmationModal
        isOpen={showAbandonConfirm}
        onClose={() => setShowAbandonConfirm(false)}
        onConfirm={proceedWithAbandon}
        customerName={orderToAbandon?.customer?.name || "Customer"}
      />
      <NoteModal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        onSave={handleSaveNote}
        order={noteOrder}
        initialNote={noteOrder?.note}
      />
      <OrderIdsModal
        isOpen={isOrderIdsModalOpen}
        onClose={() => setIsOrderIdsModalOpen(false)}
        orderIdsText={orderIdsText}
        title={orderIdsModalConfig.title}
        subtitle={orderIdsModalConfig.subtitle}
      />
      {selectedOrder && (
        <OrderModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={(val) => handleStatusChange(selectedOrder.id, val)}
          onCallStatusChange={(val) =>
            handleCallStatusChange(selectedOrder.id, val)
          }
          onShippingMethodChange={(val) =>
            handleShippingMethodChange(selectedOrder.id, val)
          }
          onPriceChange={(val) => handlePriceChange(selectedOrder.id, val)}
          onLocationChange={(d, t, a) => handleLocationChange(selectedOrder.id, d, t, a)}
          onCustomerInfoChange={(name, phone) => handleCustomerInfoChange(selectedOrder.id, name, phone)}
        />
      )}
      <header className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Book Order Dashboard
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Manage your orders and shipments efficiently.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400 bg-gray-800 px-3 py-1.5 rounded-full border border-gray-700">
          <Clock size={14} />
          {currentTime.toLocaleString()}
        </div>
      </header>
      {/* STATISTICS SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Today's", value: stats.today },
          { label: "Yesterday's", value: stats.yesterday },
          { label: "This Month's", value: stats.thisMonth },
        ].map((s, i) => (
          <div
            key={i}
            className="bg-gray-800 rounded-xl p-5 border border-gray-700 shadow-lg hover:border-gray-600 transition-colors"
          >
            <h3 className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-1">
              {s.label}
            </h3>
            <p className="text-3xl font-bold text-white">{s.value}</p>
          </div>
        ))}
      </div>
      {/* Mobile Collapsible View for Status Widgets */}
      <div className="md:hidden bg-gray-800 rounded-xl border border-gray-700 mb-6 overflow-hidden">
        <button
          onClick={() => setIsStatusWidgetOpen(!isStatusWidgetOpen)}
          className="w-full p-4 flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-3">
            <CircleDot size={20} className="text-gray-400" />
            <span className="font-medium text-white">Order Status</span>
          </div>
          {isStatusWidgetOpen ? (
            <ChevronUp size={20} className="text-gray-400" />
          ) : (
            <ChevronDown size={20} className="text-gray-400" />
          )}
        </button>
        {isStatusWidgetOpen && (
          <div className="px-4 pb-4">
            <div className="grid grid-cols-2 gap-3">
              {statusWidgets.map((w) => {
                const Icon = w.icon;
                const isActive = statusFilter === w.key;
                return (
                  <div
                    key={w.key}
                    onClick={() => handleStatusWidgetClick(w.key)}
                    className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                      isActive
                        ? `${w.border} ${w.bg} ring-2 ring-white/20`
                        : `${w.border} ${w.bg} hover:border-white/50`
                    }`}
                  >
                    <div
                      className={`p-2.5 rounded-lg bg-gray-900/50 ${w.color} shadow-sm`}
                    >
                      <Icon size={20} />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] text-gray-400 font-semibold uppercase">
                        {w.label}
                      </p>
                      <p className="text-xl font-bold text-white">
                        {statusCounts[w.key] || 0}
                      </p>
                    </div>
                    {isActive && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      {/* Desktop Grid View for Status Widgets */}
      <div className="hidden md:grid md:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
        {statusWidgets.map((w) => {
          const Icon = w.icon;
          const isActive = statusFilter === w.key;
          return (
            <div
              key={w.key}
              onClick={() => handleStatusWidgetClick(w.key)}
              className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.02] ${
                isActive
                  ? `${w.border} ${w.bg} ring-2 ring-white/20`
                  : `${w.border} ${w.bg} hover:border-white/50`
              }`}
            >
              <div
                className={`p-2.5 rounded-lg bg-gray-900/50 ${w.color} shadow-sm`}
              >
                <Icon size={20} />
              </div>
              <div className="flex-1">
                <p className="text-[10px] md:text-xs text-gray-400 font-semibold uppercase">
                  {w.label}
                </p>
                <p className="text-2xl font-bold text-white">
                  {statusCounts[w.key] || 0}
                </p>
              </div>
              {isActive && (
                <div className="w-2 h-2 bg-white rounded-full"></div>
              )}
            </div>
          );
        })}
      </div>
      {/* Active Filter Indicators */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {statusFilter && (
          <>
            <span className="text-sm text-gray-400">Active filter:</span>
            {statusFilter === "No Answer" ? (
              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-white bg-rose-600 shadow-sm">
                <PhoneOff size={14} />
                No Answer
              </span>
            ) : statusFilter === "ConfirmedProcessing" ? (
              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-white bg-teal-600 shadow-sm">
                <ClipboardCheck size={14} />
                Ready to Ship
              </span>
            ) : (
              <StatusBadge status={statusFilter} />
            )}
            <button
              onClick={() => setStatusFilter(null)}
              className="text-xs text-gray-400 hover:text-white underline"
            >
              Clear filter
            </button>
          </>
        )}
         
        {dateRange && (
          <>
            <span className="text-sm text-gray-400">Date range:</span>
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-white bg-blue-600 shadow-sm">
              <Calendar size={14} />
              {dateRange.from && dateRange.to
                ? dateRange.from.getTime() === dateRange.to.getTime()
                  ? format(dateRange.from, "MMM dd, yyyy")
                  : `${format(dateRange.from, "MMM dd")} - ${format(dateRange.to, "MMM dd, yyyy")}`
                : "Custom range"
            }
            </span>
            {selectedPreset && (
              <span className="text-xs text-gray-400">
                ({DATE_PRESETS.find(p => p.value === selectedPreset)?.label})
              </span>
            )}
          </>
        )}
      </div>
      {/* SEARCH AND DATE FILTER SECTION */}
      <div className="flex flex-col lg:flex-row gap-3 bg-gray-800/50 p-3 md:p-4 rounded-xl border border-gray-700/50 mb-5 lg:items-center">
        {/* Search */}
        <div className="relative w-full lg:flex-1">
          <input
            type="text"
            placeholder="Search by name, phone, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="inter-font w-full rounded-xl border border-gray-600 bg-gray-900 py-2.5 pl-10 pr-4 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all text-sm"
          />
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
        </div>

        {/* Date Picker + Actions + Rows */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0">
            <DateRangePicker
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              selectedPreset={selectedPreset}
              onPresetChange={setSelectedPreset}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={async () => {
                if (isSyncing) return;
                setIsSyncing(true);
                try {
                  const { syncActiveCouriers } = await import('@/app/actions/sync-courier');
                  const res = await syncActiveCouriers();
                  alert(res.message);
                  if (res.updated > 0 || res.reverted > 0) window.location.reload();
                } catch (e) {
                  console.error(e);
                  alert("Failed to sync couriers");
                } finally {
                  setIsSyncing(false);
                }
              }}
              disabled={isSyncing}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed group min-w-[140px]"
            >
              {isSyncing ? <><Loader2 size={14} className="animate-spin" /> Syncing...</> : <><RefreshCw size={14} className="group-hover:animate-spin" /> Sync Courier</>}
            </button>

            {statusFilter === "In Review" && (
              <button
                onClick={() => {
                  const idsString = filteredOrders.map((o) => o.consignmentId).filter(Boolean).join(", ");
                  setOrderIdsText(idsString);
                  setIsOrderIdsModalOpen(true);
                }}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-colors shadow-sm whitespace-nowrap"
              >
                <Package size={14} /> Consignment IDs
              </button>
            )}

            {statusFilter === "ConfirmedProcessing" && (
              <button
                onClick={handleOpenBulkCourierModal}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-500 text-white text-sm font-bold rounded-xl transition-all shadow-md border border-green-500/50 whitespace-nowrap"
              >
                <Send size={14} /> Send Bulk Courier
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0 lg:ml-auto lg:pl-3 lg:border-l lg:border-gray-700">
            <span className="text-xs text-gray-500 whitespace-nowrap hidden sm:block">Rows:</span>
            <div className="relative">
              <select
                value={itemsPerPage}
                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="inter-font appearance-none rounded-lg border border-gray-600 bg-gray-900 py-2 pl-3 pr-7 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <ChevronDown size={12} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        </div>
      </div>
      {/* TABLE SECTION */}
      <div className="md:overflow-hidden md:rounded-xl md:border md:border-gray-700 bg-transparent md:bg-gray-800 md:shadow-xl">
        <div className="w-full relative">
          <table className="inter-font w-full block md:table md:min-w-full divide-y md:divide-y divide-transparent md:divide-gray-700">
            <thead className="bg-gray-900/50 hidden md:table-header-group w-full block">
              <tr>
                  {/* Data covers ID, Buttons, Name */}
                  <th colSpan="3" className="px-2 md:px-5 py-3 md:py-4 font-semibold text-left text-[10px] md:text-xs uppercase tracking-wider text-gray-400">Order info</th>
                  
                  {/* Time hidden on very small screens */}
                  <th className="hidden lg:table-cell px-5 py-4 font-semibold text-left text-xs uppercase tracking-wider text-gray-400">Time</th>
                  
                  {/* Address & Shipping hidden on tablet/mobile */}
                  <th colSpan="2" className="hidden lg:table-cell px-5 py-4 font-semibold text-left text-xs uppercase tracking-wider text-gray-400">Geography</th>
                  
                  {/* Price hidden on mobile */}
                  <th className="hidden md:table-cell px-5 py-4 font-semibold text-left text-xs uppercase tracking-wider text-gray-400">Price</th>
                  
                  {/* Courier hidden on mobile */}
                  <th className="hidden md:table-cell px-5 py-4 font-semibold text-left text-xs uppercase tracking-wider text-gray-400 min-w-[120px]">Courier</th>
                  
                  {/* Status */}
                  <th className="px-2 md:px-5 py-3 md:py-4 font-semibold text-left text-[10px] md:text-xs uppercase tracking-wider text-gray-400 text-center md:text-left">Status</th>
                  
                  {/* Call */}
                  <th className="px-2 md:px-5 py-3 md:py-4 font-semibold text-right text-[10px] md:text-xs uppercase tracking-wider text-gray-400">Call</th>
              </tr>
            </thead>
            <tbody className="divide-y-0 md:divide-y divide-transparent md:divide-gray-700 bg-transparent md:bg-gray-800 block md:table-row-group w-full outline-none">
              {paginatedOrders.length > 0 ? (
                paginatedOrders.map((order, index) => {
                  const { location, color } = getShippingLocation(
                    order.shippingCost
                  );
                  // --- READINESS CHECK ---
                  const isReadyToShip = !order.trackingCode
                    && order.callStatus === "Confirmed"
                    && !!order.district
                    && !!order.thana
                    && !["Fake", "Cancelled", "Returned", "Abandoned", "Shipped", "Delivered"].includes(order.status);
                  const needsWork = !order.trackingCode
                    && !["Fake", "Cancelled", "Returned", "Abandoned", "Shipped", "Delivered"].includes(order.status)
                    && !isReadyToShip;
                  return (
                    <React.Fragment key={order.id}>
                      {/* DESKTOP ROW */}
                      <tr
                        onClick={() => setPinnedOrderId(prev => prev === order.id ? null : order.id)}
                        className={`hidden md:table-row cursor-pointer transition-all duration-300 ${
                          pinnedOrderId === order.id
                            ? "bg-indigo-600/25 ring-1 ring-indigo-500 shadow-[inset_4px_0_0_0_#6366f1] relative z-10"
                            : isReadyToShip
                              ? "bg-emerald-950/30 shadow-[inset_4px_0_0_0_#10b981] hover:bg-emerald-900/20"
                              : needsWork
                                ? "shadow-[inset_4px_0_0_0_#f59e0b] hover:bg-gray-700/40 " + (index % 2 === 0 ? "bg-gray-700/25" : "")
                                : `hover:bg-gray-700/40 ${index % 2 === 0 ? "bg-gray-700/25" : ""}`
                        }`}
                      >
                      <td className="whitespace-nowrap py-4 px-4 text-sm font-mono">
                        <div className="flex flex-col gap-1">
                          <span className="text-blue-400">#{order.orderId}</span>
                          {isReadyToShip && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded-full w-fit">
                              <CheckCircle size={9} /> Ready
                            </span>
                          )}
                          {needsWork && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded-full w-fit">
                              <AlertTriangle size={9} /> Incomplete
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap py-4 px-4">
                        <div className="flex items-center gap-2">
                           {/* VIEW BUTTON WITH INDICATOR */}
                           <button
                             onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); setPinnedOrderId(order.id); }}
                             className="p-1.5 rounded-lg transition-all relative border border-transparent bg-gray-700 text-gray-300 hover:bg-blue-600 hover:text-white hover:border-blue-500"
                             title="View Details"
                           >
                             <Eye size={16} />
                             {order.note && (
                               <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                                 <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-yellow-500"></span>
                               </span>
                             )}
                           </button>
                           {/* NOTE BUTTON WITH INDICATOR */}
                           <button
                             onClick={(e) => { e.stopPropagation(); openNoteModal(order); }}
                             className={`p-1.5 rounded-lg transition-all border ${
                               order.note
                                 ? "bg-yellow-500 text-black border-yellow-400 hover:bg-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.5)]"
                                 : "bg-gray-700 text-gray-400 border-transparent hover:bg-gray-600 hover:text-white"
                             }`}
                             title={order.note ? "Edit Note" : "Add Note"}
                           >
                             <StickyNote
                               size={16}
                               fill={order.note ? "currentColor" : "none"}
                             />
                           </button>
                          </div>
                      </td>
                      <td className="whitespace-nowrap py-4 px-4 text-sm">
                             <div className="font-medium text-white text-sm max-w-[200px] truncate">
                               {order.customer?.name || order.name || "N/A"}
                             </div>
                             <div className="text-xs text-gray-400 mt-0.5 truncate">
                               <a 
                                 href={`tel:${order.customer?.phone || order.number}`} 
                                 onClick={(e) => { e.stopPropagation(); setPinnedOrderId(order.id); }} 
                                 className="hover:underline hover:text-blue-400 transition-colors"
                               >
                                 {order.customer?.phone || order.number || "N/A"}
                               </a>
                               {order.smsStatus === "Sent" && (
                                 <CheckCircle size={10} className="inline ml-1 text-green-400" />
                               )}
                             </div>
                      </td>
                      <td className="whitespace-nowrap py-4 px-4 text-sm text-gray-400">
                          <div className="flex items-center gap-1.5 text-[10px] bg-gray-900/50 px-2 py-1 rounded border border-gray-700 w-fit text-gray-400 mt-1">
                             <Clock size={10} />
                             {formatTimeAgo(order.date)}
                          </div>
                      </td>

                      {/* ADDRESS COLUMN (Split into text and location) */}
                      <td
                        className="py-4 px-4 text-sm text-gray-300 max-w-[200px] truncate"
                        title={order.address}
                      >
                         {order.address || "N/A"}
                      </td>
                      <td className="whitespace-nowrap py-4 px-4 text-sm">
                           <div className="text-white font-medium">
                             {order.shippingMethod}
                           </div>
                           <div className={`flex items-center gap-1 ${color} text-xs mt-0.5`}>
                             <MapPin size={10} />
                             {location} ({order.shippingCost}৳)
                           </div>
                      </td>

                      {/* PRICE COLUMN */}
                      <td className="whitespace-nowrap py-4 px-4 text-sm font-bold text-white">
                        {order.totalValue} ৳
                      </td>

                      {/* COURIER / TRACKING COLUMN */}
                      <td className="px-5 py-4 min-w-[120px]">
                        {order.trackingCode ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium shadow-sm transition-all hover:bg-indigo-500/20" title={order.trackingCode}>
                            <Truck size={14} className="text-indigo-400" />
                            <span>Steadfast</span>
                            <CheckCircle size={14} className="text-green-500 ml-0.5" />
                          </div>
                        ) : order.status !== "Fake" && order.status !== "Cancelled" && order.status !== "Abandoned" ? (
                          <button
                            title="Send to Steadfast Courier"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenCourierModal(order);
                            }}
                            className="inline-flex w-fit items-center gap-2 px-3 py-1.5 rounded-lg bg-green-600/90 text-white hover:bg-green-500 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-green-900/40 transition-all shadow-md active:translate-y-0 border border-green-500/50"
                          >
                            <Send size={14} />
                            <span className="text-[10px] font-bold tracking-widest leading-none pt-0.5">COURIER</span>
                          </button>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-800/30 border border-gray-700 text-gray-500 text-[10px] font-medium border-dashed transition-all hover:bg-gray-800/50">
                             <span className="italic">Not sent</span>
                          </div>
                        )}
                      </td>

                      {/* STATUS COLUMN */}
                      <td className="whitespace-nowrap py-4 px-4 text-sm">
                        <StatusBadge status={order.status} />
                      </td>

                      {/* CALL STATUS COLUMN */}
                      <td className="whitespace-nowrap py-4 px-4 text-sm" onClick={(e) => e.stopPropagation()}>
                        <CallStatusDropdown
                          currentStatus={order.callStatus}
                          onStatusChange={(val) =>
                            handleCallStatusChange(order.id, val)
                          }
                        />
                      </td>
                    </tr>

                    {/* MOBILE CARD ROW */}
                    <tr className="md:hidden block mb-3 w-full">
                      <td colSpan="10" className="block p-0 w-full outline-none">
                        <div
                          onClick={() => setPinnedOrderId(prev => prev === order.id ? null : order.id)}
                          className={`flex flex-col gap-0 active:scale-[0.99] transition-transform relative overflow-hidden rounded-2xl cursor-pointer ${
                            pinnedOrderId === order.id
                              ? "bg-indigo-900/40 border border-indigo-500/80 shadow-[0_4px_20px_rgba(99,102,241,0.25)] ring-1 ring-indigo-500/50 z-10"
                              : isReadyToShip
                                ? "bg-emerald-950/40 border border-emerald-500/40 shadow-[0_2px_12px_rgba(16,185,129,0.12)]"
                                : needsWork
                                  ? "bg-gray-800/90 border-l-[3px] border-l-amber-500 border border-gray-700/60 shadow-md"
                                  : "bg-gray-800/90 border border-gray-700/50 shadow-md"
                          }`}
                        >
                          {/* ── Card Header ── */}
                          <div className="px-4 pt-4 pb-3 flex items-start gap-3">
                            {/* Left: Avatar circle */}
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                              isReadyToShip ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : needsWork ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-gray-700 text-gray-300 border border-gray-600'
                            }`}>
                              {(order.customer?.name || order.name || '?').charAt(0).toUpperCase()}
                            </div>

                            {/* Middle: Name + Phone */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-white font-semibold text-sm leading-tight truncate max-w-[170px]">{order.customer?.name || order.name || 'N/A'}</span>
                                {/* Status pill inline with name */}
                                {(isReadyToShip || needsWork) && (
                                  <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                                    isReadyToShip
                                      ? 'text-emerald-300 bg-emerald-500/20 border border-emerald-500/30'
                                      : 'text-amber-300 bg-amber-500/20 border border-amber-500/30'
                                  }`}>
                                    {isReadyToShip ? <><CheckCircle size={8} />Ready</> : <><AlertTriangle size={8} />Incomplete</>}
                                  </span>
                                )}
                              </div>
                              <a
                                href={`tel:${order.customer?.phone || order.number}`}
                                onClick={(e) => { e.stopPropagation(); setPinnedOrderId(order.id); }}
                                className="flex items-center gap-1.5 mt-1 text-xs text-blue-400 font-medium hover:text-blue-300 w-fit"
                              >
                                <Phone size={11} className="shrink-0" />
                                <span>{order.customer?.phone || order.number || 'N/A'}</span>
                                {order.smsStatus === 'Sent' && <CheckCircle size={11} className="text-green-500" />}
                              </a>
                            </div>

                            {/* Right: Time + Actions */}
                            <div className="flex flex-col items-end gap-2 shrink-0">
                              <div className="flex items-center gap-1 text-[10px] text-gray-500">
                                <Clock size={9} />
                                <span>{formatTimeAgo(order.date)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); setPinnedOrderId(order.id); }}
                                  className="p-1.5 rounded-lg transition-all border bg-gray-700/80 border-gray-600/60 text-gray-400 hover:text-white hover:bg-blue-600 hover:border-blue-500 hover:shadow-[0_0_8px_rgba(37,99,235,0.4)]"
                                  title="View Details"
                                >
                                  <Eye size={13} />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); openNoteModal(order); }}
                                  className={`p-1.5 rounded-lg transition-all border ${
                                    order.note
                                      ? 'bg-yellow-500 text-black border-yellow-400 shadow-[0_0_8px_rgba(234,179,8,0.4)]'
                                      : 'bg-gray-700/80 border-gray-600/60 text-gray-500 hover:text-white hover:bg-gray-600'
                                  }`}
                                  title={order.note ? 'Edit Note' : 'Add Note'}
                                >
                                  <StickyNote size={13} fill={order.note ? 'currentColor' : 'none'} />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* ── Address + Location row ── */}
                          <div className="px-4 pb-3 flex items-center justify-between gap-2 w-full min-w-0">
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                              <MapPin size={11} className={`shrink-0 ${color}`} />
                              <span className="text-gray-400 text-[11px] truncate flex-1 min-w-0 leading-tight pr-1">
                                {order.district ? order.district : (order.address || 'Address N/A')}
                              </span>
                            </div>
                            <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border shrink-0 min-w-max ${
                              color === 'text-teal-400' ? 'border-teal-500/30 bg-teal-500/10 text-teal-300'
                              : 'border-orange-500/30 bg-orange-500/10 text-orange-300'
                            }`}>
                              {order.shippingMethod === 'Inside Dhaka' ? 'INSIDE DHAKA' : 'OUTSIDE DHAKA'}
                            </span>
                          </div>

                          {/* ── Actions row ── */}
                          <div
                            className="px-3 py-2.5 bg-gray-900/50 border-t border-gray-700/40 flex items-center gap-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {/* Status badge */}
                            <StatusBadge status={order.status} />

                            {/* Steadfast badge */}
                            {order.trackingCode && (
                              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold shrink-0">
                                <Truck size={10} /> Steadfast
                              </div>
                            )}

                            {/* Call status – takes remaining space */}
                            <div className="ml-auto">
                              <CallStatusDropdown
                                currentStatus={order.callStatus}
                                onStatusChange={(val) => handleCallStatusChange(order.id, val)}
                              />
                            </div>
                          </div>

                          {/* ── Note preview (if exists) ── */}
                          {order.note && (
                            <div className="mx-3 mb-3 mt-1 flex items-start gap-2 p-2.5 bg-yellow-500/10 border border-yellow-500/20 rounded-xl relative overflow-hidden">
                              <div className="absolute top-0 left-0 w-[3px] h-full bg-yellow-500 rounded-l-xl" />
                              <StickyNote size={11} className="text-yellow-500 mt-0.5 shrink-0" />
                              <span className="text-xs text-yellow-100/80 italic leading-snug">{order.note}</span>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                   </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="10" className="py-12 text-center">
                    <Package size={48} className="mx-auto text-gray-600 mb-3" />
                    <p className="text-gray-400 text-lg">
                      No orders found matching your criteria.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {totalPages > 1 && (
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <p className="text-gray-400">
            Showing <span className="font-medium text-white">{startItem}</span>{" "}
            to <span className="font-medium text-white">{endItem}</span> of{" "}
            <span className="font-medium text-white">
              {filteredOrders.length}
            </span>
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-600 bg-gray-800 py-2 px-4 font-medium text-white hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              <ChevronLeft size={16} />
              Prev
            </button>
            <span className="bg-gray-800 text-white px-3 py-2 rounded-lg border border-gray-600 font-mono">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-600 bg-gray-800 py-2 px-4 font-medium text-white hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
      <CourierModal
        isOpen={isCourierModalOpen}
        onClose={() => setIsCourierModalOpen(false)}
        onConfirm={handleConfirmCourierSend}
        order={courierOrder}
        isSending={isSendingCourier}
      />

      {/* Bulk Courier Modal */}
      {isBulkCourierModalOpen && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-gray-900 border border-green-500/30 rounded-xl w-full max-w-sm shadow-2xl overflow-hidden shadow-green-500/10 transform scale-100">
             <div className="flex flex-col items-center text-center p-6 space-y-4">
                <div className="w-14 h-14 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center text-green-500 shadow-inner">
                  <Send size={24} />
                </div>
                <h3 className="text-xl font-bold text-white">
                  Bulk Courier Dispatch
                </h3>
                <p className="text-sm text-gray-300">
                  Are you sure you want to send <strong className="text-white bg-gray-800 px-1 py-0.5 rounded border border-gray-700">{bulkOrdersCount}</strong> orders to the Steadfast Courier right now?
                  <br />
                  <br />
                  <span className="text-xs text-red-400">
                    This will dispatch the orders and change their status to "Shipped".        
                  </span>
                </p>
                <div className="flex gap-3 w-full mt-4">
                  <button
                    onClick={() => setIsBulkCourierModalOpen(false)}
                    disabled={isSendingBulkCourier}
                    className="flex-1 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmBulkCourierSend}
                    disabled={isSendingBulkCourier || bulkOrdersCount === 0}
                    className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-500 text-white text-sm font-bold rounded-lg transition-colors flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSendingBulkCourier ? <><Loader2 size={16} className="animate-spin" /> Dispatching...</> : 'Yes, Dispatch'}
                  </button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}