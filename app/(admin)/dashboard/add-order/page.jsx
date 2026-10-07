"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  User,
  Phone,
  MapPin,
  MessageCircle,
  Facebook,
  MessageSquare,
  Package,
  Save,
  CheckCircle,
  AlertCircle,
  Smartphone,
  StickyNote,
  ArrowLeft,
  Loader2,
  ChevronDown,
  Users
} from "lucide-react";
import Link from "next/link";
import hubsData from "../../../../steadfast_hubs.json";

const InlineSteadfastWidget = ({ phone }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cleanPhone = phone?.replace(/[^0-9]/g, '') || '';
    if (cleanPhone.length < 11 || !cleanPhone.startsWith("01")) {
      setData(null);
      setError(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    // Small debounce to avoid spamming as they type
    const timer = setTimeout(() => {
      fetch(`/api/check-delivery?phone=${encodeURIComponent(cleanPhone)}`)
        .then(r => r.json().then(j => ({ ok: r.ok, j })))
        .then(({ ok, j }) => {
          if (!isMounted) return;
          if (!ok) throw new Error(j.error || 'Failed');
          setData(j);
        })
        .catch(e => {
          if (isMounted) setError(e.message);
        })
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    }, 500);

    return () => { 
      isMounted = false;
      clearTimeout(timer);
    };
  }, [phone]);

  const cleanPhone = phone?.replace(/[^0-9]/g, '') || '';
  if (cleanPhone.length < 11 || !cleanPhone.startsWith("01")) return null;

  if (loading) return (
    <div className="mt-2 flex items-center gap-2 text-[11px] text-gray-500">
      <Loader2 size={12} className="animate-spin" /> Checking Steadfast network...
    </div>
  );

  if (error) return (
    <div className="mt-2 flex items-center gap-2 text-[11px] text-red-500">
      <AlertCircle size={12} /> {error}
    </div>
  );

  if (!data) return null;

  const rate = data.delivery_ratio ?? 0;
  const cancelRate = data.cancellation_ratio ?? 0;
  const totalReports = data.total_reports ?? data.total_parcels ?? 0;
  
  const isNew = data.volume_band === 'none' || data.delivery_ratio === null;

  if (isNew) return (
    <div className="mt-2 flex items-center gap-2 text-[11px] text-gray-500">
      <CheckCircle size={12} /> New Customer — no history yet
    </div>
  );

  const volumeMap = {
    none:   null,
    low:    'Low (1–5)',
    medium: 'Medium (6–20)',
    high:   'High (21–200)',
  };
  const volumeBand = data.volume_band ? (volumeMap[data.volume_band.toLowerCase()] || data.volume_band) 
    : totalReports > 20 ? 'High (21–200)' : totalReports > 5 ? 'Medium (6–20)' : 'Low (1–5)';
  const fraudReports = data.total_reports ?? 0;

  const isGood = rate >= 70;
  const isBad = rate < 50;
  const rateColor = isGood ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : isBad ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20';

  return (
    <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] bg-[#1a1f2e] px-3 py-2 rounded-lg border border-gray-700/50 shadow-inner">
      <span className={`px-2 py-0.5 rounded-full font-bold border ${rateColor}`}>
        {rate}% Success
      </span>
      <span className="text-gray-400 flex items-center gap-1.5">
        Cancelled <span className={`font-bold ${cancelRate > 20 ? 'text-red-400' : 'text-emerald-400'}`}>{cancelRate}%</span>
      </span>
      <span className="text-gray-600">|</span>
      <span className="text-gray-400 flex items-center gap-1.5">
        Parcel volume <span className="px-2 py-0.5 rounded-full font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">{volumeBand} ({totalReports})</span>
      </span>
      <span className="text-gray-600">|</span>
      <span className="text-gray-400 flex items-center gap-1.5">
        Fraud reports <span className={`font-bold ${fraudReports > 0 ? 'text-red-400' : 'text-gray-400'}`}>{fraudReports}</span>
      </span>
    </div>
  );
};

// Custom styled select wrapper
const StyledSelect = ({ value, onChange, children, placeholder }) => (
  <div className="relative">
    <select
      value={value}
      onChange={onChange}
      className="w-full appearance-none bg-gray-950 border border-gray-700 rounded-lg py-2.5 pl-4 pr-10 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
    >
      {placeholder && <option value="">{placeholder}</option>}
      {children}
    </select>
    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" size={16} />
  </div>
);

export default function ManualOrderPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    number: "",
    address: "",
    source: "WhatsApp",
    shipping: "Inside Dhaka",
    shippingCost: 60,
    productPrice: "",
    note: "",
    district: "",
    thana: "",
    zip: "",
    gender: "",
  });

  const sources = [
    { id: "WhatsApp", icon: MessageCircle, color: "text-green-500", label: "WhatsApp" },
    { id: "Facebook", icon: Facebook, color: "text-blue-500", label: "Facebook" },
    { id: "Messenger", icon: MessageSquare, color: "text-blue-400", label: "Messenger" },
    { id: "Phone Call", icon: Smartphone, color: "text-purple-400", label: "Phone Call" },
  ];

  // Districts list from hubs data
  const districtList = useMemo(() => hubsData.districts.map(d => d.name).sort(), []);

  // Thanas for selected district
  const thanaList = useMemo(() => {
    if (!formData.district) return [];
    const found = hubsData.districts.find(d => d.name === formData.district);
    return found ? found.steadfast_hubs : [];
  }, [formData.district]);

  // When district changes, reset thana and auto-fill district-level zip
  const handleDistrictChange = (e) => {
    const newDistrict = e.target.value;
    const distObj = hubsData.districts.find(d => d.name === newDistrict);
    setFormData(prev => ({
      ...prev,
      district: newDistrict,
      thana: "",
      zip: distObj?.postal_code || "",
    }));
  };

  // When thana changes, auto-fill thana-level zip
  const handleThanaChange = (e) => {
    const newThana = e.target.value;
    if (!newThana) {
      const distObj = hubsData.districts.find(d => d.name === formData.district);
      setFormData(prev => ({ ...prev, thana: "", zip: distObj?.postal_code || "" }));
      return;
    }
    const distObj = hubsData.districts.find(d => d.name === formData.district);
    const hubObj = distObj?.steadfast_hubs.find(h => h.name === newThana);
    setFormData(prev => ({
      ...prev,
      thana: newThana,
      zip: hubObj?.postal_code || distObj?.postal_code || "",
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleShippingChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      shipping: value,
      shippingCost: value === "Inside Dhaka" ? 60 : 99,
    }));
  };

  const calculateTotal = () => {
    const price = parseFloat(formData.productPrice) || 0;
    return price + formData.shippingCost;
  };

  // Fire browser-side Facebook Pixel Purchase event with all enriched data
  const fireBrowserPixel = (orderId, totalValue) => {
    try {
      if (typeof window === "undefined" || !window.fbq) return;

      // Build advanced user data for fbq re-init (updates matching signals)
      const ud = { country: "bd" };
      if (formData.number) {
        let ph = formData.number.replace(/[^0-9]/g, "");
        if (ph.startsWith("01") && ph.length === 11) ph = "880" + ph;
        ud.ph = ph;
      }
      if (formData.name) {
        const np = formData.name.trim().split(" ");
        if (np.length > 0) ud.fn = np[0].toLowerCase();
        if (np.length > 1) ud.ln = np.slice(1).join(" ").toLowerCase();
      }
      if (formData.district) ud.st = formData.district.toLowerCase();
      if (formData.thana)    ud.ct = formData.thana.toLowerCase();
      if (formData.zip)      ud.zp = formData.zip;
      if (formData.gender === "m" || formData.gender === "f") ud.ge = formData.gender;

      // Re-init pixel with enriched matching data before firing event
      const pixelId = window._fbPixelId || "2362496434235791";
      window.fbq("init", pixelId, ud);

      // Fire server-deduplication-safe Purchase event
      window.fbq("track", "Purchase", {
        currency: "BDT",
        value: totalValue,
        content_type: "product",
        order_id: orderId,
      }, { eventID: orderId });

      // Persist to localStorage so pixel picks it up on next page load / visit
      try {
        if (formData.name)     localStorage.setItem("billing_name", formData.name);
        if (formData.number)   localStorage.setItem("billing_phone", formData.number);
        if (formData.district) localStorage.setItem("billing_district", formData.district);
        if (formData.thana)    localStorage.setItem("billing_thana", formData.thana);
        if (formData.zip)      localStorage.setItem("billing_zip", formData.zip);
        if (formData.gender)   localStorage.setItem("billing_gender", formData.gender);
      } catch (_) {}
    } catch (err) {
      console.error("Browser pixel fire error:", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    if (!formData.name || !formData.number || !formData.productPrice || !formData.address) {
      setError("Please fill in all required fields.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/manual-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        const totalValue = calculateTotal();
        // Fire browser-side pixel with enriched user data
        fireBrowserPixel(data.orderId, totalValue);

        setSuccess(true);
        // Reset form
        setFormData({
          name: "",
          number: "",
          address: "",
          source: "WhatsApp",
          shipping: "Inside Dhaka",
          shippingCost: 60,
          productPrice: "",
          note: "",
          district: "",
          thana: "",
          zip: "",
          gender: "",
        });
      } else {
        setError(data.message || "Failed to add order.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 p-4 md:p-8 flex items-center justify-center font-sans">
      <div className="max-w-4xl w-full">

        {/* Header Navigation */}
        <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <Link href="/" className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors text-gray-400 hover:text-white">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Manual Entry</h1>
                    <p className="text-gray-400 text-sm">Add orders from social media & phone</p>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT: FORM SECTION */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden">

                {/* Decorative Blur */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                    <Package className="text-blue-500" size={20} />
                    Order Details
                </h2>

                <div className="space-y-5 relative z-10">
                    {/* Source Selection */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {sources.map((s) => (
                            <button
                                key={s.id}
                                type="button"
                                onClick={() => setFormData({...formData, source: s.id})}
                                className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all ${
                                    formData.source === s.id
                                    ? "bg-gray-800 border-blue-500 ring-1 ring-blue-500/50"
                                    : "bg-gray-900 border-gray-700 hover:bg-gray-800"
                                }`}
                            >
                                <s.icon size={20} className={s.color} />
                                <span className={`text-xs font-medium ${formData.source === s.id ? "text-white" : "text-gray-400"}`}>
                                    {s.label}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Customer Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-gray-400 pl-1">Customer Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="Full Name"
                                    className="w-full bg-gray-950 border border-gray-700 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-600"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-gray-400 pl-1">Phone Number</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                                <input
                                    type="text"
                                    name="number"
                                    value={formData.number}
                                    onChange={handleInputChange}
                                    placeholder="017..."
                                    className="w-full bg-gray-950 border border-gray-700 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-600"
                                />
                            </div>
                            <InlineSteadfastWidget phone={formData.number} />
                        </div>
                    </div>

                    {/* Gender Selection */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-400 pl-1 flex items-center gap-1.5">
                            <Users size={12} className="inline" /> Gender
                            <span className="text-gray-600 font-normal">(for Facebook audience targeting)</span>
                        </label>
                        <div className="flex gap-3 flex-wrap">
                            {[
                              { value: "m", label: "Male", emoji: "👨" },
                              { value: "f", label: "Female", emoji: "👩" },
                              { value: "",  label: "Not specified", emoji: "—" },
                            ].map((g) => (
                                <button
                                    key={g.value + "_gender"}
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, gender: g.value }))}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-medium transition-all ${
                                        formData.gender === g.value
                                        ? "bg-blue-600/20 border-blue-500 text-blue-300"
                                        : "bg-gray-900 border-gray-700 text-gray-400 hover:bg-gray-800"
                                    }`}
                                >
                                    <span>{g.emoji}</span> {g.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Address */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-400 pl-1">Delivery Address</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-3.5 text-gray-500" size={16} />
                            <textarea
                                name="address"
                                value={formData.address}
                                onChange={handleInputChange}
                                rows="2"
                                placeholder="House, Road, Area..."
                                className="w-full bg-gray-950 border border-gray-700 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-600 resize-none"
                            ></textarea>
                        </div>
                    </div>

                    {/* District / Thana / Zip — Facebook Pixel Data */}
                    <div className="bg-blue-950/20 border border-blue-800/30 rounded-xl p-4 space-y-3">
                        <div className="flex items-center gap-2 mb-1">
                            <MapPin size={14} className="text-blue-400" />
                            <span className="text-xs font-semibold text-blue-300 uppercase tracking-wider">Location — Sent to Facebook Pixel</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {/* District */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-gray-400 pl-1">District / City</label>
                                <StyledSelect
                                    value={formData.district}
                                    onChange={handleDistrictChange}
                                    placeholder="— Select District —"
                                >
                                    {districtList.map(d => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </StyledSelect>
                            </div>

                            {/* Thana */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-gray-400 pl-1">Thana / Area</label>
                                <StyledSelect
                                    value={formData.thana}
                                    onChange={handleThanaChange}
                                    placeholder={formData.district ? "— Select Thana —" : "— Select District first —"}
                                >
                                    {thanaList.map(h => (
                                        <option key={h.name} value={h.name}>{h.name}</option>
                                    ))}
                                </StyledSelect>
                            </div>

                            {/* Zip (auto-filled, manually editable) */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-gray-400 pl-1">
                                    Zip / Postal Code <span className="text-blue-500/60 text-[10px]">(auto-filled)</span>
                                </label>
                                <input
                                    type="text"
                                    name="zip"
                                    value={formData.zip}
                                    onChange={handleInputChange}
                                    placeholder="e.g. 1216"
                                    className="w-full bg-gray-950 border border-gray-700 rounded-lg py-2.5 px-4 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-600"
                                />
                            </div>
                        </div>

                        {/* Preview of what Facebook will receive */}
                        {(formData.district || formData.thana || formData.zip || formData.gender) && (
                            <div className="mt-2 bg-gray-950/60 rounded-lg px-3 py-2 text-[11px] text-gray-400 flex flex-wrap gap-x-3 gap-y-1 items-center">
                                <span className="font-semibold text-gray-300">📤 FB will receive:</span>
                                {formData.district && <span className="text-emerald-400 font-mono">st={formData.district}</span>}
                                {formData.thana    && <span className="text-emerald-400 font-mono">ct={formData.thana}</span>}
                                {formData.zip      && <span className="text-emerald-400 font-mono">zp={formData.zip}</span>}
                                {formData.gender   && <span className="text-purple-400 font-mono">ge={formData.gender}</span>}
                                <span className="text-gray-600">+ ph, fn, ln, country=bd (hashed server-side)</span>
                            </div>
                        )}
                    </div>

                    {/* Note */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-400 pl-1">Admin Note (Optional)</label>
                        <div className="relative">
                            <StickyNote className="absolute left-3 top-3.5 text-gray-500" size={16} />
                            <textarea
                                name="note"
                                value={formData.note}
                                onChange={handleInputChange}
                                rows="1"
                                placeholder="e.g. Call before delivery"
                                className="w-full bg-gray-950 border border-gray-700 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-600 resize-none"
                            ></textarea>
                        </div>
                    </div>

                    {/* Financials */}
                    <div className="bg-gray-950/50 p-4 rounded-xl border border-gray-800 grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-gray-400 pl-1">Product Price (Tk)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">৳</span>
                                <input
                                    type="number"
                                    name="productPrice"
                                    value={formData.productPrice}
                                    onChange={handleInputChange}
                                    placeholder="0"
                                    className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2 pl-8 pr-4 text-sm text-white focus:outline-none focus:border-blue-500 transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-gray-400 pl-1">Shipping Zone</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleShippingChange("Inside Dhaka")}
                                    className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                                        formData.shipping === "Inside Dhaka"
                                        ? "bg-blue-600 border-blue-500 text-white"
                                        : "bg-gray-900 border-gray-700 text-gray-400 hover:bg-gray-800"
                                    }`}
                                >
                                    Inside Dhaka (60)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleShippingChange("Outside Dhaka")}
                                    className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                                        formData.shipping === "Outside Dhaka"
                                        ? "bg-blue-600 border-blue-500 text-white"
                                        : "bg-gray-900 border-gray-700 text-gray-400 hover:bg-gray-800"
                                    }`}
                                >
                                    Outside (99)
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Submit Button */}
                <div className="mt-8">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-linear-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-3.5 rounded-xl transition-all transform active:scale-[0.98] shadow-lg shadow-blue-500/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                        ) : (
                            <>
                                <Save size={18} />
                                Create Order
                            </>
                        )}
                    </button>
                </div>
            </form>
          </div>

          {/* RIGHT: PREVIEW SECTION */}
          <div className="lg:col-span-1 space-y-6">

            {/* Live Summary Card */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl sticky top-8">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Live Summary</h3>

                <div className="space-y-4">
                    <div className="flex justify-between items-center pb-4 border-b border-gray-800">
                        <span className="text-gray-400 text-sm">Source</span>
                        <span className="text-white font-medium flex items-center gap-2">
                             {(() => {
                                 const s = sources.find(x => x.id === formData.source);
                                 const Icon = s ? s.icon : MessageCircle;
                                 return <Icon size={14} className={s ? s.color : ""} />;
                             })()}
                            {formData.source}
                        </span>
                    </div>

                    {/* Location Preview in Summary */}
                    {(formData.district || formData.thana) && (
                        <div className="pb-4 border-b border-gray-800 space-y-1.5">
                            {formData.district && (
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500">District</span>
                                    <span className="text-blue-300 font-medium">{formData.district}</span>
                                </div>
                            )}
                            {formData.thana && (
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500">Thana</span>
                                    <span className="text-blue-300 font-medium">{formData.thana}</span>
                                </div>
                            )}
                            {formData.zip && (
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500">Zip</span>
                                    <span className="text-emerald-300 font-medium">{formData.zip}</span>
                                </div>
                            )}
                            {formData.gender && (
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500">Gender</span>
                                    <span className="text-purple-300 font-medium">{formData.gender === "m" ? "Male" : "Female"}</span>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Subtotal</span>
                            <span className="text-gray-300">৳ {formData.productPrice || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Shipping</span>
                            <span className="text-gray-300">৳ {formData.shippingCost}</span>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-800">
                        <div className="flex justify-between items-end">
                            <span className="text-gray-400 font-medium">Total Value</span>
                            <span className="text-3xl font-bold text-white tracking-tight">
                                <span className="text-lg text-gray-500 font-normal mr-1">৳</span>
                                {calculateTotal()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Status Messages */}
                {success && (
                    <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2">
                        <CheckCircle className="text-green-500 shrink-0 mt-0.5" size={18} />
                        <div>
                            <p className="text-green-400 font-bold text-sm">Order Placed!</p>
                            <p className="text-green-500/70 text-xs mt-0.5">Saved & sent to Facebook Pixel.</p>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2">
                        <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
                        <div>
                            <p className="text-red-400 font-bold text-sm">Error</p>
                            <p className="text-red-500/70 text-xs mt-0.5">{error}</p>
                        </div>
                    </div>
                )}

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}