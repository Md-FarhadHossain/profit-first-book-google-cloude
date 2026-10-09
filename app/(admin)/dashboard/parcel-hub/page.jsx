"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  MapPin,
  Package,
  RefreshCw,
  Loader2,
  Phone,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
  PauseCircle,
  HelpCircle,
  Search,
  X,
  Banknote,
  CloudDownload,
} from "lucide-react";


// ─── Courier status config ────────────────────────────────────────────────────
const COURIER_STATUS_CONFIG = {
  pending: {
    label: "Pending",
    color: "bg-blue-500/20 text-blue-300 border border-blue-500/30",
    dot: "bg-blue-400",
    icon: Clock,
    priority: 2,
  },
  in_review: {
    label: "In Review",
    color: "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30",
    dot: "bg-yellow-400",
    icon: AlertCircle,
    priority: 1,
  },
  delivered_to_courier: {
    label: "With Courier",
    color: "bg-green-500/20 text-green-300 border border-green-500/30",
    dot: "bg-green-400",
    icon: Truck,
    priority: 3,
  },
  partial_delivered: {
    label: "Partial",
    color: "bg-orange-500/20 text-orange-300 border border-orange-500/30",
    dot: "bg-orange-400",
    icon: CheckCircle2,
    priority: 4,
  },
  hold: {
    label: "On Hold",
    color: "bg-red-500/20 text-red-300 border border-red-500/30",
    dot: "bg-red-400",
    icon: PauseCircle,
    priority: 0,
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-gray-500/20 text-gray-400 border border-gray-500/30",
    dot: "bg-gray-500",
    icon: XCircle,
    priority: 5,
  },
};

const getStatusConfig = (status) =>
  COURIER_STATUS_CONFIG[status] || {
    label: status || "Unknown",
    color: "bg-gray-500/20 text-gray-400 border border-gray-500/30",
    dot: "bg-gray-500",
    icon: HelpCircle,
    priority: 99,
  };

// ─── Format date ──────────────────────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

// ─── Format currency ──────────────────────────────────────────────────────────
function formatBDT(amount) {
  return `৳${Number(amount || 0).toLocaleString("en-BD")}`;
}

// ─── Copy to clipboard with feedback ─────────────────────────────────────────
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };
  return (
    <button
      onClick={handleCopy}
      title="Copy tracking code"
      className="p-1 rounded hover:bg-white/10 transition-colors"
    >
      {copied ? (
        <Check size={13} className="text-green-400" />
      ) : (
        <Copy size={13} className="text-gray-400 hover:text-white" />
      )}
    </button>
  );
}

// ─── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = getStatusConfig(status);
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${cfg.color}`}
    >
      <Icon size={10} />
      {cfg.label}
    </span>
  );
}

// ─── Status Breakdown Pills ───────────────────────────────────────────────────
function StatusBreakdown({ breakdown }) {
  const entries = Object.entries(breakdown).sort(
    ([a], [b]) =>
      (getStatusConfig(a).priority ?? 99) -
      (getStatusConfig(b).priority ?? 99)
  );
  return (
    <div className="flex flex-wrap gap-1.5">
      {entries.map(([status, count]) => {
        const cfg = getStatusConfig(status);
        return (
          <span
            key={status}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-white/5 border border-white/10 text-gray-300"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {count} {cfg.label}
          </span>
        );
      })}
    </div>
  );
}

// ─── Parcel Table Row ──────────────────────────────────────────────────────────
function ParcelRow({ parcel, index }) {
  return (
    <tr
      className={`group transition-colors ${
        index % 2 === 0 ? "bg-white/[0.02]" : ""
      } hover:bg-white/[0.06]`}
    >
      {/* Order ID */}
      <td className="px-3 py-2.5 whitespace-nowrap">
        <span className="font-mono text-xs text-indigo-300">
          {parcel.orderId}
        </span>
      </td>

      {/* Customer */}
      <td className="px-3 py-2.5">
        <div className="font-medium text-sm text-white leading-tight">
          {parcel.name}
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          <Phone size={10} className="text-gray-500 shrink-0" />
          <span className="text-xs text-gray-400 font-mono">{parcel.number}</span>
        </div>
      </td>

      {/* Thana / Hub */}
      <td className="px-3 py-2.5">
        <span className="text-xs text-gray-300">
          {parcel.thana || <span className="text-gray-600">—</span>}
        </span>
      </td>

      {/* COD */}
      <td className="px-3 py-2.5 whitespace-nowrap">
        <span className="text-sm font-semibold text-emerald-400">
          {formatBDT(parcel.totalValue)}
        </span>
      </td>

      {/* Status */}
      <td className="px-3 py-2.5">
        <StatusBadge status={parcel.courierStatus} />
      </td>

      {/* Tracking */}
      <td className="px-3 py-2.5">
        {parcel.trackingCode ? (
          <div className="flex items-center gap-1">
            <span className="font-mono text-xs text-gray-400">
              {parcel.trackingCode}
            </span>
            <CopyButton text={parcel.trackingCode} />
          </div>
        ) : (
          <span className="text-gray-600 text-xs">—</span>
        )}
      </td>

      {/* Shipped At */}
      <td className="px-3 py-2.5 whitespace-nowrap">
        <span className="text-xs text-gray-400">{formatDate(parcel.shippedAt)}</span>
      </td>
    </tr>
  );
}

// ─── District Card ─────────────────────────────────────────────────────────────
function DistrictCard({ district, isExpanded, onToggle, searchQuery }) {
  const filteredParcels = searchQuery
    ? district.parcels.filter(
        (p) =>
          p.orderId?.toLowerCase().includes(searchQuery) ||
          p.name?.toLowerCase().includes(searchQuery) ||
          p.number?.includes(searchQuery) ||
          p.thana?.toLowerCase().includes(searchQuery) ||
          p.trackingCode?.toLowerCase().includes(searchQuery)
      )
    : district.parcels;

  const holdCount = district.statusBreakdown?.hold || 0;
  const hasAlert = holdCount > 0;

  return (
    <div
      id={`district-${district.name.replace(/\s+/g, "-").toLowerCase()}`}
      className={`rounded-2xl border transition-all duration-300 overflow-hidden
        ${hasAlert
          ? "border-red-500/40 shadow-lg shadow-red-900/10"
          : "border-white/10 shadow-lg shadow-black/20"
        }
        bg-gradient-to-b from-white/[0.06] to-white/[0.03]
      `}
    >
      {/* Card Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-white/[0.04] transition-colors group"
      >
        {/* District icon */}
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0
            ${hasAlert
              ? "bg-red-500/20 border border-red-500/30"
              : "bg-indigo-500/20 border border-indigo-500/30"
            }`}
        >
          <MapPin
            size={18}
            className={hasAlert ? "text-red-400" : "text-indigo-400"}
          />
        </div>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-white text-base">
              {district.name}
            </span>
            {hasAlert && (
              <span className="px-2 py-0.5 bg-red-500/20 border border-red-500/30 text-red-300 text-xs rounded-full font-medium animate-pulse">
                {holdCount} On Hold
              </span>
            )}
          </div>
          <div className="mt-1">
            <StatusBreakdown breakdown={district.statusBreakdown} />
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 shrink-0">
          <div className="text-right hidden sm:block">
            <div className="text-xs text-gray-500 uppercase tracking-wide">Parcels</div>
            <div className="font-bold text-2xl text-white leading-tight">
              {district.count}
            </div>
          </div>
          <div className="text-right hidden md:block">
            <div className="text-xs text-gray-500 uppercase tracking-wide">COD Value</div>
            <div className="font-bold text-lg text-emerald-400 leading-tight">
              {formatBDT(district.totalCOD)}
            </div>
          </div>
          <div className="text-gray-400 group-hover:text-white transition-colors">
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </div>
      </button>

      {/* Parcel Table */}
      {isExpanded && (
        <div className="border-t border-white/10">
          {filteredParcels.length === 0 ? (
            <div className="py-8 text-center text-gray-500 text-sm">
              No parcels match your search.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-black/20">
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      Order ID
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Customer
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Thana / Hub
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      COD
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      Status
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      Tracking
                    </th>
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                      Shipped
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {filteredParcels.map((parcel, i) => (
                    <ParcelRow key={parcel.orderId} parcel={parcel} index={i} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {/* Card footer */}
          <div className="px-5 py-2.5 bg-black/10 border-t border-white/[0.05] flex items-center justify-between text-xs text-gray-500">
            <span>
              {filteredParcels.length} parcel
              {filteredParcels.length !== 1 ? "s" : ""} shown
            </span>
            <span>Total COD: {formatBDT(district.totalCOD)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ParcelHubPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [activeDistrict, setActiveDistrict] = useState("all");
  const [expandedCards, setExpandedCards] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  const pillBarRef = useRef(null);
  const intervalRef = useRef(null);

  // ─── Fetch data ──────────────────────────────────────────────────────────────
  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const res = await fetch("/api/parcel-hubs", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message || "Unknown error");
      setData(json);
      setLastUpdated(new Date());
      // Auto-expand all districts on first load if ≤ 5
      if (!silent && json.districts?.length <= 5) {
        const expanded = {};
        json.districts.forEach((d) => {
          expanded[d.name] = true;
        });
        setExpandedCards(expanded);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Auto-refresh ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => fetchData(true), 60000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [autoRefresh, fetchData]);

  // ─── Horizontal Scroll on Mouse Wheel ─────────────────────────────────────────
  useEffect(() => {
    const pillBar = pillBarRef.current;
    if (!pillBar) return;

    const handleWheel = (e) => {
      // If scrolling vertically and not holding shift (which naturally does horizontal)
      if (e.deltaY !== 0 && !e.shiftKey) {
        e.preventDefault();
        pillBar.scrollLeft += e.deltaY;
      }
    };

    pillBar.addEventListener("wheel", handleWheel, { passive: false });
    return () => pillBar.removeEventListener("wheel", handleWheel);
  }, []);

  // ─── Sync courier statuses from Steadfast ────────────────────────────────────
  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/sync-courier", { method: "POST" });
      const result = await res.json();
      setSyncResult(result);
      // Reload page data after sync so counts update immediately
      await fetchData(true);
    } catch (e) {
      setSyncResult({ success: false, message: e.message });
    } finally {
      setSyncing(false);
      // Auto-dismiss result banner after 8 seconds
      setTimeout(() => setSyncResult(null), 8000);
    }
  };

  // ─── Toggle card ──────────────────────────────────────────────────────────────
  const toggleCard = (name) => {
    setExpandedCards((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  // ─── Scroll to district ────────────────────────────────────────────────────
  const scrollToDistrict = (districtName) => {
    setActiveDistrict(districtName);
    if (districtName === "all") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const id = `district-${districtName.replace(/\s+/g, "-").toLowerCase()}`;
    const el = document.getElementById(id);
    if (el) {
      const offset = 140; // account for sticky pill bar + top bar
      const y = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: y, behavior: "smooth" });
      // Auto-expand if not already
      setExpandedCards((prev) => ({ ...prev, [districtName]: true }));
    }
  };

  // ─── Filtered districts ──────────────────────────────────────────────────────
  const filteredDistricts = data?.districts?.filter((d) => {
    if (activeDistrict !== "all" && d.name !== activeDistrict) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    // Match district name or any parcel field
    if (d.name.toLowerCase().includes(q)) return true;
    return d.parcels.some(
      (p) =>
        p.orderId?.toLowerCase().includes(q) ||
        p.name?.toLowerCase().includes(q) ||
        p.number?.includes(q) ||
        p.thana?.toLowerCase().includes(q) ||
        p.trackingCode?.toLowerCase().includes(q)
    );
  });

  // ─── Summary stats ─────────────────────────────────────────────────────────
  const totalHoldParcels = data?.districts?.reduce(
    (sum, d) => sum + (d.statusBreakdown?.hold || 0),
    0
  ) || 0;

  // ─── Loading State ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20" />
            <div className="absolute inset-0 rounded-full border-t-2 border-indigo-400 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Package size={24} className="text-indigo-400" />
            </div>
          </div>
          <p className="text-gray-400 text-sm">Loading parcel hubs…</p>
        </div>
      </div>
    );
  }

  // ─── Error State ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-2xl flex items-center justify-center border border-red-500/30">
            <AlertCircle size={28} className="text-red-400" />
          </div>
          <h2 className="text-white text-xl font-bold mb-2">Failed to Load</h2>
          <p className="text-gray-400 text-sm mb-6">{error}</p>
          <button
            onClick={() => fetchData()}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* ── Top sticky header ─────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-gray-900/90 backdrop-blur-xl border-b border-white/10">
        {/* Page title row */}
        <div className="px-4 md:px-6 pt-5 pb-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-900/40">
              <Truck size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-xl leading-tight">
                Parcel Hub Tracker
              </h1>
              <p className="text-gray-500 text-xs">
                Shipped parcels by destination district
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Last updated */}
            {lastUpdated && (
              <span className="hidden sm:block text-xs text-gray-600">
                Updated {lastUpdated.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
            {/* Auto-refresh toggle */}
            <button
              onClick={() => setAutoRefresh((p) => !p)}
              title={autoRefresh ? "Disable auto-refresh" : "Enable auto-refresh (60s)"}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border
                ${autoRefresh
                  ? "bg-indigo-600/30 border-indigo-500/50 text-indigo-300"
                  : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/20"
                }`}
            >
              <RefreshCw
                size={12}
                className={autoRefresh ? "animate-spin [animation-duration:3s]" : ""}
              />
              {autoRefresh ? "Live" : "Auto"}
            </button>
            {/* Manual refresh */}
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing || syncing}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-gray-400 hover:text-white rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {refreshing ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <RefreshCw size={12} />
              )}
              Refresh
            </button>
            {/* ── Sync with Steadfast ── */}
            <button
              onClick={handleSync}
              disabled={syncing || refreshing}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 border shadow-lg disabled:opacity-60
                ${syncing
                  ? "bg-emerald-600/40 border-emerald-500/50 text-emerald-300 cursor-wait"
                  : "bg-emerald-600 hover:bg-emerald-500 border-emerald-500 text-white shadow-emerald-900/40"
                }`}
              title="Pull latest delivery statuses from Steadfast and update your database"
            >
              {syncing ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <CloudDownload size={12} />
              )}
              {syncing ? "Syncing…" : "Sync Steadfast"}
            </button>
          </div>
        </div>

        {/* ── Sync Result Banner ─────────────────────────────────────────── */}
        {syncResult && (
          <div className={`mx-4 md:mx-6 mb-3 px-4 py-3 rounded-xl border flex items-start gap-3 text-sm
            ${syncResult.success
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-red-500/10 border-red-500/30 text-red-300"
            }`}>
            {syncResult.success ? (
              <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-400" />
            ) : (
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-400" />
            )}
            <span className="flex-1">{syncResult.message}</span>
            <button onClick={() => setSyncResult(null)} className="shrink-0 opacity-60 hover:opacity-100">
              <X size={14} />
            </button>
          </div>
        )}

        {/* ── Summary Stats Bar ──────────────────────────────────────────── */}
        <div className="px-4 md:px-6 pb-3 flex items-center gap-3 flex-wrap">
          {/* Total parcels */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg">
            <Package size={13} className="text-indigo-400 shrink-0" />
            <span className="text-xs text-gray-400">Total</span>
            <span className="text-sm font-bold text-white">{data?.totalParcels || 0}</span>
          </div>
          {/* Active districts */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg">
            <MapPin size={13} className="text-purple-400 shrink-0" />
            <span className="text-xs text-gray-400">Districts</span>
            <span className="text-sm font-bold text-white">{data?.totalDistricts || 0}</span>
          </div>
          {/* Total COD */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg">
            <Banknote size={13} className="text-emerald-400 shrink-0" />
            <span className="text-xs text-gray-400">COD</span>
            <span className="text-sm font-bold text-emerald-400">
              {formatBDT(data?.totalCOD)}
            </span>
          </div>
          {/* Hold alert */}
          {totalHoldParcels > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 border border-red-500/30 rounded-lg animate-pulse">
              <PauseCircle size={13} className="text-red-400 shrink-0" />
              <span className="text-xs text-red-300 font-medium">
                {totalHoldParcels} On Hold
              </span>
            </div>
          )}
        </div>

        {/* ── District Pill Scroll Bar ───────────────────────────────────── */}
        <div
          ref={pillBarRef}
          className="flex gap-2 px-4 md:px-6 pb-3 overflow-x-auto custom-scrollbar-x"
        >
          {/* All pill */}
          <button
            onClick={() => scrollToDistrict("all")}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap border
              ${activeDistrict === "all"
                ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-900/40"
                : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/20 hover:bg-white/10"
              }`}
          >
            All{" "}
            <span
              className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${
                activeDistrict === "all"
                  ? "bg-white/20 text-white"
                  : "bg-white/10 text-gray-400"
              }`}
            >
              {data?.totalParcels || 0}
            </span>
          </button>

          {/* One pill per district */}
          {data?.districts?.map((d) => {
            const isActive = activeDistrict === d.name;
            const hasHold = (d.statusBreakdown?.hold || 0) > 0;
            return (
              <button
                key={d.name}
                onClick={() => scrollToDistrict(d.name)}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap border flex items-center gap-1.5
                  ${isActive
                    ? hasHold
                      ? "bg-red-600 border-red-500 text-white shadow-lg shadow-red-900/40"
                      : "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-900/40"
                    : hasHold
                      ? "bg-red-500/10 border-red-500/30 text-red-300 hover:bg-red-500/20"
                      : "bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/20 hover:bg-white/10"
                  }`}
              >
                {hasHold && !isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                )}
                {d.name}
                <span
                  className={`px-1.5 py-0.5 rounded-full text-xs ${
                    isActive ? "bg-white/20 text-white" : "bg-white/10 text-gray-400"
                  }`}
                >
                  {d.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Search Bar ────────────────────────────────────────────────── */}
        <div className="px-4 md:px-6 pb-4">
          <div className="relative max-w-sm">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value.toLowerCase())}
              placeholder="Search order, name, phone, tracking…"
              className="w-full pl-8 pr-8 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 focus:bg-white/8 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <div className="px-4 md:px-6 py-6 space-y-4 max-w-7xl mx-auto">
        {/* Empty state */}
        {(!filteredDistricts || filteredDistricts.length === 0) && (
          <div className="py-20 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
              <Package size={28} className="text-gray-600" />
            </div>
            <h3 className="text-white font-semibold mb-1">
              {data?.totalParcels === 0
                ? "No Shipped Parcels"
                : "No Matches Found"}
            </h3>
            <p className="text-gray-500 text-sm max-w-xs mx-auto">
              {data?.totalParcels === 0
                ? "Once you ship orders to Steadfast, they'll appear here grouped by destination district."
                : "Try a different search term or clear the filter."}
            </p>
          </div>
        )}

        {/* District cards */}
        {filteredDistricts?.map((district) => (
          <DistrictCard
            key={district.name}
            district={district}
            isExpanded={!!expandedCards[district.name]}
            onToggle={() => toggleCard(district.name)}
            searchQuery={searchQuery}
          />
        ))}
      </div>

      {/* ── Expand / Collapse All shortcut ────────────────────────────── */}
      {filteredDistricts && filteredDistricts.length > 1 && (
        <div className="px-4 md:px-6 pb-6 max-w-7xl mx-auto flex gap-2">
          <button
            onClick={() => {
              const all = {};
              filteredDistricts.forEach((d) => { all[d.name] = true; });
              setExpandedCards(all);
            }}
            className="px-4 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
          >
            <ChevronDown size={13} /> Expand All
          </button>
          <button
            onClick={() => setExpandedCards({})}
            className="px-4 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
          >
            <ChevronUp size={13} /> Collapse All
          </button>
        </div>
      )}
      
      {/* ── Custom Scrollbar Style for the Pill Bar ───────────────────── */}
      <style>{`
        .custom-scrollbar-x::-webkit-scrollbar { height: 4px; }
        .custom-scrollbar-x::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar-x::-webkit-scrollbar-thumb { background: #374151; border-radius: 10px; }
        .custom-scrollbar-x::-webkit-scrollbar-thumb:hover { background: #4b5563; }
      `}</style>
    </div>
  );
}
