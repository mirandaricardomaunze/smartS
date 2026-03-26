import { useState, useCallback } from 'react'
import { BarcodeScanningResult } from 'expo-camera'

export function useScanner() {
  const [scannedData, setScannedData] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(true)
  const [lastScanned, setLastScanned] = useState<string | null>(null)
  const [lastScannedTime, setLastScannedTime] = useState(0)

  const handleBarCodeScanned = useCallback((result: BarcodeScanningResult) => {
    const now = Date.now()
    // Cooldown of 2 seconds for the same barcode to avoid duplicate scans
    if (result.data === lastScanned && now - lastScannedTime < 2000) {
      return
    }

    setScannedData(result.data)
    setLastScanned(result.data)
    setLastScannedTime(now)
    // We stay in scanning mode now for "lightning fast" multi-scan
  }, [lastScanned, lastScannedTime])

  const resetScanner = useCallback(() => {
    setScannedData(null)
    setLastScanned(null)
    setLastScannedTime(0)
    setIsScanning(true)
  }, [])

  return { scannedData, isScanning, handleBarCodeScanned, resetScanner, setIsScanning }
}
