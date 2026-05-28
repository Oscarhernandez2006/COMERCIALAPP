import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Bot, RefreshCw, Send, Sparkles, User, Wifi, WifiOff, Paperclip, FileText, Download } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageHero } from '@/components/site/SectionHeader'
import { api } from '@/lib/api'
import { getEcho } from '@/lib/echo'
import { toast } from 'sonner'
import { formatPrice } from '@/hooks/usePublicData'
import { VoiceRecorder } from '@/components/chat/VoiceRecorder'

type ChatProduct = {
  id: number
  name: string
  slug: string
  short_description: string | null
  price: number
  image_url: string | null
}

type Message = {
  who: 'bot' | 'user' | 'seller' | 'system'
  text: string
  suggestions?: string[]
  products?: ChatProduct[]
  at: number
  serverId?: number
  sellerName?: string
  attachmentUrl?: string | null
  attachmentName?: string | null
  attachmentMime?: string | null
  attachmentSize?: number | null
  attachmentType?: 'image' | 'file' | 'audio' | 'text' | null
}

type ChatResponse = {
  session_id: string
  reply: string
  state: string
  suggestions?: string[]
  products?: ChatProduct[]
  done?: boolean
  silent?: boolean
  conversation_status?: string
}

const SESSION_KEY = 'gs_chat_session'
const MESSAGES_KEY_PREFIX = 'gs_chat_msgs_'
const CLOSED_AT_KEY_PREFIX = 'gs_chat_closed_at_'

function purgeChatStorage(sid: string) {
  if (!sid) return
  try {
    localStorage.removeItem(MESSAGES_KEY_PREFIX + sid)
    localStorage.removeItem(CLOSED_AT_KEY_PREFIX + sid)
    if (localStorage.getItem(SESSION_KEY) === sid) {
      localStorage.removeItem(SESSION_KEY)
    }
  } catch { /* noop */ }
}

// Si la sesión guardada quedó cerrada, purgar antes de leer para arrancar fresca.
if (typeof window !== 'undefined') {
  try {
    const sidRaw = localStorage.getItem(SESSION_KEY) ?? ''
    if (sidRaw) {
      const closedAt = Number(localStorage.getItem(CLOSED_AT_KEY_PREFIX + sidRaw) ?? 0)
      if (closedAt) {
        purgeChatStorage(sidRaw)
      }
    }
  } catch { /* noop */ }
}


function loadStoredMessages(sid: string): Message[] {
  if (!sid) return []
  try {
    const raw = localStorage.getItem(MESSAGES_KEY_PREFIX + sid)
    return raw ? (JSON.parse(raw) as Message[]) : []
  } catch {
    return []
  }
}

export default function Sales() {
  const initialSid = typeof window !== 'undefined' ? localStorage.getItem(SESSION_KEY) ?? '' : ''
  const [sessionId, setSessionId] = useState<string>(initialSid)
  const [messages, setMessages] = useState<Message[]>(() => loadStoredMessages(initialSid))
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [sellerInfo, setSellerInfo] = useState<{ id: number; name: string; phone: string | null; photo_url: string | null } | null>(null)
  const [convStatus, setConvStatus] = useState<string>('bot')
  const [sellerTyping, setSellerTyping] = useState(false)
  const [isOffline, setIsOffline] = useState(false)
  const lastSeenIdRef = useRef<number>(
    initialSid ? Math.max(0, ...loadStoredMessages(initialSid).map((m) => m.serverId ?? 0)) : 0,
  )
  const prevStatusRef = useRef<string>('bot')
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const initialGreetSentRef = useRef(false)
  const [uploading, setUploading] = useState(false)

  const uploadAttachment = async (file: File) => {
    if (!sessionId) {
      toast.error('Inicia el chat antes de adjuntar')
      return
    }
    if (convStatus === 'closed') return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const { data } = await api.post<{ session_id: string; message: { id: number; type: string; body: string; attachment_url: string | null; attachment_name: string | null; attachment_mime: string | null; attachment_size: number | null; created_at: string } }>(
        `/public/chat/${sessionId}/upload`,
        fd,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      )
      const m = data.message
      const type = m.type as Message['attachmentType']
      setMessages((prev) => [
        ...prev,
        {
          who: 'user',
          text: m.body || '',
          at: new Date(m.created_at).getTime(),
          attachmentUrl: m.attachment_url,
          attachmentName: m.attachment_name,
          attachmentMime: m.attachment_mime,
          attachmentSize: m.attachment_size,
          attachmentType: type,
        },
      ])
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } }; message?: string }
      toast.error(e?.response?.data?.message ?? e?.message ?? 'No se pudo subir el archivo')
    } finally {
      setUploading(false)
    }
  }

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) uploadAttachment(f)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Saludo inicial automático (solo si NO hay historial guardado)
  useEffect(() => {
    if (initialGreetSentRef.current) return
    if (messages.length === 0) {
      initialGreetSentRef.current = true
      sendMessage('', { initial: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Persistir mensajes en localStorage por sessionId
  useEffect(() => {
    if (!sessionId) return
    try {
      const trimmed = messages.slice(-100) // límite
      localStorage.setItem(MESSAGES_KEY_PREFIX + sessionId, JSON.stringify(trimmed))
    } catch {
      // localStorage lleno: ignorar
    }
  }, [messages, sessionId])

  const playNotify = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.type = 'sine'
      o.frequency.value = 880
      g.gain.setValueAtTime(0.0001, ctx.currentTime)
      g.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25)
      o.connect(g).connect(ctx.destination)
      o.start()
      o.stop(ctx.currentTime + 0.27)
      setTimeout(() => ctx.close(), 400)
    } catch {
      // sin audio context
    }
  }, [])

  // Realtime via Reverb (websocket). El polling sigue como fallback.
  useEffect(() => {
    if (!sessionId) return
    const echo = getEcho()
    if (!echo) return
    const channel = echo.channel(`chat.session.${sessionId}`)
    type Payload = {
      conversation_id: number
      session_id: string
      message: {
        id: number
        sender: 'client' | 'bot' | 'seller' | 'system'
        body: string
        type?: string | null
        attachment_url?: string | null
        attachment_name?: string | null
        attachment_mime?: string | null
        attachment_size?: number | null
        created_at: string
      }
    }
    const handler = (data: Payload) => {
      const m = data.message
      // El bot llega por la respuesta sincrónica de POST /chat; el cliente origina sus propios mensajes.
      // Realtime solo se usa para seller/system.
      if (m.sender !== 'seller' && m.sender !== 'system') return
      if (m.id <= lastSeenIdRef.current) return
      lastSeenIdRef.current = m.id
      setMessages((curr) => [
        ...curr,
        {
          who: m.sender as 'seller' | 'system',
          text: m.body,
          at: new Date(m.created_at).getTime(),
          serverId: m.id,
          attachmentUrl: m.attachment_url ?? null,
          attachmentName: m.attachment_name ?? null,
          attachmentMime: m.attachment_mime ?? null,
          attachmentSize: m.attachment_size ?? null,
          attachmentType: (m.type as Message['attachmentType']) ?? null,
        },
      ])
      if (m.sender === 'seller') playNotify()
    }
    channel.listen('.message.created', handler)
    return () => {
      try { channel.stopListening('.message.created') } catch { /* noop */ }
      try { echo.leave(`chat.session.${sessionId}`) } catch { /* noop */ }
    }
  }, [sessionId, playNotify])

  // Polling de mensajes del vendedor con backoff exponencial en error
  useEffect(() => {
    if (!sessionId) return
    let cancelled = false
    let timeout: ReturnType<typeof setTimeout> | null = null
    let consecutiveErrors = 0

    const poll = async () => {
      try {
        const { data } = await api.get<{
          status: string
          seller: { id: number; name: string; phone: string | null; photo_url: string | null } | null
          seller_typing?: boolean
          messages: Array<{
            id: number
            sender: 'seller' | 'system'
            body: string
            created_at: string
            type?: string | null
            attachment_url?: string | null
            attachment_name?: string | null
            attachment_mime?: string | null
            attachment_size?: number | null
          }>
        }>(`/public/chat/${sessionId}/messages`, { params: { after: lastSeenIdRef.current } })

        if (cancelled) return

        consecutiveErrors = 0
        setIsOffline(false)

        if (data.seller) setSellerInfo(data.seller)
        setSellerTyping(!!data.seller_typing)

        // Detectar cambio de status para banner + reset de prevStatus
        const prev = prevStatusRef.current
        if (prev !== data.status) {
          if (data.status === 'human' && prev !== 'human') {
            // Banner ya se renderiza via convStatus; sound al "entrar" el vendedor
            playNotify()
          }
          if (data.status === 'closed' && prev !== 'closed') {
            playNotify()
            const sellerName = data.seller?.name ?? 'tu asesor'
            setMessages((curr) => [
              ...curr,
              {
                who: 'system',
                text: `${sellerName} finalizó la atención. ¡Gracias por escribirnos! Si necesitas algo más, inicia un nuevo chat.`,
                at: Date.now(),
              },
            ])
          }
          prevStatusRef.current = data.status
        }
        setConvStatus(data.status)

        if (data.messages.length > 0) {
          const sellerCount = data.messages.filter((m) => m.sender === 'seller').length
          setMessages((prev) => [
            ...prev,
            ...data.messages.map((m) => ({
              who: m.sender as 'seller' | 'system',
              text: m.body,
              at: new Date(m.created_at).getTime(),
              serverId: m.id,
              sellerName: data.seller?.name,
              attachmentUrl: m.attachment_url ?? null,
              attachmentName: m.attachment_name ?? null,
              attachmentMime: m.attachment_mime ?? null,
              attachmentSize: m.attachment_size ?? null,
              attachmentType: (m.type as Message['attachmentType']) ?? null,
            })),
          ])
          lastSeenIdRef.current = data.messages[data.messages.length - 1].id
          if (sellerCount > 0) playNotify()
        }
      } catch {
        consecutiveErrors += 1
        if (consecutiveErrors >= 2) setIsOffline(true)
      } finally {
        if (!cancelled) {
          const delay = consecutiveErrors === 0 ? 5000 : Math.min(30000, 2000 * 2 ** consecutiveErrors)
          timeout = setTimeout(poll, delay)
        }
      }
    }

    poll()
    return () => {
      cancelled = true
      if (timeout) clearTimeout(timeout)
    }
  }, [sessionId, playNotify])

  // Auto-scroll al fondo cuando llegan mensajes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, sending])

  const sendMessage = async (text: string, opts?: { initial?: boolean; restart?: boolean }) => {
    if (!opts?.initial && !text.trim()) return
    if (sending) return

    setSending(true)
    if (text.trim()) {
      setMessages((prev) => [...prev, { who: 'user', text, at: Date.now() }])
    }
    setInput('')

    try {
      const payload: Record<string, unknown> = { session_id: sessionId || undefined, message: text }
      if (opts?.restart) payload.restart = true

      const { data } = await api.post<ChatResponse>('/public/chat', payload)

      if (data.session_id && data.session_id !== sessionId) {
        setSessionId(data.session_id)
        localStorage.setItem(SESSION_KEY, data.session_id)
      }

      // Cuando el chat está en manos del vendedor (silent), no agregar burbuja del bot.
      if (data.silent || !data.reply) {
        return
      }

      await new Promise((r) => setTimeout(r, 350))

      setMessages((prev) => [
        ...prev,
        {
          who: 'bot',
          text: data.reply,
          suggestions: data.suggestions,
          products: data.products,
          at: Date.now(),
        },
      ])

      if (data.done) {
        toast.success('Tu solicitud quedó registrada. Un asesor te contactará pronto.')
      }
    } catch (err: unknown) {
      // Diagnóstico visible en consola para identificar la causa real
      // eslint-disable-next-line no-console
      console.error('[chat] error enviando mensaje:', err)
      const e = err as { response?: { status?: number; data?: unknown }; message?: string }
      const status = e?.response?.status
      const detail =
        (typeof e?.response?.data === 'object' && e?.response?.data && 'message' in (e.response.data as Record<string, unknown>)
          ? String((e.response.data as Record<string, unknown>).message)
          : null) ?? e?.message ?? 'desconocido'
      toast.error(`Error ${status ?? ''}: ${detail}`.trim())
    } finally {
      setSending(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  const restart = () => {
    if (sessionId) {
      try { localStorage.removeItem(MESSAGES_KEY_PREFIX + sessionId) } catch { /* noop */ }
      try { localStorage.removeItem(CLOSED_AT_KEY_PREFIX + sessionId) } catch { /* noop */ }
    }
    setMessages([])
    setSellerInfo(null)
    setConvStatus('bot')
    setSellerTyping(false)
    prevStatusRef.current = 'bot'
    lastSeenIdRef.current = 0
    initialGreetSentRef.current = true
    localStorage.removeItem(SESSION_KEY)
    setSessionId('')
    sendMessage('', { initial: true, restart: true })
  }

  // Cuando la conversación pasa a 'closed', mostramos el mensaje final 5s y luego
  // reiniciamos: borramos localStorage para que el cliente arranque un chat nuevo
  // si vuelve a escribir, sin tener que esperar.
  useEffect(() => {
    if (convStatus !== 'closed' || !sessionId) return
    const key = CLOSED_AT_KEY_PREFIX + sessionId
    try { localStorage.setItem(key, String(Date.now())) } catch { /* noop */ }
    const sid = sessionId
    const timer = setTimeout(() => {
      purgeChatStorage(sid)
      setMessages([])
      setSellerInfo(null)
      setConvStatus('bot')
      setSellerTyping(false)
      prevStatusRef.current = 'bot'
      lastSeenIdRef.current = 0
      initialGreetSentRef.current = false
      setSessionId('')
    }, 5000)
    return () => clearTimeout(timer)
  }, [convStatus, sessionId])

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const hasMessages = messages.length > 0

  return (
    <>
      <PageHero
        eyebrow="Asistente virtual"
        title="Chatea con nuestro asesor inteligente"
        description="Te ayudamos a encontrar el producto adecuado y te conectamos con un asesor humano cuando lo necesites."
      />

      <section className="container-page py-10 sm:py-14">
        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          {/* CHAT WINDOW */}
          <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-lg shadow-black/5">
            <header className="flex items-center justify-between gap-3 border-b border-border bg-gradient-to-r from-brand to-brand-hover px-5 py-4 text-white">
              <div className="flex items-center gap-3">
                {sellerInfo && convStatus === 'human' && sellerInfo.photo_url ? (
                  <span className="relative size-10 overflow-hidden rounded-full ring-2 ring-white/30">
                    <img src={sellerInfo.photo_url} alt={sellerInfo.name} className="size-full object-cover" />
                    <span className="absolute -bottom-0.5 -right-0.5 grid size-3.5 place-items-center rounded-full bg-emerald-400 ring-2 ring-white">
                      <span className="size-1.5 rounded-full bg-white" />
                    </span>
                  </span>
                ) : (
                  <span className="relative grid size-10 place-items-center rounded-full bg-white/15">
                    {sellerInfo && convStatus === 'human' ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                    <span className="absolute -bottom-0.5 -right-0.5 grid size-3.5 place-items-center rounded-full bg-emerald-400 ring-2 ring-white">
                      <span className="size-1.5 rounded-full bg-white" />
                    </span>
                  </span>
                )}
                <div className="leading-tight">
                  <div className="text-sm font-semibold">
                    {sellerInfo && convStatus === 'human' ? sellerInfo.name : 'Valeria · Atención al cliente'}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-white/80">
                    {isOffline ? (
                      <>
                        <WifiOff className="h-3 w-3" /> Reconectando…
                      </>
                    ) : sellerInfo && convStatus === 'human' ? (
                      <>
                        <Wifi className="h-3 w-3" />
                        {`Asesor en línea${sellerInfo.phone ? ` · ${sellerInfo.phone}` : ''}`}
                      </>
                    ) : (
                      <>En línea · responde en segundos</>
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={restart}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium text-white/90 transition hover:bg-white/25"
                title="Reiniciar conversación"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Reiniciar
              </button>
            </header>

            {convStatus === 'human' && sellerInfo && (
              <div className="border-b border-emerald-200 bg-emerald-50 px-5 py-2 text-center text-[12px] font-medium text-emerald-800">
                <span className="font-semibold">{sellerInfo.name}</span> se incorporó a la conversación. Ya hablas con un asesor.
              </div>
            )}
            {convStatus === 'closed' && (
              <div className="flex flex-col items-center gap-2 border-b border-neutral-200 bg-neutral-100 px-5 py-3 text-center">
                <p className="text-[12px] text-neutral-600">
                  El asesor finalizó la atención. Si necesitas algo más, inicia una conversación nueva.
                </p>
                <Button
                  size="sm"
                  className="h-8 bg-[#53AC30] text-white hover:bg-[#3F8A24]"
                  onClick={restart}
                >
                  <RefreshCw className="mr-1 h-3.5 w-3.5" /> Iniciar nuevo chat
                </Button>
              </div>
            )}

            <div
              ref={scrollRef}
              className="h-[460px] space-y-4 overflow-y-auto bg-neutral-50 px-4 py-5 sm:px-6"
            >
              {!hasMessages && !sending && (
                <div className="grid h-full place-items-center text-sm text-neutral-400">
                  Iniciando conversación…
                </div>
              )}

              {messages.map((m, i) => (
                <ChatBubble key={m.serverId ?? `${m.who}-${m.at}-${i}`} msg={m} onSuggestion={(s) => sendMessage(s)} />
              ))}

              {sending && <TypingIndicator />}
              {!sending && sellerTyping && convStatus === 'human' && (
                <SellerTypingIndicator name={sellerInfo?.name ?? 'Asesor'} />
              )}
            </div>

            <form
              onSubmit={onSubmit}
              className="flex items-center gap-2 border-t border-border bg-white px-4 py-3 sm:px-5"
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
                disabled={convStatus === 'closed' || uploading}
                onClick={() => fileInputRef.current?.click()}
                title="Adjuntar archivo"
                className="grid h-11 w-9 place-items-center rounded-md text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-700 disabled:opacity-40"
              >
                <Paperclip className="h-4 w-4" />
              </button>
              <VoiceRecorder
                disabled={convStatus === 'closed' || uploading}
                onSend={(file) => uploadAttachment(file)}
              />
              <Input
                ref={inputRef}
                placeholder={convStatus === 'closed' ? 'Conversación cerrada' : uploading ? 'Subiendo archivo…' : 'Escribe tu mensaje…'}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={sending || uploading || convStatus === 'closed'}
                className="h-11 flex-1 border-neutral-200 focus-visible:ring-brand"
                autoComplete="off"
              />
              <Button
                type="submit"
                disabled={sending || !input.trim() || convStatus === 'closed'}
                className="h-11 bg-brand px-4 text-white hover:bg-brand-hover"
              >
                <Send className="h-4 w-4" />
                <span className="hidden sm:inline">Enviar</span>
              </Button>
            </form>
          </div>

          {/* SIDE */}
          <aside className="space-y-5">
            <div className="rounded-2xl border border-border bg-white p-6">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand-soft px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-brand-dark">
                <Sparkles className="h-3 w-3" /> ¿Cómo funciona?
              </div>
              <h3 className="text-lg font-bold text-ink">Conversa, no llenes formularios</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Cuéntale al asistente qué necesitas. Si encuentra coincidencias en el catálogo te las
                mostrará, y cuando estés listo recopila tus datos para conectarte con un asesor humano.
              </p>

              <ul className="mt-5 space-y-3 text-sm">
                {STEPS.map((s, i) => (
                  <li key={s.title} className="flex gap-3">
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-bold text-brand-dark">
                      {i + 1}
                    </span>
                    <div>
                      <div className="font-semibold text-ink">{s.title}</div>
                      <div className="text-xs text-muted-foreground">{s.desc}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-dashed border-brand/30 bg-brand-soft/40 p-5">
              <div className="text-xs font-semibold uppercase tracking-wider text-brand-dark">
                Tip rápido
              </div>
              <p className="mt-1 text-sm text-ink">
                Si ya sabes lo que necesitas, escríbelo directamente. Ej:{' '}
                <em className="font-medium">"Necesito cotizar 10 botas de seguridad"</em>.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </>
  )
}

const STEPS = [
  { title: 'Saluda y cuenta qué buscas', desc: 'El asistente entiende lenguaje natural en español.' },
  { title: 'Recibe sugerencias del catálogo', desc: 'Si hay productos que coinciden, los verás al instante.' },
  { title: 'Te conectamos con un asesor', desc: 'Cuando estés listo, recopilamos tus datos en segundos.' },
]

function TypingIndicator() {
  return (
    <div className="flex items-start gap-2">
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand text-white">
        <Bot className="h-4 w-4" />
      </span>
      <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-white px-3 py-3 shadow-sm">
        <span className="size-2 animate-bounce rounded-full bg-neutral-400 [animation-delay:-0.3s]" />
        <span className="size-2 animate-bounce rounded-full bg-neutral-400 [animation-delay:-0.15s]" />
        <span className="size-2 animate-bounce rounded-full bg-neutral-400" />
      </div>
    </div>
  )
}

function SellerTypingIndicator({ name }: { name: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-emerald-500 text-white">
        <User className="h-4 w-4" />
      </span>
      <div className="flex flex-col gap-1">
        <span className="px-1 text-[11px] font-semibold text-emerald-700">{name} está escribiendo…</span>
        <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-emerald-50 px-3 py-3 ring-1 ring-emerald-200">
          <span className="size-2 animate-bounce rounded-full bg-emerald-500 [animation-delay:-0.3s]" />
          <span className="size-2 animate-bounce rounded-full bg-emerald-500 [animation-delay:-0.15s]" />
          <span className="size-2 animate-bounce rounded-full bg-emerald-500" />
        </div>
      </div>
    </div>
  )
}

function ChatAttachment({ msg }: { msg: Message }) {
  if (!msg.attachmentUrl) return null
  const url = msg.attachmentUrl
  if (msg.attachmentType === 'image') {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="block">
        <img
          src={url}
          alt={msg.attachmentName ?? 'imagen'}
          className="max-h-64 max-w-full rounded-lg object-cover"
          loading="lazy"
        />
      </a>
    )
  }
  if (msg.attachmentType === 'audio') {
    return <audio controls src={url} className="w-full max-w-[260px]" />
  }
  const sizeKb = msg.attachmentSize ? Math.round(msg.attachmentSize / 1024) : null
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-2 rounded-md bg-black/10 px-2 py-1.5 text-xs hover:bg-black/20"
    >
      <FileText className="h-4 w-4 shrink-0" />
      <span className="truncate">{msg.attachmentName ?? 'archivo'}</span>
      {sizeKb !== null && <span className="shrink-0 opacity-70">{sizeKb} KB</span>}
      <Download className="h-3.5 w-3.5 shrink-0 opacity-70" />
    </a>
  )
}

function ChatBubble({ msg, onSuggestion }: { msg: Message; onSuggestion: (s: string) => void }) {
  if (msg.who === 'system') {
    return (
      <div className="my-1 flex justify-center">
        <span className="rounded-full bg-neutral-100 px-3 py-1 text-[11px] text-neutral-500">
          {msg.text}
        </span>
      </div>
    )
  }

  const isUser = msg.who === 'user'
  const isSeller = msg.who === 'seller'
  const isBot = msg.who === 'bot'

  const avatarClass = isUser
    ? 'bg-ink text-white'
    : isSeller
      ? 'bg-emerald-500 text-white'
      : 'bg-brand text-white'

  const bubbleClass = isUser
    ? 'rounded-tr-sm bg-brand text-white'
    : isSeller
      ? 'rounded-tl-sm bg-emerald-50 text-ink ring-1 ring-emerald-200'
      : 'rounded-tl-sm bg-white text-ink'

  return (
    <div className={`flex items-start gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
      <span className={`grid size-8 shrink-0 place-items-center rounded-full ${avatarClass}`}>
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </span>

      <div className={`flex max-w-[85%] flex-col gap-2 ${isUser ? 'items-end' : 'items-start'}`}>
        {isSeller && msg.sellerName && (
          <span className="text-[11px] font-semibold text-emerald-700">{msg.sellerName} · Asesor</span>
        )}
        <div className={`whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm shadow-sm ${bubbleClass}`}>
          <ChatAttachment msg={msg} />
          {msg.text && <div className={msg.attachmentUrl ? 'mt-1.5' : ''}><FormattedText text={msg.text} /></div>}
        </div>

        {isBot && msg.products && msg.products.length > 0 && (
          <div className="grid w-full gap-2 sm:grid-cols-2">
            {msg.products.map((p) => (
              <ProductChip key={p.id} product={p} />
            ))}
          </div>
        )}

        {isBot && msg.suggestions && msg.suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {msg.suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onSuggestion(s)}
                className="rounded-full border border-brand/40 bg-white px-3 py-1.5 text-xs font-medium text-brand-dark transition hover:bg-brand hover:text-white"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function FormattedText({ text }: { text: string }) {
  // Renderiza **negritas** y convierte rutas internas /xxxx en enlaces
  const nodes = useMemo(() => {
    const out: React.ReactNode[] = []
    let key = 0
    // 1) Split por **bold**
    const boldParts = text.split(/(\*\*[^*]+\*\*)/g)
    boldParts.forEach((part) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        out.push(
          <strong key={key++} className="font-semibold">
            {part.slice(2, -2)}
          </strong>,
        )
        return
      }
      // 2) En cada parte, detectar rutas /xxx
      const linkParts = part.split(/(\s\/[a-z-]+)/g)
      linkParts.forEach((lp) => {
        const trimmed = lp.trim()
        if (trimmed.startsWith('/') && /^\/[a-z-]+$/.test(trimmed)) {
          out.push(
            <span key={key++}>
              {' '}
              <Link to={trimmed} className="font-semibold underline">
                {trimmed}
              </Link>
            </span>,
          )
        } else {
          out.push(<span key={key++}>{lp}</span>)
        }
      })
    })
    return out
  }, [text])

  return <>{nodes}</>
}

function ProductChip({ product }: { product: ChatProduct }) {
  return (
    <Link
      to={`/catalogo`}
      className="group flex items-center gap-3 rounded-xl border border-border bg-white p-2.5 transition hover:border-brand"
    >
      <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-md bg-neutral-100">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <span className="text-xs text-neutral-400">Sin foto</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-ink group-hover:text-brand">
          {product.name}
        </div>
        {product.short_description && (
          <div className="line-clamp-1 text-xs text-muted-foreground">
            {product.short_description}
          </div>
        )}
        <div className="mt-0.5 text-xs font-bold text-brand-dark">{formatPrice(product.price)}</div>
      </div>
    </Link>
  )
}
