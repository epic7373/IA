import type { ApiConfig, Bot } from '../types/liquid';
import type { OpenAiMessage } from './memoryEngine';

export const DEFAULT_API_CONFIG: ApiConfig = {
  apiKey: '',
  baseUrl: 'https://api.openai.com/v1',
  chatEndpoint: '/chat/completions',
  modelId: 'gpt-4o-mini',
  globalSystemPrompt: '',
  supportsVision: true,
  supportsStreaming: true,
  supportsFrequencyPenalty: false,
  temperature: 0.7,
  topP: 0.95,
  maxTokens: 2048,
  frequencyPenalty: 0,
  customParamsJson: '',
};

export interface ProviderPreset {
  id: string;
  label: string;
  baseUrl: string;
  chatEndpoint: string;
  suggestedModel: string;
  supportsVision: boolean;
  supportsFrequencyPenalty: boolean;
}

export const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    id: 'openai',
    label: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    chatEndpoint: '/chat/completions',
    suggestedModel: 'gpt-4o-mini',
    supportsVision: true,
    supportsFrequencyPenalty: true,
  },
  {
    id: 'openrouter',
    label: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    chatEndpoint: '/chat/completions',
    suggestedModel: 'openai/gpt-4o-mini',
    supportsVision: true,
    supportsFrequencyPenalty: true,
  },
  {
    id: 'gemini-openai',
    label: 'Google Gemini (OpenAI Compat)',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    chatEndpoint: '/chat/completions',
    suggestedModel: 'gemini-2.5-flash',
    supportsVision: true,
    supportsFrequencyPenalty: false,
  },
  {
    id: 'groq',
    label: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    chatEndpoint: '/chat/completions',
    suggestedModel: 'llama-3.3-70b-versatile',
    supportsVision: false,
    supportsFrequencyPenalty: true,
  },
  {
    id: 'ollama',
    label: 'Ollama Local',
    baseUrl: 'http://localhost:11434/v1',
    chatEndpoint: '/chat/completions',
    suggestedModel: 'llama3.2',
    supportsVision: false,
    supportsFrequencyPenalty: false,
  },
];

export function normalizeChatEndpoint(baseUrl: string, chatEndpoint: string): string {
  const cleanBase = baseUrl.trim().replace(/\/+$/, '');
  const cleanEp = chatEndpoint.trim();
  if (!cleanBase) return '';
  if (!cleanEp) return `${cleanBase}/chat/completions`;
  if (cleanEp.startsWith('http://') || cleanEp.startsWith('https://')) {
    return cleanEp;
  }
  const normalizedEp = cleanEp.startsWith('/') ? cleanEp : `/${cleanEp}`;
  if (cleanBase.endsWith(normalizedEp)) {
    return cleanBase;
  }
  return `${cleanBase}${normalizedEp}`;
}

export function buildRequestPayload(params: {
  apiConfig: ApiConfig;
  bot: Bot;
  messages: OpenAiMessage[];
  stream: boolean;
}): { payload: Record<string, unknown>; parseWarning?: string } {
  const { apiConfig, bot, messages, stream } = params;
  const model = bot.modelId.trim() || apiConfig.modelId.trim();
  const temperature = bot.useCustomParams ? bot.temperature : apiConfig.temperature;
  const topP = bot.useCustomParams ? bot.topP : apiConfig.topP;
  const maxTokens = bot.useCustomParams ? bot.maxTokens : apiConfig.maxTokens;

  const payload: Record<string, unknown> = {
    model,
    messages,
    stream,
    temperature,
    top_p: topP,
    max_tokens: maxTokens,
  };

  if (apiConfig.supportsFrequencyPenalty) {
    payload.frequency_penalty = apiConfig.frequencyPenalty;
  }

  let parseWarning: string | undefined;
  if (apiConfig.customParamsJson.trim()) {
    try {
      const parsed = JSON.parse(apiConfig.customParamsJson);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        Object.assign(payload, parsed);
      } else {
        parseWarning = 'Los parámetros JSON personalizados deben ser un objeto válido.';
      }
    } catch {
      parseWarning = 'Los parámetros JSON personalizados tienen sintaxis inválida y se omitieron.';
    }
  }

  return { payload, parseWarning };
}

export interface ParsedSseResult {
  deltaText: string;
  done: boolean;
  errorMessage?: string;
}

export function parseSseLine(rawLine: string): ParsedSseResult {
  const line = rawLine.trim();
  if (!line || line.startsWith(':')) {
    return { deltaText: '', done: false };
  }

  const dataStr = line.startsWith('data:') ? line.slice(5).trim() : line;
  if (dataStr === '[DONE]') {
    return { deltaText: '', done: true };
  }

  try {
    const json = JSON.parse(dataStr);
    if (json?.error?.message) {
      return { deltaText: '', done: false, errorMessage: String(json.error.message) };
    }
    const choice = json?.choices?.[0];
    const delta = choice?.delta;
    const text =
      (typeof delta?.content === 'string' && delta.content) ||
      (typeof choice?.message?.content === 'string' && choice.message.content) ||
      (typeof choice?.text === 'string' && choice.text) ||
      '';
    return { deltaText: text, done: false };
  } catch {
    return { deltaText: '', done: false };
  }
}

export function formatApiError(status: number, bodyText: string): string {
  let detail = '';
  try {
    const parsed = JSON.parse(bodyText);
    detail =
      parsed?.error?.message ||
      parsed?.message ||
      parsed?.detail ||
      (typeof parsed?.error === 'string' ? parsed.error : '');
  } catch {
    detail = bodyText.slice(0, 220).trim();
  }

  if (status === 401 || status === 403) {
    return `Error de autenticación (${status}): Verifica que tu API Key sea válida y tenga permisos para este modelo.${detail ? ` Detalle: ${detail}` : ''}`;
  }
  if (status === 404) {
    return `Endpoint o modelo no encontrado (404): Revisa la URL base, la ruta del endpoint y el Model ID.${detail ? ` Detalle: ${detail}` : ''}`;
  }
  if (status === 429) {
    return `Límite de peticiones excedido (429): Tu proveedor ha limitado temporalmente las solicitudes.${detail ? ` Detalle: ${detail}` : ''}`;
  }
  if (status === 400 || status === 422) {
    return `Solicitud rechazada por el proveedor (${status}): Es posible que algún parámetro (como imágenes o frequency_penalty) no sea compatible con el modelo seleccionado.${detail ? ` Detalle: ${detail}` : ''}`;
  }
  if (status >= 500) {
    return `Error interno del proveedor (${status}): El servidor de la API presentó un fallo temporal.${detail ? ` Detalle: ${detail}` : ''}`;
  }
  return `Error HTTP ${status}${detail ? `: ${detail}` : ''}`;
}

export async function sendChatCompletion(params: {
  apiConfig: ApiConfig;
  bot: Bot;
  messages: OpenAiMessage[];
  signal: AbortSignal;
  onToken: (accumulatedText: string) => void;
}): Promise<{ content: string; warning?: string }> {
  const { apiConfig, bot, messages, signal, onToken } = params;
  const endpoint = normalizeChatEndpoint(apiConfig.baseUrl, apiConfig.chatEndpoint);

  if (!endpoint) {
    throw new Error('Falta configurar la URL base de la API en Configuración.');
  }
  const effectiveModel = bot.modelId.trim() || apiConfig.modelId.trim();
  if (!effectiveModel) {
    throw new Error('Falta especificar un Model ID en Configuración o en el bot.');
  }
  const isLocalEndpoint =
    endpoint.includes('localhost') || endpoint.includes('127.0.0.1');
  if (!apiConfig.apiKey.trim() && !isLocalEndpoint) {
    throw new Error(
      'No hay una API Key configurada. Agrega tu clave en Configuración para conectar con el modelo.'
    );
  }

  const { payload, parseWarning } = buildRequestPayload({
    apiConfig,
    bot,
    messages,
    stream: apiConfig.supportsStreaming,
  });

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (apiConfig.apiKey.trim()) {
    headers['Authorization'] = `Bearer ${apiConfig.apiKey.trim()}`;
  }

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal,
    });
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') {
      throw err;
    }
    throw new Error(
      `No se pudo conectar con ${endpoint}. Verifica tu conexión, que la URL sea correcta o que el proveedor permita CORS desde el navegador.`
    );
  }

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new Error(formatApiError(response.status, errorBody));
  }

  const contentType = response.headers.get('content-type') || '';

  // Handle non-streaming JSON responses cleanly (even if stream was requested)
  if (!apiConfig.supportsStreaming || contentType.includes('application/json')) {
    const data = await response.json();
    const content =
      data?.choices?.[0]?.message?.content ??
      data?.choices?.[0]?.text ??
      data?.message?.content ??
      '';
    if (typeof content !== 'string') {
      throw new Error('El proveedor devolvió un formato de respuesta inesperado.');
    }
    onToken(content);
    return { content, warning: parseWarning };
  }

  if (!response.body) {
    throw new Error('El navegador no recibió un stream legible desde la API.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  let accumulated = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const parsed = parseSseLine(line);
      if (parsed.errorMessage) {
        throw new Error(`Error en el stream del proveedor: ${parsed.errorMessage}`);
      }
      if (parsed.deltaText) {
        accumulated += parsed.deltaText;
        onToken(accumulated);
      }
      if (parsed.done) {
        return { content: accumulated, warning: parseWarning };
      }
    }
  }

  if (buffer.trim()) {
    const parsed = parseSseLine(buffer);
    if (parsed.deltaText) {
      accumulated += parsed.deltaText;
      onToken(accumulated);
    }
  }

  if (!accumulated) {
    throw new Error(
      'La conexión se completó pero el modelo no devolvió contenido. Verifica el Model ID y los parámetros.'
    );
  }

  return { content: accumulated, warning: parseWarning };
}

export async function testApiConnection(
  apiConfig: ApiConfig
): Promise<{ ok: boolean; message: string; latencyMs: number }> {
  const start = performance.now();
  const endpoint = normalizeChatEndpoint(apiConfig.baseUrl, apiConfig.chatEndpoint);
  if (!endpoint) {
    return { ok: false, message: 'Introduce una URL base válida.', latencyMs: 0 };
  }
  if (!apiConfig.modelId.trim()) {
    return { ok: false, message: 'Introduce un Model ID.', latencyMs: 0 };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (apiConfig.apiKey.trim()) {
      headers['Authorization'] = `Bearer ${apiConfig.apiKey.trim()}`;
    }

    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        model: apiConfig.modelId.trim(),
        messages: [{ role: 'user', content: 'Responde únicamente: OK' }],
        max_tokens: 12,
        temperature: 0,
        stream: false,
      }),
    });
    const latencyMs = Math.round(performance.now() - start);

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return { ok: false, message: formatApiError(res.status, text), latencyMs };
    }

    const json = await res.json();
    const reply = json?.choices?.[0]?.message?.content ?? json?.choices?.[0]?.text;
    if (typeof reply === 'string') {
      return {
        ok: true,
        message: `Conexión verificada con ${apiConfig.modelId} (${latencyMs} ms). Respuesta: "${reply.trim().slice(0, 60)}"`,
        latencyMs,
      };
    }
    return {
      ok: true,
      message: `Endpoint accesible (${latencyMs} ms), aunque el cuerpo no incluyó choices[0].message.content.`,
      latencyMs,
    };
  } catch (err) {
    const latencyMs = Math.round(performance.now() - start);
    if ((err as Error)?.name === 'AbortError') {
      return {
        ok: false,
        message: 'Tiempo de espera agotado (15s) al intentar conectar con el proveedor.',
        latencyMs,
      };
    }
    return {
      ok: false,
      message: `Fallo de red o CORS al conectar con ${endpoint}.`,
      latencyMs,
    };
  } finally {
    clearTimeout(timeout);
  }
}
