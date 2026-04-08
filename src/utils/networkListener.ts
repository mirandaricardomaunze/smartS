import NetInfo from '@react-native-community/netinfo'
import { syncData } from './syncData'
import { useNetworkStore } from '@/store/networkStore'
import { useToastStore } from '@/store/useToastStore'

export function initializeNetworkListener() {
  let previouslyOnline: boolean | null = null

  const unsubscribe = NetInfo.addEventListener(state => {
    const isOnline = !!(state.isConnected && state.isInternetReachable)

    useNetworkStore.getState().setOnline(isOnline)

    // Only react to actual transitions, not the initial event
    if (previouslyOnline !== null && previouslyOnline !== isOnline) {
      if (isOnline) {
        useToastStore.getState().show('Ligação restabelecida', 'success', 3000)
        // Silently flush the sync queue — errors are swallowed inside syncData
        syncData().catch(() => {})
      }
      // Offline state is communicated via the persistent OfflineBanner component
    }

    previouslyOnline = isOnline
  })

  return unsubscribe
}
