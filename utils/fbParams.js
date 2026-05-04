export const getCookie = (name) => {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
};

export const getFbp = () => getCookie('_fbp');
export const getFbc = () => getCookie('_fbc');

export const setFbcCookie = (fbclid) => {
  if (typeof window === 'undefined' || !fbclid) return null;
  
  // Only set if not already present
  const existingFbc = getCookie('_fbc');
  if (existingFbc) return existingFbc;

  // Format: fb.1.{timestamp}.{fbclid}
  const timestamp = Date.now();
  const fbcValue = `fb.1.${timestamp}.${fbclid}`;
  
  // Expiry: 90 days from now (matches FB standard)
  const date = new Date();
  date.setTime(date.getTime() + (90 * 24 * 60 * 60 * 1000));
  const expires = `expires=${date.toUTCString()}`;
  
  document.cookie = `_fbc=${fbcValue};${expires};path=/;SameSite=Lax`;
  return fbcValue;
};
