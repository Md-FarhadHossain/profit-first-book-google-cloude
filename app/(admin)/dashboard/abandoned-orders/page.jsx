"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, ChevronLeft, ChevronRight, ChevronDown, 
  Package, Truck, CheckCircle, CircleDot, MapPin, Clock,
  XCircle, Eye, X, User, Phone, Calendar, DollarSign,
  PhoneCall, PhoneOff, Check, Smartphone, Globe, Zap, 
  ShieldCheck, ShoppingBag,
  AlertTriangle, Share2, ArrowRightCircle, TrendingUp, BarChart2, Target, Users2, Edit,
  StickyNote, Save
} from 'lucide-react';
import { UAParser } from 'ua-parser-js'; 
import { SteadfastPill, FraudCheckerBadge } from '@/components/SteadfastWidgets';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";

// --- CONFIGURATION ---
const CALL_OPTIONS = [
  { label: 'Pending', value: 'Pending' },
  { label: 'Confirmed', value: 'Confirmed' }, 
  { label: 'No Answer', value: 'No Answer' },
];

const DEVICE_CODEX = {
  '23129RAA4G': 'Redmi Note 13 5G',
  '23124RA7EO': 'Redmi Note 13 4G',
  'SM-S918B': 'Galaxy S23 Ultra',
  'SM-S908B': 'Galaxy S22 Ultra',
  'iPhone16,1': 'iPhone 15 Pro',
  'iPhone16,2': 'iPhone 15 Pro Max',
};

// --- HELPER: USER AGENT PARSER ---
const getDeepUserAgentInfo = (uaString) => {
  if (!uaString) return null;
  const parser = new UAParser(uaString);
  const result = parser.getResult();
  
  const rawModel = result.device.model || 'PC/Unknown';
  const marketingName = DEVICE_CODEX[rawModel] || rawModel;
  const vendor = result.device.vendor || '';

  let appSource = { name: 'Browser', code: 'Web', insight: 'Standard Web Browser' };
  if (uaString.includes('FB_IAB') || uaString.includes('FB4A')) {
      appSource = { name: 'Facebook App', code: 'FB_IAB', insight: 'User came from Facebook Feed/Ads' };
  } else if (uaString.includes('Instagram')) {
      appSource = { name: 'Instagram', code: 'IG', insight: 'User came from Instagram' };
  } else if (uaString.includes('WhatsApp')) {
      appSource = { name: 'WhatsApp', code: 'WA', insight: 'User came from WhatsApp Link' };
  }

  return {
    device: {
        vendor,
        marketingName,
        rawModel,
        os: `${result.os.name || 'Unknown OS'} ${result.os.version || ''}`.trim()
    },
    browser: `${result.browser.name || 'Unknown'}`,
    appSource,
    summary: `${vendor} ${marketingName} on ${result.os.name}. Source: ${appSource.name}.`
  };
};

// --- HELPER COMPONENTS ---

const StatusDropdown = ({ status, onStatusChange }) => {
  const styles = {
    Processing: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    Cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
    Fake: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    Duplicate: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  };
  const activeStyle = styles[status] || styles.Processing;

  return (
    <div className="relative inline-block">
      <select
        value={status || 'Processing'}
        onChange={(e) => onStatusChange(e.target.value)}
        className={`appearance-none rounded-md pl-2.5 pr-6 py-1 text-xs font-medium border focus:outline-none cursor-pointer ${activeStyle}`}
      >
        <option value="Processing" className="bg-gray-900 text-white">Processing</option>
        <option value="Cancelled" className="bg-gray-900 text-white">Cancel</option>
        <option value="Fake" className="bg-gray-900 text-white">Fake</option>
        <option value="Duplicate" className="bg-gray-900 text-white">Duplicate Order</option>
      </select>
      <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
    </div>
  );
};

const CallStatusDropdown = ({ currentStatus, onStatusChange }) => {
    const statusStyles = {
      Confirmed: 'border-green-500/50 bg-green-500/20 text-green-400',
      'No Answer': 'border-red-500/50 bg-red-500/20 text-red-400',
      'Pending': 'border-yellow-500/50 bg-yellow-500/20 text-yellow-400'
    };
    const currentStyle = statusStyles[currentStatus] || statusStyles['Pending'];
    
    return (
      <div className="relative w-28 inline-block"> 
        <select
          value={currentStatus || 'Pending'}
          onChange={(e) => onStatusChange(e.target.value)}
          className={`appearance-none w-full rounded-md border py-1 pl-2.5 pr-6 text-xs font-medium shadow-sm focus:outline-none transition-colors cursor-pointer ${currentStyle}`}
        >
          {CALL_OPTIONS.map((option) => (
            <option key={option.value} value={option.value} className="bg-gray-900 text-white">
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
      </div>
    );
};

// --- NOTE MODAL ---
const NoteModal = ({ onClose, onSave, order, initialNote }) => {
  const [noteText, setNoteText] = useState(initialNote || "");

  if (!order) return null;

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
              <p className="text-xs text-gray-400">For {order.customer?.name || order.name || 'Anonymous'}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        {/* Body */}
        <div className="p-6">
          <label className="block text-sm text-gray-400 mb-2 font-medium">
            Special instructions or internal details:
          </label>
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            className="w-full h-32 bg-gray-950 border border-gray-700 rounded-lg p-3 text-gray-200 text-sm focus:outline-none focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 resize-none shadow-inner"
            placeholder="e.g. Customer requested call after 4 PM, confirm color/address..."
            autoFocus
          />
          <div className="mt-4 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 font-medium transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(order._id, noteText)}
              className="flex-1 py-2.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-500 font-bold transition-colors text-sm flex items-center justify-center gap-2 shadow-lg shadow-yellow-600/20"
            >
              <Save size={16} /> Save Note
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- CONFIRMATION POPUP ---
const ConfirmationModal = ({ isOpen, onClose, onConfirm, customerName, isMigrating }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-sm w-full shadow-2xl transform scale-100">
                <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 mb-4">
                        <ArrowRightCircle size={24} className={isMigrating ? "animate-spin" : ""} />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{isMigrating ? "Migrating..." : "Migrate Order?"}</h3>
                    <p className="text-sm text-gray-400 mb-6">
                        {isMigrating ? (
                          "Please wait while we migrate this order to the dashboard..."
                        ) : (
                          <>
                            Are you sure you want to move <strong>{customerName}</strong>&apos;s abandoned cart to the active orders list? 
                            <br/><br/>
                            <span className="text-xs text-gray-500">This creates an active confirmed order while tracking its abandoned origin.</span>
                          </>
                        )}
                    </p>
                    <div className="flex gap-3 w-full">
                        <button onClick={onClose} disabled={isMigrating} className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium rounded-lg transition-colors disabled:opacity-50">
                            Cancel
                        </button>
                        <button onClick={onConfirm} disabled={isMigrating} className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                            {isMigrating ? (
                                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Migrating...</>
                            ) : "Yes, Migrate"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- MAIN DETAILS MODAL ---
const OrderModal = ({ 
  order, 
  onClose, 
  onStatusChange, 
  onCallStatusChange, 
  onMigrateRequest, 
  onCustomerInfoChange, 
  onLocationChange,
  onScheduleChange,
  onOpenNoteModal
}) => {
  const [isEditingCustomer, setIsEditingCustomer] = useState(false);
  const [customerName, setCustomerName] = useState(order?.customer?.name || order?.name || "");
  const [customerPhone, setCustomerPhone] = useState(order?.customer?.phone || order?.number || "");
  const [customerGender, setCustomerGender] = useState(order?.gender || "");

  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [address, setAddress] = useState(order?.address || "");
  const [scheduledDate, setScheduledDate] = useState(order?.scheduledDate || "");

  if (!order) return null;
  const ua = getDeepUserAgentInfo(order.userAgent);
  const cartItem = order.items?.[0] || {}; 

  // FIXED: Read values from root `order` object, falling back to `cartItem` only if necessary
  const shippingMethod = order.shipping || cartItem.shippingMethod || 'Standard';
  const shippingCost = order.shippingCost || cartItem.shippingCost || 0;
  const totalAmount = order.totalValue || cartItem.totalAmount || 0;
  const productPrice = cartItem.price || cartItem.productPrice || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-5xl bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-800 bg-gray-900">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full ${order.status === 'Cancelled' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
              <ShoppingBag size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {order.customer.name || 'Unknown Guest'}
              </h2>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span>{order.customer.phone}</span>
                <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                <span className="font-mono text-gray-500">ID: {order.orderId || 'N/A'}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Column 1: Cart & Financials */}
            <div className="lg:col-span-2 space-y-6">

              {/* SPECIAL NOTE HIGHLIGHT / ACTION */}
              {order.note ? (
                <div className="bg-yellow-900/15 border-l-4 border-yellow-500 rounded-r-xl p-4 flex justify-between items-start gap-4 shadow-sm">
                  <div className="flex gap-3">
                    <div className="bg-yellow-500/20 p-2 rounded-lg shrink-0 h-fit text-yellow-500">
                      <StickyNote size={18} />
                    </div>
                    <div>
                      <h4 className="text-yellow-500 font-bold text-[11px] uppercase tracking-wider mb-1">Order Note / Special Instructions</h4>
                      <p className="text-gray-200 text-sm leading-relaxed italic">&quot;{order.note}&quot;</p>
                    </div>
                  </div>
                  <button
                    onClick={() => onOpenNoteModal(order)}
                    className="text-xs text-yellow-400 hover:text-yellow-300 font-medium px-2.5 py-1 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 rounded-md transition-colors shrink-0 flex items-center gap-1.5"
                  >
                    <Edit size={11} /> Edit Note
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => onOpenNoteModal(order)}
                  className="flex items-center gap-2 text-xs text-gray-400 hover:text-yellow-400 px-4 py-3 bg-gray-800/40 hover:bg-gray-800 border border-dashed border-gray-700 hover:border-yellow-500/40 rounded-xl transition-all w-full justify-center group"
                >
                  <StickyNote size={15} className="group-hover:scale-110 transition-transform" />
                  <span>Add Note / Instructions for this Abandoned Order</span>
                </button>
              )}

              <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Package size={14} /> Cart Details
                </h3>
                <div className="flex items-start justify-between p-3 bg-gray-900 rounded-lg border border-gray-800">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center text-gray-600 font-bold text-xs">IMG</div>
                    <div>
                      <p className="text-sm font-medium text-white">Product ID: {cartItem.item_id || cartItem.postId || 'N/A'}</p>
                      <p className="text-xs text-gray-400">Price: {productPrice} ৳</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">{totalAmount} ৳</p>
                    <p className="text-[10px] text-gray-500">Total with Shipping</p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-800">
                    <p className="text-xs text-gray-500 mb-1">Shipping Method</p>
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <Truck size={14} />
                      <span className="font-medium">{shippingMethod}</span>
                    </div>
                  </div>
                  <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-800">
                    <p className="text-xs text-gray-500 mb-1">Shipping Cost</p>
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <DollarSign size={14} />
                      <span className="font-medium">{shippingCost} ৳</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-700/50 bg-gray-900/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-blue-400" />
                    <h3 className="text-xs font-bold text-gray-200">Customer Identity</h3>
                  </div>
                  {!isEditingCustomer && (
                    <button onClick={() => setIsEditingCustomer(true)} className="flex items-center gap-1.5 px-2 py-1 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg text-[10px] font-semibold text-white transition-all">
                      <Edit size={10} /> Edit Details
                    </button>
                  )}
                </div>
                <div className="p-4">
                  {isEditingCustomer ? (
                    <div className="space-y-3 bg-gray-900/50 p-4 rounded-lg border border-gray-800">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><User size={10} className="text-blue-400" /> Full Name</label>
                          <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full bg-black text-gray-200 border border-gray-700 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500 transition-all" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><Phone size={10} className="text-green-400" /> Phone Number</label>
                          <input type="text" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="w-full bg-black text-gray-200 border border-gray-700 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-green-500 transition-all" />
                        </div>
                        <div className="space-y-1.5 sm:col-span-2">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><User size={10} className="text-yellow-400" /> Gender</label>
                          <select value={customerGender} onChange={(e) => setCustomerGender(e.target.value)} className="w-full bg-black text-gray-200 border border-gray-700 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-yellow-500 transition-all">
                            <option value="">Unknown</option>
                            <option value="m">Male</option>
                            <option value="f">Female</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end mt-3">
                        <button onClick={() => { setIsEditingCustomer(false); setCustomerName(order?.customer?.name || order?.name || ""); setCustomerPhone(order?.customer?.phone || order?.number || ""); setCustomerGender(order?.gender || ""); }} className="text-[10px] text-gray-300 font-semibold px-3 py-1.5 hover:bg-gray-800 rounded-md transition-all">Cancel</button>
                        <button onClick={() => { onCustomerInfoChange(customerName, customerPhone, customerGender); setIsEditingCustomer(false); }} className="text-[10px] text-white px-4 py-1.5 bg-blue-500 hover:bg-blue-600 rounded-md font-bold transition-all flex items-center gap-1.5">
                          <Check size={12} /> Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-900/50 p-2.5 rounded-lg border border-gray-800">
                        <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Full Name</p>
                        <p className="font-semibold text-white text-xs truncate">{order.customer?.name || order.name || 'Anonymous'}</p>
                      </div>
                      <div className="bg-gray-900/50 p-2.5 rounded-lg border border-gray-800">
                        <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Phone</p>
                        <p className="font-semibold text-white text-xs truncate">{order.customer?.phone || order.number || 'No Phone'}</p>
                      </div>
                      <div className="bg-gray-900/50 p-2.5 rounded-lg border border-gray-800 col-span-2">
                        <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Gender</p>
                        <p className="font-semibold text-white text-xs">{order.gender === 'm' ? 'Male' : order.gender === 'f' ? 'Female' : 'Unknown'}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

               <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-700/50 bg-gray-900/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-rose-400" />
                    <h3 className="text-xs font-bold text-gray-200">Delivery Info</h3>
                  </div>
                  {!isEditingLocation && (
                    <button onClick={() => setIsEditingLocation(true)} className="flex items-center gap-1.5 px-2 py-1 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg text-[10px] font-semibold text-white transition-all">
                      <Edit size={10} /> Edit Address
                    </button>
                  )}
                </div>
                <div className="p-4">
                  {isEditingLocation ? (
                    <div className="space-y-3">
                      <textarea value={address} onChange={(e) => setAddress(e.target.value)} className="w-full bg-black text-gray-200 border border-gray-700 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 transition-all resize-none h-20 custom-scrollbar" />
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => { setIsEditingLocation(false); setAddress(order?.address || ""); }} className="text-[10px] text-gray-300 font-semibold px-3 py-1.5 hover:bg-gray-800 rounded-md transition-all">Cancel</button>
                        <button onClick={() => { onLocationChange(address); setIsEditingLocation(false); }} className="text-[10px] text-white px-4 py-1.5 bg-indigo-500 hover:bg-indigo-600 rounded-md font-bold transition-all flex items-center gap-1.5">
                          <Check size={12} /> Save Address
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-300 leading-relaxed bg-gray-900 p-3 rounded-lg border border-gray-800">
                      {order.address || 'No address provided'}
                    </div>
                  )}
                </div>
              </div>

              {/* SCHEDULE ORDER CARD */}
              <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 overflow-hidden shadow-lg">
                <div className="px-4 py-3 border-b border-gray-700/50 bg-gray-900/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-purple-400" />
                    <h3 className="text-xs font-bold text-gray-200 uppercase tracking-wider">Schedule Order</h3>
                  </div>
                  {scheduledDate && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      Scheduled
                    </span>
                  )}
                </div>
                <div className="p-4 flex flex-col gap-3">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <Clock size={12} className="text-purple-400" /> Set Future Delivery Date
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className="w-full flex items-center justify-between bg-black border border-gray-700 rounded-lg px-4 py-2.5 text-xs text-gray-200 hover:text-white hover:border-gray-500 focus:outline-none focus:border-purple-500 transition-all font-medium cursor-pointer">
                              {scheduledDate ? format(new Date(scheduledDate), "PPP") : <span className="text-gray-500">Pick a delivery date...</span>}
                              <Calendar size={14} className="text-gray-400" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0 bg-gray-900 border-gray-700 text-white shadow-2xl z-70" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={scheduledDate ? new Date(scheduledDate) : undefined}
                              onSelect={(date) => {
                                const dateStr = date ? format(date, "yyyy-MM-dd") : "";
                                setScheduledDate(dateStr);
                                onScheduleChange(dateStr);
                              }}
                              disabled={(date) => {
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);
                                return date <= today;
                              }}
                              initialFocus
                              className="bg-gray-900 text-white rounded-lg border border-gray-700"
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      {scheduledDate && (
                        <button 
                          onClick={() => {
                            setScheduledDate("");
                            onScheduleChange("");
                          }}
                          className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/20 transition-colors shrink-0 cursor-pointer"
                          title="Clear Schedule"
                        >
                          <X size={15} />
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1.5">
                      {scheduledDate ? `Order scheduled to be shipped on ${scheduledDate}.` : "No schedule set. Select a future date to delay delivery."}
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* Column 2: Digital Fingerprint */}
            <div className="space-y-4">
              <div className="bg-linear-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700 overflow-hidden shadow-lg relative">
                <div className="p-4 border-b border-gray-700/50 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck size={14} /> Digital Footprint
                  </h3>
                  {ua?.appSource.name.includes('Facebook') && (
                    <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full">Ads Traffic</span>
                  )}
                </div>
                
                {ua ? (
                  <div className="p-4 space-y-4">
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase mb-1">Device Hardware</p>
                      <p className="text-sm text-white font-medium flex items-center gap-2">
                        <Smartphone size={14} className="text-gray-400" /> 
                        {ua.device.vendor} <span className="text-blue-400">{ua.device.marketingName}</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase mb-1">Browser / App</p>
                      <p className="text-sm text-white font-medium flex items-center gap-2">
                        <Globe size={14} className="text-gray-400" /> {ua.appSource.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 pl-6 italic">&quot;{ua.appSource.insight}&quot;</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase mb-1">Operating System</p>
                      <p className="text-sm text-white font-medium flex items-center gap-2">
                        <Zap size={14} className="text-gray-400" /> {ua.device.os}
                      </p>
                    </div>
                    <div className="pt-3 border-t border-gray-700/50">
                      <p className="text-[10px] text-gray-500 uppercase mb-2">Network IP</p>
                      <code className="block bg-black/40 rounded px-2 py-1 text-xs text-green-500 font-mono">
                         {order.clientInfo?.ip || 'Not Captured'}
                      </code>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center text-gray-500 text-xs">No Device Data</div>
                )}
              </div>

              <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Recovery Actions</h3>
                <div className="grid grid-cols-2 gap-2">
                   <a href={`tel:${order.customer.phone}`} className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white py-2 rounded-lg text-xs font-bold transition-colors">
                     <PhoneCall size={14} /> Call Now
                   </a>
                   <a href={`https://wa.me/${order.customer.phone?.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg text-xs font-bold transition-colors">
                     <Share2 size={14} /> WhatsApp
                   </a>
                </div>
              </div>
              <FraudCheckerBadge phone={order.customer.phone} />
            </div>
          </div>
        </div>

        {/* Footer - ACTIONS */}
        <div className="px-6 py-4 bg-gray-900 border-t border-gray-800 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">Status:</span>
              <StatusDropdown status={order.status} onStatusChange={onStatusChange} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">Call Outcome:</span>
              <CallStatusDropdown currentStatus={order.callStatus} onStatusChange={onCallStatusChange} />
            </div>
          </div>
          <div className="flex items-center gap-3">
             <button
               onClick={() => onOpenNoteModal(order)}
               className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                 order.note
                   ? "bg-yellow-500 text-black border-yellow-400 hover:bg-yellow-400 shadow-[0_0_8px_rgba(234,179,8,0.3)]"
                   : "bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700 hover:text-white"
               }`}
             >
               <StickyNote size={14} fill={order.note ? "currentColor" : "none"} />
               {order.note ? "Edit Note" : "Add Note"}
             </button>

             <div className="hidden sm:block border-r border-gray-700 h-6 mx-1"></div>
             
             {/* MIGRATE BUTTON */}
             {order.isMigrated ? (
               <div className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs font-bold">
                 <CheckCircle size={14} /> Migrated ({order.migratedOrderId || 'Active'})
               </div>
             ) : (
               <button 
                  onClick={() => onMigrateRequest(order)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600/20 text-green-400 hover:bg-green-600 hover:text-white border border-green-600/30 rounded-lg text-xs font-bold transition-all cursor-pointer"
               >
                  <ArrowRightCircle size={14} /> 
                  Migrate to Active
               </button>
             )}

             <button onClick={onClose} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg ml-1 cursor-pointer">
               Save & Close
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- HELPERS: UI UTILS ---
const formatTimeAgo = (dateString) => {
  if (!dateString) return 'Unknown';
  const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "y ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "mo ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "m ago";
  return Math.floor(seconds) + "s ago";
};

// --- MAIN PAGE COMPONENT ---
export default function PendingOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showConfirmMigrate, setShowConfirmMigrate] = useState(false);
  const [orderToMigrate, setOrderToMigrate] = useState(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [notification, setNotification] = useState(null);
  
  // Note Modal state
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteOrder, setNoteOrder] = useState(null);

  // Filter tab state
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'unmigrated' | 'migrated'
  
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const stats = useMemo(() => {
    const today = new Date().setHours(0,0,0,0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();

    const isToday = (dateStr) => {
      if (!dateStr) return false;
      const d = new Date(dateStr);
      return !isNaN(d.getTime()) && d.setHours(0,0,0,0) === today;
    };

    const isYesterday = (dateStr) => {
      if (!dateStr) return false;
      const d = new Date(dateStr);
      return !isNaN(d.getTime()) && d.setHours(0,0,0,0) === yesterday.getTime();
    };

    const isThisMonth = (dateStr) => {
      if (!dateStr) return false;
      const d = new Date(dateStr);
      return !isNaN(d.getTime()) && d.getTime() >= firstDayOfMonth;
    };

    const isMigratedOrder = (o) => Boolean(o.isMigrated);

    const todayOrders = orders.filter(o => isToday(o.createdAt));
    const yesterdayOrders = orders.filter(o => isYesterday(o.createdAt));
    const thisMonthOrders = orders.filter(o => isThisMonth(o.createdAt));

    return {
      total: orders.length,
      totalMigrated: orders.filter(isMigratedOrder).length,

      today: todayOrders.length,
      todayMigrated: todayOrders.filter(isMigratedOrder).length,

      yesterday: yesterdayOrders.length,
      yesterdayMigrated: yesterdayOrders.filter(isMigratedOrder).length,

      thisMonth: thisMonthOrders.length,
      thisMonthMigrated: thisMonthOrders.filter(isMigratedOrder).length,

      abandoned: orders.filter(o => !isMigratedOrder(o) && (!o.status || o.status === 'Processing')).length
    };
  }, [orders]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/save-partial-order', { cache: 'no-store' });
      
      const json = await response.json();
      const rawData = json.data || [];
      
      const processed = rawData.map((item, idx) => {
        const phone = item.number || item.marketing?.number || 'N/A';
        
        return {
          _id: item._id || `temp-${idx}`,
          orderId: item.orderId || item.items?.[0]?.postId || 'N/A', 
          createdAt: item.createdAt || item.date || new Date().toISOString(),
          status: item.marketing?.status || item.status || 'Processing',
          callStatus: item.phoneCallStatus || 'Pending',
          note: item.note || '',
          scheduledDate: item.scheduledDate || null,
          // Trust ONLY the database flag - set exclusively by the explicit "Migrate to Active" action
          isMigrated: Boolean(item.isMigrated),
          migratedAt: item.migratedAt || null,
          migratedOrderId: item.migratedOrderId || null,
          customer: {
            name: item.name || item.marketing?.name || 'Guest',
            phone: phone
          },
          gender: item.gender || '',
          items: item.items || [],
          address: item.address || item.marketing?.address || 'N/A',
          clientInfo: item.clientInfo || {},
          userAgent: item.clientInfo?.userAgent || item.userAgent || '',
          
          // Explicitly map the fields from the root level
          shipping: item.shipping,
          shippingCost: item.shippingCost,
          totalValue: item.totalValue,
          sfData: item.sfData
        };
      });
      setOrders(processed.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (error) {
      console.error("Failed to load orders", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // --- API HANDLERS ---
  
  const handleStatusUpdate = async (id, newStatus) => {
    setOrders(prev => prev.map(o => o._id === id ? { ...o, status: newStatus } : o));
    if (selectedOrder && selectedOrder._id === id) setSelectedOrder(prev => ({...prev, status: newStatus}));
    try {
        await fetch(`/api/partial-orders/${id}`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }),
        });
    } catch(e) { console.error("Update failed", e); }
  };

  const handleCallStatusUpdate = async (id, newCallStatus) => {
      setOrders(prev => prev.map(o => o._id === id ? { ...o, callStatus: newCallStatus } : o));
      if (selectedOrder && selectedOrder._id === id) setSelectedOrder(prev => ({...prev, callStatus: newCallStatus}));
      try {
        await fetch(`/api/partial-orders/${id}`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ callStatus: newCallStatus }),
        });
      } catch(e) { console.error("Call Status Update failed", e); }
  };

  const handleCustomerInfoChange = async (id, name, phone, gender) => {
      setOrders(prev => prev.map(o => o._id === id ? { ...o, customer: { ...o.customer, name, phone }, gender } : o));
      if (selectedOrder && selectedOrder._id === id) setSelectedOrder(prev => ({...prev, customer: { ...prev.customer, name, phone }, gender}));
      try {
        await fetch(`/api/partial-orders/${id}`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, phone: phone, number: phone, gender, "marketing.name": name, "marketing.number": phone }),
        });
      } catch(e) { console.error("Customer Update failed", e); }
  };

  const handleLocationChange = async (id, address) => {
      setOrders(prev => prev.map(o => o._id === id ? { ...o, address } : o));
      if (selectedOrder && selectedOrder._id === id) setSelectedOrder(prev => ({...prev, address}));
      try {
        await fetch(`/api/partial-orders/${id}`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ address, "marketing.address": address }),
        });
      } catch(e) { console.error("Location Update failed", e); }
  };

  // --- NOTE HANDLER ---
  const openNoteModal = (order) => {
    setNoteOrder(order);
    setIsNoteModalOpen(true);
  };

  const handleSaveNote = async (id, noteText) => {
    setOrders(prev => prev.map(o => o._id === id ? { ...o, note: noteText } : o));
    if (selectedOrder && selectedOrder._id === id) {
      setSelectedOrder(prev => ({ ...prev, note: noteText }));
    }
    if (noteOrder && noteOrder._id === id) {
      setNoteOrder(prev => ({ ...prev, note: noteText }));
    }
    setIsNoteModalOpen(false);
    try {
      await fetch(`/api/partial-orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: noteText }),
      });
      setNotification({ type: 'success', message: 'Note saved successfully!' });
      setTimeout(() => setNotification(null), 3000);
    } catch (e) {
      console.error('Note update failed', e);
      setNotification({ type: 'error', message: 'Failed to save note' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  // --- SCHEDULE HANDLER ---
  const handleScheduleChange = async (id, dateStr) => {
    setOrders(prev => prev.map(o => o._id === id ? { ...o, scheduledDate: dateStr || null } : o));
    if (selectedOrder && selectedOrder._id === id) {
      setSelectedOrder(prev => ({ ...prev, scheduledDate: dateStr || null }));
    }
    try {
      await fetch(`/api/partial-orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledDate: dateStr || null }),
      });
      setNotification({ type: 'success', message: dateStr ? `Order scheduled for ${dateStr}` : 'Schedule cleared' });
      setTimeout(() => setNotification(null), 3000);
    } catch (e) {
      console.error('Schedule update failed', e);
      setNotification({ type: 'error', message: 'Failed to update schedule' });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  // --- MIGRATION LOGIC ---
  
  const handleMigrateClick = (order) => {
      setOrderToMigrate(order);
      setShowConfirmMigrate(true);
  };

  const proceedWithMigration = async () => {
    if (!orderToMigrate) return;

    try {
        setIsMigrating(true);
        // 1. Prepare Payload: Map frontend "Abandoned" structure to backend "Active Order" structure
        const payload = {
            ...orderToMigrate,
            number: orderToMigrate.customer.phone,
            name: orderToMigrate.customer.name,
            gender: orderToMigrate.gender,
            address: orderToMigrate.address,
            items: orderToMigrate.items,
            status: "Processing", // Default status for new confirmed orders
            phoneCallStatus: "Confirmed", // If migrated manually, marked as confirmed
            shippingCost: orderToMigrate.shippingCost || 60,
            totalValue: orderToMigrate.totalValue || (490 + (orderToMigrate.shippingCost || 60)),
            note: orderToMigrate.note || null,
            scheduledDate: orderToMigrate.scheduledDate || null,
            source: "Abandoned Recovery", 
            isRecoveredOrder: true
        };

        // Remove the old _id so database generates a fresh one for the orders table
        delete payload._id; 

        // 2. Send to Main Orders Collection
        const createRes = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const createData = await createRes.json();

        if (createData.success) {
            // 3. Mark the partial order as migrated WITHOUT deleting it, preserving stats!
            await fetch(`/api/partial-orders/${orderToMigrate._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    isMigrated: true,
                    migratedOrderId: createData.orderId,
                    migratedAt: new Date().toISOString(),
                    status: 'Migrated',
                    callStatus: 'Confirmed'
                })
            });
            
            // 4. Cleanup UI & Refresh
            setNotification({ type: 'success', message: `Order Migrated Successfully! New Order ID: ${createData.orderId}` });
            setTimeout(() => setNotification(null), 4000);
            setShowConfirmMigrate(false);
            setOrderToMigrate(null);
            setSelectedOrder(null); // Close modal
            fetchOrders(); // Refresh list to update status and metrics
        } else {
            setNotification({ type: 'error', message: `Migration Failed: ${createData.message || 'Unknown error'}` });
            setTimeout(() => setNotification(null), 4000);
            if(createData.reason === 'active_order_exists') {
                setShowConfirmMigrate(false); // Close popup if it already exists
            }
        }

    } catch (error) {
        console.error("Migration error:", error);
        setNotification({ type: 'error', message: "Server Error during migration." });
        setTimeout(() => setNotification(null), 4000);
    } finally {
        setIsMigrating(false);
    }
  };

  // --- RENDER HELPERS ---

  const filteredOrders = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase();
    return orders.filter(o => {
      const matchesSearch = 
        (o.customer.name || '').toLowerCase().includes(lowerSearch) || 
        (o.customer.phone || '').includes(lowerSearch) ||
        (o.orderId || '').toLowerCase().includes(lowerSearch) ||
        (o.note || '').toLowerCase().includes(lowerSearch) ||
        (o.scheduledDate || '').toLowerCase().includes(lowerSearch);

      if (!matchesSearch) return false;

      if (filterTab === 'unmigrated') {
        return !o.isMigrated;
      }
      if (filterTab === 'migrated') {
        return o.isMigrated;
      }
      return true;
    });
  }, [orders, searchTerm, filterTab]);

  const paginatedData = filteredOrders.slice((currentPage-1)*itemsPerPage, currentPage*itemsPerPage);
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  // --- ANALYTICS DATA ---
  const analyticsData = useMemo(() => {
    const total = orders.length;
    if (total === 0) return null;

    // Status breakdown
    const statusCounts = {
      Processing: orders.filter(o => !o.isMigrated && (o.status === 'Processing' || !o.status)).length,
      Cancelled: orders.filter(o => o.status === 'Cancelled').length,
      Fake: orders.filter(o => o.status === 'Fake').length,
      Duplicate: orders.filter(o => o.status === 'Duplicate').length,
      Migrated: orders.filter(o => o.isMigrated).length,
    };

    // Call status breakdown
    const callCounts = {
      Confirmed: orders.filter(o => o.callStatus === 'Confirmed').length,
      'No Answer': orders.filter(o => o.callStatus === 'No Answer').length,
      Pending: orders.filter(o => !o.callStatus || o.callStatus === 'Pending').length,
    };

    // Conversion rate (migrated to real orders)
    const conversionRate = Math.round((statusCounts.Migrated / total) * 100);
    const confirmationRate = Math.round((callCounts.Confirmed / total) * 100);
    const cancelRate = Math.round((statusCounts.Cancelled / total) * 100);
    const noAnswerRate = Math.round((callCounts['No Answer'] / total) * 100);

    // Last 30 days daily counts for calendar heatmap
    const today = new Date();
    const dailyCounts = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      dailyCounts[key] = 0;
    }
    orders.forEach(o => {
      const key = new Date(o.createdAt).toISOString().split('T')[0];
      if (dailyCounts[key] !== undefined) dailyCounts[key]++;
    });
    const dailyEntries = Object.entries(dailyCounts);
    const maxDaily = Math.max(...Object.values(dailyCounts), 1);

    // Inside/Outside Dhaka
    const insideDhaka = orders.filter(o => o.shipping === 'Inside Dhaka').length;
    const outsideDhaka = orders.filter(o => o.shipping === 'Outside Dhaka').length;
    const unknownShipping = total - insideDhaka - outsideDhaka;

    return { total, statusCounts, callCounts, conversionRate, confirmationRate, cancelRate, noAnswerRate, dailyEntries, maxDaily, insideDhaka, outsideDhaka, unknownShipping };
  }, [orders]);

  return (
    <div className="min-h-screen bg-black text-gray-200 font-sans selection:bg-blue-500/30">
       <style>{`.custom-scrollbar::-webkit-scrollbar { width: 6px; } .custom-scrollbar::-webkit-scrollbar-track { background: #111827; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #374151; border-radius: 10px; }`}</style>
      
       {/* NOTIFICATION TOAST */}
       {notification && (
         <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full flex items-center gap-2 shadow-2xl animate-in slide-in-from-top-5 duration-300 ${
           notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
         }`}>
           {notification.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
           <span className="font-medium text-sm">{notification.message}</span>
         </div>
       )}

      {/* NOTE MODAL */}
      {isNoteModalOpen && noteOrder && (
        <NoteModal
          key={noteOrder._id}
          onClose={() => { setIsNoteModalOpen(false); setNoteOrder(null); }}
          onSave={handleSaveNote}
          order={noteOrder}
          initialNote={noteOrder?.note || ""}
        />
      )}

      {/* MIGRATION CONFIRMATION MODAL */}
      <ConfirmationModal 
        isOpen={showConfirmMigrate}
        onClose={() => setShowConfirmMigrate(false)}
        onConfirm={proceedWithMigration}
        customerName={orderToMigrate?.customer?.name || 'Customer'}
        isMigrating={isMigrating}
      />

      {selectedOrder && (
        <OrderModal 
          key={selectedOrder._id}
          order={selectedOrder} 
          onClose={() => setSelectedOrder(null)} 
          onStatusChange={(s) => handleStatusUpdate(selectedOrder._id, s)}
          onCallStatusChange={(s) => handleCallStatusUpdate(selectedOrder._id, s)}
          onMigrateRequest={handleMigrateClick}
          onCustomerInfoChange={(name, phone, gender) => handleCustomerInfoChange(selectedOrder._id, name, phone, gender)}
          onLocationChange={(address) => handleLocationChange(selectedOrder._id, address)}
          onScheduleChange={(dateStr) => handleScheduleChange(selectedOrder._id, dateStr)}
          onOpenNoteModal={openNoteModal}
        />
      )}

      <div className="max-w-[1600px] mx-auto p-4 md:p-8">
        <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Unsubmitted Orders</h1>
            <p className="text-gray-500 text-sm">Review abandoned carts and partial submissions.</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400 bg-gray-900 px-3 py-1.5 rounded-full border border-gray-800">
             <Clock size={14} />
             {currentTime.toLocaleTimeString()}
          </div>
        </header>

        {/* STAT CARDS WITH MIGRATED METRIC */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
           {/* TODAY */}
           <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl flex items-center justify-between hover:border-gray-700/80 transition-all">
             <div>
               <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Today</p>
               <p className="text-3xl font-bold text-white">{stats.today}</p>
             </div>
             <div className="flex items-center gap-3">
               <div className="flex flex-col items-end">
                 <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border shadow-sm ${
                   stats.todayMigrated > 0 
                     ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                     : 'bg-gray-800/60 text-gray-400 border-gray-700/50'
                 }`}>
                   <ArrowRightCircle size={13} className={stats.todayMigrated > 0 ? "text-emerald-400" : "text-gray-500"} />
                   <span>{stats.todayMigrated} Migrated</span>
                 </span>
                 <span className="text-[10px] text-gray-500 mt-1 font-medium">Confirmed orders</span>
               </div>
               <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 shrink-0">
                 <Calendar size={20} />
               </div>
             </div>
           </div>

           {/* YESTERDAY */}
           <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl flex items-center justify-between hover:border-gray-700/80 transition-all">
             <div>
               <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Yesterday</p>
               <p className="text-3xl font-bold text-white">{stats.yesterday}</p>
             </div>
             <div className="flex items-center gap-3">
               <div className="flex flex-col items-end">
                 <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border shadow-sm ${
                   stats.yesterdayMigrated > 0 
                     ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' 
                     : 'bg-gray-800/60 text-gray-400 border-gray-700/50'
                 }`}>
                   <ArrowRightCircle size={13} className={stats.yesterdayMigrated > 0 ? "text-orange-400" : "text-gray-500"} />
                   <span>{stats.yesterdayMigrated} Migrated</span>
                 </span>
                 <span className="text-[10px] text-gray-500 mt-1 font-medium">Confirmed orders</span>
               </div>
               <div className="w-10 h-10 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-500 shrink-0">
                 <Clock size={20} />
               </div>
             </div>
           </div>

           {/* THIS MONTH */}
           <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl flex items-center justify-between hover:border-gray-700/80 transition-all">
             <div>
               <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">This Month</p>
               <p className="text-3xl font-bold text-white">{stats.thisMonth}</p>
             </div>
             <div className="flex items-center gap-3">
               <div className="flex flex-col items-end">
                 <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border shadow-sm ${
                   stats.thisMonthMigrated > 0 
                     ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' 
                     : 'bg-gray-800/60 text-gray-400 border-gray-700/50'
                 }`}>
                   <ArrowRightCircle size={13} className={stats.thisMonthMigrated > 0 ? "text-purple-400" : "text-gray-500"} />
                   <span>{stats.thisMonthMigrated} Migrated</span>
                 </span>
                 <span className="text-[10px] text-gray-500 mt-1 font-medium">Confirmed orders</span>
               </div>
               <div className="w-10 h-10 bg-purple-500/10 rounded-full flex items-center justify-center text-purple-500 shrink-0">
                 <Calendar size={20} />
               </div>
             </div>
           </div>

           {/* TOTAL */}
           <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl flex items-center justify-between hover:border-gray-700/80 transition-all">
             <div>
               <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Total</p>
               <p className="text-3xl font-bold text-white">{stats.total}</p>
             </div>
             <div className="flex items-center gap-3">
               <div className="flex flex-col items-end">
                 <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border shadow-sm ${
                   stats.totalMigrated > 0 
                     ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                     : 'bg-gray-800/60 text-gray-400 border-gray-700/50'
                 }`}>
                   <ArrowRightCircle size={13} className={stats.totalMigrated > 0 ? "text-blue-400" : "text-gray-500"} />
                   <span>{stats.totalMigrated} Migrated</span>
                 </span>
                 <span className="text-[10px] text-gray-500 mt-1 font-medium">Confirmed orders</span>
               </div>
               <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-500 shrink-0">
                 <ShoppingBag size={20} />
               </div>
             </div>
           </div>
        </div>

        {/* SEARCH & FILTER CONTROLS */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
           <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
             <div className="relative w-full md:w-80">
               <input 
                  type="text" 
                  placeholder="Search name, phone, note, ID..." 
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                  className="w-full bg-gray-900 border border-gray-800 text-sm text-white py-2.5 pl-10 pr-4 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-gray-600"
               />
               <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
             </div>

             {/* Quick Filter Tabs */}
             <div className="flex items-center gap-1 bg-gray-900/90 p-1 rounded-xl border border-gray-800">
               <button
                 onClick={() => { setFilterTab('all'); setCurrentPage(1); }}
                 className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                   filterTab === 'all' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
                 }`}
               >
                 All ({orders.length})
               </button>
               <button
                 onClick={() => { setFilterTab('unmigrated'); setCurrentPage(1); }}
                 className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                   filterTab === 'unmigrated' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
                 }`}
               >
                 Unsubmitted ({orders.filter(o => !o.isMigrated && !o.realOrder).length})
               </button>
               <button
                 onClick={() => { setFilterTab('migrated'); setCurrentPage(1); }}
                 className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                   filterTab === 'migrated' ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-400 hover:text-white'
                 }`}
               >
                 Migrated ({stats.totalMigrated})
               </button>
             </div>
           </div>

           <div className="flex items-center gap-2">
             <span className="text-xs text-gray-500">Rows:</span>
             <select 
               value={itemsPerPage} 
               onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
               className="bg-gray-900 border border-gray-800 text-xs text-white rounded-lg px-3 py-2 outline-none focus:border-blue-500"
             >
               <option value={10}>10</option><option value={20}>20</option><option value={50}>50</option>
             </select>
           </div>
        </div>

        {/* DESKTOP TABLE VIEW */}
        <div className="hidden md:block bg-[#111624] border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
           <div className="overflow-x-auto custom-scrollbar">
             <table className="w-full text-left whitespace-nowrap">
               <thead>
                 <tr className="bg-[#1A2235] text-gray-400 border-b border-gray-800 text-[10px] font-bold uppercase tracking-widest">
                   <th className="py-4 px-6">Order Info</th>
                   <th className="py-4 px-6">Time & Schedule</th>
                   <th className="py-4 px-6">Geography</th>
                   <th className="py-4 px-6">Courier History</th>
                   <th className="py-4 px-6">Status</th>
                   <th className="py-4 px-6">Call</th>
                   <th className="py-4 px-6 text-right">Action</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-800/60">
                 {loading ? (
                   <tr><td colSpan="7" className="py-16 text-center text-gray-500">Loading...</td></tr>
                 ) : paginatedData.length === 0 ? (
                   <tr><td colSpan="7" className="py-16 text-center text-gray-500">No abandoned carts found.</td></tr>
                 ) : (
                   paginatedData.map((order) => {
                     const isMigrated = order.isMigrated || !!order.realOrder;
                     const isCancelled = order.status === 'Cancelled';
                     return (
                       <tr key={order._id} className={`group transition-all duration-200 ${isMigrated ? 'bg-[#151c2e] hover:bg-[#1a233a] opacity-85' : isCancelled ? 'bg-red-950/20 shadow-[inset_4px_0_0_0_#ef4444] hover:bg-red-900/10' : 'bg-transparent hover:bg-gray-800/40'}`}>
                         <td className="py-4 px-6">
                           <div className="flex items-center gap-4">
                             <div className="flex flex-col gap-1 min-w-[130px]">
                               <span className="text-[13px] font-bold text-white group-hover:text-blue-400 truncate max-w-[160px]">{order.customer.name}</span>
                               <span className="text-xs text-gray-400 font-mono">{order.customer.phone}</span>
                               
                               {/* Note snippet preview */}
                               {order.note && (
                                 <div 
                                   onClick={(e) => { e.stopPropagation(); openNoteModal(order); }}
                                   className="flex items-center gap-1.5 text-[11px] text-yellow-300/90 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 px-2 py-0.5 rounded-md max-w-[200px] truncate cursor-pointer transition-colors mt-0.5" 
                                   title={`Click to edit note: ${order.note}`}
                                 >
                                   <StickyNote size={11} className="text-yellow-400 shrink-0" fill="currentColor" />
                                   <span className="truncate italic">{order.note}</span>
                                 </div>
                               )}
                             </div>
                             {isMigrated && (
                               <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                                 <CheckCircle size={12} /> Migrated ({order.migratedOrderId || order.realOrder?.orderId || 'Active'})
                               </div>
                             )}
                           </div>
                         </td>
                         <td className="py-4 px-6">
                           <div className="flex flex-col gap-1.5">
                             <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-gray-800/50 text-gray-400 text-[11px] font-medium border border-gray-700/50 w-fit">
                               <Clock size={12} /> {formatTimeAgo(order.createdAt)}
                             </div>
                             {order.scheduledDate && (
                               <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/25 text-[10px] font-bold w-fit">
                                 <Calendar size={11} className="text-purple-400" /> Scheduled: {order.scheduledDate}
                               </div>
                             )}
                           </div>
                         </td>
                         <td className="py-4 px-6">
                           <div className="flex flex-col gap-1.5">
                             <div className="flex items-center gap-2">
                               <span className="text-sm text-gray-200 font-bold">{order.totalValue ? `${order.totalValue} ৳` : 'N/A'}</span>
                               <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400">{order.shipping || 'Standard'}</span>
                             </div>
                             {order.address && order.address !== 'N/A' && (
                               <div className="flex items-center gap-1.5 text-xs text-gray-400 max-w-[200px] truncate" title={order.address}>
                                 <MapPin size={12} className="shrink-0 text-gray-500" />
                                 <span className="truncate">{order.address}</span>
                                </div>
                             )}
                           </div>
                         </td>
                         <td className="py-4 px-6">
                           <SteadfastPill phone={order.customer.phone} initialData={order.sfData} />
                         </td>
                         <td className="py-4 px-6">
                           {isMigrated ? (
                             <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                               <CheckCircle size={12} /> Migrated
                             </span>
                           ) : (
                             <StatusDropdown status={order.status} onStatusChange={(s) => handleStatusUpdate(order._id, s)} />
                           )}
                         </td>
                         <td className="py-4 px-6">
                           {isMigrated ? (
                             <span className="text-xs text-gray-400 font-medium italic">Confirmed</span>
                           ) : (
                             <CallStatusDropdown currentStatus={order.callStatus} onStatusChange={(s) => handleCallStatusUpdate(order._id, s)} />
                           )}
                         </td>
                         <td className="py-4 px-6 text-right">
                           <div className="flex items-center justify-end gap-2">
                             {/* NOTE BUTTON WITH STATE COLOR */}
                             <button
                               onClick={(e) => { e.stopPropagation(); openNoteModal(order); }}
                               className={`p-1.5 rounded-lg transition-all border cursor-pointer ${
                                 order.note
                                   ? "bg-yellow-500 text-black border-yellow-400 hover:bg-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.4)]"
                                   : "bg-[#1F2937] text-gray-400 border-gray-700 hover:bg-gray-700 hover:text-white"
                               }`}
                               title={order.note ? `Edit Note: "${order.note}"` : "Add Note"}
                             >
                               <StickyNote size={14} fill={order.note ? "currentColor" : "none"} />
                             </button>

                             {/* VIEW DETAILS BUTTON */}
                             <button 
                               onClick={() => setSelectedOrder(order)} 
                               className="relative inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1F2937] hover:bg-[#374151] border border-gray-700 rounded-md text-[11px] font-bold text-white transition-all shadow-sm cursor-pointer"
                             >
                               <Eye size={14} /> View
                               {order.note && (
                                 <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                                   <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-yellow-500"></span>
                                 </span>
                               )}
                             </button>
                           </div>
                         </td>
                       </tr>
                     );
                   })
                 )}
               </tbody>
             </table>
           </div>
           {totalPages > 1 && (
             <div className="px-6 py-4 border-t border-gray-800 bg-[#151c2e] flex items-center justify-between">
               <span className="text-xs text-gray-400 font-medium">Page <span className="text-white">{currentPage}</span> of <span className="text-white">{totalPages}</span></span>
               <div className="flex gap-2">
                 <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="p-2 rounded-lg bg-gray-800/80 border border-gray-700 text-gray-400 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-700 hover:text-white transition-colors cursor-pointer"><ChevronLeft size={16} /></button>
                 <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="p-2 rounded-lg bg-gray-800/80 border border-gray-700 text-gray-400 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-700 hover:text-white transition-colors cursor-pointer"><ChevronRight size={16} /></button>
               </div>
             </div>
           )}
        </div>

        {/* MOBILE CARD LIST */}
        <div className="md:hidden flex flex-col gap-3">
          {loading ? (
            <div className="py-16 text-center text-gray-500 flex flex-col items-center gap-3">
              <span className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></span>
              <span className="text-sm">Loading orders...</span>
            </div>
          ) : paginatedData.length === 0 ? (
            <div className="py-16 text-center text-gray-500 bg-gray-900/50 rounded-2xl border border-gray-800">
              <ShoppingBag size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No abandoned carts found.</p>
            </div>
          ) : (
            paginatedData.map((order) => {
              const isMigrated = order.isMigrated;
              return (
                <div
                  key={order._id}
                  onClick={() => setSelectedOrder(order)}
                  className={`flex flex-col gap-0 active:scale-[0.99] transition-transform relative overflow-hidden rounded-2xl cursor-pointer ${
                    isMigrated
                      ? "bg-indigo-900/30 border border-indigo-500/60 shadow-[0_4px_20px_rgba(99,102,241,0.2)] ring-1 ring-indigo-500/40 z-10"
                      : order.status === "Cancelled"
                        ? "bg-red-950/20 border border-red-500/20 shadow-[0_2px_12px_rgba(239,68,68,0.05)]"
                        : "bg-gray-800/90 border border-gray-700/50 shadow-md"
                  }`}
                >
                  {/* ── Card Header ── */}
                  <div className="px-4 pt-4 pb-3 flex items-start gap-3">
                    {/* Left: Avatar circle */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                      isMigrated ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      : 'bg-gray-700 text-gray-300 border border-gray-600'
                    }`}>
                      {(order.customer?.name && order.customer.name !== 'Guest' ? order.customer.name : '?').charAt(0).toUpperCase()}
                    </div>

                    {/* Middle: Name + Phone */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white font-semibold text-sm leading-tight truncate max-w-[170px]">
                          {(order.customer?.name && order.customer.name !== 'Guest') ? order.customer.name : <span className="text-gray-500 font-medium italic text-sm">Unknown Guest</span>}
                        </span>
                        {/* Status pill inline with name */}
                        {isMigrated && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 text-emerald-300 bg-emerald-500/20 border border-emerald-500/30">
                            <CheckCircle size={8} /> Migrated
                          </span>
                        )}
                      </div>
                      <a
                        href={`tel:${order.customer?.phone || 'N/A'}`}
                        onClick={(e) => { e.stopPropagation(); }}
                        className="flex items-center gap-1.5 mt-1 text-xs text-blue-400 font-medium hover:text-blue-300 w-fit"
                      >
                        <Phone size={11} className="shrink-0" />
                        <span>{order.customer?.phone || 'N/A'}</span>
                      </a>
                    </div>

                    {/* Right: Time + Actions */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="flex items-center gap-1 text-[10px] text-gray-500">
                        <Clock size={9} />
                        <span>{formatTimeAgo(order.createdAt)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {/* Note Button Mobile */}
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
                        
                        {/* View Button Mobile */}
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); }}
                          className="relative p-1.5 rounded-lg transition-all border bg-gray-700/80 border-gray-600/60 text-gray-400 hover:text-white hover:bg-blue-600 hover:border-blue-500 hover:shadow-[0_0_8px_rgba(37,99,235,0.4)]"
                          title="View Details"
                        >
                          <Eye size={13} />
                          {order.note && (
                            <span className="absolute -top-1 -right-1 flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                            </span>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* ── Scheduled Date Banner (if scheduled) ── */}
                  {order.scheduledDate && (
                    <div className="mx-4 mb-2 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[10px] font-bold">
                      <Calendar size={11} className="text-purple-400 shrink-0" />
                      <span>Scheduled for: {order.scheduledDate}</span>
                    </div>
                  )}

                  {/* ── Note preview (if exists) ── */}
                  {order.note && (
                    <div 
                      onClick={(e) => { e.stopPropagation(); openNoteModal(order); }}
                      className="mx-4 mb-2 flex items-start gap-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl relative overflow-hidden cursor-pointer"
                    >
                      <div className="absolute top-0 left-0 w-[3px] h-full bg-yellow-500 rounded-l-xl" />
                      <StickyNote size={11} className="text-yellow-500 mt-0.5 shrink-0" fill="currentColor" />
                      <span className="text-xs text-yellow-100/90 italic leading-snug truncate">{order.note}</span>
                    </div>
                  )}

                  {/* ── Address + Location row ── */}
                  <div className="px-4 pb-3 flex items-center justify-between gap-2 w-full min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <MapPin size={11} className={`shrink-0 ${order.shipping === 'Inside Dhaka' ? 'text-teal-400' : 'text-orange-400'}`} />
                      <span className="text-gray-400 text-[11px] truncate flex-1 min-w-0 leading-tight pr-1">
                        {order.address && order.address !== 'N/A' ? order.address : 'Address N/A'}
                      </span>
                    </div>
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border shrink-0 min-w-max ${
                      order.shipping === 'Inside Dhaka' ? 'border-teal-500/30 bg-teal-500/10 text-teal-300'
                      : 'border-orange-500/30 bg-orange-500/10 text-orange-300'
                    }`}>
                      {order.shipping === 'Inside Dhaka' ? 'INSIDE DHAKA' : order.shipping === 'Outside Dhaka' ? 'OUTSIDE DHAKA' : (order.shipping || 'N/A').toUpperCase()}
                    </span>
                  </div>

                  {/* ── Delivery History row ── */}
                  <div className="px-4 pb-3 flex items-center justify-between gap-2 w-full min-w-0">
                     <div className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold flex items-center gap-1">
                       <ShieldCheck size={10} className="text-gray-400" />
                       Record
                     </div>
                     <SteadfastPill phone={order.customer?.phone} initialData={order.sfData} />
                  </div>

                  {/* ── Actions row ── */}
                  <div
                    className="px-3 py-2.5 bg-gray-900/50 border-t border-gray-700/40 flex items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Status badge */}
                    {isMigrated ? (
                       <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                         <CheckCircle size={10} /> Migrated ({order.migratedOrderId || order.realOrder?.orderId || 'Active'})
                       </span>
                    ) : (
                       <div className="relative">
                         <select
                           value={order.status || 'Processing'}
                           onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                           className={`appearance-none rounded-md pl-2.5 pr-6 py-1 text-xs font-medium border focus:outline-none cursor-pointer transition-all ${
                             order.status === 'Processing' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                             order.status === 'Cancelled' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                             order.status === 'Fake' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                             'bg-gray-500/10 text-gray-400 border-gray-500/20'
                           }`}
                         >
                           <option value="Processing" className="bg-gray-900 text-white">Processing</option>
                           <option value="Cancelled" className="bg-gray-900 text-white">Cancel</option>
                           <option value="Fake" className="bg-gray-900 text-white">Fake</option>
                           <option value="Duplicate" className="bg-gray-900 text-white">Duplicate</option>
                         </select>
                         <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                       </div>
                    )}

                    {/* Call status – takes remaining space */}
                    <div className="ml-auto">
                      {isMigrated ? (
                         <span className="text-[10px] text-gray-500 font-medium italic">Confirmed</span>
                      ) : (
                        <div className="relative">
                           <select
                             value={order.callStatus || 'Pending'}
                             onChange={(e) => handleCallStatusUpdate(order._id, e.target.value)}
                             className={`appearance-none w-28 rounded-md border py-1 pl-2.5 pr-6 text-xs font-medium shadow-sm focus:outline-none transition-colors cursor-pointer ${
                               order.callStatus === 'Confirmed' ? 'border-green-500/50 bg-green-500/20 text-green-400' :
                               order.callStatus === 'No Answer' ? 'border-red-500/50 bg-red-500/20 text-red-400' :
                               'border-yellow-500/50 bg-yellow-500/20 text-yellow-400'
                             }`}
                           >
                             {CALL_OPTIONS.map(o => <option key={o.value} value={o.value} className="bg-gray-900 text-white">{o.label}</option>)}
                           </select>
                           <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                         </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* Mobile Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between py-3 px-1">
              <span className="text-xs text-gray-400">Page <span className="text-white font-bold">{currentPage}</span> of <span className="text-white font-bold">{totalPages}</span></span>
              <div className="flex gap-2">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="px-4 py-2 rounded-xl bg-gray-800 border border-gray-700 text-gray-400 disabled:opacity-40 text-sm font-medium hover:bg-gray-700 hover:text-white transition-colors flex items-center gap-1 cursor-pointer">
                  <ChevronLeft size={15} /> Prev
                </button>
                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="px-4 py-2 rounded-xl bg-gray-800 border border-gray-700 text-gray-400 disabled:opacity-40 text-sm font-medium hover:bg-gray-700 hover:text-white transition-colors flex items-center gap-1 cursor-pointer">
                  Next <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>

      {/* ═══════════════════════════════════════════════════ */}
      {/* ANALYTICS SECTION */}
      {/* ═══════════════════════════════════════════════════ */}
      {analyticsData && !loading && (
        <div className="mt-20 pt-10 border-t border-gray-800/60 space-y-8">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
               <BarChart2 size={24} className="text-blue-400" />
            </div>
            <div>
               <h2 className="text-2xl font-bold text-white tracking-tight">Abandoned Order Analytics</h2>
               <p className="text-sm text-gray-500 mt-0.5">Based on <span className="text-white font-medium">{analyticsData.total}</span> total records</p>
            </div>
          </div>

          {/* ── ROW 1: KPI Cards ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Conversion Rate', value: `${analyticsData.conversionRate}%`, sub: `${analyticsData.statusCounts.Migrated} migrated`, icon: <Target size={20} />, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
              { label: 'Confirmed Calls', value: `${analyticsData.confirmationRate}%`, sub: `${analyticsData.callCounts.Confirmed} confirmed`, icon: <CheckCircle size={20} />, color: 'text-blue-400', bg: 'bg-blue-500/10' },
              { label: 'No Answer Rate', value: `${analyticsData.noAnswerRate}%`, sub: `${analyticsData.callCounts['No Answer']} unreachable`, icon: <PhoneOff size={20} />, color: 'text-rose-400', bg: 'bg-rose-500/10' },
              { label: 'Cancel Rate', value: `${analyticsData.cancelRate}%`, sub: `${analyticsData.statusCounts.Cancelled} cancelled`, icon: <XCircle size={20} />, color: 'text-red-400', bg: 'bg-red-500/10' },
            ].map((kpi, i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 flex flex-col gap-4">
                <div className={`w-12 h-12 rounded-xl ${kpi.bg} flex items-center justify-center ${kpi.color}`}>{kpi.icon}</div>
                <div>
                  <p className="text-3xl font-black text-white tracking-tight">{kpi.value}</p>
                  <p className="text-sm font-medium text-gray-400 mt-1">{kpi.label}</p>
                  <p className="text-xs text-gray-500 mt-1">{kpi.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── ROW 2: Status Breakdown + Call Breakdown + Shipping ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Status Breakdown Bar Chart */}
            <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 flex flex-col justify-between">
              <h3 className="text-base font-bold text-white mb-6 flex items-center gap-2"><CircleDot size={18} className="text-blue-400" /> Order Status Breakdown</h3>
              <div className="space-y-5">
                {[
                  { label: 'Processing', count: analyticsData.statusCounts.Processing, color: 'bg-blue-500', text: 'text-blue-400' },
                  { label: 'Cancelled', count: analyticsData.statusCounts.Cancelled, color: 'bg-red-500', text: 'text-red-400' },
                  { label: 'Migrated', count: analyticsData.statusCounts.Migrated, color: 'bg-emerald-500', text: 'text-emerald-400' },
                  { label: 'Fake', count: analyticsData.statusCounts.Fake, color: 'bg-orange-500', text: 'text-orange-400' },
                  { label: 'Duplicate', count: analyticsData.statusCounts.Duplicate, color: 'bg-gray-500', text: 'text-gray-400' },
                ].map(item => (
                  <div key={item.label} className="group">
                    <div className="flex justify-between text-sm mb-2">
                      <span className={`font-medium ${item.text}`}>{item.label}</span>
                      <span className="text-gray-300 font-semibold">{item.count} <span className="text-gray-500 font-normal ml-1">({analyticsData.total > 0 ? Math.round(item.count / analyticsData.total * 100) : 0}%)</span></span>
                    </div>
                    <div className="h-2.5 bg-gray-800/80 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-full transition-all duration-1000 ease-out`}
                        style={{ width: `${analyticsData.total > 0 ? (item.count / analyticsData.total * 100) : 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Call Status Breakdown */}
            <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8">
              <h3 className="text-base font-bold text-white mb-8 flex items-center gap-2"><Phone size={18} className="text-purple-400" /> Call Status Breakdown</h3>
              {/* SVG Donut Chart */}
              <div className="flex flex-col sm:flex-row items-center gap-8 justify-center h-[calc(100%-4rem)]">
                {(() => {
                  const segments = [
                    { label: 'Confirmed', count: analyticsData.callCounts.Confirmed, color: '#34d399' },
                    { label: 'No Answer', count: analyticsData.callCounts['No Answer'], color: '#f43f5e' },
                    { label: 'Pending', count: analyticsData.callCounts.Pending, color: '#facc15' },
                  ];
                  const total = analyticsData.total;
                  const r = 50, cx = 60, cy = 60, stroke = 18;
                  const circumference = 2 * Math.PI * r;
                  let offset = 0;
                  return (
                    <>
                      <svg viewBox="0 0 120 120" className="w-40 h-40 shrink-0 -rotate-90 drop-shadow-lg">
                        {segments.map((seg, i) => {
                          const pct = total > 0 ? seg.count / total : 0;
                          const dash = pct * circumference;
                          const gap = circumference - dash;
                          const el = (
                            <circle
                              key={i}
                              cx={cx} cy={cy} r={r}
                              fill="none"
                              stroke={seg.color}
                              strokeWidth={stroke}
                              strokeDasharray={`${dash} ${gap}`}
                              strokeDashoffset={-offset * circumference}
                              strokeLinecap="round"
                              opacity="0.9"
                              className="transition-all duration-1000 ease-out hover:stroke-width-[22px] cursor-pointer"
                            />
                          );
                          offset += pct;
                          return el;
                        })}
                        <circle cx={cx} cy={cy} r={r - stroke/2 - 4} fill="#111827" />
                        <text x="60" y="65" textAnchor="middle" fill="#fff" fontSize="20" fontWeight="bold" transform="rotate(90 60 60)">
                          {total}
                        </text>
                      </svg>
                      <div className="flex flex-col gap-4 w-full sm:w-auto">
                        {segments.map(seg => (
                          <div key={seg.label} className="flex items-center gap-3">
                            <span className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm" style={{ background: seg.color }} />
                            <span className="text-sm font-medium text-gray-300">{seg.label}</span>
                            <span className="text-sm font-bold text-white ml-auto">{seg.count}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Shipping Area Breakdown */}
            <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 flex flex-col justify-between">
              <h3 className="text-base font-bold text-white mb-6 flex items-center gap-2"><MapPin size={18} className="text-teal-400" /> Geographic Distribution</h3>
              <div className="space-y-4">
                {[
                  { label: 'Inside Dhaka', count: analyticsData.insideDhaka, color: 'bg-teal-500', text: 'text-teal-400', border: 'border-teal-500/30' },
                  { label: 'Outside Dhaka', count: analyticsData.outsideDhaka, color: 'bg-orange-500', text: 'text-orange-400', border: 'border-orange-500/30' },
                  { label: 'Unknown', count: analyticsData.unknownShipping, color: 'bg-gray-600', text: 'text-gray-400', border: 'border-gray-600/30' },
                ].map(item => (
                  <div key={item.label} className={`flex items-center gap-4 p-4 rounded-2xl border ${item.border} bg-gray-800/30 hover:bg-gray-800/60 transition-colors`}>
                    <span className={`w-3 h-3 rounded-full ${item.color} shrink-0`} />
                    <span className={`text-sm font-medium flex-1 ${item.text}`}>{item.label}</span>
                    <span className="text-sm font-bold text-white">{item.count}</span>
                    <span className="text-xs text-gray-500 ml-1">({analyticsData.total > 0 ? Math.round(item.count / analyticsData.total * 100) : 0}%)</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-5 border-t border-gray-800/60 flex items-center justify-between">
                <span className="text-sm text-gray-400 font-medium">Total Tracked</span>
                <span className="text-lg font-bold text-white">{analyticsData.total}</span>
              </div>
            </div>
          </div>

          {/* ── ROW 3: 30-Day Activity Heatmap ── */}
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-base font-bold text-white flex items-center gap-2"><TrendingUp size={18} className="text-indigo-400" /> 30-Day Activity Heatmap</h3>
              <span className="text-xs font-medium text-indigo-300 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">Last 30 Days</span>
            </div>
            <div className="flex items-end gap-1.5 h-32 relative">
              {/* Background horizontal lines for reference */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                 <div className="border-t border-gray-600 w-full"></div>
                 <div className="border-t border-gray-600 w-full"></div>
                 <div className="border-t border-gray-600 w-full"></div>
                 <div className="border-t border-gray-600 w-full"></div>
              </div>

              {analyticsData.dailyEntries.map(([date, count]) => {
                const ratio = count / analyticsData.maxDaily;
                const d = new Date(date);
                const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                // Make colors a bit brighter
                const opacity = count === 0 ? 0.08 : 0.2 + ratio * 0.8;
                return (
                  <div key={date} className="flex-1 flex flex-col items-center gap-1 group relative z-10" title={`${label}: ${count} orders`}>
                    <div
                      className="w-full rounded-t-md transition-all duration-300 hover:opacity-90 cursor-crosshair"
                      style={{
                        height: `${count === 0 ? 4 : Math.max(8, ratio * 128)}px`,
                        background: count === 0
                          ? 'rgba(99,102,241,0.08)'
                          : `rgba(99,102,241,${opacity})`,
                        border: count > 0 ? '1px solid rgba(99,102,241,0.5)' : '1px solid rgba(99,102,241,0.1)'
                      }}
                    />
                    {/* Tooltip on hover */}
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 hidden group-hover:flex items-center gap-1.5 bg-gray-800 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap z-20 border border-gray-600 shadow-xl font-medium">
                      <span className="text-gray-400">{label}:</span> <span>{count} orders</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-4">
              <span className="text-xs font-medium text-gray-500">{analyticsData.dailyEntries[0]?.[0] ? new Date(analyticsData.dailyEntries[0][0]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}</span>
              <span className="text-xs font-medium text-gray-500">Today</span>
            </div>
          </div>

          {/* ── ROW 4: Action Insight Summary ── */}
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8">
            <h3 className="text-base font-bold text-white mb-6 flex items-center gap-2"><Users2 size={18} className="text-indigo-400" /> Actionable Insights</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#151c2e] border border-gray-800/80 rounded-2xl p-6">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-2">Needs Follow-up</p>
                <p className="text-4xl font-black text-amber-400 tracking-tight">{analyticsData.callCounts.Pending}</p>
                <p className="text-sm text-gray-500 mt-2">Orders with pending calls — priority for outreach</p>
              </div>
              <div className="bg-[#151c2e] border border-gray-800/80 rounded-2xl p-6">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-2">Ready to Migrate</p>
                <p className="text-4xl font-black text-emerald-400 tracking-tight">{Math.max(0, analyticsData.callCounts.Confirmed - analyticsData.statusCounts.Migrated)}</p>
                <p className="text-sm text-gray-500 mt-2">Confirmed calls not yet migrated to dashboard</p>
              </div>
              <div className="bg-[#151c2e] border border-gray-800/80 rounded-2xl p-6">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-2">Lost Orders</p>
                <p className="text-4xl font-black text-rose-400 tracking-tight">{analyticsData.statusCounts.Cancelled + analyticsData.statusCounts.Fake + analyticsData.callCounts['No Answer']}</p>
                <p className="text-sm text-gray-500 mt-2">Cancelled + Fake + No Answer combined</p>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}