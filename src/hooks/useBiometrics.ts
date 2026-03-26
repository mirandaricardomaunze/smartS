import { useState, useEffect } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';

export function useBiometrics() {
  const [isSupported, setIsSupported] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  
  useEffect(() => {
    (async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      setIsSupported(compatible);
      
      if (compatible) {
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        setIsEnrolled(enrolled);
      }
    })();
  }, []);

  const authenticateAsync = async (promptMessage = 'Autenticar com Biometria') => {
    // If the device does not support it, we fail open (allow access) 
    // to prevent permanently locking out users on old devices.
    if (!isSupported || !isEnrolled) return true; 
    
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        fallbackLabel: 'Usar Código/Senha da Tela',
        disableDeviceFallback: false,
      });
      return result.success;
    } catch (error) {
      console.warn('Biometric auth failed:', error);
      return false;
    }
  };

  return { isSupported, isEnrolled, authenticateAsync };
}
