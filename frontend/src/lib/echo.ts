import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

// Expose Pusher para que Echo lo encuentre
;(window as unknown as { Pusher: typeof Pusher }).Pusher = Pusher

const key = import.meta.env.VITE_REVERB_APP_KEY as string | undefined
const host = (import.meta.env.VITE_REVERB_HOST as string | undefined) ?? '127.0.0.1'
const port = Number(import.meta.env.VITE_REVERB_PORT ?? 8080)
const scheme = (import.meta.env.VITE_REVERB_SCHEME as string | undefined) ?? 'http'

let echo: Echo<'reverb'> | null = null
let connected = false

export function isEchoConnected(): boolean {
  return connected
}

export function getEcho(): Echo<'reverb'> | null {
  if (!key) return null
  if (echo) return echo
  try {
    echo = new Echo({
      broadcaster: 'reverb',
      key,
      wsHost: host,
      wsPort: port,
      wssPort: port,
      forceTLS: scheme === 'https',
      enabledTransports: ['ws', 'wss'],
      disableStats: true,
    })
    const pusher = (echo as unknown as { connector: { pusher: Pusher } }).connector.pusher
    pusher.connection.bind('connected', () => {
      connected = true
      console.info('[echo] conectado a Reverb', host, port)
    })
    pusher.connection.bind('disconnected', () => {
      connected = false
      console.warn('[echo] desconectado de Reverb')
    })
    pusher.connection.bind('unavailable', () => {
      connected = false
    })
    pusher.connection.bind('failed', () => {
      connected = false
    })
    pusher.connection.bind('error', (err: unknown) => console.warn('[echo] error', err))
    return echo
  } catch (err) {
    console.warn('[echo] no se pudo inicializar', err)
    return null
  }
}
