'use client';

import React, { useState, useEffect } from 'react';
import { getStock } from '../../../actions/stock';
import { addExpense, getExpenses, deleteExpense } from '../../../actions/expenses';
import { addFacebookCost, getFacebookCosts, deleteFacebookCost } from '../../../actions/facebook';
import { getFinancialStats } from '../../../actions/finance';
import { getSteadfastPayments } from '../../../actions/steadfast';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  Package, RefreshCw, DollarSign, PlusCircle, History, 
  Trash2, Save, Send, Filter, TrendingUp, TrendingDown, 
  Activity, Truck, BarChart2
} from 'lucide-react';

const EXPENSE_CATEGORIES = [
  'Courier Cost',
  'Transportation Cost',
  'Dollar Buying',
  'Other'
];

export default function StockManagementPage() {
  const [stock, setStockLevel] = useState(0);
  const [expenses, setExpenses] = useState([]);
  const [facebookCosts, setFacebookCosts] = useState([]);
  const [financeStats, setFinanceStats] = useState({
    totalRevenue: 0,
    totalProductRevenue: 0,
    totalShippingRevenue: 0,
    totalDeliveredQuantity: 0,
    totalDeliveredOrders: 0,
  });
  const [steadfastPayments, setSteadfastPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Expense Form State
  const [isSavingExpense, setIsSavingExpense] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [expenseNote, setExpenseNote] = useState('');

  // Expense Filter State
  const [expenseFilter, setExpenseFilter] = useState('All');

  // Facebook Cost Form State
  const [isSavingFbCost, setIsSavingFbCost] = useState(false);
  const [fbTotalBdt, setFbTotalBdt] = useState('');
  const [fbDollarRate, setFbDollarRate] = useState('');

  const [baselineDate, setBaselineDate] = useState(null);
  const [newCollectionsAmount, setNewCollectionsAmount] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { getSetting } = await import('../../../actions/settings');
      
      const [currentStock, history, fbHistory, stats, payments, baselineSetting] = await Promise.all([
        getStock('Book'),
        getExpenses(),
        getFacebookCosts(),
        getFinancialStats(),
        getSteadfastPayments(),
        getSetting('STEADFAST_BASELINE_DATE')
      ]);
      setStockLevel(currentStock);
      setExpenses(history);
      setFacebookCosts(fbHistory);
      if (stats.success) setFinanceStats(stats);
      
      let currentBaselineStr = baselineSetting?.value;
      
      if (payments?.success && payments?.data?.payments && payments.data.payments.length > 0) {
        setSteadfastPayments(payments.data.payments);
        
        // Show the latest successful payment
        const latestPayment = payments.data.payments.find(p => p.status_label?.toLowerCase() === 'paid');
        if (latestPayment) {
           setNewCollectionsAmount(latestPayment.total || 0);
           setBaselineDate(latestPayment.paid_at || latestPayment.created_at || new Date().toISOString());
        } else {
           setNewCollectionsAmount(0);
           setBaselineDate(null);
        }
      } else {
        setNewCollectionsAmount(0);
        setBaselineDate(null);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };



  const calculateTotalExpenses = () => {
    const regularExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const fbExpenses = facebookCosts.reduce((sum, cost) => sum + cost.totalBdt, 0);
    return regularExpenses + fbExpenses;
  };

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    if (!expenseAmount || isNaN(expenseAmount) || expenseAmount <= 0) return;
    
    setIsSavingExpense(true);
    try {
      await addExpense(
        parseFloat(expenseAmount), 
        expenseCategory, 
        expenseCategory === 'Other' ? customCategory : '', 
        expenseNote
      );
      
      // Reset form
      setExpenseAmount('');
      setCustomCategory('');
      setExpenseNote('');
      setExpenseCategory(EXPENSE_CATEGORIES[0]);
      
      // Refresh list
      const history = await getExpenses();
      setExpenses(history);
    } catch (error) {
      console.error("Failed to save expense", error);
    } finally {
      setIsSavingExpense(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!confirm("Are you sure you want to delete this expense record?")) return;
    try {
      await deleteExpense(id);
      setExpenses(expenses.filter(e => e.id !== id));
    } catch (error) {
      console.error("Error deleting expense:", error);
    }
  };

  const handleFbCostSubmit = async (e) => {
    e.preventDefault();
    const totalBdt = parseFloat(fbTotalBdt);
    const dollarRate = parseFloat(fbDollarRate);
    if (!totalBdt || isNaN(totalBdt) || totalBdt <= 0) return;
    if (!dollarRate || isNaN(dollarRate) || dollarRate <= 0) return;
    
    // Derive dollars bought: how many dollars you got for the BDT spent
    const derivedDollars = totalBdt / dollarRate;
    
    setIsSavingFbCost(true);
    try {
      await addFacebookCost(derivedDollars, dollarRate);
      
      // Reset form
      setFbTotalBdt('');
      setFbDollarRate('');
      
      // Refresh list
      const history = await getFacebookCosts();
      setFacebookCosts(history);
    } catch (error) {
       console.error("Failed to save Facebook cost:", error);
    } finally {
      setIsSavingFbCost(false);
    }
  };

  const handleDeleteFbCost = async (id) => {
    if (!confirm("Are you sure you want to delete this Facebook cost record?")) return;
    try {
      await deleteFacebookCost(id);
      setFacebookCosts(facebookCosts.filter(e => e.id !== id));
    } catch (error) {
      console.error("Error deleting Facebook cost:", error);
    }
  };

  const stockValue = stock * 550; // Remaining stock × selling price

  // ── Financial Calculators ──────────────────────────────────────────────────
  const totalExpensesAll = calculateTotalExpenses();

  // Cost of Goods Sold: only count production/purchase cost of books.
  // We use totalProductRevenue (shipping already stripped) as the revenue base.
  // This prevents double-counting: shipping cost is already in "Courier Cost" expenses.
  const assumedCostPerBook = 150; // BDT purchase/production cost per book
  const totalBooksSold = financeStats.totalDeliveredQuantity; // Accurate qty from items[]
  const cogs = totalBooksSold * assumedCostPerBook;

  // Gross Margin = Product Revenue − COGS  (shipping excluded from both sides)
  const grossMargin = financeStats.totalProductRevenue - cogs;

  // Net Profit = Product Revenue − COGS − All Expenses
  // (Courier Cost expense covers shipping spend; product revenue excludes shipping income.
  //  So both sides balance without double-counting.)
  const netProfit = financeStats.totalProductRevenue - cogs - totalExpensesAll;

  // Filter Logic
  const uniqueCategories = ['All', ...new Set(expenses.map(e => e.category === 'Other' ? e.customCategory : e.category))].filter(Boolean);

  const filteredExpenses = expenseFilter === 'All' 
    ? expenses 
    : expenses.filter(e => (e.category === 'Other' ? e.customCategory : e.category) === expenseFilter);

  const filteredTotal = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  const categoryBreakdown = uniqueCategories
    .filter(cat => cat !== 'All')
    .map(cat => {
      const total = expenses
        .filter(e => (e.category === 'Other' ? e.customCategory : e.category) === cat)
        .reduce((sum, exp) => sum + exp.amount, 0);
      return { name: cat, total };
    })
    .sort((a, b) => b.total - a.total); // Sort highest expenses first

  // ── Chart Data ──────────────────────────────────────────────────────────────
  const CHART_COLORS = ['#818cf8', '#34d399', '#f472b6', '#fb923c', '#facc15', '#38bdf8', '#a78bfa', '#4ade80'];

  // Donut chart: category totals (regular expenses + FB ads as its own slice)
  const donutData = [
    ...categoryBreakdown.map((cat, i) => ({ name: cat.name, value: cat.total })),
    ...(facebookCosts.length > 0 ? [{ name: 'FB Ads', value: facebookCosts.reduce((s, c) => s + c.totalBdt, 0) }] : [])
  ].filter(d => d.value > 0);

  // Bar chart: daily expense totals (last 30 days, combining regular + FB)
  const barDataMap = {};
  const allExpenseItems = [
    ...expenses.map(e => ({ date: e.date, amount: e.amount })),
    ...facebookCosts.map(c => ({ date: c.date, amount: c.totalBdt }))
  ];
  allExpenseItems.forEach(item => {
    const d = new Date(item.date);
    const key = `${d.getMonth() + 1}/${d.getDate()}`;
    barDataMap[key] = (barDataMap[key] || 0) + item.amount;
  });
  const barChartData = Object.entries(barDataMap)
    .map(([date, total]) => ({ date, total }))
    .slice(-20); // show last 20 data points

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 shadow-xl">
          <p className="text-gray-400 text-xs mb-1">{label}</p>
          <p className="text-white font-bold text-sm">৳ {payload[0].value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
        </div>
      );
    }
    return null;
  };

  const DonutTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 shadow-xl">
          <p className="font-semibold text-sm" style={{ color: payload[0].payload.fill }}>{payload[0].name}</p>
          <p className="text-white font-bold">৳ {payload[0].value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          <p className="text-gray-400 text-xs">{((payload[0].value / totalExpensesAll) * 100).toFixed(1)}% of total</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 mb-20">
      <div className="flex items-center justify-between border-b border-gray-800 pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Package className="text-blue-500" size={32} />
            Stock & Money Management
          </h1>
          <p className="text-gray-400 mt-2">Monitor your inventory and track your expenses in one place.</p>
        </div>
        <button 
          onClick={fetchData}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg transition-colors border border-gray-700"
        >
          <RefreshCw size={18} className={`${isLoading ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
      </div>

      {/* ── Financial Summary: math explanation banner ── */}
      <div className="mb-2 bg-gray-900/60 border border-gray-700/40 rounded-xl px-5 py-3 text-[11px] text-gray-500 leading-relaxed">
        <span className="font-semibold text-gray-400">How the math works: </span>
        Revenue shown is <strong className="text-gray-300">product revenue only</strong> (shipping cost excluded).
        Gross Margin = Product Revenue − COGS (৳150/book).
        Net Profit = Gross Margin − All Expenses (courier, ads, transport, etc.).
        Shipping income &amp; courier cost cancel each other out — so neither appears in the profit formula.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Revenue Card — product revenue only, shipping excluded */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-emerald-900/50 rounded-2xl p-6 shadow-xl flex flex-col items-center justify-center relative overflow-hidden group hover:border-emerald-500/50 transition-colors">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-bl-full pointer-events-none"></div>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="text-emerald-400" size={20} />
            <h3 className="text-lg font-medium text-gray-400">Product Revenue</h3>
          </div>
          {isLoading ? (
            <div className="h-10 flex items-center justify-center animate-pulse mt-2"><div className="w-20 h-8 bg-gray-700 rounded-lg"></div></div>
          ) : (
            <div className="text-4xl font-bold tracking-tighter text-emerald-400 drop-shadow-md break-all text-center mt-2">
              ৳ {financeStats.totalProductRevenue.toLocaleString()}
            </div>
          )}
          <span className="text-xs text-gray-500 mt-3 uppercase tracking-wider font-semibold" title="Total collected minus shipping charges">
            Delivered · Shipping Excluded
          </span>
        </div>

        {/* Gross Margin Card */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-blue-900/50 rounded-2xl p-6 shadow-xl flex flex-col items-center justify-center relative overflow-hidden group hover:border-blue-500/50 transition-colors">
          <div className="absolute top-0 left-0 w-24 h-24 bg-blue-500/10 rounded-br-full pointer-events-none"></div>
          <div className="flex items-center gap-2 mb-2">
            <Activity className="text-blue-400" size={20} />
            <h3 className="text-lg font-medium text-gray-400">Gross Margin</h3>
          </div>
          {isLoading ? (
            <div className="h-10 flex items-center justify-center animate-pulse mt-2"><div className="w-20 h-8 bg-gray-700 rounded-lg"></div></div>
          ) : (
            <div className={`text-4xl font-bold tracking-tighter drop-shadow-md break-all text-center mt-2 ${grossMargin >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
              ৳ {grossMargin.toLocaleString()}
            </div>
          )}
          <span className="text-xs text-gray-500 mt-3 uppercase tracking-wider font-semibold" title={`Product Revenue − COGS (${totalBooksSold} books × ৳150)`}>
            {isLoading ? '—' : `${totalBooksSold} books × ৳150 COGS`}
          </span>
        </div>

        {/* Total Expenses Card */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-red-900/50 rounded-2xl p-6 shadow-xl flex flex-col items-center justify-center relative overflow-hidden group hover:border-red-500/50 transition-colors">
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-red-500/10 rounded-tr-full pointer-events-none"></div>
           <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="text-red-400" size={20} />
            <h3 className="text-lg font-medium text-gray-400">Total Expenses</h3>
          </div>
          {isLoading ? (
            <div className="h-10 flex items-center justify-center animate-pulse mt-2"><div className="w-20 h-8 bg-gray-700 rounded-lg"></div></div>
          ) : (
            <div className="text-4xl font-bold tracking-tighter text-red-400 drop-shadow-md break-all text-center mt-2">
              ৳ {totalExpensesAll.toLocaleString()}
            </div>
          )}
          <span className="text-xs text-gray-500 mt-3 uppercase tracking-wider font-semibold">Courier + Ads + Other</span>
        </div>

        {/* Net Profit Card */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-yellow-900/50 rounded-2xl p-6 shadow-xl flex flex-col items-center justify-center relative overflow-hidden group hover:border-yellow-500/50 transition-colors">
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-yellow-500/5 rounded-full pointer-events-none"></div>
           <div className="flex items-center gap-2 mb-2">
            <DollarSign className="text-yellow-400" size={20} />
             <h3 className="text-lg font-medium text-gray-400">Net Profit</h3>
          </div>
          {isLoading ? (
            <div className="h-10 flex items-center justify-center animate-pulse mt-2"><div className="w-20 h-8 bg-gray-700 rounded-lg"></div></div>
          ) : (
            <div className={`text-4xl font-bold tracking-tighter drop-shadow-md break-all text-center mt-2 ${netProfit >= 0 ? 'text-yellow-400' : 'text-red-500'}`}>
              ৳ {netProfit.toLocaleString()}
            </div>
          )}
          <span className="text-xs text-gray-500 mt-3 uppercase tracking-wider font-semibold">Gross Margin − All Expenses</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
        {/* Current Stock Card */}
        <div className="bg-violet-900/20 backdrop-blur-sm border border-violet-500/30 rounded-2xl p-6 shadow-xl flex flex-col items-center justify-center relative overflow-hidden group hover:border-violet-500/60 transition-colors">
          <div className="absolute bottom-0 right-0 w-28 h-28 bg-violet-500/10 rounded-tl-full pointer-events-none"></div>
          <div className="flex items-center gap-2 mb-2">
            <Package className="text-violet-400" size={20} />
            <h3 className="text-lg font-medium text-gray-400">Available Stock</h3>
          </div>
          {isLoading ? (
            <div className="h-10 flex items-center justify-center animate-pulse mt-2"><div className="w-20 h-8 bg-violet-900/50 rounded-lg"></div></div>
          ) : (
            <div className={`text-4xl font-bold tracking-tighter drop-shadow-md mt-2 ${stock < 100 ? 'text-red-400' : 'text-violet-300'}`}>
              {stock} <span className="text-lg font-normal text-gray-500">units</span>
            </div>
          )}
          <span className="text-xs text-gray-500 mt-3 uppercase tracking-wider font-semibold">Manually Updated Inventory</span>
        </div>

        {/* Books Sold Card — accurate unit count from delivered orders */}
        <div className="bg-orange-900/20 backdrop-blur-sm border border-orange-500/30 rounded-2xl p-6 shadow-xl flex flex-col items-center justify-center relative overflow-hidden group hover:border-orange-500/60 transition-colors">
          <div className="absolute top-0 left-0 w-28 h-28 bg-orange-500/10 rounded-br-full pointer-events-none"></div>
          <div className="flex items-center gap-2 mb-2">
            <Activity className="text-orange-400" size={20} />
            <h3 className="text-lg font-medium text-gray-400">Books Sold</h3>
          </div>
          {isLoading ? (
            <div className="h-10 flex items-center justify-center animate-pulse mt-2"><div className="w-20 h-8 bg-orange-900/50 rounded-lg"></div></div>
          ) : (
            <div className="text-4xl font-bold tracking-tighter text-orange-300 drop-shadow-md mt-2">
              {totalBooksSold.toLocaleString()} <span className="text-lg font-normal text-gray-500">units</span>
            </div>
          )}
          <span className="text-xs text-gray-500 mt-3 uppercase tracking-wider font-semibold" title="Actual qty summed from all delivered orders">
            {isLoading ? '—' : `${financeStats.totalDeliveredOrders} delivered orders`}
          </span>
        </div>

        {/* Stock Value Card */}
        <div className="bg-cyan-900/20 backdrop-blur-sm border border-cyan-500/30 rounded-2xl p-6 shadow-xl flex flex-col items-center justify-center relative overflow-hidden group hover:border-cyan-500/60 transition-colors">
          <div className="absolute top-0 right-0 w-28 h-28 bg-cyan-500/10 rounded-bl-full pointer-events-none"></div>
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="text-cyan-400" size={20} />
            <h3 className="text-lg font-medium text-gray-400">Stock Value</h3>
          </div>
          {isLoading ? (
            <div className="h-10 flex items-center justify-center animate-pulse mt-2"><div className="w-24 h-8 bg-cyan-900/50 rounded-lg"></div></div>
          ) : (
            <div className="text-4xl font-bold tracking-tighter text-cyan-300 drop-shadow-md break-all text-center mt-2">৳ {stockValue.toLocaleString()}</div>
          )}
          <span className="text-xs text-gray-500 mt-3 uppercase tracking-wider font-semibold">Remaining stock @ ৳550 / unit</span>
        </div>

        {/* New Payment Amount Card */}
        <div className="bg-blue-900/20 backdrop-blur-sm border border-blue-500/30 rounded-2xl p-6 shadow-[0_0_30px_rgba(59,130,246,0.15)] flex flex-col justify-center relative overflow-hidden hover:border-blue-500/60 transition-colors">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/10 rounded-tr-full pointer-events-none"></div>
          <div className="flex items-center gap-2 mb-2">
            <Truck className="text-blue-400" size={20} />
            <h3 className="text-lg font-medium text-gray-400">Latest Payout</h3>
          </div>
          {isLoading ? (
            <div className="w-24 h-8 bg-blue-900/50 rounded animate-pulse mt-2"></div>
          ) : (
            <div className="text-4xl font-bold tracking-tighter text-blue-300 mt-2">৳ {newCollectionsAmount.toLocaleString()}</div>
          )}
          <span className="text-xs text-blue-300/50 mt-3 uppercase tracking-wider font-semibold">
            Payout: {baselineDate ? new Date(baselineDate).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
          </span>
        </div>
      </div>

      {/* Category Breakdowns Grid */}
      {categoryBreakdown.length > 0 && (
        <div className="space-y-4 pt-2 animate-in slide-in-from-bottom-4 duration-700 delay-100">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest pl-1">
            Expense Breakdown
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {categoryBreakdown.map((cat, index) => (
              <div 
                key={cat.name} 
                onClick={() => setExpenseFilter(cat.name)}
                className={`group relative bg-gray-800/40 backdrop-blur-md border rounded-xl p-5 flex flex-col justify-center cursor-pointer transition-all duration-300 hover:-translate-y-1 ${
                  expenseFilter === cat.name 
                    ? 'border-blue-500 bg-blue-500/5 shadow-[0_0_20px_rgba(59,130,246,0.15)]' 
                    : 'border-gray-700/60 hover:border-gray-500 hover:bg-gray-800/60 shadow-lg'
                }`}
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/0 via-blue-500/0 to-blue-500/0 group-hover:via-blue-500/20 transition-all duration-500 rounded-t-xl"></div>
                
                <span 
                  className={`text-xs font-semibold uppercase tracking-wider mb-2 line-clamp-1 transition-colors ${expenseFilter === cat.name ? 'text-blue-400' : 'text-gray-400 group-hover:text-gray-300'}`} 
                  title={cat.name}
                >
                  {cat.name}
                </span>
                
                <span className={`text-2xl font-bold tracking-tight transition-colors ${expenseFilter === cat.name ? 'text-white' : 'text-gray-200 group-hover:text-white'}`}>
                  ৳ <span className={cat.total > 10000 ? 'text-red-400/90' : ''}>{cat.total.toLocaleString()}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── EXPENSE ANALYTICS CHARTS ───────────────────────────────────────── */}
      <div className="pt-8 mt-4 border-t border-gray-800">
        <div className="flex items-center gap-3 mb-6">
          <BarChart2 className="text-purple-400" size={22} />
          <h2 className="text-xl font-bold text-white">Expense Analytics</h2>
          <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold ml-1">Visual Overview</span>
        </div>

        <div className="grid grid-cols-1 gap-6">

          {/* Bar Chart — Category Breakdown */}
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/60 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500/0 via-purple-500/40 to-purple-500/0 rounded-t-2xl"></div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-semibold text-white">By Category</h3>
                <p className="text-xs text-gray-500 mt-0.5">Total spent per expense type</p>
              </div>
              <span className="text-xs bg-purple-500/10 text-purple-300 border border-purple-500/20 px-3 py-1 rounded-full font-semibold">
                {donutData.length} categories
              </span>
            </div>
            {isLoading ? (
              <div className="h-56 flex items-center justify-center">
                <div className="w-full h-full bg-gray-700/30 rounded-xl animate-pulse"></div>
              </div>
            ) : donutData.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-gray-500 italic text-sm">No data yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={donutData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="catBarGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.5} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#6b7280', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                    tickFormatter={v => v.length > 10 ? v.slice(0, 9) + '…' : v}
                  />
                  <YAxis
                    tick={{ fill: '#6b7280', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={v => `৳${(v / 1000).toFixed(0)}k`}
                    width={48}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(167,139,250,0.08)' }} />
                  <Bar dataKey="value" fill="url(#catBarGrad)" radius={[6, 6, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-6">
        {/* ADD EXPENSE FORM */}
        <div className="lg:col-span-1 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 shadow-xl h-fit">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2 border-b border-gray-700 pb-4">
            <PlusCircle className="text-red-400" size={24} />
            Add Expense
          </h3>
          
          <form onSubmit={handleExpenseSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Amount (৳)</label>
              <input 
                type="number"
                min="0.01"
                step="0.01"
                required
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                placeholder="0.00"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Category</label>
              <select 
                value={expenseCategory}
                onChange={(e) => setExpenseCategory(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all appearance-none"
              >
                {EXPENSE_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {expenseCategory === 'Other' && (
              <div className="animate-in slide-in-from-top-2 duration-300">
                <label className="block text-sm font-medium text-gray-400 mb-2">Custom Category</label>
                <input 
                  type="text"
                  required
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                  placeholder="E.g. Server Hosting"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Note (Optional)</label>
              <textarea 
                value={expenseNote}
                onChange={(e) => setExpenseNote(e.target.value)}
                rows={2}
                className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all resize-none"
                placeholder="Brief details..."
              />
            </div>

            <button 
              type="submit"
              disabled={isSavingExpense || !expenseAmount}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-red-600 hover:bg-red-500 text-white font-medium rounded-xl transition-colors disabled:opacity-50 shadow-lg shadow-red-900/20 mt-2"
            >
              {isSavingExpense ? <RefreshCw size={20} className="animate-spin" /> : <Save size={20} />}
              Save Expense
            </button>
          </form>
        </div>

        {/* EXPENSE HISTORY */}
        <div className="lg:col-span-2 bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 shadow-xl">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2 border-b border-gray-700 pb-4">
            <History className="text-blue-400" size={24} />
            Expense History
          </h3>

          {/* Filters & Dynamic Sum */}
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-900/50 p-4 rounded-xl border border-gray-700">
            <div className="flex items-center gap-2 overflow-x-auto w-full pb-2 sm:pb-0 scrollbar-none">
              <Filter size={16} className="text-gray-500 shrink-0 mr-1" />
              {uniqueCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setExpenseFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    expenseFilter === cat 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200 border border-gray-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            
            <div className="shrink-0 flex items-center gap-3 bg-gray-800 px-4 py-2 rounded-lg border border-gray-700 min-w-max">
              <span className="text-gray-400 text-sm">Total for <strong className="text-white">{expenseFilter}</strong>:</span>
              <span className="text-lg font-bold text-red-400">৳ {filteredTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent pr-2">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-gray-800/90 backdrop-blur-sm z-10">
                <tr className="border-b border-gray-700 text-gray-400 text-sm">
                  <th className="py-3 px-4 font-medium">Date</th>
                  <th className="py-3 px-4 font-medium">Category</th>
                  <th className="py-3 px-4 font-medium">Note</th>
                  <th className="py-3 px-4 font-medium text-right">Amount (৳)</th>
                  <th className="py-3 px-4 font-medium text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-gray-500 italic">
                      {expenses.length === 0 ? "No expenses recorded yet." : "No expenses match this category."}
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((expense) => {
                    const dispCategory = expense.category === 'Other' ? expense.customCategory : expense.category;
                    const dispDate = new Date(expense.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    });

                    return (
                      <tr key={expense.id} className="hover:bg-gray-800/50 transition-colors">
                        <td className="py-4 px-4 text-sm text-gray-300 whitespace-nowrap">{dispDate}</td>
                        <td className="py-4 px-4 text-sm font-medium text-white">
                          <span className="bg-gray-700 text-gray-200 px-2 py-1 rounded-md text-xs border border-gray-600">
                            {dispCategory}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-400 max-w-[200px] truncate" title={expense.note}>
                          {expense.note || '-'}
                        </td>
                        <td className="py-4 px-4 text-sm font-bold text-red-400 text-right">
                          {expense.amount.toLocaleString()}
                        </td>
                        <td className="py-4 px-4 text-center">
                           <button
                             onClick={() => handleDeleteExpense(expense.id)}
                             className="text-gray-500 hover:text-red-500 bg-gray-800 hover:bg-red-500/10 p-2 rounded-lg transition-all"
                             title="Delete Record"
                           >
                             <Trash2 size={16} />
                           </button>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-10 mt-4 border-t border-gray-800">
        {/* FACEBOOK ADS FORM */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-indigo-900/50 rounded-2xl p-6 shadow-xl h-fit">
           <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2 border-b border-gray-700 pb-4">
            <Send className="text-indigo-400" size={24} />
            Facebook Ad Costs (Dollar Buy)
          </h3>

          <form onSubmit={handleFbCostSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Total BDT Spent (৳)</label>
                <input 
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={fbTotalBdt}
                  onChange={(e) => setFbTotalBdt(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  placeholder="e.g. 1200.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Dollar Price (৳ per $1)</label>
                <input 
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={fbDollarRate}
                  onChange={(e) => setFbDollarRate(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  placeholder="e.g. 127"
                />
              </div>
            </div>

            {/* Dollars received result */}
            <div className="bg-indigo-900/20 rounded-xl p-4 flex justify-between items-center border border-indigo-900/30">
               <span className="text-gray-400 text-sm font-medium">Dollars You Got:</span>
               <span className="text-xl font-bold text-indigo-400">
                 $ {(
                   (parseFloat(fbTotalBdt) > 0 && parseFloat(fbDollarRate) > 0)
                     ? (parseFloat(fbTotalBdt) / parseFloat(fbDollarRate)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                     : '0.00'
                 )}
               </span>
            </div>

            <button 
              type="submit"
              disabled={isSavingFbCost || !fbTotalBdt || !fbDollarRate}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-colors disabled:opacity-50 shadow-lg shadow-indigo-900/20 mt-2"
            >
              {isSavingFbCost ? <RefreshCw size={20} className="animate-spin" /> : <Save size={20} />}
              Log Facebook Cost
            </button>
          </form>
        </div>

        {/* FACEBOOK ADS HISTORY */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-indigo-900/50 rounded-2xl p-6 shadow-xl relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-bl-full pointer-events-none"></div>
           <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2 border-b border-gray-700 pb-4">
            <History className="text-indigo-400" size={24} />
            Dollar Usage History
          </h3>

          <div className="overflow-x-auto max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-gray-800/90 backdrop-blur-sm z-10">
                <tr className="border-b border-gray-700 text-gray-400 text-sm">
                  <th className="py-3 px-4 font-medium">Date</th>
                  <th className="py-3 px-4 font-medium">Dollars ($)</th>
                  <th className="py-3 px-4 font-medium">Rate (৳)</th>
                  <th className="py-3 px-4 font-medium text-right">Total (৳)</th>
                  <th className="py-3 px-4 font-medium text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {facebookCosts.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-gray-500 italic">
                      No Facebook costs logged yet.
                    </td>
                  </tr>
                ) : (
                  facebookCosts.map((cost) => {
                    const dispDate = new Date(cost.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    });

                    return (
                      <tr key={cost.id} className="hover:bg-gray-800/50 transition-colors">
                        <td className="py-4 px-4 text-sm text-gray-300 whitespace-nowrap">{dispDate}</td>
                        <td className="py-4 px-4 text-sm font-medium text-green-400 text-center bg-green-900/10 rounded-md">
                           ${cost.dollars.toFixed(2)}
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-400 text-center">
                           {cost.bdtRate.toFixed(2)}
                        </td>
                        <td className="py-4 px-4 text-sm font-bold text-indigo-400 text-right">
                          {cost.totalBdt.toLocaleString()}
                        </td>
                        <td className="py-4 px-4 text-center">
                           <button
                             onClick={() => handleDeleteFbCost(cost.id)}
                             className="text-gray-500 hover:text-red-500 bg-gray-800 hover:bg-red-500/10 p-2 rounded-lg transition-all"
                             title="Delete Record"
                           >
                             <Trash2 size={16} />
                           </button>
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

      {/* STEADFAST PAYMENTS TABLE */}
      <div className="pt-10 mt-4 border-t border-gray-800">
        <div className="bg-gray-800/50 backdrop-blur-sm border border-orange-900/50 rounded-2xl p-6 shadow-xl relative overflow-hidden">
           <div className="absolute top-0 left-0 w-32 h-32 bg-orange-500/5 rounded-br-full pointer-events-none"></div>
           <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2 border-b border-gray-700 pb-4">
            <Truck className="text-orange-400" size={24} />
            Steadfast Courier Payments
          </h3>

          <div className="overflow-x-auto max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-gray-800/90 backdrop-blur-sm z-10">
                <tr className="border-b border-gray-700 text-gray-400 text-sm">
                  <th className="py-3 px-4 font-medium">Payment ID</th>
                  <th className="py-3 px-4 font-medium">Method</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium text-right">Collected (৳)</th>
                  <th className="py-3 px-4 font-medium text-right">Charges (৳)</th>
                  <th className="py-3 px-4 font-medium text-right">Net Received (৳)</th>
                  <th className="py-3 px-4 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {!steadfastPayments || steadfastPayments.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-gray-500 italic">
                      {isLoading ? "Loading payments..." : "No Steadfast payments found."}
                    </td>
                  </tr>
                ) : (
                  steadfastPayments.map((payment) => {
                    const dispDate = new Date(payment.paid_at || payment.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    });

                    return (
                      <tr key={payment.payment_id} className="hover:bg-gray-800/50 transition-colors">
                        <td className="py-4 px-4 text-sm text-gray-300 font-mono">{payment.payment_id}</td>
                        <td className="py-4 px-4 text-sm text-gray-400">{payment.method}</td>
                        <td className="py-4 px-4">
                           <span className={`px-2 py-1 rounded-md text-xs border bg-gray-900 ${
                             payment.status_label?.toLowerCase() === 'paid' 
                              ? 'text-green-400 border-green-500/50' 
                              : 'text-yellow-400 border-yellow-500/50'
                           }`}>
                             {payment.status_label?.toUpperCase()}
                           </span>
                        </td>
                        <td className="py-4 px-4 text-sm font-medium text-gray-300 text-right">
                          {payment.amount?.toLocaleString()}
                        </td>
                        <td className="py-4 px-4 text-sm text-rose-400 text-right">
                          -{payment.charges?.toLocaleString()}
                        </td>
                        <td className="py-4 px-4 text-sm font-bold text-orange-400 text-right">
                          {payment.total?.toLocaleString()}
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-400 whitespace-nowrap">{dispDate}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
