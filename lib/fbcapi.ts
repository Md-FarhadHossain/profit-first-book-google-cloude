// lib/fbcapi.ts

export const getCookie = (name: string): string | undefined => {
    if (typeof document === 'undefined') return undefined;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return undefined;
};

export const generateEventId = (): string => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c: any) =>
        (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16)
    );
};

// ─── SHA-256 using Web Crypto API (browser-native, no dependencies) ─────────
const sha256 = async (value: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(value.trim().toLowerCase());
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// ─── Normalize phone to international format before hashing ────────────────
const normalizePhone = (ph: string): string => {
    let phone = ph.trim().replace(/\s+/g, '').replace(/-/g, '');
    // 01XXXXXXXXX (11 digits) → 8801XXXXXXXXX
    if (phone.startsWith('01') && phone.length === 11) phone = '880' + phone;
    // +8801XXXXXXXXX → 8801XXXXXXXXX
    else if (phone.startsWith('+')) phone = phone.replace('+', '');
    return phone;
};

// ─── Hash all PII fields before sending to server ─────────────────────────
const hashUserData = async (userData: any): Promise<any> => {
    const hashed: any = {};

    if (userData.ph)          hashed.ph          = await sha256(normalizePhone(userData.ph));
    if (userData.fn)          hashed.fn          = await sha256(userData.fn);
    if (userData.ln)          hashed.ln          = await sha256(userData.ln);
    if (userData.em)          hashed.em          = await sha256(userData.em);
    if (userData.ct)          hashed.ct          = await sha256(userData.ct);
    if (userData.st)          hashed.st          = await sha256(userData.st);
    // Always send country — default to 'bd' (Bangladesh) if not provided
    hashed.country            = await sha256(userData.country || 'bd');
    if (userData.external_id) hashed.external_id = await sha256(userData.external_id);

    // These fields must NOT be hashed — sent raw per Facebook spec
    if (userData.fbc)               hashed.fbc               = userData.fbc;
    if (userData.fbp)               hashed.fbp               = userData.fbp;
    if (userData.client_ip_address) hashed.client_ip_address = userData.client_ip_address;
    if (userData.client_user_agent) hashed.client_user_agent = userData.client_user_agent;

    return hashed;
};

// ─── Fire browser pixel event ──────────────────────────────────────────────
export const firePixelEvent = (eventName: string, data: any, eventId: string) => {
    if (typeof window !== 'undefined') {
        const fbq = (window as any).fbq;
        if (typeof fbq === 'function') {
            const standardEvents = ['PageView', 'ViewContent', 'AddToCart', 'InitiateCheckout', 'Purchase', 'Lead', 'CompleteRegistration'];
            if (standardEvents.includes(eventName)) {
                fbq('track', eventName, data, { eventID: eventId });
            } else {
                fbq('trackCustom', eventName, data, { eventID: eventId });
            }
        } else {
            console.warn('fbq not found on window, event not fired natively:', eventName);
        }
    }
};

// ─── Send server-side CAPI event ───────────────────────────────────────────
export const sendServerEvent = async (eventName: string, customData: any, userData: any, eventId: string) => {
    try {
        // Resolve fbc: cookie > constructed from fbclid > passed userData
        const fbcFromCookie = getCookie('_fbc');
        const fbcConstructed = typeof localStorage !== 'undefined' ? (localStorage.getItem('_fbc_constructed') ?? undefined) : undefined;
        const fbc = userData.fbc || fbcFromCookie || fbcConstructed;

        // Resolve fbp: cookie > localStorage backup (for Safari ITP)
        const fbpFromCookie = getCookie('_fbp');
        const fbpBackup = typeof localStorage !== 'undefined' ? (localStorage.getItem('_fbp_backup') ?? undefined) : undefined;
        const fbp = userData.fbp || fbpFromCookie || fbpBackup;

        // Build full userData with resolved fbc/fbp before hashing
        const rawUserData = {
            ...userData,
            fbc,
            fbp,
            client_user_agent: userData.client_user_agent || (typeof navigator !== 'undefined' ? navigator.userAgent : undefined),
        };

        // Hash all PII client-side using Web Crypto SHA-256
        const hashedUserData = await hashUserData(rawUserData);

        const payload = {
            eventName,
            eventSourceUrl: typeof window !== 'undefined' ? window.location.href : '',
            userData: hashedUserData,
            customData,
            eventId,
            _prehashed: true, // Tells the server to skip re-hashing user_data fields
        };

        await fetch('/api/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
    } catch (e) {
        console.error("Failed to send server event", e);
    }
};
