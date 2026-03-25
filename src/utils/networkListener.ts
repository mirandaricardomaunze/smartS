import NetInfo from '@react-native-community/netinfo'
import { syncData } from './syncData'

export function initializeNetworkListener() {
  const unsubscribe = NetInfo.addEventListener(state => {
    if (state.isConnected && state.isInternetReachable) {
      syncData().catch(console.error)
    }
  })

  return unsubscribe
}
