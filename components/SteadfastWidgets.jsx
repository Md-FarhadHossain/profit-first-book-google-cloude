"use client";
import React, { useState, useEffect } from 'react';
import { Loader2, XCircle, Shield, ShieldCheck, AlertTriangle, ShieldAlert, Package } from 'lucide-react';

// --- SHARED STEADFAST FETCH CACHE & QUEUE (module-level, survives re-renders) ---
// sessionStorage key prefix for cross-reload persistence
const SF_SESSION_KEY = 'sf_cache_v1';
const SF_SESSION_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours in sessionStorage

function _ssGet(phone) {
  try {
    const raw = sessionStorage.getItem(`${SF_SESSION_KEY}:${phone}`);
    if (!raw) return null;
    const { ts, value } = JSON.parse(raw);
    if (Date.now() - ts > SF_SESSION_TTL_MS) {
      sessionStorage.removeItem(`${SF_SESSION_KEY}:${phone}`);
      return null;
    }
    return value;
  } catch { return null; }
}
function _ssSet(phone, value) {
  try {
    sessionStorage.setItem(`${SF_SESSION_KEY}:${phone}`, JSON.stringify({ ts: Date.now(), value }));
  } catch { /* quota exceeded or SSR — ignore */ }
}

const _sfCache = new Map(); // phone -> { rate, total, delivered, cancelled, cancelRate, raw } | 'loading' | 'error'
const _sfListeners = new Map(); // phone -> Set of setState callbacks

const fetchQueue = [];
let isProcessingQueue = false;

async function processQueue() {
  if (isProcessingQueue || fetchQueue.length === 0) return;
  isProcessingQueue = true;

  while (fetchQueue.length > 0) {
    const phone = fetchQueue.shift();

    // If it was somehow resolved already, skip
    if (_sfCache.get(phone) !== 'loading') continue;

    try {
      const r = await fetch(`/api/check-delivery?phone=${encodeURIComponent(phone)}`);
      const isCached = r.headers.get('X-Cache') === 'HIT';
      const j = await r.json();

      // If we hit a rate limit, put it back in the front of the queue and pause
      if (r.status === 429 || (j.error && j.error.toLowerCase().includes('rate limit'))) {
        fetchQueue.unshift(phone);
        await new Promise(res => setTimeout(res, 5000));
        continue;
      }

      const total = j.total_parcels ?? j.parcel_count ?? j.total_reports ?? 0;
      const delivered = j.total_delivered ?? j.delivered_count ?? 0;
      const cancelled = j.total_cancelled ?? j.return_count ?? 0;
      // Use delivery_ratio directly from API
      const rate = j.delivery_ratio !== undefined ? j.delivery_ratio : (total > 0 ? Math.round((delivered / total) * 100) : null);
      const cancelRate = j.cancellation_ratio !== undefined ? j.cancellation_ratio : (total > 0 ? Math.round((cancelled / total) * 100) : null);
      const result = r.ok ? { rate, total, delivered, cancelled, cancelRate, raw: j } : 'error';

      _sfCache.set(phone, result);
      if (result !== 'error') _ssSet(phone, result);
      _sfListeners.get(phone)?.forEach(cb => cb(result));
      _sfListeners.delete(phone);

      // Throttle only if it was a LIVE request to Steadfast (not from our DB)
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

  // Check sessionStorage before making any network request
  const ssValue = _ssGet(phone);
  if (ssValue) {
    _sfCache.set(phone, ssValue);
    onResult(ssValue);
    return;
  }

  _sfCache.set(phone, 'loading');
  _sfListeners.set(phone, new Set([onResult]));
  fetchQueue.push(phone);
  processQueue();
}

// --- COMPACT INLINE PILL FOR LIST ROWS ---
export const SteadfastPill = ({ phone, initialData }) => {
  const [result, setResult] = useState(() => {
    if (initialData) return initialData;
    const cached = _sfCache.get(phone);
    return cached !== undefined ? cached : 'loading';
  });

  useEffect(() => {
    if (!phone) { setResult('nodata'); return; }
    if (initialData) { setResult(initialData); return; }
    const cached = _sfCache.get(phone);
    if (cached && cached !== 'loading') { setResult(cached); return; }
    fetchSteadfastForPhone(phone, setResult);
  }, [phone, initialData]);

  if (!phone || result === 'nodata') return null;

  if (result === 'loading') return (
    <div className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 animate-pulse px-2.5 py-1.5">
      <Loader2 size={14} className="animate-spin shrink-0" />
      <span>checking...</span>
    </div>
  );

  if (result === 'error') return (
    <div className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 px-2.5 py-1.5" title="Steadfast check failed">
      <XCircle size={14} className="shrink-0" />
      <span>N/A</span>
    </div>
  );

  const { rate, total, delivered, cancelled, raw } = result;

  const isNew = raw ? (raw.volume_band === 'none' || raw.delivery_ratio === null) : (total === 0 && rate === null);

  if (isNew) return (
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

// --- FRAUD CHECKER BADGE (Premium Modal View) ---
export const FraudCheckerBadge = ({ phone }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!phone) { setLoading(false); return; }
    fetch(`/api/check-delivery?phone=${encodeURIComponent(phone)}`)
      .then(r => r.json().then(j => ({ ok: r.ok, j })))
      .then(({ ok, j }) => {
        if (!ok) throw new Error(j.error || 'Failed');
        setData(j);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [phone]);

  if (loading) return (
    <div className="mt-4 p-5 rounded-2xl border border-gray-700/50 bg-gray-800/40 flex items-center justify-center gap-3">
      <Loader2 className="animate-spin text-indigo-400 w-5 h-5" />
      <span className="text-sm font-medium text-gray-400">Checking Steadfast history...</span>
    </div>
  );
  if (error) return (
    <div className="mt-4 p-4 rounded-2xl border border-red-500/20 bg-red-500/10 flex items-center gap-3">
      <AlertTriangle className="text-red-400 w-5 h-5 shrink-0" />
      <span className="text-sm font-medium text-red-400">{error}</span>
    </div>
  );
  if (!data) return null;

  // Use API fields directly — no re-calculation to avoid rounding drift
  const rate = data.delivery_ratio ?? 0;
  const cancelRate = data.cancellation_ratio ?? 0;
  const totalParcels = data.total_parcels ?? 0;
  const volumeBand = data.volume_band ?? null;
  const fraudCount = data.total_reports ?? 0;
  const fraudCats = Array.isArray(data.fraud_categories) ? data.fraud_categories : [];
  const doubtful = data.doubtful_reports;

  const isGood = rate >= 70;
  const isBad = rate < 50 && (totalParcels > 0 || volumeBand);

  const accent = isGood
    ? { text: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', stroke: '#10b981' }
    : isBad
    ? { text: 'text-red-400',     bg: 'bg-red-500/15',     border: 'border-red-500/30',     stroke: '#ef4444' }
    : { text: 'text-amber-400',   bg: 'bg-amber-500/15',   border: 'border-amber-500/30',   stroke: '#f59e0b' };

  const label = isGood ? 'Trusted' : isBad ? 'High Risk' : 'Neutral';

  const volumeMap = {
    none:   null,
    low:    'Low (1-5)',
    medium: 'Medium (6-20)',
    high:   'High (21-200)',
  };
  const volumeLabel = volumeBand ? (volumeMap[volumeBand.toLowerCase()] || volumeBand)
    : totalParcels > 20 ? 'High (21-200)' : totalParcels > 5 ? 'Medium (6-20)' : totalParcels > 0 ? 'Low (1-5)' : '-';

  const volumeColor = volumeBand === 'high' || totalParcels > 20
    ? { bg: 'bg-emerald-500/10', text: 'text-emerald-400', icon: 'text-emerald-500' }
    : volumeBand === 'medium' || (totalParcels > 5 && totalParcels <= 20)
    ? { bg: 'bg-blue-500/10', text: 'text-blue-400', icon: 'text-blue-500' }
    : volumeBand === 'low' || (totalParcels > 0 && totalParcels <= 5)
    ? { bg: 'bg-amber-500/10', text: 'text-amber-400', icon: 'text-amber-500' }
    : { bg: 'bg-gray-800/40', text: 'text-gray-400', icon: 'text-gray-500' };

  return (
    <div className="mt-4 rounded-xl border border-gray-700/50 bg-[#131825] overflow-hidden">
      <div className={`px-4 pt-4 pb-3 flex items-center justify-between ${volumeColor.bg}`}>
        <div className="flex items-center gap-2.5">
          <Package size={14} className={volumeColor.icon} />
          <div>
            <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-widest leading-none mb-0.5">Parcel Volume</p>
            <p className={`text-[17px] font-black leading-none ${volumeColor.text}`}>{volumeLabel}</p>
          </div>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-widest ${accent.bg} ${accent.text} border ${accent.border}`}>
          {label}
        </span>
      </div>

      <div className="border-t border-gray-800/80" />

      <div className="px-4 py-3">
        <div className="flex items-end gap-2 mb-2">
          <span className={`text-[32px] font-black leading-none ${accent.text}`}>{rate}%</span>
          <span className="text-sm font-semibold text-gray-400 mb-1">Delivery Success</span>
        </div>
        <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: '#f04438' }}>
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${rate}%`, background: accent.stroke }}
          />
        </div>
      </div>

      <div className="mx-4 border-t border-gray-800" />

      <div className="grid grid-cols-2">
        <div className="px-4 py-3">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1">Cancelled</p>
          <p className="text-[18px] font-black leading-none text-red-400">{cancelRate}%</p>
        </div>

        <div className={`relative border-l border-gray-700/60 px-4 py-3 flex flex-col items-center justify-center ${fraudCount >= 1 ? 'bg-red-500/15' : ''}`}>
          <p className={`text-[10px] font-semibold uppercase tracking-widest mb-1 flex items-center gap-1 ${fraudCount >= 1 ? 'text-red-400' : 'text-gray-500'}`}>
            <ShieldAlert size={10} className={fraudCount >= 1 ? 'text-red-400' : 'text-gray-600'} />
            Fraud Reports
          </p>
          <p className={`text-[22px] font-black leading-none ${fraudCount >= 1 ? 'text-red-400' : 'text-gray-500'}`}>
            {fraudCount >= 1 ? fraudCount : '-'}
          </p>
        </div>
      </div>

      {fraudCats.length > 0 && (
        <div className="mx-4 mb-3 pt-2 border-t border-gray-800 space-y-1.5">
          <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-widest flex items-center gap-1">
            <ShieldAlert size={9} className="text-red-400" /> Reported As
          </p>
          <div className="flex flex-wrap gap-1.5">
            {fraudCats.map((cat, idx) => (
              <span key={idx} className="px-2 py-0.5 rounded text-[10px] font-semibold bg-red-500/10 border border-red-500/20 text-red-300">
                {cat.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
              </span>
            ))}
          </div>
        </div>
      )}

      {doubtful && (
        <div className="mx-4 mb-3 flex items-center gap-2 border border-amber-500/20 rounded-lg px-3 py-2" style={{ background: 'rgba(245,158,11,0.05)' }}>
          <AlertTriangle size={11} className="text-amber-400 shrink-0" />
          <p className="text-[11px] font-medium text-amber-300">Flagged as doubtful by Steadfast network</p>
        </div>
      )}
    </div>
  );
};
