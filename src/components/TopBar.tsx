import React from 'react';
import {
  Brain,
  Menu,
  Moon,
  PanelLeftOpen,
  Settings,
  Sun,
} from 'lucide-react';
import type { ApiConfig, Bot, Conversation, ThemeMode } from '../types/liquid';
import { LiquidGlassSurface } from './LiquidGlassSurface';

interface TopBarProps {
  collapsedDesktop: boolean;
  onExpandDesktop: () => void;
  onOpenMobileSidebar: () => void;
  activeBot: Bot | null;
  activeConversation: Conversation | null;
  apiConfig: ApiConfig;
  memoryCount: number;
  memoryDrawerOpen: boolean;
  onToggleMemoryDrawer: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onOpenSettings: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  collapsedDesktop,
  onExpandDesktop,
  onOpenMobileSidebar,
  activeBot,
  activeConversation,
  apiConfig,
  memoryCount,
  memoryDrawerOpen,
  onToggleMemoryDrawer,
  theme,
  onToggleTheme,
  onOpenSettings,
}) => {
  const effectiveModel =
    activeBot?.modelId?.trim() || apiConfig.modelId.trim() || 'Sin modelo';
  const isLocalUrl =
    apiConfig.baseUrl.includes('localhost') || apiConfig.baseUrl.includes('127.0.0.1');
  const isApiReady =
    Boolean(apiConfig.baseUrl.trim()) &&
    Boolean(effectiveModel !== 'Sin modelo') &&
    (Boolean(apiConfig.apiKey.trim()) || isLocalUrl);

  return (
    <LiquidGlassSurface
      as="header"
      variant="panel"
      className="flex min-h-[58px] shrink-0 items-center justify-between gap-3 px-3.5 py-2 text-slate-900 dark:text-slate-100"
    >
      {/* Left: Sidebar Toggle + Active Bot & Conversation */}
      <div className="flex min-w-0 items-center gap-2.5">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          aria-label="Abrir menú lateral"
          className="liquid-glass-button inline-flex lg:hidden min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl"
        >
          <Menu className="h-5 w-5" />
        </button>

        {collapsedDesktop && (
          <button
            type="button"
            onClick={onExpandDesktop}
            aria-label="Mostrar barra lateral"
            title="Mostrar barra lateral"
            className="liquid-glass-button hidden lg:inline-flex min-h-[40px] min-w-[40px] shrink-0 items-center justify-center rounded-xl"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </button>
        )}

        {activeBot && (
          <img
            src={activeBot.avatar}
            alt={activeBot.name}
            referrerPolicy="no-referrer"
            className="h-9 w-9 shrink-0 rounded-xl object-cover ring-1 ring-white/30"
          />
        )}

        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold leading-tight sm:text-base">
            {activeConversation?.title || activeBot?.name || 'LIQUID AI'}
          </h1>
          <div className="flex items-center gap-1.5 truncate text-xs text-slate-600 dark:text-slate-300">
            <span className="truncate">{activeBot?.name ?? 'Sin bot'}</span>
            <span aria-hidden="true">·</span>
            <span className="truncate font-mono text-[11px]">{effectiveModel}</span>
          </div>
        </div>
      </div>

      {/* Right: Connection State + Memory Inspector + Theme */}
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={onOpenSettings}
          title={
            isApiReady
              ? 'Conexión API configurada'
              : 'Configura tu API Key y URL para chatear'
          }
          className="liquid-glass-button hidden sm:inline-flex min-h-[40px] items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium whitespace-nowrap"
        >
          <Settings className="h-3.5 w-3.5" />
          <span>{isApiReady ? 'API lista' : 'Configurar API'}</span>
        </button>

        {activeConversation && (
          <button
            type="button"
            onClick={onToggleMemoryDrawer}
            aria-pressed={memoryDrawerOpen}
            aria-label={`Memoria de conversación (${memoryCount} recuerdos)`}
            className={`liquid-glass-button inline-flex min-h-[44px] lg:min-h-[40px] items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium whitespace-nowrap ${
              memoryDrawerOpen ? 'ring-2 ring-sky-500/70' : ''
            }`}
          >
            <Brain className="h-4 w-4" />
            <span className="hidden sm:inline">Memoria</span>
            <span className="tabular-nums text-[11px] opacity-80">
              {memoryCount}
            </span>
          </button>
        )}

        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
          title={theme === 'dark' ? 'Tema claro' : 'Tema oscuro'}
          className="liquid-glass-button inline-flex min-h-[44px] min-w-[44px] lg:min-h-[40px] lg:min-w-[40px] items-center justify-center rounded-xl"
        >
          {theme === 'dark' ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </button>
      </div>
    </LiquidGlassSurface>
  );
};
