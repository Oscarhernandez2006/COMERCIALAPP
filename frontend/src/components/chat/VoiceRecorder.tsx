import { useEffect, useRef, useState } from 'react'
import { Mic, Trash2, Send, Square, Play, Pause } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Props = {
  onSend: (file: File) => void
  disabled?: boolean
  className?: string
}

/**
 * Grabador de notas de voz estilo WhatsApp:
 *  - Idle: botón micrófono.
 *  - Grabando: cronómetro + cancelar (papelera) + detener (cuadrado).
 *  - Preview: reproducir/pausar + cancelar + enviar.
 */
export function VoiceRecorder({ onSend, disabled, className }: Props) {
  const [phase, setPhase] = useState<'idle' | 'recording' | 'preview'>('idle')
  const [elapsed, setElapsed] = useState(0)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewFile, setPreviewFile] = useState<File | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const cancelledRef = useRef(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const cleanupStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }

  const clearPreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setPreviewFile(null)
    setIsPlaying(false)
  }

  useEffect(() => {
    return () => {
      if (tickRef.current) clearInterval(tickRef.current)
      cleanupStream()
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const start = async () => {
    if (disabled) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mime = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : ''
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
      chunksRef.current = []
      cancelledRef.current = false
      rec.ondataavailable = (ev) => { if (ev.data.size > 0) chunksRef.current.push(ev.data) }
      rec.onstop = () => {
        cleanupStream()
        if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null }
        if (cancelledRef.current) {
          setPhase('idle')
          setElapsed(0)
          chunksRef.current = []
          return
        }
        const type = rec.mimeType || 'audio/webm'
        const blob = new Blob(chunksRef.current, { type })
        const ext = type.split('/')[1].split(';')[0] || 'webm'
        const file = new File([blob], `nota-de-voz-${Date.now()}.${ext}`, { type })
        const url = URL.createObjectURL(blob)
        setPreviewFile(file)
        setPreviewUrl(url)
        setPhase('preview')
      }
      rec.start()
      mediaRecorderRef.current = rec
      setPhase('recording')
      setElapsed(0)
      tickRef.current = setInterval(() => setElapsed((s) => s + 1), 1000)
    } catch {
      toast.error('No pude acceder al micrófono')
    }
  }

  const stopRecording = () => {
    cancelledRef.current = false
    mediaRecorderRef.current?.stop()
    mediaRecorderRef.current = null
  }

  const cancelRecording = () => {
    cancelledRef.current = true
    mediaRecorderRef.current?.stop()
    mediaRecorderRef.current = null
  }

  const togglePlay = () => {
    const a = audioRef.current
    if (!a) return
    if (a.paused) { void a.play(); setIsPlaying(true) }
    else { a.pause(); setIsPlaying(false) }
  }

  const send = () => {
    if (!previewFile) return
    onSend(previewFile)
    clearPreview()
    setPhase('idle')
    setElapsed(0)
  }

  const cancelPreview = () => {
    clearPreview()
    setPhase('idle')
    setElapsed(0)
  }

  const fmt = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0')
    const r = (s % 60).toString().padStart(2, '0')
    return `${m}:${r}`
  }

  if (phase === 'recording') {
    return (
      <div className={cn('flex items-center gap-2 rounded-full bg-red-50 px-3 py-1.5', className)}>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={cancelRecording}
          title="Cancelar grabación"
          className="h-8 px-2 text-red-600 hover:bg-red-100"
        >
          <Trash2 className="size-4" />
        </Button>
        <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-red-500" />
        <span className="font-mono text-sm tabular-nums text-red-700">{fmt(elapsed)}</span>
        <span className="text-xs text-red-600/80">Grabando…</span>
        <Button
          type="button"
          size="sm"
          onClick={stopRecording}
          title="Detener grabación"
          className="h-8 bg-red-600 px-3 text-white hover:bg-red-700"
        >
          <Square className="size-3.5 fill-current" />
        </Button>
      </div>
    )
  }

  if (phase === 'preview' && previewUrl) {
    return (
      <div className={cn('flex items-center gap-2 rounded-full bg-neutral-100 px-3 py-1.5', className)}>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={cancelPreview}
          title="Descartar"
          className="h-8 px-2 text-neutral-600 hover:bg-neutral-200"
        >
          <Trash2 className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={togglePlay}
          title={isPlaying ? 'Pausar' : 'Reproducir'}
          className="h-8 px-2 text-neutral-700 hover:bg-neutral-200"
        >
          {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
        </Button>
        <audio
          ref={audioRef}
          src={previewUrl}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
        <span className="font-mono text-xs tabular-nums text-neutral-600">{fmt(elapsed)}</span>
        <Button
          type="button"
          size="sm"
          onClick={send}
          title="Enviar nota de voz"
          className="h-8 bg-[#53AC30] px-3 text-white hover:bg-[#3F8A24]"
        >
          <Send className="size-3.5" />
        </Button>
      </div>
    )
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={disabled}
      onClick={start}
      title="Grabar nota de voz"
      className={cn('h-10 px-2 text-neutral-500 hover:text-neutral-700', className)}
    >
      <Mic className="size-4" />
    </Button>
  )
}
