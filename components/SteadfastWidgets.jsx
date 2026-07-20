"use client";
import React, { useState, useEffect } from 'react';
import { Loader2, XCircle, Shield, ShieldCheck, AlertTriangle } from 'lucide-react';

// --- SHARED STEADFAST FETCH CACHE & QUEUE (module-level, survives re-renders) ---
const _sfCache = new Map(); // phone -> { rate, total, delivered, cancelled } | 'loading' | 'error'
const _sfListeners = new Map(); // phone -> Set of setState callbacks

const fetchQueue = [];
let isProcessingQueue = false;

async function processQueue() {
  if (isProcessingQueue || fetchQueue.length === 0) return;
  isProcessingQueue = true;

  while (fetchQueue.length > 0) {
    const phone = fetchQueue.shift();
    
    if (_sfCache.get(phone) !== 'loading') continue;

    try {
      const r = await fetch(`/api/check-delivery?phone=${encodeURIComponent(phone)}`);
      const isCached = r.headers.get('X-Cache') === 'HIT';
      const j = await r.json();
      
      if (r.status === 429 || (j.error && j.error.toLowerCase().includes('rate limit'))) {
        fetchQueue.unshift(phone);
        await new Promise(res => setTimeout(res, 5000));
        continue;
      }

      const total = j.total_parcels ?? j.parcel_count ?? 0;
      const delivered = j.total_delivered ?? j.delivered_count ?? 0;
      const cancelled = j.total_cancelled ?? j.return_count ?? 0;
      const rate = total > 0 ? Math.round((delivered / total) * 100) : null;
      const result = r.ok ? { rate, total, delivered, cancelled } : 'error';
      
      _sfCache.set(phone, result);
      _sfListeners.get(phone)?.forEach(cb => cb(result));
      _sfListeners.delete(phone);
      
      if (fetchQueue.length > 0 && !isCached) {
        await new Promise(res => setTimeout(res, 1200));
      }
    } catch (err) {
      _sfCache.set(phone, 'error');
      _sfListeners.get(phone)?.forEach(cb => cb('error'));
      _sfListeners.delete(phone);
      
      if (fetchQueue.length > 0) {
        await new Promise(res => setTimeout(res, 1200));
      }
    }
  }
  
  isProcessingQueue = false;
}

function fetchSteadfastForPhone(phone, onResult) {
  if (_sfCache.has(phone)) {
    const v = _sfCache.get(phone);
    if (v !== 'loading') { onResult(v); return; }
    _sfListeners.get(phone)?.add(onResult);
    return;
  }
  _sfCache.set(phone, 'loading');
  _sfListeners.set(phone, new Set([onResult]));

  fetchQueue.push(phone);
  processQueue();
}

export const SteadfastPill = ({ phone }) => {
  const [result, setResult] = useState(() => {
    const cached = _sfCache.get(phone);
    return cached !== undefined ? cached : 'loading';
  });

  useEffect(() => {
    if (!phone) { setResult('nodata'); return; }
    const cached = _sfCache.get(phone);
    if (cached && cached !== 'loading') { setResult(cached); return; }
    fetchSteadfastForPhone(phone, setResult);
  }, [phone]);

  if (!phone || result === 'nodata') return null;

  if (result === 'loading') return (
    <div className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 animate-pulse px-2.5 py-1.5">
      <Loader2 size={14} className="animate-spin shrink-0" />
      <span>checking…</span>
    </div>
  );

  if (result === 'error') return (
    <div className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 px-2.5 py-1.5" title="Steadfast check failed">
      <XCircle size={14} className="shrink-0" />
      <span>N/A</span>
    </div>
  );

  const { rate, total, delivered, cancelled } = result;

  if (total === 0) return (
    <div className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-400 bg-gray-800/80 border border-gray-700/80 px-2.5 py-1.5 rounded-lg shadow-sm" title="No Steadfast history">
      <Shield size={14} className="shrink-0 text-gray-500" />
      <span>New</span>
    </div>
  );

  const isGood = rate >= 70;
  const isBad = rate < 50;

  const Icon = isGood ? ShieldCheck : isBad ? AlertTriangle : Shield;
  const textColor = isGood ? 'text-emerald-400' : isBad ? 'text-red-400' : 'text-amber-400';
  const bgColor = isGood ? 'bg-emerald-500/10 border-emerald-500/30' : isBad ? 'bg-red-500/10 border-red-500/30' : 'bg-amber-500/10 border-amber-500/30';
  const label = isGood ? 'Trusted' : isBad ? 'Risky' : 'Neutral';

  return (
    <div
      className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-lg border ${bgColor} ${textColor} cursor-default select-none transition-all hover:scale-105`}
      title={`Steadfast: ${rate}% success rate (${delivered} delivered, ${cancelled} cancelled out of ${total})`}
    >
      <Icon size={14} className="shrink-0" />
      <span>{rate}% {label}</span>
    </div>
  );
};

export const FraudCheckerBadge = ({ phone }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!phone) {
      setLoading(false);
      return;
    }
    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/check-delivery?phone=${encodeURIComponent(phone)}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to check status");
        setData(json);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    checkStatus();
  }, [phone]);

  if (loading) return (
    <div className="mt-4 p-3 rounded-xl border border-gray-700/50 bg-gray-800/40 flex items-center justify-center gap-2">
      <Loader2 className="animate-spin text-indigo-400 w-4 h-4" />
      <span className="text-xs text-gray-400">Checking Steadfast Record...</span>
    </div>
  );
  if (error) return (
    <div className="mt-4 p-3 rounded-xl border border-red-500/20 bg-red-500/10 flex items-center gap-2">
      <AlertTriangle className="text-red-400 w-4 h-4" />
      <span className="text-xs text-red-400" title={error}>Failed: {error}</span>
    </div>
  );
  if (!data) return null;

  const total = data.total_parcels ?? data.parcel_count ?? 0;
  const delivered = data.total_delivered ?? data.delivered_count ?? 0;
  const cancelled = data.total_cancelled ?? data.return_count ?? 0;
  
  const rate = total > 0 ? Math.round((delivered / total) * 100) : 0;

  const isGood = rate >= 70;
  const isBad = rate < 50 && total > 0;
  
  return (
    <div className={`mt-4 p-4 rounded-xl border ${isGood ? 'bg-green-500/10 border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.1)]' : isBad ? 'bg-red-500/10 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]' : 'bg-yellow-500/10 border-yellow-500/20 shadow-[0_0_10px_rgba(234,179,8,0.1)]'} backdrop-blur-sm transition-all`}>
       <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
         <div className="flex items-center gap-2">
           {isGood ? <ShieldCheck className="text-green-400" size={16} /> : isBad ? <AlertTriangle className="text-red-400" size={16} /> : <Shield className="text-yellow-400" size={16} />}
           <span className="text-xs font-bold text-gray-200 uppercase tracking-widest">Steadfast History</span>
         </div>
         <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isGood ? 'bg-green-500/20 text-green-400' : isBad ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
           {isGood ? 'TRUSTED' : isBad ? 'HIGH RISK' : 'NEUTRAL'}
         </span>
       </div>
       <div className="grid grid-cols-3 gap-2">
         <div className="flex flex-col items-center justify-center bg-black/20 p-2 rounded-lg">
            <span className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Success</span>
            <span className={`text-lg font-black tracking-tight ${isGood ? 'text-green-400' : isBad ? 'text-red-400' : 'text-yellow-400'}`}>{rate}%</span>
         </div>
         <div className="flex flex-col items-center justify-center bg-black/20 p-2 rounded-lg">
            <span className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Delivered</span>
            <span className="text-base font-bold text-gray-200">{delivered}</span>
         </div>
         <div className="flex flex-col items-center justify-center bg-black/20 p-2 rounded-lg">
            <span className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Cancelled</span>
            <span className="text-base font-bold text-gray-200">{cancelled}</span>
         </div>
       </div>
    </div>
  );
};

