import { captureError, captureMessage } from '@/services/sentryService'

/**
 * Logger centralizado.
 * - Em desenvolvimento: imprime na consola.
 * - Em produção: erros e warnings são enviados ao Sentry; debug/info são silenciados.
 */
export const logger = {
  debug: (...args: unknown[]) => {
    if (__DEV__) console.log(...args)
  },

  info: (...args: unknown[]) => {
    if (__DEV__) console.info(...args)
  },

  warn: (...args: unknown[]) => {
    if (__DEV__) {
      console.warn(...args)
    } else {
      captureMessage(args.map(String).join(' '), 'warning')
    }
  },

  error: (...args: unknown[]) => {
    if (__DEV__) {
      console.error(...args)
    } else {
      const err = args.find(a => a instanceof Error)
      if (err) {
        const context = args.filter(a => !(a instanceof Error))
        captureError(err, context.length ? { extra: context } : undefined)
      } else {
        captureMessage(args.map(String).join(' '), 'error')
      }
    }
  },
}
