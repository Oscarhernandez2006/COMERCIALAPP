import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Send, RefreshCw, X, MessageSquare, CheckCheck, Check, Paperclip, FileText, Download, Loader2, Search, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { PageTitle } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { adminApi, apiErrorMessage } from '@/lib/admin-api';
import { getEcho } from '@/lib/echo';
import { cn } from '@/lib/utils';
import { VoiceRecorder } from '@/components/chat/VoiceRecorder';

// Patrón doodle estilo WhatsApp Web (sutil) como fondo del área de mensajes.
const WA_DOODLE =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='90' height='90' viewBox='0 0 90 90'><g fill='%23d1d7db' fill-opacity='0.35'><circle cx='10' cy='10' r='1.2'/><circle cx='45' cy='25' r='1'/><circle cx='75' cy='12' r='1.4'/><circle cx='20' cy='55' r='1'/><circle cx='60' cy='65' r='1.3'/><circle cx='80' cy='80' r='1'/></g></svg>\")";

type ConversationStatus = 'bot' | 'waiting_human' | 'human' | 'closed';

type ConversationListItem = {
  id: number;
  session_id: string;
  status: ConversationStatus;
  client_in_erp: boolean;
  started_at: string;
  last_message_at: string | null;
  closed_at: string | null;
  messages_count: number;
  client: { id: number; document_number: string; name: string; phone: string | null; email: string | null; city: string | null } | null;
  seller: { id: number; name: string; phone: string | null } | null;
  last_message: { sender: string; body: string; created_at: string } | null;
  unread_count?: number;
};

type MessageRow = {
  id: number;
  sender: 'client' | 'bot' | 'seller' | 'system';
  sender_id: number | null;
  type?: 'text' | 'image' | 'file' | 'audio' | null;
  body: string;
  attachment_url?: string | null;
  attachment_name?: string | null;
  attachment_mime?: string | null;
  attachment_size?: number | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  read_at?: string | null;
};

type ChatDetail = {
  conversation: ConversationListItem;
  messages: MessageRow[];
};

const statusStyles: Record<ConversationStatus, { label: string; color: string; dot: string }> = {
  bot: { label: 'Bot', color: 'bg-sky-100 text-sky-700', dot: 'bg-sky-500' },
  waiting_human: { label: 'En espera', color: 'bg-amber-100 text-amber-800', dot: 'bg-amber-500' },
  human: { label: 'Activa', color: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-500' },
  closed: { label: 'Cerrada', color: 'bg-neutral-200 text-neutral-600', dot: 'bg-neutral-400' },
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p.charAt(0).toUpperCase()).join('') || '?';
}

function avatarColor(seed: string | number): string {
  const palette = ['#00a884', '#06cf9c', '#0a7e6d', '#5f4caf', '#df3079', '#f29900', '#1f6feb', '#d6336c'];
  let h = 0;
  const s = String(seed);
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}

function formatChatTime(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return d.toLocaleDateString('es-CO', { weekday: 'short' });
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

export default function AdminChats() {
  const [statusFilter, setStatusFilter] = useState<ConversationStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const prevUnreadRef = useRef<number>(0);

  const playNotify = useCallback(() => {
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = 660;
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
      o.connect(g).connect(ctx.destination);
      o.start();
      o.stop(ctx.currentTime + 0.32);
    } catch { /* noop */ }
  }, []);

  const listQuery = useQuery({
    queryKey: ['admin', 'chats', statusFilter, search],
    queryFn: async () => {
      const { data } = await adminApi.get<{ data: ConversationListItem[] }>('/admin/chats', {
        params: {
          status: statusFilter === 'all' ? undefined : statusFilter,
          q: search || undefined,
        },
      });
      return data.data;
    },
    refetchInterval: 4000,
    refetchOnWindowFocus: true,
  });

  // Total no-leídos (excluyendo el chat ya abierto) → dispara sonido cuando sube
  useEffect(() => {
    const list = listQuery.data ?? [];
    const total = list.reduce((acc, c) => acc + (c.id === selectedId ? 0 : c.unread_count ?? 0), 0);
    if (total > prevUnreadRef.current) {
      playNotify();
      try {
        document.title = `(${total}) Conversaciones · Admin`;
      } catch { /* noop */ }
    } else if (total === 0) {
      try { document.title = 'Conversaciones · Admin'; } catch { /* noop */ }
    }
    prevUnreadRef.current = total;
  }, [listQuery.data, selectedId, playNotify]);

  return (
    <>
      <PageTitle
        title="Conversaciones"
        description="Bandeja de chats del asistente. Toma el control, responde y cierra cuando termines."
      />

      <div className="grid h-[calc(100dvh-176px)] min-h-0 overflow-hidden rounded-lg border border-neutral-200 shadow-sm lg:grid-cols-[380px_1fr]">
        {/* Sidebar tipo WhatsApp */}
        <aside className="flex min-h-0 flex-col border-r border-neutral-200 bg-white">
          {/* Header del sidebar */}
          <div className="flex items-center justify-between bg-[#f0f2f5] px-4 py-3">
            <h2 className="text-base font-semibold text-neutral-800">Chats</h2>
            <button
              onClick={() => listQuery.refetch()}
              className="grid size-9 place-items-center rounded-full text-neutral-600 hover:bg-neutral-200"
              title="Refrescar"
            >
              <RefreshCw className="size-4" />
            </button>
          </div>

          {/* Buscador */}
          <div className="bg-white px-3 py-2">
            <div className="flex items-center gap-2 rounded-lg bg-[#f0f2f5] px-3 py-1.5">
              <Search className="size-4 text-neutral-500" />
              <input
                placeholder="Buscar un chat o iniciar uno nuevo"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-neutral-500"
              />
            </div>
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap gap-1 border-b border-neutral-100 px-3 pb-2">
            {(['all', 'waiting_human', 'human', 'bot', 'closed'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  'rounded-full px-3 py-1 text-[12px] font-medium transition',
                  statusFilter === s
                    ? 'bg-[#d1f4cc] text-[#0a7e6d]'
                    : 'bg-[#f0f2f5] text-neutral-600 hover:bg-neutral-200',
                )}
              >
                {s === 'all' ? 'Todas' : statusStyles[s].label}
              </button>
            ))}
          </div>

          {/* Lista de conversaciones */}
          <div className="min-h-0 flex-1 overflow-y-auto">
            {listQuery.isLoading ? (
              <div className="p-4 text-sm text-neutral-500">Cargando…</div>
            ) : (listQuery.data ?? []).length === 0 ? (
              <div className="p-8 text-center text-sm text-neutral-500">
                <MessageSquare className="mx-auto mb-2 size-10 text-neutral-300" />
                No hay conversaciones todavía.
              </div>
            ) : (
              (listQuery.data ?? []).map((c) => (
                <ConversationItem
                  key={c.id}
                  conv={c}
                  active={selectedId === c.id}
                  onClick={() => setSelectedId(c.id)}
                />
              ))
            )}
          </div>
        </aside>

        {/* Panel del chat */}
        <section
          className="relative flex min-h-0 min-w-0 flex-col overflow-hidden bg-[#efeae2]"
          style={{ backgroundImage: WA_DOODLE }}
        >
          {selectedId ? (
            <ChatWindow conversationId={selectedId} onClose={() => setSelectedId(null)} />
          ) : (
            <div className="flex flex-1 items-center justify-center bg-[#f0f2f5] text-center text-neutral-500">
              <div className="max-w-md px-8">
                <MessageSquare className="mx-auto mb-4 size-20 text-neutral-300" />
                <h3 className="mb-2 text-2xl font-light text-neutral-700">Conversaciones del equipo</h3>
                <p className="text-sm">
                  Selecciona un chat de la izquierda para empezar a responder a tus clientes.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </>
  );
}

function ConversationItem({
  conv,
  active,
  onClick,
}: {
  conv: ConversationListItem;
  active: boolean;
  onClick: () => void;
}) {
  const name = conv.client?.name ?? 'Sin identificar';
  const last = conv.last_message;
  const unread = conv.unread_count ?? 0;
  const isClosed = conv.status === 'closed';
  const isWaiting = conv.status === 'waiting_human';
  const status = statusStyles[conv.status as ConversationStatus] ?? statusStyles.bot;

  let lastPreview = '';
  if (last) {
    const prefix = last.sender === 'seller' ? 'Tú: ' : last.sender === 'bot' ? '🤖 ' : '';
    lastPreview = prefix + last.body;
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 border-b border-neutral-100 px-3 py-3 text-left transition',
        active ? 'bg-[#f0f2f5]' : 'bg-white hover:bg-[#f5f6f6]',
      )}
    >
      {/* Avatar */}
      <div
        className="grid size-12 shrink-0 place-items-center rounded-full text-base font-semibold text-white"
        style={{ backgroundColor: avatarColor(conv.client?.id ?? conv.id) }}
      >
        {initials(name)}
      </div>

      {/* Texto */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <p className={cn('truncate text-[15px] font-medium', isClosed ? 'text-neutral-500' : 'text-neutral-900')}>
              {name}
            </p>
            <span
              className={cn(
                'inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                status.color,
              )}
              title={`Estado: ${status.label}`}
            >
              <span className={cn('size-1.5 rounded-full', status.dot)} />
              {status.label}
            </span>
          </div>
          <span
            className={cn(
              'shrink-0 text-[11px]',
              unread > 0 ? 'font-semibold text-[#00a884]' : 'text-neutral-500',
            )}
          >
            {formatChatTime(conv.last_message_at)}
          </span>
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <p className="flex-1 truncate text-[13px] text-neutral-500">
            {lastPreview || (
              <span className="italic text-neutral-400">Sin mensajes aún</span>
            )}
          </p>
          <div className="flex shrink-0 items-center gap-1.5">
            {isWaiting && (
              <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-amber-700">
                Espera
              </span>
            )}
            {!conv.client_in_erp && (
              <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-amber-600">
                Nuevo
              </span>
            )}
            {unread > 0 && (
              <span className="grid min-w-[20px] place-items-center rounded-full bg-[#00a884] px-1.5 py-0.5 text-[11px] font-bold text-white">
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

function ChatWindow({ conversationId, onClose }: { conversationId: number; onClose: () => void }) {
  const qc = useQueryClient();
  const [body, setBody] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const detailQuery = useQuery({
    queryKey: ['admin', 'chats', conversationId],
    queryFn: async () => (await adminApi.get<ChatDetail>(`/admin/chats/${conversationId}`)).data,
    refetchInterval: 8000, // fallback; el websocket inyecta en vivo
    refetchOnWindowFocus: true,
  });

  // Cada vez que se abre/refetchea el detalle, los mensajes del cliente quedan leídos en el backend.
  // Invalidamos la bandeja para que el badge se actualice de inmediato.
  useEffect(() => {
    qc.invalidateQueries({ queryKey: ['admin', 'chats'], exact: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detailQuery.data?.messages.length]);

  // Realtime: suscripción al canal de la conversación abierta
  useEffect(() => {
    const echo = getEcho();
    if (!echo) return;
    const channel = echo.channel(`chat.conversation.${conversationId}`);
    type Payload = {
      conversation_id: number;
      session_id: string;
      message: MessageRow;
    };
    const handler = (data: Payload) => {
      // Inyectar el mensaje directamente en la caché — cero latencia, sin refetch.
      qc.setQueryData<ChatDetail | undefined>(
        ['admin', 'chats', conversationId],
        (prev) => {
          if (!prev) return prev;
          // Si ya está (por id real), nada que hacer.
          if (prev.messages.some((m) => m.id === data.message.id)) return prev;
          // Si hay un optimista temporal (id<0) del mismo emisor y body, reemplazarlo.
          const tempIdx = prev.messages.findIndex(
            (m) => m.id < 0 && m.sender === data.message.sender && m.body === data.message.body,
          );
          const nextMessages = tempIdx >= 0
            ? prev.messages.map((m, i) => (i === tempIdx ? data.message : m))
            : [...prev.messages, data.message];
          return {
            ...prev,
            conversation: {
              ...prev.conversation,
              last_message_at: data.message.created_at,
            },
            messages: nextMessages,
          };
        },
      );
      // Refrescar bandeja para preview/contador.
      qc.invalidateQueries({ queryKey: ['admin', 'chats'], exact: false });
    };
    channel.listen('.message.created', handler);
    return () => {
      try { channel.stopListening('.message.created'); } catch { /* noop */ }
      try { echo.leave(`chat.conversation.${conversationId}`); } catch { /* noop */ }
    };
  }, [conversationId, qc]);

  const replyMut = useMutation({
    mutationFn: async (text: string) =>
      (await adminApi.post(`/admin/chats/${conversationId}/reply`, { body: text })).data,
    onMutate: async (text: string) => {
      await qc.cancelQueries({ queryKey: ['admin', 'chats', conversationId] });
      const prev = qc.getQueryData<ChatDetail>(['admin', 'chats', conversationId]);
      const tempId = -Date.now();
      if (prev) {
        qc.setQueryData<ChatDetail>(['admin', 'chats', conversationId], {
          ...prev,
          messages: [
            ...prev.messages,
            {
              id: tempId,
              sender: 'seller',
              sender_id: null,
              type: 'text',
              body: text,
              metadata: null,
              created_at: new Date().toISOString(),
            },
          ],
        });
      }
      setBody('');
      return { prev };
    },
    onError: (e, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(['admin', 'chats', conversationId], ctx.prev);
      toast.error(apiErrorMessage(e));
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'chats', conversationId] });
      qc.invalidateQueries({ queryKey: ['admin', 'chats'] });
    },
  });

  const takeMut = useMutation({
    mutationFn: async () => (await adminApi.post(`/admin/chats/${conversationId}/take`)).data,
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ['admin', 'chats', conversationId] });
      const prev = qc.getQueryData<ChatDetail>(['admin', 'chats', conversationId]);
      if (prev) {
        qc.setQueryData<ChatDetail>(['admin', 'chats', conversationId], {
          ...prev,
          conversation: { ...prev.conversation, status: 'human' },
        });
      }
      return { prev };
    },
    onError: (e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['admin', 'chats', conversationId], ctx.prev);
      toast.error(apiErrorMessage(e));
    },
    onSuccess: () => toast.success('Conversación iniciada'),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'chats', conversationId] });
      qc.invalidateQueries({ queryKey: ['admin', 'chats'] });
    },
  });

  const closeMut = useMutation({
    mutationFn: async () => (await adminApi.post(`/admin/chats/${conversationId}/close`)).data,
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ['admin', 'chats', conversationId] });
      const prev = qc.getQueryData<ChatDetail>(['admin', 'chats', conversationId]);
      if (prev) {
        qc.setQueryData<ChatDetail>(['admin', 'chats', conversationId], {
          ...prev,
          conversation: { ...prev.conversation, status: 'closed' },
        });
      }
      return { prev };
    },
    onError: (e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['admin', 'chats', conversationId], ctx.prev);
      toast.error(apiErrorMessage(e));
    },
    onSuccess: () => toast.success('Conversación cerrada'),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'chats', conversationId] });
      qc.invalidateQueries({ queryKey: ['admin', 'chats'] });
    },
  });

  const uploadMut = useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData();
      fd.append('file', file);
      return (await adminApi.post(`/admin/chats/${conversationId}/upload`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })).data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'chats', conversationId] });
      qc.invalidateQueries({ queryKey: ['admin', 'chats'] });
    },
    onError: (e) => toast.error(apiErrorMessage(e)),
  });

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) uploadMut.mutate(f);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Notificar "escribiendo" al backend (debounced, máx 1 ping cada 2s)
  const lastTypingRef = useRef<number>(0);
  const notifyTyping = () => {
    const now = Date.now();
    if (now - lastTypingRef.current < 2000) return;
    lastTypingRef.current = now;
    adminApi.post(`/admin/chats/${conversationId}/typing`).catch(() => undefined);
  };

  // Auto-scroll inteligente: sólo baja si el usuario está cerca del final.
  const isAtBottomRef = useRef(true);
  const handleMessagesScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    isAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (isAtBottomRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [detailQuery.data?.messages.length]);
  // Al cambiar de conversación, siempre bajar al final.
  useEffect(() => {
    isAtBottomRef.current = true;
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [conversationId]);

  if (detailQuery.isLoading || !detailQuery.data) {
    return <div className="flex flex-1 items-center justify-center text-sm text-neutral-500">Cargando…</div>;
  }

  const conv = detailQuery.data.conversation;
  const messages = detailQuery.data.messages;
  const closed = conv.status === 'closed';

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      {/* Header WhatsApp-style */}
      <div className="flex items-center justify-between gap-3 border-b border-neutral-200 bg-[#f0f2f5] px-4 py-2.5">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button
            onClick={onClose}
            className="grid size-9 place-items-center rounded-full text-neutral-600 hover:bg-neutral-200 lg:hidden"
            title="Volver"
          >
            <ArrowLeft className="size-4" />
          </button>
          <div
            className="grid size-10 shrink-0 place-items-center rounded-full text-sm font-semibold text-white"
            style={{ backgroundColor: avatarColor(conv.client?.id ?? conv.id) }}
          >
            {initials(conv.client?.name ?? '?')}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold text-neutral-900">
              {conv.client?.name ?? 'Sin identificar'}
            </p>
            <p className="truncate text-[12px] text-neutral-500">
              {conv.status === 'human'
                ? 'En línea · atendiendo'
                : conv.status === 'waiting_human'
                  ? 'Esperando que tomes el chat'
                  : conv.status === 'closed'
                    ? 'Conversación cerrada'
                    : conv.client?.document_number
                      ? `NIT/CC ${conv.client.document_number}`
                      : 'Bot atendiendo'}
              {conv.client?.phone && ` · ${conv.client.phone}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {conv.status !== 'human' && conv.status !== 'closed' && (
            <Button
              size="sm"
              className="h-9 rounded-full bg-[#00a884] px-4 text-white hover:bg-[#06cf9c]"
              onClick={() => takeMut.mutate()}
              disabled={takeMut.isPending}
            >
              {takeMut.isPending ? (
                <><Loader2 className="size-4 animate-spin mr-1" /> Iniciando…</>
              ) : (
                'Iniciar conversación'
              )}
            </Button>
          )}
          {!closed && (
            <Button
              size="sm"
              variant="outline"
              className="h-9 rounded-full border-neutral-300 text-neutral-700"
              onClick={() => {
                if (confirm('¿Cerrar la atención con este cliente? Su conversación se archivará y al cliente le aparecerá un chat nuevo si vuelve a escribir.')) {
                  closeMut.mutate();
                }
              }}
              disabled={closeMut.isPending}
            >
              Cerrar atención
            </Button>
          )}
          <button
            onClick={onClose}
            className="hidden size-9 place-items-center rounded-full text-neutral-600 hover:bg-neutral-200 lg:grid"
            title="Cerrar"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      {/* Mensajes con fondo doodle */}
      <div
        ref={scrollRef}
        onScroll={handleMessagesScroll}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-1"
        style={{ backgroundImage: WA_DOODLE, backgroundColor: '#efeae2' }}
      >
        {messages.map((m, idx) => {
          const prev = messages[idx - 1];
          const showAvatar = !prev || prev.sender !== m.sender;
          return <MessageBubble key={m.id} m={m} showTail={showAvatar} />;
        })}
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <span className="rounded-full bg-white/80 px-4 py-2 text-xs text-neutral-600 shadow-sm">
              Sin mensajes aún. Escribe el primero para comenzar.
            </span>
          </div>
        )}
      </div>

      {/* Input bar estilo WhatsApp */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!body.trim() || closed) return;
          replyMut.mutate(body.trim());
        }}
        className="flex items-end gap-2 bg-[#f0f2f5] px-3 py-2.5"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf,application/zip,audio/*,.doc,.docx,.xls,.xlsx"
          className="hidden"
          onChange={onPickFile}
        />
        <button
          type="button"
          disabled={closed || uploadMut.isPending}
          onClick={() => fileInputRef.current?.click()}
          title="Adjuntar archivo"
          className="grid size-10 place-items-center rounded-full text-neutral-600 transition hover:bg-neutral-200 disabled:opacity-40"
        >
          <Paperclip className="size-5" />
        </button>
        <VoiceRecorder
          disabled={closed || uploadMut.isPending}
          onSend={(file) => uploadMut.mutate(file)}
        />
        <div className="flex-1 rounded-full bg-white px-4 py-2">
          <input
            placeholder={closed ? 'Conversación cerrada' : 'Escribe un mensaje'}
            value={body}
            onChange={(e) => {
              setBody(e.target.value);
              if (!closed && e.target.value.trim()) notifyTyping();
            }}
            disabled={closed || replyMut.isPending}
            className="w-full bg-transparent text-sm outline-none placeholder:text-neutral-500"
            autoComplete="off"
          />
        </div>
        <button
          type="submit"
          disabled={closed || replyMut.isPending || !body.trim()}
          className="grid size-10 place-items-center rounded-full bg-[#00a884] text-white transition hover:bg-[#06cf9c] disabled:bg-neutral-300"
          title="Enviar"
        >
          <Send className="size-4" />
        </button>
      </form>

      {closed && (
        <div className="border-t border-neutral-200 bg-[#fff8e1] px-4 py-2 text-center text-[12px] text-amber-800">
          Esta conversación está cerrada. El cliente verá un chat nuevo si vuelve a escribir.
        </div>
      )}
    </div>
  );
}

function MessageBubble({ m, showTail }: { m: MessageRow; showTail: boolean }) {
  if (m.sender === 'system') {
    return (
      <div className="flex justify-center py-1">
        <span className="rounded-md bg-white/85 px-3 py-1 text-[11.5px] text-neutral-700 shadow-sm">
          {m.body}
        </span>
      </div>
    );
  }

  const isOwn = m.sender === 'seller';
  const isBot = m.sender === 'bot';
  const align = isOwn ? 'justify-end' : 'justify-start';

  // Colores estilo WhatsApp: enviado por nosotros (#d9fdd3), recibido (#ffffff)
  // Mensajes del bot los marcamos en azulado tenue para distinguirlos.
  const bubbleColor = isOwn
    ? 'bg-[#d9fdd3]'
    : isBot
      ? 'bg-[#eef6ff]'
      : 'bg-white';

  const corner = isOwn
    ? showTail
      ? 'rounded-2xl rounded-tr-md'
      : 'rounded-2xl'
    : showTail
      ? 'rounded-2xl rounded-tl-md'
      : 'rounded-2xl';

  return (
    <div className={cn('flex', align)}>
      <div
        className={cn(
          'group relative max-w-[75%] px-2.5 py-1.5 shadow-sm',
          bubbleColor,
          corner,
        )}
      >
        {isBot && (
          <p className="mb-0.5 text-[11px] font-semibold text-[#5b6cff]">🤖 Valeria (bot)</p>
        )}
        <Attachment m={m} />
        {m.body && (
          <p className={cn('whitespace-pre-wrap break-words text-[14.2px] leading-snug text-neutral-800', m.attachment_url ? 'mt-1' : '')}>
            {m.body}
          </p>
        )}
        <div className="mt-0.5 flex items-center justify-end gap-1">
          <span className="text-[10.5px] text-neutral-500">
            {new Date(m.created_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
          </span>
          {isOwn && (
            m.read_at ? (
              <CheckCheck className="size-3.5 text-[#53bdeb]" />
            ) : (
              <Check className="size-3.5 text-neutral-500" />
            )
          )}
        </div>
      </div>
    </div>
  );
}

function Attachment({ m }: { m: MessageRow }) {
  if (!m.attachment_url) return null;
  const url = m.attachment_url;
  if (m.type === 'image') {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="block">
        <img
          src={url}
          alt={m.attachment_name ?? 'imagen'}
          className="max-h-64 max-w-full rounded-lg object-cover"
          loading="lazy"
        />
      </a>
    );
  }
  if (m.type === 'audio') {
    return <audio controls src={url} className="w-full max-w-[260px]" />;
  }
  const sizeKb = m.attachment_size ? Math.round(m.attachment_size / 1024) : null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-2 rounded-md bg-black/5 px-2 py-1.5 text-xs hover:bg-black/10"
    >
      <FileText className="size-4 shrink-0" />
      <span className="truncate">{m.attachment_name ?? 'archivo'}</span>
      {sizeKb !== null && <span className="shrink-0 opacity-70">{sizeKb} KB</span>}
      <Download className="size-3.5 shrink-0 opacity-70" />
    </a>
  );
}
