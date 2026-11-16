import type {
  Bot,
  ChatMessage,
  Conversation,
  GeneralSettings,
  MemoryItem,
} from '../types/liquid';

export const GENERATED_BACKDROPS = {
  light: '/src/assets/images/liquid_backdrop_light_1794797394370.jpg',
  dark: '/src/assets/images/liquid_backdrop_dark_1794797393989.jpg',
};

export const AVATAR_GALLERY = [
  {
    id: 'prism',
    label: 'Prisma Óptico',
    url: '/src/assets/images/avatar_crystal_prism_1794797394484.jpg',
  },
  {
    id: 'lens',
    label: 'Lente Cromática',
    url: '/src/assets/images/avatar_optical_lens_1794797395693.jpg',
  },
  {
    id: 'svg-aurora',
    label: 'Esfera Cobalto',
    url: `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><defs><linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#38bdf8"/><stop offset="50%" stop-color="#0284c7"/><stop offset="100%" stop-color="#1e293b"/></linearGradient></defs><rect width="120" height="120" rx="28" fill="url(#g1)"/><circle cx="48" cy="44" r="24" fill="rgba(255,255,255,0.24)"/><path d="M22 86 Q60 54 98 86" stroke="rgba(255,255,255,0.65)" stroke-width="3" fill="none"/></svg>`
    )}`,
  },
  {
    id: 'svg-amber',
    label: 'Cuarzo Solar',
    url: `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><defs><linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#fbbf24"/><stop offset="55%" stop-color="#d97706"/><stop offset="100%" stop-color="#1e293b"/></linearGradient></defs><rect width="120" height="120" rx="28" fill="url(#g2)"/><polygon points="60,22 92,60 60,98 28,60" fill="rgba(255,255,255,0.22)" stroke="rgba(255,255,255,0.7)" stroke-width="2"/></svg>`
    )}`,
  },
  {
    id: 'svg-emerald',
    label: 'Lámina Jade',
    url: `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><defs><linearGradient id="g3" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#34d399"/><stop offset="55%" stop-color="#059669"/><stop offset="100%" stop-color="#0f172a"/></linearGradient></defs><rect width="120" height="120" rx="28" fill="url(#g3)"/><rect x="30" y="30" width="60" height="60" rx="18" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.68)" stroke-width="2"/></svg>`
    )}`,
  },
];

export const DEFAULT_GENERAL_SETTINGS: GeneralSettings = {
  theme: 'dark',
  accentColor: '#0ea5e9',
  backgroundMode: 'optical-waves',
  customBackgroundDataUrl: '',
  fontFamily: 'plus-jakarta',
  fontSize: 15,
  density: 'comfortable',
  performanceMode: 'auto',
};

export function createSeedData(): {
  bots: Bot[];
  conversations: Conversation[];
  messages: ChatMessage[];
  memories: MemoryItem[];
} {
  const now = Date.now();

  const bots: Bot[] = [
    {
      id: 'bot_architect',
      name: 'Aria · Arquitecta Técnica',
      description:
        'Especialista en arquitectura de software, diseño de sistemas, código limpio y análisis de datos.',
      avatar: AVATAR_GALLERY[0].url,
      systemPrompt:
        'Eres Aria, una arquitecta técnica senior. Responde con precisión, estructura clara, ejemplos de código verificables y fórmulas en LaTeX cuando aporten claridad.',
      greeting:
        'Hola. Soy Aria. Configura tu API en Ajustes para comenzar a conversar con respuestas reales en streaming, análisis de imágenes y memoria aislada por chat.',
      modelId: '',
      supportsVision: true,
      useCustomParams: false,
      temperature: 0.5,
      topP: 0.95,
      maxTokens: 2048,
      createdAt: now - 86400000,
      updatedAt: now - 86400000,
    },
    {
      id: 'bot_curator',
      name: 'Soren · Estratega Editorial',
      description:
        'Compañero de escritura, síntesis de documentos, investigación y claridad conceptual.',
      avatar: AVATAR_GALLERY[1].url,
      systemPrompt:
        'Eres Soren, un editor y estratega de investigación. Mantén un tono sereno, analítico y directo. Evita rellenos innecesarios.',
      greeting:
        'Bienvenido. Cada conversación conmigo mantiene su propia memoria independiente, sin mezclar contextos entre sesiones.',
      modelId: '',
      supportsVision: true,
      useCustomParams: true,
      temperature: 0.75,
      topP: 0.92,
      maxTokens: 2048,
      createdAt: now - 43200000,
      updatedAt: now - 43200000,
    },
  ];

  const conversations: Conversation[] = [
    {
      id: 'conv_welcome_1',
      botId: 'bot_architect',
      title: 'Espacio de Arquitectura & Código',
      archived: false,
      memoryEnabled: true,
      summary: '',
      summaryUpToMessageId: null,
      createdAt: now - 3600000,
      updatedAt: now - 3500000,
    },
    {
      id: 'conv_editorial_2',
      botId: 'bot_curator',
      title: 'Notas de Investigación Aisladas',
      archived: false,
      memoryEnabled: true,
      summary: '',
      summaryUpToMessageId: null,
      createdAt: now - 1800000,
      updatedAt: now - 1800000,
    },
  ];

  const messages: ChatMessage[] = [
    {
      id: 'msg_seed_1',
      conversationId: 'conv_welcome_1',
      role: 'assistant',
      content:
        'Hola. Soy **Aria**, tu asistente técnica en **LIQUID AI**.\n\n- Cada conversación tiene su propia **memoria aislada** (recuerdos manuales, mensajes fijados y resumen progresivo).\n- Puedes ajustar la óptica de la interfaz en tiempo real desde **Glass Engine**.\n- Para recibir respuestas reales de un modelo, introduce tu `API Base URL`, `Model ID` y `API Key` en **Configuración**.\n\nEjemplo de bloque de código y fórmula soportados:\n\n```ts\nexport function refractionIndex(n1: number, n2: number, theta1: number) {\n  return Math.asin((n1 / n2) * Math.sin(theta1));\n}\n```\n\n$$n_1 \\sin(\\theta_1) = n_2 \\sin(\\theta_2)$$',
      createdAt: now - 3550000,
    },
    {
      id: 'msg_seed_2',
      conversationId: 'conv_editorial_2',
      role: 'assistant',
      content:
        'Hola. Soy **Soren**. Esta sesión está completamente aislada de otras conversaciones: cualquier recuerdo que fijes aquí permanecerá únicamente en este hilo.',
      createdAt: now - 1800000,
    },
  ];

  const memories: MemoryItem[] = [
    {
      id: 'mem_seed_1',
      conversationId: 'conv_welcome_1',
      content: 'Preferencia de respuestas técnicas en español con ejemplos TypeScript.',
      importance: 'high',
      source: 'manual',
      createdAt: now - 3500000,
    },
  ];

  return { bots, conversations, messages, memories };
}
