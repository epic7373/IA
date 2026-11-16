import { DEFAULT_API_CONFIG } from '../core/apiClient';
import { DEFAULT_GENERAL_SETTINGS } from '../core/seedData';
import { DEFAULT_GLASS_CONFIG, sanitizeGlassConfig } from '../glass/glassEngine';
import type { ApiConfig, GeneralSettings, GlassConfig } from '../types/liquid';

const KEYS = {
  apiConfig: 'liquid_ai_api_config_v1',
  glassConfig: 'liquid_ai_glass_config_v1',
  generalSettings: 'liquid_ai_general_settings_v1',
  activeConversationId: 'liquid_ai_active_conv_v1',
  activeBotId: 'liquid_ai_active_bot_v1',
};

function safeReadJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return { ...fallback, ...parsed };
    }
    return fallback;
  } catch {
    return fallback;
  }
}

function safeWriteJson(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or restricted mode
  }
}

export function loadApiConfig(): ApiConfig {
  return safeReadJson(KEYS.apiConfig, DEFAULT_API_CONFIG);
}

export function saveApiConfig(config: ApiConfig): void {
  safeWriteJson(KEYS.apiConfig, config);
}

export function loadGlassConfig(): GlassConfig {
  const raw = safeReadJson(KEYS.glassConfig, DEFAULT_GLASS_CONFIG);
  return sanitizeGlassConfig(raw);
}

export function saveGlassConfig(config: GlassConfig): void {
  safeWriteJson(KEYS.glassConfig, config);
}

export function loadGeneralSettings(): GeneralSettings {
  return safeReadJson(KEYS.generalSettings, DEFAULT_GENERAL_SETTINGS);
}

export function saveGeneralSettings(settings: GeneralSettings): void {
  safeWriteJson(KEYS.generalSettings, settings);
}

export function loadActiveIds(): { conversationId: string | null; botId: string | null } {
  try {
    return {
      conversationId: window.localStorage.getItem(KEYS.activeConversationId),
      botId: window.localStorage.getItem(KEYS.activeBotId),
    };
  } catch {
    return { conversationId: null, botId: null };
  }
}

export function saveActiveIds(conversationId: string | null, botId: string | null): void {
  try {
    if (conversationId) {
      window.localStorage.setItem(KEYS.activeConversationId, conversationId);
    } else {
      window.localStorage.removeItem(KEYS.activeConversationId);
    }
    if (botId) {
      window.localStorage.setItem(KEYS.activeBotId, botId);
    } else {
      window.localStorage.removeItem(KEYS.activeBotId);
    }
  } catch {
    // Ignore storage restriction
  }
}
