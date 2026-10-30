// Safe for public GitHub repositories - No hardcoded API keys!

export const GEMINI_API_KEY: string =
  (import.meta as any).env?.VITE_GEMINI_API_KEY ||
  (typeof window !== 'undefined' ? localStorage.getItem('EDUSMART_GEMINI_KEY') || '' : '');

export const GEMINI_MODEL = 'gemini-2.5-flash';
