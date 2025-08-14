export const saveToken = (token) => {
  localStorage.setItem('token', token);
};

export const saveRefreshToken = (refreshToken) => {
  localStorage.setItem('refreshToken', refreshToken);
};

// --- JWT helpers ---
const decodePayload = (token) => {
  try {
    let payload = token.split('.')[1];
    // convert from base64url to base64
    payload = payload.replace(/-/g, '+').replace(/_/g, '/');
    // pad string with '=' to make length multiple of 4
    while (payload.length % 4) payload += '=';
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
};

export const getUsernameFromToken = () => {
  const token = getToken();
  if (!token) {

    return null;
  }
  const payload = decodePayload(token);
  
  const username = (
    payload?.username ||
    payload?.name ||
    payload?.user?.username ||
    payload?.sub ||
    null
  );
  
  return username;
};

export const getUserIdFromToken = () => {
  const token = getToken();
  if (!token) return null;
  const payload = decodePayload(token);
  return (
    payload?.userId ||
    payload?.id ||
    payload?.user?.id ||
    null
  );
};

export const isTokenValid = () => {
  const token = getToken();
  if (!token) return false;
  const payload = decodePayload(token);
  if (!payload || !payload.exp) return false;
  // exp is in seconds
  const now = Date.now() / 1000;
  return payload.exp > now;
};

export const isTokenExpiringSoon = () => {
  const token = getToken();
  if (!token) return true;
  const payload = decodePayload(token);
  if (!payload || !payload.exp) return true;
  // Check if token expires in the next 5 minutes
  const now = Date.now() / 1000;
  return payload.exp < (now + 300);
};

export const getToken = () => localStorage.getItem('token');

export const getRefreshToken = () => localStorage.getItem('refreshToken');

export const clearToken = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
};

export const authHeader = () => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const apiFetch = async (url, options = {}) => {
  const headers = { 'Content-Type': 'application/json', ...options.headers, ...authHeader() };
  
  try {
    const response = await fetch(url, { ...options, headers });
    
    // If token is expired, try to refresh
    if (response.status === 401 && getRefreshToken()) {
      const refreshResponse = await fetch('/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: getRefreshToken() })
      });
      
      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        saveToken(refreshData.token);
        saveRefreshToken(refreshData.refreshToken);
        
        // Retry the original request with new token
        const newHeaders = { ...headers, Authorization: `Bearer ${refreshData.token}` };
        return fetch(url, { ...options, headers: newHeaders });
      } else {
        // Refresh failed, clear tokens
        clearToken();
        throw new Error('Authentication failed');
      }
    }
    
    return response;
  } catch (error) {
    throw error;
  }
};

// --- Logout helper ---
export const logout = async () => {
  const token = getToken();
  if (!token) {
    clearToken();
    return;
  }
  try {
    await fetch('/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    });
  } catch (_) {
    // ignore network errors; still clear client token
  } finally {
    clearToken();
  }
};
