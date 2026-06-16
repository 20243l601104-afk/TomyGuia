import Constants from 'expo-constants';

const extra = (Constants.expoConfig?.extra || {}) as Record<string, string>;

const get = (key: string): string =>
  extra[key] || (process.env as Record<string, string>)[key] || '';

// Fallbacks para Expo Go (se sobreescriben en APK via eas.json)
const GEMINI_KEY_FALLBACK = 'AQ.Ab8RN6LkaFpStIAJa4IcFEFf8bvrD4GHJHN1PQeTlHl4naf2wg';
const STT_KEY_FALLBACK    = 'e851640d66cfaadaaff1c12472bff40ff6fe9eb3';

export const STT_API_KEY      = get('EXPO_PUBLIC_STT_API_KEY')      || STT_KEY_FALLBACK;
export const GEMINI_API_KEY   = get('EXPO_PUBLIC_GEMINI_API_KEY')   || GEMINI_KEY_FALLBACK;
export const BELVO_SECRET_ID  = get('EXPO_PUBLIC_BELVO_SECRET_ID')  || '';
export const BELVO_SECRET_KEY = get('EXPO_PUBLIC_BELVO_SECRET_KEY') || '';

export const STT_URL        = 'https://api.deepgram.com/v1/listen';
export const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
