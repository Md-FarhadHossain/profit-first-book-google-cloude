"use client";

import React, { useState } from "react";
import {
  User,
  Phone,
  MapPin,
  MessageCircle,
  Facebook,
  MessageSquare,
  Package,
  DollarSign,
  Truck,
  Save,
  CheckCircle,
  AlertCircle,
  Smartphone,
  StickyNote,
  ArrowLeft
} from "lucide-react";
import Link from "next/link"; // Assuming you use Next.js Link

export default function ManualOrderPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    number: "",
    address: "",
    source: "WhatsApp", // Default
    shipping: "Inside Dhaka", // Default
    shippingCost: 60,
    productPrice: "",
    note: ""
  });

  const sources = [
    { id: "WhatsApp", icon: MessageCircle, color: "text-green-500", label: "WhatsApp" },
    { id: "Facebook", icon: Facebook, color: "text-blue-500", label: "Facebook" },
    { id: "Messenger", icon: MessageSquare, color: "text-blue-400", label: "Messenger" },
    { id: "Phone Call", icon: Smartphone, color: "text-purple-400", label: "Phone Call" },
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleShippingChange = (value) => {
    const cost = value === "Inside Dhaka" ? 60 : 120; // Adjusted cost based on your previous code (99 or 120)
    setFormData((prev) => ({
      ...prev,
      shipping: value,
      shippingCost: value === "Inside Dhaka" ? 60 : 99, // Matching your previous code logic
    }));
  };

  const calculateTotal = () => {
    const price = parseFloat(formData.productPrice) || 0;
    return price + formData.shippingCost;
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
          note: ""
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
                             {/* Render icon dynamically based on selection */}
                             {(() => {
                                 const s = sources.find(x => x.id === formData.source);
                                 const Icon = s ? s.icon : MessageCircle;
                                 return <Icon size={14} className={s ? s.color : ""} />;
                             })()}
                            {formData.source}
                        </span>
                    </div>

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
                            <p className="text-green-500/70 text-xs mt-0.5">Added to processing list.</p>
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