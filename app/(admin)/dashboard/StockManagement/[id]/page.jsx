'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { getStockHistoryById, updateStockCosts } from '../../../../actions/stock';
import {
  ArrowLeft, Save, RefreshCw, Calculator, Package,
  Plus, Trash2, BookOpen, Truck, Layers, ChevronRight,
  CheckCircle2, Pencil, X, TrendingDown, PieChart, TrendingUp
} from 'lucide-react';

// ── Input field ──────────────────────────────────────────────────────────────
function CostInput({ label, name, value, onChange, placeholder }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</label>
      <div className="relative flex items-center">
        <span className="absolute left-3 text-gray-500 font-bold select-none text-sm">৳</span>
        <input
          type="number"
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder || '0'}
          min="0"
          step="0.01"
          className="w-full bg-gray-900/80 border border-gray-700 text-white rounded-xl pl-8 pr-4 py-2.5 focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none transition-all text-sm hover:border-gray-500"
        />
      </div>
    </div>
  );
}

// ── Read-only value display ──────────────────────────────────────────────────
function CostRow({ label, value }) {
  if (!value || value === 0) return null;
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-700/30 last:border-0">
      <span className="text-sm text-gray-400">{label}</span>
      <span className="text-sm font-bold text-white">৳ {value.toLocaleString()}</span>
    </div>
  );
}

// ── Section card wrapper ─────────────────────────────────────────────────────
function SectionCard({ icon: Icon, title, color, children, total, isEditing }) {
  const hasContent = total > 0;
  return (
    <div className={`rounded-2xl border p-5 space-y-4 transition-all duration-300 ${color.border} ${isEditing ? color.bg : (hasContent ? color.bgSolid : 'bg-gray-800/20')}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${color.iconBg}`}>
            <Icon size={16} className={color.icon} />
          </div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">{title}</h3>
        </div>
        {total > 0 && (
          <span className={`text-sm font-bold ${color.icon}`}>
            ৳ {total.toLocaleString()}
          </span>
        )}
      </div>
      <div className={isEditing ? 'grid grid-cols-2 gap-4' : 'space-y-0'}>
        {children}
      </div>
    </div>
  );
}

const n = (val) => parseFloat(val) || 0;

export default function StockBatchCostPage({ params }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const stockId = parseInt(resolvedParams.id, 10);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [stockEntry, setStockEntry] = useState(null);
  const [hasSavedCosts, setHasSavedCosts] = useState(false);
  const [sellingPrice, setSellingPrice] = useState('490');
  const [isEditingSP, setIsEditingSP] = useState(false);

  const [costs, setCosts] = useState({
    bookPrice: '', cover: '', serviceCharge: '',
    courier: '', vanBhara: '',
    carton: '', courierPoly: '', packaging: '', cosTape: '',
    letterPrint: '', paperPrice: '',
    otherCosts: []
  });

  useEffect(() => {
    if (stockId) fetchStockEntry();
  }, [stockId]);

  const fetchStockEntry = async () => {
    setIsLoading(true);
    try {
      const entry = await getStockHistoryById(stockId);
      if (entry) {
        setStockEntry(entry);
        if (entry.costs) {
          const loaded = {
            bookPrice:     entry.costs.bookPrice     || '',
            cover:         entry.costs.cover         || '',
            serviceCharge: entry.costs.serviceCharge || '',
            courier:       entry.costs.courier       || '',
            vanBhara:      entry.costs.vanBhara      || '',
            carton:        entry.costs.carton        || '',
            courierPoly:   entry.costs.courierPoly   || '',
            packaging:     entry.costs.packaging     || '',
            cosTape:       entry.costs.cosTape       || '',
            letterPrint:   entry.costs.letterPrint   || '',
            paperPrice:    entry.costs.paperPrice    || '',
            otherCosts:    Array.isArray(entry.costs.otherCosts) ? entry.costs.otherCosts : []
          };
          setCosts(loaded);
          // Check if any cost has been entered previously
          const anyFilled = Object.entries(loaded).some(([k, v]) =>
            k !== 'otherCosts' ? n(v) > 0 : (Array.isArray(v) && v.length > 0)
          );
          setHasSavedCosts(anyFilled);
          // If costs exist, start in view mode; otherwise open edit mode directly
          setIsEditing(!anyFilled);
        } else {
          setIsEditing(true);
        }
      }
    } catch (err) {
      console.error('Error fetching stock entry:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCosts(prev => ({ ...prev, [name]: value }));
  };

  const handleOtherChange = (index, field, value) => {
    setCosts(prev => {
      const arr = [...prev.otherCosts];
      arr[index] = { ...arr[index], [field]: value };
      return { ...prev, otherCosts: arr };
    });
  };

  const addOther = () =>
    setCosts(prev => ({ ...prev, otherCosts: [...prev.otherCosts, { name: '', amount: '' }] }));

  const removeOther = (index) =>
    setCosts(prev => ({ ...prev, otherCosts: prev.otherCosts.filter((_, i) => i !== index) }));

  // Section subtotals
  const productionTotal = n(costs.bookPrice) + n(costs.cover) + n(costs.serviceCharge);
  const deliveryTotal   = n(costs.courier) + n(costs.vanBhara);
  const packagingTotal  = n(costs.carton) + n(costs.courierPoly) + n(costs.packaging) + n(costs.cosTape);
  const printTotal      = n(costs.letterPrint) + n(costs.paperPrice);
  const otherTotal      = costs.otherCosts.reduce((s, c) => s + n(c.amount), 0);
  const totalCost       = productionTotal + deliveryTotal + packagingTotal + printTotal + otherTotal;
  const costPerBook     = stockEntry?.amount > 0 ? totalCost / stockEntry.amount : 0;

  const sp = parseFloat(sellingPrice) || 0;
  const profitPerBook = sp - costPerBook;
  const margin = sp > 0 ? (profitPerBook / sp) * 100 : 0;
  const roi = costPerBook > 0 ? (profitPerBook / costPerBook) * 100 : 0;

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        bookPrice: n(costs.bookPrice), cover: n(costs.cover), serviceCharge: n(costs.serviceCharge),
        courier: n(costs.courier), vanBhara: n(costs.vanBhara),
        carton: n(costs.carton), courierPoly: n(costs.courierPoly), packaging: n(costs.packaging), cosTape: n(costs.cosTape),
        letterPrint: n(costs.letterPrint), paperPrice: n(costs.paperPrice),
        otherCosts: costs.otherCosts.map(c => ({ name: c.name, amount: n(c.amount) }))
      };
      await updateStockCosts(stockId, payload);
      setSaved(true);
      setHasSavedCosts(true);
      setTimeout(() => {
        setSaved(false);
        setIsEditing(false);
      }, 1200);
    } catch (err) {
      console.error('Failed to save costs:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RefreshCw size={32} className="animate-spin text-violet-500" />
      </div>
    );
  }

  if (!stockEntry) {
    return (
      <div className="max-w-2xl mx-auto mt-10 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Stock Batch Not Found</h2>
        <button onClick={() => router.push('/dashboard/StockManagement')} className="text-blue-400 hover:underline">
          Return to Stock Management
        </button>
      </div>
    );
  }

  const formattedDate = new Date(stockEntry.date).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  // All items for sidebar breakdown
  const breakdownItems = [
    { label: 'Book Price', value: n(costs.bookPrice) },
    { label: 'Cover', value: n(costs.cover) },
    { label: 'Service Charge', value: n(costs.serviceCharge) },
    { label: 'Courier', value: n(costs.courier) },
    { label: 'Van Bhara', value: n(costs.vanBhara) },
    { label: 'Carton', value: n(costs.carton) },
    { label: 'Courier Poly', value: n(costs.courierPoly) },
    { label: 'Packaging', value: n(costs.packaging) },
    { label: 'Cos-Tape', value: n(costs.cosTape) },
    { label: 'Letter Print', value: n(costs.letterPrint) },
    { label: 'Paper Price', value: n(costs.paperPrice) },
    ...costs.otherCosts.filter(c => c.name).map(c => ({ label: c.name, value: n(c.amount) }))
  ].filter(item => item.value > 0);

  const sections = [
    {
      icon: BookOpen, title: 'Production Costs', total: productionTotal,
      color: { border: 'border-violet-500/20', bg: 'bg-violet-900/10', bgSolid: 'bg-violet-900/15', iconBg: 'bg-violet-500/20', icon: 'text-violet-400' },
      rows: [
        { label: 'Book Price', value: n(costs.bookPrice) },
        { label: 'Cover', value: n(costs.cover) },
        { label: 'Service Charge', value: n(costs.serviceCharge) },
      ],
      editInputs: (
        <>
          <CostInput label="Book Price" name="bookPrice" value={costs.bookPrice} onChange={handleChange} placeholder="e.g. 104000" />
          <CostInput label="Cover" name="cover" value={costs.cover} onChange={handleChange} placeholder="e.g. 500" />
          <div className="col-span-2">
            <CostInput label="Service Charge" name="serviceCharge" value={costs.serviceCharge} onChange={handleChange} placeholder="e.g. 1000" />
          </div>
        </>
      )
    },
    {
      icon: Truck, title: 'Delivery Costs', total: deliveryTotal,
      color: { border: 'border-blue-500/20', bg: 'bg-blue-900/10', bgSolid: 'bg-blue-900/15', iconBg: 'bg-blue-500/20', icon: 'text-blue-400' },
      rows: [
        { label: 'Courier', value: n(costs.courier) },
        { label: 'Van Bhara', value: n(costs.vanBhara) },
      ],
      editInputs: (
        <>
          <CostInput label="Courier" name="courier" value={costs.courier} onChange={handleChange} placeholder="e.g. 3000" />
          <CostInput label="Van Bhara" name="vanBhara" value={costs.vanBhara} onChange={handleChange} placeholder="e.g. 300" />
        </>
      )
    },
    {
      icon: Package, title: 'Packaging & Materials', total: packagingTotal,
      color: { border: 'border-emerald-500/20', bg: 'bg-emerald-900/10', bgSolid: 'bg-emerald-900/15', iconBg: 'bg-emerald-500/20', icon: 'text-emerald-400' },
      rows: [
        { label: 'Carton', value: n(costs.carton) },
        { label: 'Courier Poly', value: n(costs.courierPoly) },
        { label: 'Packaging', value: n(costs.packaging) },
        { label: 'Cos-Tape', value: n(costs.cosTape) },
      ],
      editInputs: (
        <>
          <CostInput label="Carton" name="carton" value={costs.carton} onChange={handleChange} placeholder="e.g. 1500" />
          <CostInput label="Courier Poly" name="courierPoly" value={costs.courierPoly} onChange={handleChange} placeholder="e.g. 300" />
          <CostInput label="Packaging" name="packaging" value={costs.packaging} onChange={handleChange} placeholder="e.g. 500" />
          <CostInput label="Cos-Tape" name="cosTape" value={costs.cosTape} onChange={handleChange} placeholder="e.g. 200" />
        </>
      )
    },
    {
      icon: Layers, title: 'Print Costs', total: printTotal,
      color: { border: 'border-orange-500/20', bg: 'bg-orange-900/10', bgSolid: 'bg-orange-900/15', iconBg: 'bg-orange-500/20', icon: 'text-orange-400' },
      rows: [
        { label: 'Letter Print', value: n(costs.letterPrint) },
        { label: 'Paper Price for Print', value: n(costs.paperPrice) },
      ],
      editInputs: (
        <>
          <CostInput label="Letter Print" name="letterPrint" value={costs.letterPrint} onChange={handleChange} placeholder="e.g. 800" />
          <CostInput label="Paper Price for Print" name="paperPrice" value={costs.paperPrice} onChange={handleChange} placeholder="e.g. 600" />
        </>
      )
    },
  ];

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-500 mb-20 px-4">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 border-b border-gray-800 pb-5 pt-8 mb-8">
        <button
          onClick={() => router.push('/dashboard/StockManagement')}
          className="p-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl transition-colors shrink-0"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <Calculator className="text-violet-400" size={24} />
            Batch Cost Manager
          </h1>
          <p className="text-gray-400 mt-1 text-sm">
            Batch of&nbsp;
            <strong className="text-white bg-gray-800 px-2 py-0.5 rounded-md font-bold">{stockEntry.amount} books</strong>
            &nbsp;·&nbsp;Added on {formattedDate}
          </p>
        </div>
        {/* Edit toggle button — only show if costs are saved */}
        {hasSavedCosts && (
          <button
            onClick={() => setIsEditing(e => !e)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all ${
              isEditing
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                : 'bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30'
            }`}
          >
            {isEditing ? <><X size={16} /> Cancel</> : <><Pencil size={16} /> Edit Costs</>}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* ── Main Content ──────────────────────────────────────────────── */}
        <div className="xl:col-span-2">
          {isEditing ? (
            // ── EDIT MODE ────────────────────────────────────────────────
            <form onSubmit={handleSave} className="space-y-5">
              {sections.map((sec) => (
                <SectionCard key={sec.title} icon={sec.icon} title={sec.title} color={sec.color} total={sec.total} isEditing={true}>
                  {sec.editInputs}
                </SectionCard>
              ))}

              {/* Dynamic Other Costs */}
              <div className="rounded-2xl border border-gray-700/50 bg-gray-800/30 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-gray-700/60"><Plus size={16} className="text-gray-400" /></div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Other Costs</h3>
                    {otherTotal > 0 && <span className="text-sm font-bold text-gray-400">৳ {otherTotal.toLocaleString()}</span>}
                  </div>
                  <button type="button" onClick={addOther} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs font-semibold rounded-lg transition-colors">
                    <Plus size={14} /> Add Cost
                  </button>
                </div>
                {costs.otherCosts.length === 0 ? (
                  <p className="text-xs text-gray-600 italic py-2">Click "Add Cost" to log any extra expense not listed above.</p>
                ) : (
                  <div className="space-y-3">
                    {costs.otherCosts.map((c, i) => (
                      <div key={i} className="flex gap-3 items-center bg-gray-900/40 border border-gray-700/40 rounded-xl p-3">
                        <div className="flex-1 space-y-1">
                          <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Cost Name</label>
                          <input type="text" value={c.name} onChange={e => handleOtherChange(i, 'name', e.target.value)} placeholder="e.g. Labor"
                            className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none text-sm transition-all" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Amount (৳)</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-bold">৳</span>
                            <input type="number" value={c.amount} onChange={e => handleOtherChange(i, 'amount', e.target.value)} placeholder="0" min="0" step="0.01"
                              className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg pl-8 pr-3 py-2 focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 outline-none text-sm transition-all" />
                          </div>
                        </div>
                        <button type="button" onClick={() => removeOther(i)} className="mt-5 p-2 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button type="submit" disabled={isSaving || saved}
                className={`w-full flex items-center justify-center gap-2 py-4 font-semibold rounded-2xl transition-all duration-300 shadow-lg text-white ${
                  saved ? 'bg-emerald-600 shadow-emerald-900/30' : 'bg-violet-600 hover:bg-violet-500 shadow-violet-900/30 active:scale-[0.99]'
                } disabled:opacity-60`}>
                {saved ? <><CheckCircle2 size={20} /> Saved!</> : isSaving ? <><RefreshCw size={20} className="animate-spin" /> Saving...</> : <><Save size={20} /> Save All Costs</>}
              </button>
            </form>
          ) : (
            // ── VIEW MODE ────────────────────────────────────────────────
            <div className="space-y-5">
              {sections.map((sec) => {
                const filledRows = sec.rows.filter(r => r.value > 0);
                if (filledRows.length === 0) return null;
                return (
                  <SectionCard key={sec.title} icon={sec.icon} title={sec.title} color={sec.color} total={sec.total} isEditing={false}>
                    <div className="col-span-2 divide-y divide-gray-700/30">
                      {filledRows.map(row => (
                        <div key={row.label} className="flex items-center justify-between py-2.5">
                          <span className="text-sm text-gray-400">{row.label}</span>
                          <span className="text-sm font-bold text-white">৳ {row.value.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                );
              })}

              {/* Other costs view */}
              {costs.otherCosts.filter(c => n(c.amount) > 0).length > 0 && (
                <div className="rounded-2xl border border-gray-700/50 bg-gray-800/20 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-gray-700/60"><Plus size={16} className="text-gray-400" /></div>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">Other Costs</h3>
                    </div>
                    <span className="text-sm font-bold text-gray-400">৳ {otherTotal.toLocaleString()}</span>
                  </div>
                  <div className="divide-y divide-gray-700/30">
                    {costs.otherCosts.filter(c => n(c.amount) > 0).map((c, i) => (
                      <div key={i} className="flex items-center justify-between py-2.5">
                        <span className="text-sm text-gray-400">{c.name || 'Unnamed'}</span>
                        <span className="text-sm font-bold text-white">৳ {n(c.amount).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {totalCost === 0 && (
                <div className="rounded-2xl border border-dashed border-gray-700 bg-gray-800/20 p-10 text-center">
                  <p className="text-gray-500 text-sm">No costs recorded yet.</p>
                  <button onClick={() => setIsEditing(true)} className="mt-3 text-violet-400 hover:text-violet-300 text-sm font-semibold transition-colors">
                    + Add costs now
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Sticky Sidebar ─────────────────────────────────────────────── */}
        <div className="xl:col-span-1 space-y-5 xl:sticky xl:top-8 xl:self-start">
          {/* Total */}
          <div className="bg-gradient-to-br from-violet-900/30 to-gray-900/60 backdrop-blur-sm border border-violet-500/30 rounded-2xl p-6 shadow-xl text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(139,92,246,0.12),transparent_60%)] pointer-events-none" />
            <div className="flex items-center justify-center gap-2 mb-1">
              <TrendingDown size={14} className="text-violet-400" />
              <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Total Batch Cost</p>
            </div>
            <div className="text-5xl font-black tracking-tighter text-white mt-1 drop-shadow-md">
              ৳ {totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <p className="text-xs text-gray-500 mt-2">{stockEntry.amount} books total</p>
          </div>

          {/* Cost Per Book */}
          <div className="bg-gray-800/50 border border-gray-700/60 rounded-2xl p-5 text-center">
            <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-1">Cost Per Book</p>
            <div className="text-3xl font-bold text-emerald-400 mt-1">
              ৳ {costPerBook.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-600 mt-1">Average unit cost</p>
          </div>

          {/* Unit Economics */}
          {hasSavedCosts && totalCost > 0 && (
            <div className="bg-gray-800/50 border border-gray-700/60 rounded-2xl p-5 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 w-20 h-20 bg-orange-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-orange-500/10 transition-colors" />
              
              <div className="flex items-center gap-2 mb-4">
                <PieChart size={16} className="text-orange-400" />
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Unit Economics</h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-300 font-medium">Est. Selling Price</span>
                  {isEditingSP ? (
                    <div className="relative w-24 flex items-center">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs font-bold">৳</span>
                      <input 
                        type="number" 
                        value={sellingPrice} 
                        onChange={e => setSellingPrice(e.target.value)}
                        onBlur={() => setIsEditingSP(false)}
                        autoFocus
                        className="w-full bg-gray-900 border border-gray-600 text-white rounded-lg pl-6 pr-2 py-1.5 text-right text-xs font-bold focus:ring-1 focus:ring-orange-500 outline-none transition-all"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">৳ {sp.toLocaleString()}</span>
                      <button 
                        onClick={() => setIsEditingSP(true)}
                        className="p-1 text-gray-500 hover:text-orange-400 bg-gray-900/50 hover:bg-orange-500/10 rounded-md transition-colors"
                        title="Edit Selling Price"
                      >
                        <Pencil size={12} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-700/50">
                  <span className="text-sm text-gray-300 font-bold">Profit Per Book</span>
                  <span className={`text-lg font-black ${profitPerBook >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    ৳ {profitPerBook.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="bg-gray-900/50 rounded-xl p-3 text-center border border-gray-700/30">
                    <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wider mb-1">Margin</p>
                    <p className={`text-sm font-bold ${margin >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{margin.toFixed(1)}%</p>
                  </div>
                  <div className="bg-gray-900/50 rounded-xl p-3 text-center border border-gray-700/30">
                    <p className="text-[10px] text-gray-500 uppercase font-semibold tracking-wider mb-1">ROI</p>
                    <p className={`text-sm font-bold ${roi >= 0 ? 'text-blue-400' : 'text-red-400'}`}>{roi.toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Breakdown list */}
          {breakdownItems.length > 0 && (
            <div className="bg-gray-800/40 border border-gray-700/50 rounded-2xl p-5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Breakdown</p>
              {breakdownItems.map((item, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-700/30 last:border-0">
                  <span className="flex items-center gap-2 text-xs text-gray-400">
                    <ChevronRight size={10} className="text-gray-600" />
                    {item.label}
                  </span>
                  <span className="text-xs font-semibold text-white">৳ {item.value.toLocaleString()}</span>
                </div>
              ))}
              <div className="flex items-center justify-between pt-3 mt-1 border-t border-gray-600">
                <span className="text-xs font-bold text-gray-300">Total</span>
                <span className="text-xs font-black text-violet-400">৳ {totalCost.toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
