import { useState, useEffect, useCallback } from 'react'
import * as AuthSession from 'expo-auth-session'
import * as WebBrowser from 'expo-web-browser'
import { googleTokenStore } from '@/services/googleDriveService'

WebBrowser.maybeCompleteAuthSession()

const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? ''

const SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/drive.file',
]

export type DriveAuthState =
  | 'idle'
  | 'connected'
  | 'disconnected'
  | 'loading'
  | 'error'

export function useGoogleDriveAuth() {
  const [authState, setAuthState] = useState<DriveAuthState>('idle')
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // useAutoDiscovery must be called inside the hook, not at module level
  const discovery = AuthSession.useAutoDiscovery('https://accounts.google.com')
  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'smarts', path: 'drive-auth' })

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: GOOGLE_CLIENT_ID,
      scopes: SCOPES,
      redirectUri,
      responseType: AuthSession.ResponseType.Token,
      extraParams: { access_type: 'offline', prompt: 'consent' },
    },
    discovery ?? null
  )

  useEffect(() => {
    googleTokenStore.isConnected().then((connected) => {
      setAuthState(connected ? 'connected' : 'disconnected')
    })
  }, [])

  useEffect(() => {
    if (!response) return

    if (response.type === 'success') {
      const { access_token, refresh_token } = response.params
      googleTokenStore
        .saveTokens(access_token, refresh_token)
        .then(() => fetchUserEmail(access_token))
        .then((email) => {
          setUserEmail(email)
          setAuthState('connected')
          setError(null)
        })
        .catch((e) => {
          setError(e.message)
          setAuthState('error')
        })
    } else if (response.type === 'error') {
      setError(response.error?.message ?? 'Authentication failed')
      setAuthState('error')
    } else if (response.type === 'cancel' || response.type === 'dismiss') {
      setAuthState('disconnected')
    }
  }, [response])

  const signIn = useCallback(async () => {
    if (!GOOGLE_CLIENT_ID) {
      setError('EXPO_PUBLIC_GOOGLE_CLIENT_ID não configurado no .env')
      setAuthState('error')
      return
    }
    setAuthState('loading')
    setError(null)
    await promptAsync()
  }, [promptAsync])

  const signOut = useCallback(async () => {
    await googleTokenStore.clearTokens()
    setUserEmail(null)
    setAuthState('disconnected')
    setError(null)
  }, [])

  return {
    authState,
    userEmail,
    error,
    isConnected: authState === 'connected',
    isLoading: authState === 'loading' || authState === 'idle',
    signIn,
    signOut,
    requestReady: !!request,
  }
}

async function fetchUserEmail(accessToken: string): Promise<string | null> {
  try {
    const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.email ?? null
  } catch {
    return null
  }
}
