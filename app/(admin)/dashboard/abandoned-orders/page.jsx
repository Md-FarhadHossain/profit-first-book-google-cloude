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
                   <button className="flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg text-xs font-bold transition-colors">
                     <Share2 size={14} /> WhatsApp
                   </button>
                </div>
              </div>
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

    return {
      total: orders.length,
      today: orders.filter(o => new Date(o.createdAt).setHours(0,0,0,0) === today).length,
      yesterday: orders.filter(o => new Date(o.createdAt).setHours(0,0,0,0) === yesterday.getTime()).length,
      abandoned: orders.filter(o => !o.status || o.status === 'Processing').length
    };
  }, [orders]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      // REPLACED IMPORT WITH DIRECT FETCH
      const response = await fetch('/api/save-partial-order', {
        cache: 'no-store',
      });
      const json = await response.json();
      const rawData = json.data || [];
      
      const processed = rawData.map((item, idx) => ({
        _id: item._id || `temp-${idx}`,
        orderId: item.orderId || item.items?.[0]?.postId || 'N/A', 
        createdAt: item.createdAt || new Date().toISOString(),
        status: item.marketing?.status || item.status || 'Processing',
        callStatus: item.phoneCallStatus || 'Pending',
        customer: {
          name: item.marketing?.name || item.name || 'Guest',
          phone: item.marketing?.number || item.number || 'N/A'
        },
        items: item.items || [],
        address: item.address || item.marketing?.address || 'N/A',
        clientInfo: item.clientInfo || {},
        userAgent: item.clientInfo?.userAgent || item.userAgent || '',
        
        // FIXED: Explicitly map the fields from the root level
        shipping: item.shipping,
        shippingCost: item.shippingCost,
        totalValue: item.totalValue
      }));
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
        await fetch(`/api/orders/${id}`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }),
        });
    } catch(e) { console.error("Update failed", e); }
  };

  const handleCallStatusUpdate = async (id, newCallStatus) => {
      setOrders(prev => prev.map(o => o._id === id ? { ...o, callStatus: newCallStatus } : o));
      if (selectedOrder && selectedOrder._id === id) setSelectedOrder(prev => ({...prev, callStatus: newCallStatus}));
      try {
        await fetch(`/api/orders/${id}/call-status`, {
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
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

        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
           <div className="overflow-x-auto">
             <table className="w-full">
               <thead>
                 <tr className="bg-gray-800/50 text-left">
                   <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Customer</th>
                   <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Cart Details</th>
                   <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Time Ago</th>
                   <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                   <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Call</th>
                   <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Action</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-800">
                 {loading ? (
                   <tr><td colSpan="6" className="py-12 text-center text-gray-500">Loading orders...</td></tr>
                 ) : paginatedData.length === 0 ? (
                   <tr><td colSpan="6" className="py-12 text-center text-gray-500">No orders found.</td></tr>
                 ) : (
                   paginatedData.map((order) => {
                     const item = order.items?.[0] || {};
                     return (
                       <tr key={order._id} className="hover:bg-gray-800/50 transition-colors group">
                         <td className="py-4 px-6">
                           <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-linear-to-br from-gray-700 to-gray-800 flex items-center justify-center text-gray-400 font-bold text-xs border border-gray-600">
                                {(order.customer.name || 'G').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">{order.customer.name}</p>
                                <p className="text-xs text-gray-500 font-mono mt-0.5 lg:block md:block hidden">{order.customer.phone}</p>

                                  <a
                            href={`tel:${order.customer?.phone}`}
                            className="text-xs text-gray-400 mt-0.5 hover:text-blue-500 hover:underline cursor-pointer block lg:hidden md:hidden"
                          >
                            {order.customer?.phone}
                          </a>
                              </div>
                           </div>
                         </td>
                         <td className="py-4 px-6">
                            <div className="flex flex-col gap-1">
                               {/* FIXED: Read totalValue from order root */}
                               <span className="text-sm text-gray-300 font-medium">{order.totalValue ? `${order.totalValue} ৳` : 'N/A'}</span>
                               {/* FIXED: Read shipping from order root */}
                               <span className="text-[10px] text-gray-500">{order.shipping || 'Standard'}</span>
                               
                               {order.address && order.address !== 'N/A' && (
                                  <div className="flex items-center gap-1 mt-0.5  text-gray-400 max-w-[180px]">
                                     <MapPin size={10} className="shrink-0" />
                                     <span className="truncate" title={order.address}>{order.address}</span>
                                  </div>
                               )}
                            </div>
                         </td>
                         <td className="py-4 px-6">
                            <span className="text-xs text-gray-400 flex items-center gap-1.5">
                              <Clock size={12} /> {formatTimeAgo(order.createdAt)}
                            </span>
                         </td>
                         <td className="py-4 px-6">
                            <StatusDropdown 
                                status={order.status} 
                                onStatusChange={(newStatus) => handleStatusUpdate(order._id, newStatus)} 
                            />
                         </td>
                         <td className="py-4 px-6">
                            <CallStatusDropdown 
                                currentStatus={order.callStatus} 
                                onStatusChange={(newCallStatus) => handleCallStatusUpdate(order._id, newCallStatus)} 
                            />
                         </td>
                         <td className="py-4 px-6 text-right">
                            <button 
                              onClick={() => setSelectedOrder(order)}
                              className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-600 rounded-lg text-xs font-medium text-white transition-all"
                            >
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
            <div className="px-6 py-4 border-t border-gray-800 flex items-center justify-between">
                <span className="text-xs text-gray-500">Page {currentPage} of {totalPages}</span>
                <div className="flex gap-2">
                    <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className="p-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed hover:text-white">
                    <ChevronLeft size={16} /></button>
                    <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className="p-2 rounded-lg bg-gray-800 border border-gray-700 text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed hover:text-white">
                    <ChevronRight size={16} /></button>
                </div>
            </div>
           )}
        </div>
      </div>
    </div>
  );
}