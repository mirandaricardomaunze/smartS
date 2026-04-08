import * as Sentry from '@sentry/react-native'

const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN

export function initSentry() {
  if (!DSN) return

  Sentry.init({
    dsn: DSN,
    debug: false,
    enabled: !__DEV__,
    environment: __DEV__ ? 'development' : 'production',
    // Captura 20% das sessões para performance monitoring
    tracesSampleRate: 0.2,
    // Ignora erros de rede que não são bugs da app
    ignoreErrors: [
      'Network request failed',
      'Failed to fetch',
      'NetworkError',
    ],
  })
}

export function setSentryUser(user: { id: string; email?: string; name?: string } | null) {
  if (!DSN) return
  if (user) {
    Sentry.setUser({ id: user.id, email: user.email, username: user.name })
  } else {
    Sentry.setUser(null)
  }
}

export function captureError(error: unknown, context?: Record<string, unknown>) {
  if (!DSN) return
  if (context) Sentry.setContext('extra', context)
  Sentry.captureException(error)
}

export function captureMessage(message: string, level: Sentry.SeverityLevel = 'warning') {
  if (!DSN) return
  Sentry.captureMessage(message, level)
}

export const SentryErrorBoundary = Sentry.ErrorBoundary
