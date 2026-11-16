import React, { useState } from 'react';
import {
  Archive,
  ArchiveRestore,
  Bot as BotIcon,
  Check,
  Copy,
  Edit3,
  MessageSquarePlus,
  MoreHorizontal,
  PanelLeftClose,
  Search,
  Settings,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import type { Bot, Conversation } from '../types/liquid';
import { LiquidGlassSurface } from './LiquidGlassSurface';

interface SidebarProps {
  open: boolean;
  onCloseMobile: () => void;
  collapsedDesktop: boolean;
  onToggleCollapseDesktop: () => void;
  bots: Bot[];
  activeBotId: string;
  onSelectBot: (botId: string) => void;
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (convId: string) => void;
  onNewChat: (botId?: string) => void;
  onRenameConversation: (convId: string, newTitle: string) => void;
  onDuplicateConversation: (convId: string) => void;
  onToggleArchiveConversation: (convId: string) => void;
  onDeleteConversation: (convId: string) => void;
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  showArchived: boolean;
  onToggleShowArchived: () => void;
  onOpenBotsModal: () => void;
  onOpenGlassEngine: () => void;
  onOpenSettings: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  open,
  onCloseMobile,
  collapsedDesktop,
  onToggleCollapseDesktop,
  bots,
  activeBotId,
  onSelectBot,
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onRenameConversation,
  onDuplicateConversation,
  onToggleArchiveConversation,
  onDeleteConversation,
  searchQuery,
  onSearchQueryChange,
  showArchived,
  onToggleShowArchived,
  onOpenBotsModal,
  onOpenGlassEngine,
  onOpenSettings,
}) => {
  const [menuConvId, setMenuConvId] = useState<string | null>(null);
  const [editingConvId, setEditingConvId] = useState<string | null>(null);
  const [editTitleValue, setEditTitleValue] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const botMap = new Map(bots.map((b) => [b.id, b]));

  const startRename = (conv: Conversation) => {
    setMenuConvId(null);
    setEditingConvId(conv.id);
    setEditTitleValue(conv.title);
  };

  const commitRename = (convId: string) => {
    const trimmed = editTitleValue.trim();
    if (trimmed) {
      onRenameConversation(convId, trimmed);
    }
    setEditingConvId(null);
  };

  const sidebarContent = (
    <LiquidGlassSurface
      as="aside"
      variant="panel"
      className="flex h-full w-full flex-col overflow-hidden p-3.5 text-slate-900 dark:text-slate-100"
    >
      {/* Brand & Collapse Header */}
      <div className="flex items-center justify-between gap-2 px-1 pb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
            style={{
              background:
                'linear-gradient(135deg, color-mix(in srgb, var(--lg-accent) 85%, white 20%), var(--lg-accent))',
            }}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 3L4 9v6l8 6 8-6V9l-8-6z" />
              <path d="M12 3v18M4 9l8 6 8-6" opacity="0.65" />
            </svg>
          </div>
          <span className="truncate text-base font-bold tracking-tight whitespace-nowrap">
            LIQUID AI
          </span>
        </div>

        <button
          type="button"
          onClick={onToggleCollapseDesktop}
          aria-label="Contraer barra lateral"
          title="Contraer barra lateral"
          className="liquid-glass-button hidden lg:inline-flex min-h-[38px] min-w-[38px] items-center justify-center rounded-xl text-slate-700 dark:text-slate-200"
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Cerrar menú lateral"
          className="liquid-glass-button inline-flex lg:hidden min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-slate-700 dark:text-slate-200"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Primary Action: New Chat + Bot Selector */}
      <div className="space-y-2 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              onNewChat();
              onCloseMobile();
            }}
            className="liquid-glass-button liquid-glass-button-accent flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold whitespace-nowrap"
          >
            <MessageSquarePlus className="h-4 w-4 shrink-0" />
            <span>Nuevo chat</span>
          </button>
        </div>

        <div>
          <label htmlFor="sidebar-bot-select" className="sr-only">
            Bot activo para nuevos chats
          </label>
          <select
            id="sidebar-bot-select"
            value={activeBotId}
            onChange={(e) => onSelectBot(e.target.value)}
            className="w-full min-h-[40px] rounded-xl border border-slate-300/60 bg-white/50 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-white/15 dark:bg-slate-900/55 dark:text-slate-100"
          >
            {bots.map((b) => (
              <option key={b.id} value={b.id} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">
                Bot: {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* Global Search */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="Buscar chats o mensajes..."
            aria-label="Buscar conversaciones por título o contenido"
            className="w-full min-h-[40px] rounded-xl border border-slate-300/60 bg-white/45 py-2 pl-9 pr-8 text-sm text-slate-900 placeholder:text-slate-500 outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-white/15 dark:bg-slate-900/45 dark:text-slate-100 dark:placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchQueryChange('')}
              aria-label="Limpiar búsqueda"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs: Active vs Archived */}
      <div className="mb-2 flex items-center justify-between gap-2 px-1">
        <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
          {showArchived ? 'Archivadas' : 'Conversaciones'} ({conversations.length})
        </span>
        <button
          type="button"
          onClick={onToggleShowArchived}
          className="rounded-lg px-2 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-900/10 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-100"
        >
          {showArchived ? 'Ver activas' : 'Archivadas'}
        </button>
      </div>

      {/* Conversation List */}
      <nav
        aria-label="Lista de conversaciones"
        className="liquid-scroll flex-1 space-y-1.5 overflow-y-auto pr-1"
      >
        {conversations.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300/60 p-4 text-center text-xs text-slate-500 dark:border-white/15 dark:text-slate-400">
            {searchQuery
              ? 'No se encontraron conversaciones que coincidan.'
              : showArchived
                ? 'No tienes conversaciones archivadas.'
                : 'Sin conversaciones activas. Inicia un nuevo chat.'}
          </div>
        ) : (
          conversations.map((conv) => {
            const bot = botMap.get(conv.botId);
            const isActive = conv.id === activeConversationId;
            const isEditing = editingConvId === conv.id;
            const isMenuOpen = menuConvId === conv.id;
            const isConfirmDelete = confirmDeleteId === conv.id;

            return (
              <div
                key={conv.id}
                className={`group relative rounded-xl transition-colors ${
                  isActive
                    ? 'bg-sky-500/16 ring-1 ring-sky-500/35 dark:bg-sky-400/15 dark:ring-sky-400/35'
                    : 'hover:bg-slate-900/6 dark:hover:bg-white/8'
                }`}
              >
                {isEditing ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      commitRename(conv.id);
                    }}
                    className="flex items-center gap-1.5 p-2"
                  >
                    <input
                      type="text"
                      value={editTitleValue}
                      onChange={(e) => setEditTitleValue(e.target.value)}
                      autoFocus
                      aria-label="Nuevo título de conversación"
                      className="min-w-0 flex-1 rounded-lg border border-sky-500/50 bg-white/80 px-2.5 py-1.5 text-xs text-slate-900 outline-none dark:bg-slate-900/80 dark:text-slate-100"
                    />
                    <button
                      type="submit"
                      aria-label="Guardar nombre"
                      className="inline-flex min-h-[32px] min-w-[32px] items-center justify-center rounded-lg bg-sky-600 text-white"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingConvId(null)}
                      aria-label="Cancelar edición"
                      className="inline-flex min-h-[32px] min-w-[32px] items-center justify-center rounded-lg text-slate-500 hover:bg-slate-900/10 dark:text-slate-300"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </form>
                ) : isConfirmDelete ? (
                  <div className="flex items-center justify-between gap-2 p-2.5 text-xs">
                    <span className="font-medium text-rose-600 dark:text-rose-400">
                      ¿Eliminar chat?
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteConversation(conv.id);
                          setConfirmDeleteId(null);
                        }}
                        className="rounded-lg bg-rose-600 px-2.5 py-1 font-medium text-white hover:bg-rose-700"
                      >
                        Eliminar
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="rounded-lg px-2 py-1 text-slate-600 hover:bg-slate-900/10 dark:text-slate-300"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-2">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectConversation(conv.id);
                        onCloseMobile();
                      }}
                      className="flex min-w-0 flex-1 items-center gap-2.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded-lg"
                    >
                      {bot?.avatar ? (
                        <img
                          src={bot.avatar}
                          alt={bot.name}
                          referrerPolicy="no-referrer"
                          className="h-8 w-8 shrink-0 rounded-xl object-cover ring-1 ring-white/30"
                        />
                      ) : (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-500/20">
                          <BotIcon className="h-4 w-4" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium leading-snug">
                          {conv.title}
                        </div>
                        <div className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                          {bot?.name ?? 'Bot'}
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMenuConvId(isMenuOpen ? null : conv.id)}
                      aria-label={`Opciones para ${conv.title}`}
                      aria-expanded={isMenuOpen}
                      className="inline-flex min-h-[36px] min-w-[36px] shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-900/10 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {/* Context Menu */}
                {isMenuOpen && (
                  <div
                    role="menu"
                    className="liquid-glass relative z-20 mx-2 mb-2 rounded-xl p-1.5 text-xs shadow-lg"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => startRename(conv)}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left hover:bg-slate-900/10 dark:hover:bg-white/10"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      <span>Renombrar</span>
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenuConvId(null);
                        onDuplicateConversation(conv.id);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left hover:bg-slate-900/10 dark:hover:bg-white/10"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      <span>Duplicar</span>
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenuConvId(null);
                        onToggleArchiveConversation(conv.id);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left hover:bg-slate-900/10 dark:hover:bg-white/10"
                    >
                      {conv.archived ? (
                        <>
                          <ArchiveRestore className="h-3.5 w-3.5" />
                          <span>Desarchivar</span>
                        </>
                      ) : (
                        <>
                          <Archive className="h-3.5 w-3.5" />
                          <span>Archivar</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenuConvId(null);
                        setConfirmDeleteId(conv.id);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-rose-600 hover:bg-rose-500/10 dark:text-rose-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Eliminar</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </nav>

      {/* Bottom Workspace Navigation */}
      <div className="mt-3 grid grid-cols-3 gap-1.5 border-t border-slate-300/40 pt-3 dark:border-white/10">
        <button
          type="button"
          onClick={() => {
            onOpenBotsModal();
            onCloseMobile();
          }}
          className="liquid-glass-button flex min-h-[44px] flex-col items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-medium"
        >
          <BotIcon className="h-4 w-4" />
          <span className="truncate">Bots</span>
        </button>
        <button
          type="button"
          onClick={() => {
            onOpenGlassEngine();
            onCloseMobile();
          }}
          className="liquid-glass-button flex min-h-[44px] flex-col items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-medium"
        >
          <Sparkles className="h-4 w-4" />
          <span className="truncate">Glass Engine</span>
        </button>
        <button
          type="button"
          onClick={() => {
            onOpenSettings();
            onCloseMobile();
          }}
          className="liquid-glass-button flex min-h-[44px] flex-col items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-[11px] font-medium"
        >
          <Settings className="h-4 w-4" />
          <span className="truncate">Ajustes</span>
        </button>
      </div>
    </LiquidGlassSurface>
  );

  return (
    <>
      {/* Desktop Collapsible Sidebar */}
      <div
        className={`hidden lg:block shrink-0 transition-all duration-300 ${
          collapsedDesktop ? 'w-0 overflow-hidden opacity-0 pointer-events-none' : 'w-[290px]'
        }`}
      >
        {sidebarContent}
      </div>

      {/* Mobile Drawer Overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 h-full w-[85vw] max-w-[320px] p-2.5">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
