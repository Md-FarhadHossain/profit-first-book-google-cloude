"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Shield,
  ShieldAlert,
  Search,
  UserX,
  FileText,
  AlertTriangle,
  CheckCircle,
  Unlock,
  Trash2,
  RefreshCw,
  Loader2,
  Ban,
  Smartphone,
  Globe,
  Hash,
  Phone,
  X,
  ChevronDown,
  ChevronUp,
  ShieldOff,
} from "lucide-react";

const API_URL = "/api";

const getIdentifierType = (str) => {
  if (!str) return "unknown";
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(str)) return "ip";
  if (/^(\+?880|01)\d{9,}$/.test(str)) return "phone";
  if (str.startsWith("dev_")) return "device";
  if (str.includes(".")) return "ip";
  if (str.length > 10) return "device";
  return "phone";
};

const identifierConfig = {
  ip:      { icon: Globe,      label: "IP Address", color: "text-blue-400",   bg: "bg-blue-500/10",   border: "border-blue-500/20" },
  phone:   { icon: Phone,      label: "Phone",       color: "text-green-400",  bg: "bg-green-500/10",  border: "border-green-500/20" },
  device:  { icon: Smartphone, label: "Device ID",   color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
  unknown: { icon: Hash,       label: "Identifier",  color: "text-gray-400",   bg: "bg-gray-500/10",   border: "border-gray-500/20" },
};

function IdentifierChip({ value }) {
  const type = getIdentifierType(value);
  const cfg = identifierConfig[type];
  const Icon = cfg.icon;
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${cfg.bg} ${cfg.border} ${cfg.color} text-xs font-mono font-medium max-w-full`}>
      <Icon size={11} className="shrink-0" />
      <span className="truncate">{value}</span>
    </div>
  );
}

function BlockedCard({ group, onUnblockGroup }) {
  const [expanded, setExpanded] = useState(false);
  const isFraud = group.length > 1;
  const date = group[0].blockedAt ? new Date(group[0].blockedAt) : null;
  const rawNote = group[0].note || "";

  // Parse "Customer Name — Blocked from order #ORD-XXXX"
  const nameSep = rawNote.indexOf(" \u2014 ");
  const customerName = nameSep > -1 ? rawNote.substring(0, nameSep) : null;
  const noteDetail = nameSep > -1 ? rawNote.substring(nameSep + 3) : rawNote;

  const visible = expanded ? group : group.slice(0, 2);
  const hidden = group.length - 2;

  return (
    <div className={`relative rounded-xl border shadow-md transition-all duration-200 overflow-hidden
      ${isFraud
        ? "bg-red-950/20 border-red-500/25 hover:border-red-500/40 hover:bg-red-950/30"
        : "bg-gray-800/60 border-gray-700 hover:border-gray-600 hover:bg-gray-800"
      }`}
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${isFraud ? "bg-red-500" : "bg-gray-600"}`} />

      <div className="pl-4 pr-4 pt-4 pb-3 ml-1">
        {/* Top row: badge + customer name + date + unblock */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              {isFraud ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 text-[10px] font-bold uppercase tracking-wider">
                  <ShieldAlert size={10} />
                  Fraud Customer
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-700 border border-gray-600 text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                  <Shield size={10} />
                  Blocked
                </span>
              )}
              {customerName && (
                <span className="text-sm font-semibold text-white">{customerName}</span>
              )}
            </div>
            {noteDetail && (
              <span className="text-[11px] text-gray-500 pl-0.5">{noteDetail}</span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {date && (
              <span className="text-[10px] text-gray-500 whitespace-nowrap">
                {date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
              </span>
            )}
            <button
              onClick={() => onUnblockGroup(group)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-900/80 border border-gray-600 text-xs text-gray-300 hover:text-red-400 hover:border-red-500/50 hover:bg-red-500/10 transition-all"
              title="Unblock"
            >
              <ShieldOff size={11} />
              {isFraud ? `Unblock All (${group.length})` : "Unblock"}
            </button>
          </div>
        </div>


        <div className="flex flex-wrap gap-2">
          {visible.map(user => (
            <IdentifierChip key={user.identifier} value={user.identifier} />
          ))}
          {!expanded && hidden > 0 && (
            <button
              onClick={() => setExpanded(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-700/60 border border-gray-600 text-gray-400 hover:text-white text-xs font-medium transition-all"
            >
              <ChevronDown size={11} />
              +{hidden} more
            </button>
          )}
          {expanded && hidden > 0 && (
            <button
              onClick={() => setExpanded(false)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-700/60 border border-gray-600 text-gray-400 hover:text-white text-xs font-medium transition-all"
            >
              <ChevronUp size={11} />
              Show less
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BlockScammerPage() {
  const [identifier, setIdentifier] = useState("");
  const [note, setNote] = useState("");
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => { fetchBlockedUsers(); }, []);

  const fetchBlockedUsers = async () => {
    setFetchLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/blocked-users`);
      const data = await res.json();
      setBlockedUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch blocked users", error);
    } finally {
      setFetchLoading(false);
    }
  };

  const handleBlockUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const cleanIdentifier = identifier.trim();
    if (!cleanIdentifier) {
      setMessage({ type: "error", text: "Please enter a Device ID, Phone Number, or IP" });
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/admin/block-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: cleanIdentifier, note }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: "success", text: "User has been blocked successfully." });
        setIdentifier("");
        setNote("");
        fetchBlockedUsers();
      } else {
        setMessage({ type: "error", text: data.message || "Failed to block user" });
      }
    } catch {
      setMessage({ type: "error", text: "Server error occurred" });
    } finally {
      setLoading(false);
    }
  };

  const handleUnblockGroup = async (group) => {
    const label = group.length > 1 ? `these ${group.length} identifiers` : "this identifier";
    if (!confirm(`Are you sure you want to unblock ${label}? Access will be restored.`)) return;
    try {
      await Promise.all(group.map(user =>
        fetch(`${API_URL}/admin/blocked-users/${encodeURIComponent(user.identifier)}`, { method: "DELETE" })
      ));
      fetchBlockedUsers();
    } catch {
      alert("Error unblocking users");
    }
  };

  const groupedUsers = useMemo(() => {
    let filtered = blockedUsers;
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      filtered = blockedUsers.filter(
        (user) =>
          user.identifier?.toLowerCase().includes(lowerTerm) ||
          user.note?.toLowerCase().includes(lowerTerm)
      );
    }

    const groups = {};
    const ungrouped = [];

    filtered.forEach(user => {
      if (user.note && user.note.trim() !== "") {
        const key = user.note.trim();
        if (!groups[key]) groups[key] = [];
        groups[key].push(user);
      } else {
        ungrouped.push([user]);
      }
    });

    const result = [...Object.values(groups), ...ungrouped];

    return result.sort((a, b) => {
      const dateA = a[0].blockedAt ? new Date(a[0].blockedAt).getTime() : 0;
      const dateB = b[0].blockedAt ? new Date(b[0].blockedAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [blockedUsers, searchTerm]);

  const fraudCount = groupedUsers.filter(g => g.length > 1).length;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4 md:p-8 font-sans selection:bg-red-500/30">
      <style>{`
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #111827; }
        ::-webkit-scrollbar-thumb { background: #374151; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #4b5563; }
      `}</style>

      <div className="max-w-6xl mx-auto space-y-8">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/20 text-red-500">
                <ShieldAlert size={28} />
              </div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Security Shield</h1>
            </div>
            <p className="text-gray-400 text-sm pl-1">Manage blacklisted devices, IPs, and phone numbers.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-gray-800 rounded-xl p-3 border border-gray-700 flex items-center gap-3 shadow-lg">
              <div className="p-2 bg-gray-900 rounded-lg text-red-400"><Ban size={20} /></div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase font-semibold">Total Blocked</p>
                <p className="text-xl font-bold text-white">{blockedUsers.length}</p>
              </div>
            </div>
            {fraudCount > 0 && (
              <div className="bg-red-950/30 rounded-xl p-3 border border-red-500/25 flex items-center gap-3 shadow-lg">
                <div className="p-2 bg-red-500/10 rounded-lg text-red-400"><ShieldAlert size={20} /></div>
                <div>
                  <p className="text-[10px] text-red-500/70 uppercase font-semibold">Fraud Entries</p>
                  <p className="text-xl font-bold text-red-400">{fraudCount}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT: Block form */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-gray-800 rounded-2xl border border-gray-700 shadow-xl overflow-hidden sticky top-4">
              <div className="bg-gray-900/50 px-6 py-4 border-b border-gray-700 flex items-center gap-2">
                <UserX size={18} className="text-red-400" />
                <h2 className="font-semibold text-white">Block New User</h2>
              </div>
              <div className="p-6">
                <form onSubmit={handleBlockUser} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wider ml-1">Identifier</label>
                    <div className="relative group">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-red-400 transition-colors">
                        <Smartphone size={16} />
                      </div>
                      <input
                        type="text"
                        placeholder="Device ID / Phone / IP"
                        className="w-full bg-gray-900 border border-gray-600 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all font-mono text-sm"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                      />
                    </div>
                    <p className="text-[10px] text-gray-500 pl-1">Supports Device IDs, Phone Numbers (017...), or IP Addresses.</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wider ml-1">Reason / Note</label>
                    <div className="relative group">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-red-400 transition-colors">
                        <FileText size={16} />
                      </div>
                      <input
                        type="text"
                        placeholder="e.g. Fake order scammer"
                        className="w-full bg-gray-900 border border-gray-600 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all text-sm"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                      />
                    </div>
                  </div>

                  {message && (
                    <div className={`p-3 rounded-lg border flex items-start gap-3 text-sm ${message.type === "success" ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`}>
                      {message.type === "success" ? <CheckCircle size={16} className="shrink-0 mt-0.5" /> : <AlertTriangle size={16} className="shrink-0 mt-0.5" />}
                      <span>{message.text}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-red-900/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <><Shield size={18} /> BLOCK USER</>}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* RIGHT: Card list */}
          <div className="lg:col-span-2 space-y-4">

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-gray-800/50 p-2 rounded-xl border border-gray-700/50">
              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  placeholder="Search by identifier or note..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2 pl-9 pr-8 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/30"
                />
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                {searchTerm && (
                  <button onClick={() => setSearchTerm("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                    <X size={13} />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                {groupedUsers.length > 0 && (
                  <span className="text-xs text-gray-500 px-2">
                    {groupedUsers.length} {groupedUsers.length === 1 ? "entry" : "entries"}
                  </span>
                )}
                <button
                  onClick={fetchBlockedUsers}
                  disabled={fetchLoading}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-1.5 text-sm"
                >
                  <RefreshCw size={13} className={fetchLoading ? "animate-spin" : ""} />
                  Refresh
                </button>
              </div>
            </div>

            {/* Cards area */}
            {fetchLoading && blockedUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-500">
                <Loader2 size={32} className="animate-spin" />
                <p className="text-sm">Loading database...</p>
              </div>
            ) : groupedUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4 text-gray-500">
                <div className="p-5 bg-gray-800/50 rounded-2xl border border-gray-700">
                  {searchTerm ? <Search size={32} /> : <Shield size={32} />}
                </div>
                <div className="text-center">
                  <p className="text-gray-300 font-medium">{searchTerm ? "No results found" : "Blacklist is empty"}</p>
                  <p className="text-gray-500 text-sm mt-1">{searchTerm ? "Try a different search term" : "Blocked users will appear here"}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {groupedUsers.map((group, index) => (
                  <BlockedCard key={index} group={group} onUnblockGroup={handleUnblockGroup} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

