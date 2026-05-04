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
  X
} from "lucide-react";

const API_URL = "/api"; // Your backend URL

export default function BlockScammerPage() {
  // --- STATE ---
  const [identifier, setIdentifier] = useState("");
  const [note, setNote] = useState("");
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // --- EFFECTS ---
  useEffect(() => {
    fetchBlockedUsers();
  }, []);

  // --- LOGIC ---
  const fetchBlockedUsers = async () => {
    setFetchLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/blocked-users`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setBlockedUsers(data);
      } else {
        setBlockedUsers([]);
        console.error("API returned non-array data:", data);
      }
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
      setMessage({
        type: "error",
        text: "Please enter a Device ID, Phone Number, or IP",
      });
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
        setMessage({
          type: "error",
          text: data.message || "Failed to block user",
        });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Server error occurred" });
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async (targetIdentifier) => {
    if (!confirm("Are you sure you want to unblock this user? Access will be restored.")) return;

    try {
      const res = await fetch(
        `${API_URL}/admin/blocked-users/${encodeURIComponent(targetIdentifier)}`,
        {
          method: "DELETE",
        }
      );

      if (res.ok) {
        fetchBlockedUsers();
      } else {
        alert("Failed to unblock");
      }
    } catch (error) {
      alert("Error unblocking user");
    }
  };

  // --- SEARCH FILTER ---
  const filteredUsers = useMemo(() => {
    if (!searchTerm) return blockedUsers;
    const lowerTerm = searchTerm.toLowerCase();
    return blockedUsers.filter(
      (user) =>
        user.identifier?.toLowerCase().includes(lowerTerm) ||
        user.note?.toLowerCase().includes(lowerTerm)
    );
  }, [blockedUsers, searchTerm]);

  // --- RENDER HELPERS ---
  const getIdentifierIcon = (str) => {
    if (str.includes(".")) return <Globe size={14} />; // IP
    if (str.length > 10 && !str.includes(".")) return <Smartphone size={14} />; // Device ID
    return <Hash size={14} />; // Number
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4 md:p-8 font-sans selection:bg-red-500/30">
      {/* Custom Scrollbar Styles to match dashboard */}
      <style>{`
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #111827; }
        ::-webkit-scrollbar-thumb { background: #374151; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #4b5563; }
      `}</style>

      <div className="max-w-6xl mx-auto space-y-8">
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 bg-red-500/10 rounded-lg border border-red-500/20 text-red-500">
                <ShieldAlert size={28} />
              </div>
              <h1 className="text-3xl font-bold text-white tracking-tight">
                Security Shield
              </h1>
            </div>
            <p className="text-gray-400 text-sm">
              Manage blacklisted devices, IPs, and phone numbers.
            </p>
          </div>
          
          {/* Stats Widget */}
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 flex items-center gap-4 shadow-lg min-w-[200px]">
            <div className="p-3 bg-gray-900 rounded-lg text-red-400">
              <Ban size={24} />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase font-semibold">Total Blocked</p>
              <p className="text-2xl font-bold text-white">{blockedUsers.length}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* --- LEFT COLUMN: BLOCK FORM --- */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-gray-800 rounded-2xl border border-gray-700 shadow-xl overflow-hidden">
              <div className="bg-gray-900/50 px-6 py-4 border-b border-gray-700 flex items-center gap-2">
                <UserX size={18} className="text-red-400" />
                <h2 className="font-semibold text-white">Block New User</h2>
              </div>
              
              <div className="p-6">
                <form onSubmit={handleBlockUser} className="space-y-5">
                  {/* Identifier Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wider ml-1">
                      Identifier
                    </label>
                    <div className="relative group">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-red-400 transition-colors">
                        <Smartphone size={18} />
                      </div>
                      <input
                        type="text"
                        placeholder="Device ID / Phone / IP"
                        className="w-full bg-gray-900 border border-gray-600 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all font-mono text-sm"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                      />
                    </div>
                    <p className="text-[10px] text-gray-500 pl-1">
                      Supports Device IDs, Phone Numbers (017...), or IP Addresses.
                    </p>
                  </div>

                  {/* Note Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-400 uppercase tracking-wider ml-1">
                      Reason / Note
                    </label>
                    <div className="relative group">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-red-400 transition-colors">
                        <FileText size={18} />
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

                  {/* Feedback Message */}
                  {message && (
                    <div
                      className={`p-3 rounded-lg border flex items-start gap-3 text-sm animate-in fade-in slide-in-from-top-2 ${
                        message.type === "success"
                          ? "bg-green-500/10 border-green-500/20 text-green-400"
                          : "bg-red-500/10 border-red-500/20 text-red-400"
                      }`}
                    >
                      {message.type === "success" ? (
                        <CheckCircle size={18} className="shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                      )}
                      <span>{message.text}</span>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-red-900/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <>
                        <Shield size={20} /> BLOCK USER
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* --- RIGHT COLUMN: DATABASE LIST --- */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-800/50 p-2 rounded-xl border border-gray-700/50">
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Search database..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg py-2 pl-9 pr-3 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <button
                onClick={fetchBlockedUsers}
                disabled={fetchLoading}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2 text-sm"
              >
                <RefreshCw size={14} className={fetchLoading ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>

            {/* Table */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-900/80 border-b border-gray-700">
                    <tr>
                      <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Identifier</th>
                      <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Note</th>
                      <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                      <th className="p-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/50">
                    {fetchLoading && blockedUsers.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="p-12 text-center text-gray-500">
                          <Loader2 size={32} className="animate-spin mx-auto mb-2" />
                          <p>Loading database...</p>
                        </td>
                      </tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="p-12 text-center">
                          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-700/50 mb-4 text-gray-500">
                            {searchTerm ? <Search size={24}/> : <Shield size={24} />}
                          </div>
                          <p className="text-gray-300 font-medium">
                            {searchTerm ? "No users found matching search" : "No blocked users found"}
                          </p>
                          <p className="text-gray-500 text-sm mt-1">
                            {searchTerm ? "Try a different ID or note" : "Your blacklist is currently empty."}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <tr key={user._id} className="group hover:bg-gray-700/30 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-gray-900 rounded-md text-gray-400 border border-gray-700 group-hover:border-gray-500 transition-colors">
                                {getIdentifierIcon(user.identifier)}
                              </div>
                              <span className="font-mono text-sm text-white">{user.identifier}</span>
                            </div>
                          </td>
                          <td className="p-4 text-sm text-gray-300">
                            {user.note || <span className="text-gray-600 italic">No note provided</span>}
                          </td>
                          <td className="p-4 text-sm text-gray-400 whitespace-nowrap">
                            {user.blockedAt ? new Date(user.blockedAt).toLocaleDateString() : "N/A"}
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleUnblock(user.identifier)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-600 text-xs font-medium text-gray-300 hover:text-red-400 hover:border-red-500/50 hover:bg-red-500/10 transition-all group/btn"
                              title="Unblock User"
                            >
                              <Unlock size={12} className="group-hover/btn:hidden" />
                              <Trash2 size={12} className="hidden group-hover/btn:block" />
                              Unblock
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Footer Count */}
            {filteredUsers.length > 0 && (
              <p className="text-xs text-gray-500 text-right px-1">
                Showing {filteredUsers.length} of {blockedUsers.length} entries
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}