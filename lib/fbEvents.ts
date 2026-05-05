// lib/fbEvents.ts
import { generateEventId, firePixelEvent, sendServerEvent } from './fbcapi';

export const trackPageView = () => {
  const eventId = generateEventId();
  firePixelEvent('PageView', {}, eventId);
  sendServerEvent('PageView', {}, {}, eventId);
};

export const trackViewContent = (
  contentIds: string[], 
  contentName: string, 
  value: number, 
  currency: string = 'BDT',
  userData: any = {}
) => {
  const eventId = generateEventId();
  const customData = {
    content_ids: contentIds,
    content_name: contentName,
    content_type: 'product',
    value: value,
    currency: currency,
  };
  
  firePixelEvent('ViewContent', customData, eventId);
  sendServerEvent('ViewContent', customData, userData, eventId);
};

export const trackAddToCart = (
  contentIds: string[], 
  contentName: string, 
  value: number, 
  currency: string = 'BDT',
  extraParams: any = {},
  userData: any = {}
) => {
  const eventId = generateEventId();
  const now = new Date();

  const customData = {
    content_ids: contentIds,
    content_name: contentName,
    content_type: 'product',
    contents: contentIds.map(id => ({ id, quantity: 1, item_price: value })),
    value: value,
    currency: currency,
    
    // Additional parameters
    category_name: extraParams.category_name,
    event_day: now.toLocaleDateString("en-US", { weekday: "long" }),
    event_hour: now.getHours().toString(),
    event_month: now.toLocaleDateString("en-US", { month: "long" }),
    event_url: typeof window !== 'undefined' ? window.location.href : '',
    landing_page: typeof window !== 'undefined' ? (localStorage.getItem('landing_page') || window.location.href) : '',
    page_title: typeof document !== 'undefined' ? document.title : '',
    post_id: extraParams.post_id || "913",
    post_type: extraParams.post_type || "product",
    tags: extraParams.tags || ["f-commerce", "book"],
    traffic_source: typeof document !== 'undefined' ? (document.referrer || "direct") : "direct",
    user_role: "guest",
    ...extraParams
  };

  firePixelEvent('AddToCart', customData, eventId);
  sendServerEvent('AddToCart', customData, userData, eventId);
};

export const trackInitiateCheckout = (
  contentIds: string[], 
  contentName: string, 
  value: number, 
  currency: string = 'BDT',
  numItems: number = 1,
  extraParams: any = {},
  userData: { ph?: string; fn?: string; ln?: string; em?: string; ct?: string; st?: string; country?: string; external_id?: string } = {}
) => {
  const eventId = generateEventId();
  const now = new Date();

  const customData = {
    content_ids: contentIds,
    content_name: contentName,
    content_type: 'product',
    contents: contentIds.map(id => ({ id, quantity: numItems, item_price: value })),
    value: value,
    currency: currency,
    num_items: numItems,
    
    // Additional parameters
    category_name: extraParams.category_name,
    event_day: now.toLocaleDateString("en-US", { weekday: "long" }),
    event_hour: now.getHours().toString(),
    event_month: now.toLocaleDateString("en-US", { month: "long" }),
    event_url: typeof window !== 'undefined' ? window.location.href : '',
    landing_page: typeof window !== 'undefined' ? (localStorage.getItem('landing_page') || window.location.href) : '',
    page_title: typeof document !== 'undefined' ? document.title : '',
    post_id: extraParams.post_id || "913",
    post_type: extraParams.post_type || "product",
    subtotal: extraParams.subtotal || value,
    tags: extraParams.tags || ["f-commerce", "book"],
    traffic_source: typeof document !== 'undefined' ? (document.referrer || "direct") : "direct",
    user_role: "guest",
    ...extraParams
  };

  firePixelEvent('InitiateCheckout', customData, eventId);
  sendServerEvent('InitiateCheckout', customData, userData, eventId);
};

export const trackPurchase = (
  contentIds: string[], 
  contentName: string, 
  value: number, 
  currency: string = 'BDT',
  numItems: number = 1,
  orderId: string,
  extraParams: any = {},
  userData: { ph?: string; fn?: string; ln?: string; em?: string } = {}
) => {
  // Use orderId for rock-solid deduplication on Facebook's end
  const eventId = orderId ? `purchase_${orderId}` : generateEventId();
  const now = new Date();
  
  const customData = {
    content_ids: contentIds,
    content_name: contentName,
    content_type: 'product',
    value: value,
    currency: currency,
    num_items: numItems,
    order_id: orderId, // Crucial for dedupping standard events outside of the eventId CAPI paradigm too sometimes
    contents: contentIds.map(id => ({ id, quantity: numItems, item_price: value })), // FB format for product tracking
    
    // Additional extensive parameters requested by user
    average_order: extraParams.average_order,
    category_name: extraParams.category_name,
    coupon_used: extraParams.coupon_used,
    event_day: now.toLocaleDateString("en-US", { weekday: "long" }),
    event_hour: now.getHours().toString(),
    event_month: now.toLocaleDateString("en-US", { month: "long" }),
    event_url: typeof window !== 'undefined' ? window.location.href : '',
    landing_page: typeof window !== 'undefined' ? (localStorage.getItem('landing_page') || window.location.href) : '',
    new_customer: extraParams.new_customer !== undefined ? extraParams.new_customer : true,
    page_title: typeof document !== 'undefined' ? document.title : '',
    post_id: extraParams.post_id || "913",
    post_type: extraParams.post_type || "product",
    predicted_ltv: extraParams.predicted_ltv,
    profit_margin: extraParams.profit_margin,
    shipping: extraParams.shipping_cost,
    shipping_cost: extraParams.shipping_cost,
    tags: extraParams.tags || ["f-commerce", "book", "purchase"],
    tax: extraParams.tax,
    total: extraParams.total || value,
    traffic_source: typeof document !== 'undefined' ? (document.referrer || "direct") : "direct",
    transactions_count: extraParams.transactions_count,
    user_role: "guest",
    ...extraParams // Merge any other custom keys provided
  };

  firePixelEvent('Purchase', customData, eventId);
  sendServerEvent('Purchase', customData, userData, eventId);
};

export const trackLead = (userData: { ph?: string; em?: string; fn?: string; ln?: string }) => {
  const eventId = generateEventId();
  firePixelEvent('Lead', {}, eventId);
  sendServerEvent('Lead', {}, userData, eventId);
};

export const trackCompleteRegistration = (userData: { ph?: string; em?: string; fn?: string; ln?: string }) => {
  const eventId = generateEventId();
  firePixelEvent('CompleteRegistration', {}, eventId);
  sendServerEvent('CompleteRegistration', {}, userData, eventId);
};

// Custom events matching the previous GTM implementations
export const trackCustomEvent = (
  eventName: string, 
  value: number = 0, 
  currency: string = 'BDT',
  extraParams: any = {},
  userData: { ph?: string; fn?: string; ln?: string; em?: string; ct?: string; st?: string; country?: string; external_id?: string } = {}
) => {
  const eventId = generateEventId();
  const now = new Date();

  const customData = { 
    value, 
    currency,
    
    // Additional generic parameters
    event_day: now.toLocaleDateString("en-US", { weekday: "long" }),
    event_hour: now.getHours().toString(),
    event_month: now.toLocaleDateString("en-US", { month: "long" }),
    event_url: typeof window !== 'undefined' ? window.location.href : '',
    landing_page: typeof window !== 'undefined' ? (localStorage.getItem('landing_page') || window.location.href) : '',
    page_title: typeof document !== 'undefined' ? document.title : '',
    traffic_source: typeof document !== 'undefined' ? (document.referrer || "direct") : "direct",
    user_role: "guest",
    ...extraParams 
  };
  
  firePixelEvent(eventName, customData, eventId);
  sendServerEvent(eventName, customData, userData, eventId);
};
