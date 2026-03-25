import { useState, useCallback } from 'react'
import { BarcodeScanningResult } from 'expo-camera'

export function useScanner() {
  const [scannedData, setScannedData] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(true)

  const handleBarCodeScanned = useCallback((result: BarcodeScanningResult) => {
    setScannedData(result.data)
    setIsScanning(false)
  }, [])

  const resetScanner = useCallback(() => {
    setScannedData(null)
    setIsScanning(true)
  }, [])

  return { scannedData, isScanning, handleBarCodeScanned, resetScanner }
}
