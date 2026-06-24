// Central API base URL configuration
// Prefer Vite env; fall back to Railway production URL when blank
export const API_BASE_URL = import.meta?.env?.VITE_API_URL || 'https://carevault-production-b2c0.up.railway.app';
