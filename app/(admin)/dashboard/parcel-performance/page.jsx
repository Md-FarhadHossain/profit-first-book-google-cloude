"use client";

import React, { useEffect, useState } from "react";
import { getParcelPerformance } from "../../../actions/performance";
import {
  Activity,
  Package,
  Truck,
  CheckCircle,
  RotateCcw,
  XCircle,
  Clock,
  Loader2
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

export default function ParcelPerformancePage() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const result = await getParcelPerformance();
        setData(result);
      } catch (error) {
        console.error("Failed to load parcel performance data", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Calculate totals
  const totals = data.reduce(
    (acc, row) => ({
      totalOrders: acc.totalOrders + row.totalOrders,
      shipped: acc.shipped + row.shipped,
      delivered: acc.delivered + row.delivered,
      returned: acc.returned + row.returned,
      canceled: acc.canceled + row.canceled,
      pending: acc.pending + row.pending,
    }),
    {
      totalOrders: 0,
      shipped: 0,
      delivered: 0,
      returned: 0,
      canceled: 0,
      pending: 0,
    }
  );

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <Activity className="h-8 w-8 text-blue-500" />
            Parcel Performance
          </h1>
          <p className="text-gray-400 mt-2">
            Analyze the lifecycle and success rates of orders based on the original date they were placed.
          </p>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      {!isLoading && data.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <StatCard
            title="Total Orders"
            value={totals.totalOrders}
            icon={<Package size={20} />}
            color="bg-blue-500/10 text-blue-500 border-blue-500/20"
          />
          <StatCard
            title="Total Shipped"
            value={totals.shipped}
            icon={<Truck size={20} />}
            color="bg-purple-500/10 text-purple-500 border-purple-500/20"
          />
          <StatCard
            title="Total Delivered"
            value={totals.delivered}
            icon={<CheckCircle size={20} />}
            color="bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
          />
          <StatCard
            title="Total Returned"
            value={totals.returned}
            icon={<RotateCcw size={20} />}
            color="bg-orange-500/10 text-orange-500 border-orange-500/20"
          />
          <StatCard
            title="Total Canceled"
            value={totals.canceled}
            icon={<XCircle size={20} />}
            color="bg-red-500/10 text-red-500 border-red-500/20"
          />
          <StatCard
            title="Total Pending"
            value={totals.pending}
            icon={<Clock size={20} />}
            color="bg-amber-500/10 text-amber-500 border-amber-500/20"
          />
        </div>
      )}

      {/* CHART SECTION */}
      {!isLoading && data.length > 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-xl p-6 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: "Delivered", value: totals.delivered, color: "#10b981" },
                    { name: "Returned", value: totals.returned, color: "#f97316" },
                    { name: "Canceled", value: totals.canceled, color: "#ef4444" },
                    { name: "Pending", value: totals.pending, color: "#f59e0b" },
                  ].filter((d) => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {[
                    { name: "Delivered", value: totals.delivered, color: "#10b981" },
                    { name: "Returned", value: totals.returned, color: "#f97316" },
                    { name: "Canceled", value: totals.canceled, color: "#ef4444" },
                    { name: "Pending", value: totals.pending, color: "#f59e0b" },
                  ].filter((d) => d.value > 0).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '0.5rem', color: '#f3f4f6' }}
                  itemStyle={{ color: '#f3f4f6' }}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 w-full space-y-4">
            <h3 className="text-xl font-bold text-white mb-2">Overall Outcome Distribution</h3>
            <p className="text-gray-400">
              This chart shows the absolute final outcome of all your orders. Because we enforced strict priority routing, these metrics add up exactly to your <strong>Total Orders</strong> ({totals.totalOrders}).
            </p>
            <div className="space-y-3 mt-4">
              <div className="flex justify-between items-center bg-gray-750 p-3 rounded-lg border border-gray-700">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <span className="text-gray-300">Delivered</span>
                </div>
                <span className="font-semibold text-white">{totals.totalOrders > 0 ? ((totals.delivered / totals.totalOrders) * 100).toFixed(1) : 0}%</span>
              </div>
              <div className="flex justify-between items-center bg-gray-750 p-3 rounded-lg border border-gray-700">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <span className="text-gray-300">Returned</span>
                </div>
                <span className="font-semibold text-white">{totals.totalOrders > 0 ? ((totals.returned / totals.totalOrders) * 100).toFixed(1) : 0}%</span>
              </div>
              <div className="flex justify-between items-center bg-gray-750 p-3 rounded-lg border border-gray-700">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-gray-300">Canceled</span>
                </div>
                <span className="font-semibold text-white">{totals.totalOrders > 0 ? ((totals.canceled / totals.totalOrders) * 100).toFixed(1) : 0}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TABLE SECTION */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-900 border-b border-gray-700 text-sm font-medium text-gray-400">
                <th className="px-6 py-4 whitespace-nowrap">Order Date</th>
                <th className="px-6 py-4 whitespace-nowrap">Total Orders</th>
                <th className="px-6 py-4 whitespace-nowrap">Shipped</th>
                <th className="px-6 py-4 whitespace-nowrap">Delivered</th>
                <th className="px-6 py-4 whitespace-nowrap">Returned</th>
                <th className="px-6 py-4 whitespace-nowrap">Canceled</th>
                <th className="px-6 py-4 whitespace-nowrap">Pending</th>
                <th className="px-6 py-4 whitespace-nowrap text-right">Delivery Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-400">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
                    Loading performance data...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-400">
                    No order data found.
                  </td>
                </tr>
              ) : (
                data.map((row, idx) => {
                  // Calculate delivery success rate (Delivered / Shipped)
                  const deliveryRate = row.shipped > 0 
                    ? ((row.delivered / row.shipped) * 100).toFixed(1) 
                    : 0;

                  return (
                    <tr 
                      key={row.orderDate || idx} 
                      className="hover:bg-gray-750 transition-colors group"
                    >
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-white">
                        {row.orderDate ? format(parseISO(row.orderDate), "MMM d, yyyy") : 'Unknown Date'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          {row.totalOrders}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-300">
                        {row.shipped}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-emerald-400 font-medium">
                        {row.delivered}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-orange-400">
                        {row.returned}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-red-400">
                        {row.canceled}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-amber-400">
                        {row.pending}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${
                          deliveryRate >= 80 ? 'bg-emerald-500/10 text-emerald-400' :
                          deliveryRate >= 50 ? 'bg-amber-500/10 text-amber-400' :
                          'bg-red-500/10 text-red-400'
                        }`}>
                          {deliveryRate}%
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  return (
    <div className={`p-4 rounded-xl border flex flex-col gap-3 ${color}`}>
      <div className="flex items-center gap-2 text-sm font-medium opacity-80">
        {icon}
        {title}
      </div>
      <div className="text-2xl font-bold">
        {value.toLocaleString()}
      </div>
    </div>
  );
}
