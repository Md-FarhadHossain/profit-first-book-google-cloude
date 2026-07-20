"use client";

import React, { useState, useEffect } from 'react';
import { getAiSummary } from '@/app/actions/ai-summary';
import { Sparkles, Activity } from 'lucide-react';

export default function AiSummary() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchSummary() {
      try {
        const res = await getAiSummary();
        if (res.success) {
          setSummary(res.summary);
        } else {
          setError(res.message);
        }
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchSummary();
  }, []);

  if (loading) {
    return (
      <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700/60 rounded-2xl p-6 mb-8 shadow-2xl flex items-center justify-center min-h-[100px]">
        <Activity className="animate-pulse mr-2 text-indigo-400" />
        <span className="text-gray-400 text-sm">Generating AI Business Summary...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500/30 rounded-2xl p-6 mb-8 text-red-400 text-sm">
        Failed to load AI Summary: {error}
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="bg-gradient-to-br from-indigo-900/30 to-purple-900/20 backdrop-blur-xl border border-indigo-500/30 rounded-2xl p-6 mb-8 shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="flex items-center gap-2 mb-4 relative z-10">
        <Sparkles className="text-indigo-400" size={20} />
        <h2 className="text-lg font-bold text-white tracking-tight">AI Executive Summary</h2>
        <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
          Auto-Updates Daily
        </span>
      </div>
      
      <div 
        className="relative z-10 text-gray-300 text-sm leading-relaxed space-y-4"
        dangerouslySetInnerHTML={{ 
          __html: summary
            .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-white">$1</strong>')
            .replace(/^\* /gm, '• ')
            .replace(/\n/g, '<br />')
        }}
      />
    </div>
  );
}
