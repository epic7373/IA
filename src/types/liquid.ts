export type GlassPresetId =
  | 'crystal'
  | 'soft-glass'
  | 'deep-glass'
  | 'prismatic'
  | 'minimal-glass'
  | 'custom';

export interface GlassEffectsEnabled {
  refraction: boolean;
  blur: boolean;
  chromaticAberration: boolean;
  specular: boolean;
  borderGlow: boolean;
  shadows: boolean;
  animations: boolean;
  lighting: boolean;
}

export interface GlassConfig {
  presetId: GlassPresetId;
  refractionIntensity: number; // 0 - 100
  blurIntensity: number; // 0 - 48 px
  chromaticAberration: number; // 0 - 100
  specularIntensity: number; // 0 - 100
  transparency: number; // 10 - 92 % opacity (converted cleanly)
  borderGlow: number; // 0 - 100
  glassDepth: number; // 0 - 100
  shadowIntensity: number; // 0 - 100
  animationSpeed: number; // 25 - 200 %
  lightingIntensity: number; // 0 - 100
  enabled: GlassEffectsEnabled;
}

export interface ApiConfig {
  apiKey: string;
  baseUrl: string;
  chatEndpoint: string;
  modelId: string;
  globalSystemPrompt: string;
  supportsVision: boolean;
  supportsStreaming: boolean;
  supportsFrequencyPenalty: boolean;
  temperature: number;
  topP: number;
  maxTokens: number;
  frequencyPenalty: number;
  customParamsJson: string;
}

export type ThemeMode = 'light' | 'dark';
export type FontFamilyOption = 'plus-jakarta' | 'dm-sans' | 'manrope' | 'system';
export type UiDensity = 'compact' | 'comfortable' | 'airy';
export type BackgroundMode = 'optical-waves' | 'studio-slate' | 'liquid-shader' | 'custom-image';
export type PerformanceMode = 'auto' | 'high' | 'reduced';

export interface GeneralSettings {
  theme: ThemeMode;
  accentColor: string;
  backgroundMode: BackgroundMode;
  customBackgroundDataUrl: string;
  fontFamily: FontFamilyOption;
  fontSize: number; // 13 - 18 px
  density: UiDensity;
  performanceMode: PerformanceMode;
}

export interface Bot {
  id: string;
  name: string;
  description: string;
  avatar: string; // URL path or data URL
  systemPrompt: string;
  greeting: string;
  modelId: string; // empty string = use global default
  supportsVision: boolean;
  useCustomParams: boolean;
  temperature: number;
  topP: number;
  maxTokens: number;
  createdAt: number;
  updatedAt: number;
}

export interface ChatAttachment {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  dataUrl: string;
  kind: 'image' | 'text' | 'file';
  textContent?: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: ChatAttachment[];
  createdAt: number;
  updatedAt?: number;
  pinned?: boolean;
  error?: string;
}

export interface MemoryItem {
  id: string;
  conversationId: string;
  content: string;
  importance: 'high' | 'normal';
  source: 'auto' | 'manual' | 'pinned';
  createdAt: number;
}

export interface Conversation {
  id: string;
  botId: string;
  title: string;
  archived: boolean;
  memoryEnabled: boolean;
  summary: string;
  summaryUpToMessageId: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface ExportBundle {
  version: 1;
  exportedAt: number;
  glassConfig: GlassConfig;
  generalSettings: GeneralSettings;
  bots: Bot[];
  conversations: Conversation[];
  messages: ChatMessage[];
  memories: MemoryItem[];
}
