"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, ChevronLeft, ChevronRight, ChevronDown, 
  Package, Truck, CheckCircle, CircleDot, MapPin, Clock,
  XCircle, RotateCcw, Eye, X, User, Phone, Calendar, DollarSign,
  PhoneCall, PhoneOff, Check, Smartphone, Globe, Zap, 
  LayoutTemplate, Info, ShieldCheck, AlertCircle, ShoppingBag,
  AlertTriangle, Share2, ArrowRightCircle
} from 'lucide-react';
import { UAParser } from 'ua-parser-js'; 
import getAllOrders from '@/lib/getAllorders';
import { SteadfastPill, FraudCheckerBadge } from '@/components/SteadfastWidgets';

// --- CONFIGURATION ---
const ACTION_OPTIONS = [
  { label: 'Processing', value: 'Processing' },
  { label: 'Shipped', value: 'Shipped' },
  { label: 'Delivered', value: 'Delivered' },
  { label: 'Cancel', value: 'Cancelled' },
  { label: 'Return', value: 'Returned' }
];

const CALL_OPTIONS = [
  { label: 'Pending', value: 'Pending' },
  { label: 'Confirmed', value: 'Confirmed' }, 
  { label: 'No Answer', value: 'No Answer' },
];

const DEVICE_CODEX = {
  '23129RAA4G': 'Redmi Note 13 5G',
  '23124RA7EO': 'Redmi Note 13 4G',
  'SM-S918B': 'Galaxy S23 Ultra',
  'SM-S908B': 'Galaxy S22 Ultra',
  'iPhone16,1': 'iPhone 15 Pro',
  'iPhone16,2': 'iPhone 15 Pro Max',
};

// --- HELPER: USER AGENT PARSER ---
const getDeepUserAgentInfo = (uaString) => {
  if (!uaString) return null;
  const parser = new UAParser(uaString);
  const result = parser.getResult();
  
  const rawModel = result.device.model || 'PC/Unknown';
  const marketingName = DEVICE_CODEX[rawModel] || rawModel;
  const vendor = result.device.vendor || '';

  let appSource = { name: 'Browser', code: 'Web', insight: 'Standard Web Browser' };
  if (uaString.includes('FB_IAB') || uaString.includes('FB4A')) {
      appSource = { name: 'Facebook App', code: 'FB_IAB', insight: 'User came from Facebook Feed/Ads' };
  } else if (uaString.includes('Instagram')) {
      appSource = { name: 'Instagram', code: 'IG', insight: 'User came from Instagram' };
  } else if (uaString.includes('WhatsApp')) {
      appSource = { name: 'WhatsApp', code: 'WA', insight: 'User came from WhatsApp Link' };
  }

  return {
    device: {
        vendor,
        marketingName,
        rawModel,
        os: `${result.os.name || 'Unknown OS'} ${result.os.version || ''}`.trim()
    },
    browser: `${result.browser.name || 'Unknown'}`,
    appSource,
    summary: `${vendor} ${marketingName} on ${result.os.name}. Source: ${appSource.name}.`
  };
};

// --- HELPER COMPONENTS ---

const StatusDropdown = ({ status, onStatusChange }) => {
  const styles = {
    Processing: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    Cancelled: 'bg-red-500/10 text-red-400 border-red-500/20',
    Fake: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    Duplicate: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  };
  const activeStyle = styles[status] || styles.Processing;

  return (
    <div className="relative inline-block">
      <select
        value={status || 'Processing'}
        onChange={(e) => onStatusChange(e.target.value)}
        className={`appearance-none rounded-md pl-2.5 pr-6 py-1 text-xs font-medium border focus:outline-none cursor-pointer ${activeStyle}`}
      >
        <option value="Processing" className="bg-gray-900 text-white">Processing</option>
        <option value="Cancelled" className="bg-gray-900 text-white">Cancel</option>
        <option value="Fake" className="bg-gray-900 text-white">Fake</option>
        <option value="Duplicate" className="bg-gray-900 text-white">Duplicate Order</option>
      </select>
      <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
    </div>
  );
};

const CallStatusDropdown = ({ currentStatus, onStatusChange }) => {
    const statusStyles = {
      Confirmed: 'border-green-500/50 bg-green-500/20 text-green-400',
      'No Answer': 'border-red-500/50 bg-red-500/20 text-red-400',
      'Pending': 'border-yellow-500/50 bg-yellow-500/20 text-yellow-400'
    };
    const currentStyle = statusStyles[currentStatus] || statusStyles['Pending'];
    
    return (
      <div className="relative w-28 inline-block"> 
        <select
          value={currentStatus || 'Pending'}
          onChange={(e) => onStatusChange(e.target.value)}
          className={`appearance-none w-full rounded-md border py-1 pl-2.5 pr-6 text-xs font-medium shadow-sm focus:outline-none transition-colors cursor-pointer ${currentStyle}`}
        >
          {CALL_OPTIONS.map((option) => (
            <option key={option.value} value={option.value} className="bg-gray-900 text-white">
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
      </div>
    );
};

const ActionDropdown = ({ currentStatus, onStatusChange }) => {
  return (
    <div className="relative group">
      <select
        value={currentStatus}
        onChange={(e) => onStatusChange(e.target.value)}
        className="appearance-none w-32 rounded-lg bg-gray-900 border border-gray-700 text-xs font-medium text-gray-300 py-2 pl-3 pr-8 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer hover:border-gray-600"
      >
        {ACTION_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
      <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none group-hover:text-gray-300" />
    </div>
  );
};

// --- CONFIRMATION POPUP ---
const ConfirmationModal = ({ isOpen, onClose, onConfirm, customerName }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-sm w-full shadow-2xl transform scale-100">
                <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 mb-4">
                        <ArrowRightCircle size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Migrate Order?</h3>
                    <p className="text-sm text-gray-400 mb-6">
                        Are you sure you want to move <strong>{customerName}</strong>'s abandoned cart to the active orders list? 
                        <br/><br/>
                        <span className="text-xs text-gray-500">This will remove it from 'Abandoned' and create a real order.</span>
                    </p>
                    <div className="flex gap-3 w-full">
                        <button onClick={onClose} className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium rounded-lg transition-colors">
                            Cancel
                        </button>
                        <button onClick={onConfirm} className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-bold rounded-lg transition-colors">
                            Yes, Migrate
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- MAIN DETAILS MODAL ---
const OrderModal = ({ order, onClose, onStatusChange, onCallStatusChange, onMigrateRequest }) => {
  if (!order) return null;
  const ua = getDeepUserAgentInfo(order.userAgent);
  const cartItem = order.items?.[0] || {}; 

  // FIXED: Read values from root `order` object, falling back to `cartItem` only if necessary
  const shippingMethod = order.shipping || cartItem.shippingMethod || 'Standard';
  const shippingCost = order.shippingCost || cartItem.shippingCost || 0;
  const totalAmount = order.totalValue || cartItem.totalAmount || 0;
  const productPrice = cartItem.price || cartItem.productPrice || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-5xl bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-800 bg-gray-900">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full ${order.status === 'Cancelled' ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'}`}>
              <ShoppingBag size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {order.customer.name || 'Unknown Guest'}
              </h2>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <span>{order.customer.phone}</span>
                <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                <span className="font-mono text-gray-500">ID: {order.orderId || 'N/A'}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Column 1: Cart & Financials */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Package size={14} /> Cart Details
                </h3>
                <div className="flex items-start justify-between p-3 bg-gray-900 rounded-lg border border-gray-800">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center text-gray-600 font-bold text-xs">IMG</div>
                    <div>
                      <p className="text-sm font-medium text-white">Product ID: {cartItem.item_id || cartItem.postId || 'N/A'}</p>
                      <p className="text-xs text-gray-400">Price: {productPrice} ৳</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">{totalAmount} ৳</p>
                    <p className="text-[10px] text-gray-500">Total with Shipping</p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-800">
                    <p className="text-xs text-gray-500 mb-1">Shipping Method</p>
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <Truck size={14} />
                      <span className="font-medium">{shippingMethod}</span>
                    </div>
                  </div>
                  <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-800">
                    <p className="text-xs text-gray-500 mb-1">Shipping Cost</p>
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <DollarSign size={14} />
                      <span className="font-medium">{shippingCost} ৳</span>
                    </div>
                  </div>
                </div>
              </div>

               <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <MapPin size={14} /> Delivery Info
                </h3>
                <div className="text-sm text-gray-300 leading-relaxed bg-gray-900 p-3 rounded-lg border border-gray-800">
                  {order.address || 'No address provided'}
                </div>
              </div>
            </div>

            {/* Column 2: Digital Fingerprint */}
            <div className="space-y-4">
              <div className="bg-linear-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700 overflow-hidden shadow-lg relative">
                <div className="p-4 border-b border-gray-700/50 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck size={14} /> Digital Footprint
                  </h3>
                  {ua?.appSource.name.includes('Facebook') && (
                    <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full">Ads Traffic</span>
                  )}
                </div>
                
                {ua ? (
                  <div className="p-4 space-y-4">
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase mb-1">Device Hardware</p>
                      <p className="text-sm text-white font-medium flex items-center gap-2">
                        <Smartphone size={14} className="text-gray-400" /> 
                        {ua.device.vendor} <span className="text-blue-400">{ua.device.marketingName}</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase mb-1">Browser / App</p>
                      <p className="text-sm text-white font-medium flex items-center gap-2">
                        <Globe size={14} className="text-gray-400" /> {ua.appSource.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 pl-6 italic">"{ua.appSource.insight}"</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase mb-1">Operating System</p>
                      <p className="text-sm text-white font-medium flex items-center gap-2">
                        <Zap size={14} className="text-gray-400" /> {ua.device.os}
                      </p>
                    </div>
                    <div className="pt-3 border-t border-gray-700/50">
                      <p className="text-[10px] text-gray-500 uppercase mb-2">Network IP</p>
                      <code className="block bg-black/40 rounded px-2 py-1 text-xs text-green-500 font-mono">
                         {order.clientInfo?.ip || 'Not Captured'}
                      </code>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center text-gray-500 text-xs">No Device Data</div>
                )}
              </div>

              <div className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Recovery Actions</h3>
                <div className="grid grid-cols-2 gap-2">
                   <a href={`tel:${order.customer.phone}`} className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white py-2 rounded-lg text-xs font-bold transition-colors">
                     <PhoneCall size={14} /> Call Now
                   </a>
                   <a href={`https://wa.me/${order.customer.phone?.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg text-xs font-bold transition-colors">
                     <Share2 size={14} /> WhatsApp
                   </a>
                </div>
              </div>
              <FraudCheckerBadge phone={order.customer.phone} />
            </div>
          </div>
        </div>

        {/* Footer - ACTIONS */}
        <div className="px-6 py-4 bg-gray-900 border-t border-gray-800 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
             <span className="text-xs text-gray-500">Call Outcome:</span>
             <CallStatusDropdown currentStatus={order.callStatus} onStatusChange={onCallStatusChange} />
          </div>
          <div className="flex items-center gap-3">
             <div className="hidden sm:block border-r border-gray-700 h-6 mx-2"></div>
             
             {/* MIGRATE BUTTON */}
             <button 
                onClick={() => onMigrateRequest(order)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600/20 text-green-400 hover:bg-green-600 hover:text-white border border-green-600/30 rounded-lg text-xs font-bold transition-all"
             >
                <ArrowRightCircle size={14} /> 
                Migrate to Active
             </button>

             <button onClick={onClose} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg ml-2">
               Save & Close
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- HELPERS: UI UTILS ---
const formatTimeAgo = (dateString) => {
  if (!dateString) return 'Unknown';
  const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "y ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "mo ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "m ago";
  return Math.floor(seconds) + "s ago";
};

// --- MAIN PAGE COMPONENT ---
export default function PendingOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showConfirmMigrate, setShowConfirmMigrate] = useState(false);
  const [orderToMigrate, setOrderToMigrate] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const stats = useMemo(() => {
    const today = new Date().setHours(0,0,0,0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();

    return {
      total: orders.length,
      today: orders.filter(o => new Date(o.createdAt).setHours(0,0,0,0) === today).length,
      yesterday: orders.filter(o => new Date(o.createdAt).setHours(0,0,0,0) === yesterday.getTime()).length,
      thisMonth: orders.filter(o => new Date(o.createdAt).getTime() >= firstDayOfMonth).length,
      abandoned: orders.filter(o => !o.status || o.status === 'Processing').length
    };
  }, [orders]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      const [response, allRealOrders] = await Promise.all([
        fetch('/api/save-partial-order', { cache: 'no-store' }),
        getAllOrders()
      ]);
      
      const json = await response.json();
      const rawData = json.data || [];
      
      const processed = rawData.map((item, idx) => {
        const phone = item.marketing?.number || item.number || 'N/A';
        
        // Normalize phone number to match safely
        const normalize = (p) => p ? p.replace(/\D/g, '').slice(-11) : '';
        const normPhone = normalize(phone);
        const matchingOrder = normPhone.length > 5 ? allRealOrders.find(ro => normalize(ro.customer?.phone) === normPhone) : null;
        
        return {
          _id: item._id || `temp-${idx}`,
          orderId: item.orderId || item.items?.[0]?.postId || 'N/A', 
          createdAt: item.createdAt || new Date().toISOString(),
          status: item.marketing?.status || item.status || 'Processing',
          callStatus: item.phoneCallStatus || 'Pending',
          customer: {
            name: item.marketing?.name || item.name || 'Guest',
            phone: phone
          },
          items: item.items || [],
          address: item.address || item.marketing?.address || 'N/A',
          clientInfo: item.clientInfo || {},
          userAgent: item.clientInfo?.userAgent || item.userAgent || '',
          
          // Explicitly map the fields from the root level
          shipping: item.shipping,
          shippingCost: item.shippingCost,
          totalValue: item.totalValue,
          realOrder: matchingOrder || null
        };
      });
      setOrders(processed.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (error) {
      console.error("Failed to load orders", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // --- API HANDLERS ---
  
  const handleStatusUpdate = async (id, newStatus) => {
    setOrders(prev => prev.map(o => o._id === id ? { ...o, status: newStatus } : o));
    if (selectedOrder && selectedOrder._id === id) setSelectedOrder(prev => ({...prev, status: newStatus}));
    try {
        await fetch(`/api/partial-orders/${id}`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }),
        });
    } catch(e) { console.error("Update failed", e); }
  };

  const handleCallStatusUpdate = async (id, newCallStatus) => {
      setOrders(prev => prev.map(o => o._id === id ? { ...o, callStatus: newCallStatus } : o));
      if (selectedOrder && selectedOrder._id === id) setSelectedOrder(prev => ({...prev, callStatus: newCallStatus}));
      try {
        await fetch(`/api/partial-orders/${id}`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ callStatus: newCallStatus }),
        });
      } catch(e) { console.error("Call Status Update failed", e); }
  };

  // --- MIGRATION LOGIC ---
  
  const handleMigrateClick = (order) => {
      setOrderToMigrate(order);
      setShowConfirmMigrate(true);
  };

  const proceedWithMigration = async () => {
    if (!orderToMigrate) return;

    try {
        // 1. Prepare Payload: Map frontend "Abandoned" structure to backend "Active Order" structure
        // Based on your backend, it expects: { number, status, ... }
        const payload = {
            ...orderToMigrate,
            // Explicitly set fields the backend looks for
            number: orderToMigrate.customer.phone,
            name: orderToMigrate.customer.name,
            address: orderToMigrate.address,
            items: orderToMigrate.items,
            status: "Processing", // Default status for new confirmed orders
            phoneCallStatus: "Confirmed", // Logic: If we migrate manually, we likely confirmed it
            
            // --- NEW: TAG SOURCE AS ABANDONED ---
            source: "Abandoned Recovery", 
            isRecoveredOrder: true
        };

        // Remove the old _id so MongoDB generates a fresh one for the new collection
        delete payload._id; 

        // 2. Send to Main Orders Collection
        const createRes = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const createData = await createRes.json();

        if (createData.success) {
            // 3. If success, DELETE the old abandoned record
            const deleteRes = await fetch(`/api/partial-orders/${orderToMigrate._id}`, {
                method: 'DELETE'
            });
            
            // 4. Cleanup UI
            alert(`Order Migrated Successfully! New Order ID: ${createData.orderId}`);
            setShowConfirmMigrate(false);
            setOrderToMigrate(null);
            setSelectedOrder(null); // Close modal
            fetchOrders(); // Refresh list to remove the migrated item
        } else {
            alert(`Migration Failed: ${createData.message || 'Unknown error'}`);
            if(createData.reason === 'active_order_exists') {
                setShowConfirmMigrate(false); // Close popup if it already exists
            }
        }

    } catch (error) {
        console.error("Migration error:", error);
        alert("Server Error during migration.");
    }
  };

  // --- RENDER HELPERS ---

  const filteredOrders = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase();
    return orders.filter(o => 
        (o.customer.name || '').toLowerCase().includes(lowerSearch) || 
        (o.customer.phone || '').includes(lowerSearch) ||
        (o.orderId || '').toLowerCase().includes(lowerSearch)
    );
  }, [orders, searchTerm]);

  const paginatedData = filteredOrders.slice((currentPage-1)*itemsPerPage, currentPage*itemsPerPage);
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  return (
    <div className="min-h-screen bg-black text-gray-200 font-sans selection:bg-blue-500/30">
       <style>{`.custom-scrollbar::-webkit-scrollbar { width: 6px; } .custom-scrollbar::-webkit-scrollbar-track { background: #111827; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #374151; border-radius: 10px; }`}</style>
      
      {/* MIGRATION CONFIRMATION MODAL */}
      <ConfirmationModal 
        isOpen={showConfirmMigrate}
        onClose={() => setShowConfirmMigrate(false)}
        onConfirm={proceedWithMigration}
        customerName={orderToMigrate?.customer?.name || 'Customer'}
      />

      {selectedOrder && (
        <OrderModal 
          order={selectedOrder} 
          onClose={() => setSelectedOrder(null)} 
          onStatusChange={(s) => handleStatusUpdate(selectedOrder._id, s)}
          onCallStatusChange={(s) => handleCallStatusUpdate(selectedOrder._id, s)}
          onMigrateRequest={handleMigrateClick}
        />
      )}

      <div className="max-w-[1600px] mx-auto p-4 md:p-8">
        <header className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Unsubmitted Orders</h1>
            <p className="text-gray-500 text-sm">Review abandoned carts and partial submissions.</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400 bg-gray-900 px-3 py-1.5 rounded-full border border-gray-800">
             <Clock size={14} />
             {currentTime.toLocaleTimeString()}
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
           <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl flex items-center justify-between">
             <div>
               <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Total</p>
               <p className="text-3xl font-bold text-white">{stats.total}</p>
             </div>
             <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center text-blue-500"><ShoppingBag size={20} /></div>
           </div>
           <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl flex items-center justify-between">
             <div>
               <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Today</p>
               <p className="text-3xl font-bold text-white">{stats.today}</p>
             </div>
             <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center text-green-500"><Calendar size={20} /></div>
           </div>
           <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl flex items-center justify-between">
             <div>
               <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">Yesterday</p>
               <p className="text-3xl font-bold text-white">{stats.yesterday}</p>
             </div>
             <div className="w-10 h-10 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-500"><Clock size={20} /></div>
           </div>
           <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl flex items-center justify-between">
             <div>
               <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">This Month</p>
               <p className="text-3xl font-bold text-white">{stats.thisMonth}</p>
             </div>
             <div className="w-10 h-10 bg-purple-500/10 rounded-full flex items-center justify-center text-purple-500"><Calendar size={20} /></div>
           </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
           <div className="relative w-full md:w-96">
             <input 
                type="text" 
                placeholder="Search name, phone, or ID..." 
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full bg-gray-900 border border-gray-800 text-sm text-white py-2.5 pl-10 pr-4 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-gray-600"
             />
             <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
           </div>
           <div className="flex items-center gap-2">
             <span className="text-xs text-gray-500">Rows:</span>
             <select 
               value={itemsPerPage} 
               onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
               className="bg-gray-900 border border-gray-800 text-xs text-white rounded-lg px-3 py-2 outline-none focus:border-blue-500"
             >
               <option value={10}>10</option><option value={20}>20</option><option value={50}>50</option>
             </select>
           </div>
        </div>

        {/* DESKTOP TABLE VIEW */}
        <div className="hidden md:block bg-[#111624] border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
           <div className="overflow-x-auto custom-scrollbar">
             <table className="w-full text-left whitespace-nowrap">
               <thead>
                 <tr className="bg-[#1A2235] text-gray-400 border-b border-gray-800 text-[10px] font-bold uppercase tracking-widest">
                   <th className="py-4 px-6">Order Info</th>
                   <th className="py-4 px-6">Time</th>
                   <th className="py-4 px-6">Geography</th>
                   <th className="py-4 px-6">Courier History</th>
                   <th className="py-4 px-6">Status</th>
                   <th className="py-4 px-6">Call</th>
                   <th className="py-4 px-6 text-right">Action</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-800/60">
                 {loading ? (
                   <tr><td colSpan="7" className="py-16 text-center text-gray-500">Loading...</td></tr>
                 ) : paginatedData.length === 0 ? (
                   <tr><td colSpan="7" className="py-16 text-center text-gray-500">No abandoned carts found.</td></tr>
                 ) : (
                   paginatedData.map((order) => {
                     const hasRealOrder = !!order.realOrder;
                     return (
                       <tr key={order._id} className={`group transition-all duration-200 ${hasRealOrder ? 'bg-[#151c2e] hover:bg-[#1a233a] opacity-80' : 'bg-transparent hover:bg-gray-800/40'}`}>
                         <td className="py-4 px-6">
                           <div className="flex items-center gap-4">
                             <div className="flex flex-col gap-1.5 min-w-[120px]">
                               <span className="text-[13px] font-bold text-white group-hover:text-blue-400 truncate max-w-[160px]">{order.customer.name}</span>
                               <span className="text-xs text-gray-400 font-mono">{order.customer.phone}</span>
                             </div>
                             {hasRealOrder && (
                               <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-bold uppercase tracking-wider">
                                 <CheckCircle size={12} /> Already Ordered ({order.realOrder.status})
                               </div>
                             )}
                           </div>
                         </td>
                         <td className="py-4 px-6">
                           <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-gray-800/50 text-gray-400 text-[11px] font-medium border border-gray-700/50">
                             <Clock size={12} /> {formatTimeAgo(order.createdAt)}
                           </div>
                         </td>
                         <td className="py-4 px-6">
                           <div className="flex flex-col gap-1.5">
                             <div className="flex items-center gap-2">
                               <span className="text-sm text-gray-200 font-bold">{order.totalValue ? `${order.totalValue} ৳` : 'N/A'}</span>
                               <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400">{order.shipping || 'Standard'}</span>
                             </div>
                             {order.address && order.address !== 'N/A' && (
                               <div className="flex items-center gap-1.5 text-xs text-gray-400 max-w-[200px] truncate" title={order.address}>
                                 <MapPin size={12} className="shrink-0 text-gray-500" />
                                 <span className="truncate">{order.address}</span>
                               </div>
                             )}
                           </div>
                         </td>
                         <td className="py-4 px-6">
                           <SteadfastPill phone={order.customer.phone} />
                         </td>
                         <td className="py-4 px-6">
                           {hasRealOrder ? (
                             <span className="text-xs text-gray-500 font-medium italic">Handled</span>
                           ) : (
                             <StatusDropdown status={order.status} onStatusChange={(s) => handleStatusUpdate(order._id, s)} />
                           )}
                         </td>
                         <td className="py-4 px-6">
                           {hasRealOrder ? (
                             <span className="text-xs text-gray-500 font-medium italic">N/A</span>
                           ) : (
                             <CallStatusDropdown currentStatus={order.callStatus} onStatusChange={(s) => handleCallStatusUpdate(order._id, s)} />
                           )}
                         </td>
                         <td className="py-4 px-6 text-right">
                           <button onClick={() => setSelectedOrder(order)} className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#1F2937] hover:bg-[#374151] border border-gray-700 rounded-md text-[11px] font-bold text-white transition-all shadow-sm">
                             <Eye size={14} /> View
                           </button>
                         </td>
                       </tr>
                     );
                   })
                 )}
               </tbody>
             </table>
           </div>
           {totalPages > 1 && (
             <div className="px-6 py-4 border-t border-gray-800 bg-[#151c2e] flex items-center justify-between">
               <span className="text-xs text-gray-400 font-medium">Page <span className="text-white">{currentPage}</span> of <span className="text-white">{totalPages}</span></span>
               <div className="flex gap-2">
                 <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="p-2 rounded-lg bg-gray-800/80 border border-gray-700 text-gray-400 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-700 hover:text-white transition-colors"><ChevronLeft size={16} /></button>
                 <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="p-2 rounded-lg bg-gray-800/80 border border-gray-700 text-gray-400 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-700 hover:text-white transition-colors"><ChevronRight size={16} /></button>
               </div>
             </div>
           )}
        </div>

        {/* MOBILE CARD LIST */}
        <div className="md:hidden flex flex-col gap-3">
          {loading ? (
            <div className="py-16 text-center text-gray-500 flex flex-col items-center gap-3">
              <span className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></span>
              <span className="text-sm">Loading orders...</span>
            </div>
          ) : paginatedData.length === 0 ? (
            <div className="py-16 text-center text-gray-500 bg-gray-900/50 rounded-2xl border border-gray-800">
              <ShoppingBag size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No abandoned carts found.</p>
            </div>
          ) : (
            paginatedData.map((order) => {
              const hasRealOrder = !!order.realOrder;
              return (
                <div
                  key={order._id}
                  className={`rounded-2xl border overflow-hidden transition-all active:scale-[0.99] ${
                    hasRealOrder
                      ? 'bg-gradient-to-br from-green-950/40 to-[#111827] border-green-500/30 shadow-lg shadow-green-900/10'
                      : 'bg-gradient-to-br from-[#1a2236] to-[#111827] border-gray-700/60 shadow-md'
                  }`}
                >
                  {/* ── TOP BANNER: Already Ordered ── */}
                  {hasRealOrder && (() => {
                    const s = order.realOrder.status;
                    const statusPill = {
                      Cancelled:  { bg: 'bg-red-600',     icon: <XCircle size={11} />,   label: 'Cancelled'  },
                      Delivered:  { bg: 'bg-green-600',   icon: <CheckCircle size={11}/>, label: 'Delivered'  },
                      Shipped:    { bg: 'bg-purple-600',  icon: <Truck size={11} />,      label: 'Shipped'    },
                      Returned:   { bg: 'bg-orange-600',  icon: <RotateCcw size={11} />,  label: 'Returned'   },
                      Processing: { bg: 'bg-blue-600',    icon: <CircleDot size={11} />,  label: 'Processing' },
                      Fake:       { bg: 'bg-gray-600',    icon: <XCircle size={11} />,    label: 'Fake'       },
                    }[s] || { bg: 'bg-gray-600', icon: <CircleDot size={11} />, label: s };
                    return (
                      <div className="px-4 pt-3 pb-2 bg-green-500/10 border-b border-green-500/20 flex items-center gap-2">
                        <CheckCircle size={13} className="text-green-400 shrink-0" />
                        <span className="text-[11px] font-bold text-green-400 uppercase tracking-wider">Already Ordered —</span>
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full text-white ${statusPill.bg}`}>
                          {statusPill.icon}
                          {statusPill.label}
                        </span>
                      </div>
                    );
                  })()}


                  {/* ── CARD HEADER ── */}
                  <div className="px-4 pt-4 pb-3 flex items-start gap-3">
                    {/* Avatar */}
                    <div className={`w-11 h-11 rounded-full flex items-center justify-center text-base font-black shrink-0 ${
                      hasRealOrder
                        ? 'bg-green-500/20 text-green-300 border-2 border-green-500/40'
                        : (order.customer?.name && order.customer.name !== 'Guest')
                          ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-2 border-blue-500/40 shadow-md shadow-blue-900/30'
                          : 'bg-gray-700/80 text-gray-400 border-2 border-gray-600/50'
                    }`}>
                      {(order.customer?.name && order.customer.name !== 'Guest')
                        ? order.customer.name.trim().charAt(0).toUpperCase()
                        : <User size={18} />
                      }
                    </div>

                    {/* Name + Phone */}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-[15px] leading-tight">
                        {(order.customer?.name && order.customer.name !== 'Guest')
                          ? order.customer.name
                          : <span className="text-gray-500 font-medium italic text-sm">Unknown Guest</span>
                        }
                      </p>
                      {order.customer?.phone && order.customer.phone !== 'N/A' ? (
                        <a
                          href={`tel:${order.customer.phone}`}
                          className="inline-flex items-center gap-1.5 mt-1 text-[13px] text-blue-400 font-semibold hover:text-blue-300 transition-colors"
                        >
                          <Phone size={12} className="shrink-0" />
                          {order.customer.phone}
                        </a>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 mt-1 text-xs text-gray-600 italic">
                          <Phone size={11} /> No phone number
                        </span>
                      )}
                    </div>

                    {/* Time + View button */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="flex items-center gap-1 text-[11px] text-gray-500 bg-gray-800/70 rounded-full px-2 py-0.5 border border-gray-700/50">
                        <Clock size={10} />
                        <span>{formatTimeAgo(order.createdAt)}</span>
                      </div>
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white transition-all border border-blue-500/30 text-[11px] font-bold"
                      >
                        <Eye size={13} /> View
                      </button>
                    </div>
                  </div>

                  {/* ── DIVIDER ── */}
                  <div className="mx-4 h-px bg-gray-700/40" />

                  {/* ── CART INFO: Amount + Steadfast ── */}
                  <div className="px-4 py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {order.totalValue ? (
                        <span className="text-white font-black text-lg">{order.totalValue} ৳</span>
                      ) : (
                        <span className="text-gray-500 text-sm font-medium italic">No price</span>
                      )}
                      {order.shipping && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/20">
                          {order.shipping}
                        </span>
                      )}
                    </div>
                    <SteadfastPill phone={order.customer?.phone} />
                  </div>

                  {/* ── ADDRESS (conditional) ── */}
                  {order.address && order.address !== 'N/A' && (
                    <div className="px-4 pb-3">
                      <div className="flex items-start gap-2 text-[11px] text-gray-400 bg-gray-800/50 rounded-xl px-3 py-2 border border-gray-700/40">
                        <MapPin size={11} className="shrink-0 text-gray-500 mt-0.5" />
                        <span className="leading-relaxed line-clamp-2">{order.address}</span>
                      </div>
                    </div>
                  )}

                  {/* ── STATUS CONTROLS ── */}
                  <div className="px-4 pb-3 grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider pl-1">Call Status</span>
                      {hasRealOrder ? (
                        <span className="text-xs text-gray-500 italic px-1">Handled</span>
                      ) : (
                        <div className="relative">
                          <select
                            value={order.callStatus || 'Pending'}
                            onChange={(e) => handleCallStatusUpdate(order._id, e.target.value)}
                            className={`appearance-none w-full rounded-xl border py-2.5 pl-3 pr-7 text-xs font-bold focus:outline-none cursor-pointer transition-all ${
                              order.callStatus === 'Confirmed' ? 'border-green-500/50 bg-green-500/15 text-green-400' :
                              order.callStatus === 'No Answer' ? 'border-red-500/50 bg-red-500/15 text-red-400' :
                              'border-yellow-500/50 bg-yellow-500/15 text-yellow-400'
                            }`}
                          >
                            {CALL_OPTIONS.map(o => <option key={o.value} value={o.value} className="bg-gray-900 text-white">{o.label}</option>)}
                          </select>
                          <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider pl-1">Order Status</span>
                      {hasRealOrder ? (
                        <span className="text-xs text-gray-500 italic px-1">Handled</span>
                      ) : (
                        <div className="relative">
                          <select
                            value={order.status || 'Processing'}
                            onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                            className={`appearance-none w-full rounded-xl border py-2.5 pl-3 pr-7 text-xs font-bold focus:outline-none cursor-pointer transition-all ${
                              order.status === 'Processing' ? 'border-blue-500/50 bg-blue-500/15 text-blue-400' :
                              order.status === 'Cancelled' ? 'border-red-500/50 bg-red-500/15 text-red-400' :
                              order.status === 'Fake' ? 'border-orange-500/50 bg-orange-500/15 text-orange-400' :
                              'border-gray-500/50 bg-gray-500/15 text-gray-400'
                            }`}
                          >
                            <option value="Processing" className="bg-gray-900 text-white">Processing</option>
                            <option value="Cancelled" className="bg-gray-900 text-white">Cancel</option>
                            <option value="Fake" className="bg-gray-900 text-white">Fake</option>
                            <option value="Duplicate" className="bg-gray-900 text-white">Duplicate</option>
                          </select>
                          <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── QUICK ACTION BUTTONS ── */}
                  {!hasRealOrder && order.customer?.phone && order.customer.phone !== 'N/A' && (
                    <div className="px-4 pb-4 flex gap-2">
                      <a
                        href={`tel:${order.customer.phone}`}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-green-600/20 text-green-400 border border-green-500/30 text-xs font-bold hover:bg-green-600 hover:text-white transition-all active:scale-[0.97]"
                      >
                        <PhoneCall size={14} /> Call
                      </a>
                      <a
                        href={`https://wa.me/${order.customer.phone?.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-700/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold hover:bg-emerald-600 hover:text-white transition-all active:scale-[0.97]"
                      >
                        <Share2 size={14} /> WhatsApp
                      </a>
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 text-xs font-bold hover:bg-indigo-600 hover:text-white transition-all active:scale-[0.97]"
                      >
                        <Eye size={14} /> Detail
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Mobile Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between py-3 px-1">
              <span className="text-xs text-gray-400">Page <span className="text-white font-bold">{currentPage}</span> of <span className="text-white font-bold">{totalPages}</span></span>
              <div className="flex gap-2">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="px-4 py-2 rounded-xl bg-gray-800 border border-gray-700 text-gray-400 disabled:opacity-40 text-sm font-medium hover:bg-gray-700 hover:text-white transition-colors flex items-center gap-1">
                  <ChevronLeft size={15} /> Prev
                </button>
                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="px-4 py-2 rounded-xl bg-gray-800 border border-gray-700 text-gray-400 disabled:opacity-40 text-sm font-medium hover:bg-gray-700 hover:text-white transition-colors flex items-center gap-1">
                  Next <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}