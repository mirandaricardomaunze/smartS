import React from 'react';
import { TouchableOpacity, Platform } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { feedback } from '@/utils/haptics';

interface BackButtonProps {
  onPress?: () => void;
  variant?: 'default' | 'glass' | 'transparent';
  className?: string;
  iconColor?: string;
  size?: number;
}

export default function BackButton({ 
  onPress, 
  variant = 'default',
  className = '',
  iconColor,
  size = 24
}: BackButtonProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handlePress = () => {
    feedback.light();
    if (onPress) {
      onPress();
    } else {
      if (router.canGoBack()) {
         router.back();
      } else {
         router.replace('/(app)/dashboard');
      }
    }
  };

  let bgClass = '';
  let borderClass = '';
  let defaultIconColor = '';

  switch (variant) {
    case 'default':
      bgClass = isDark ? 'bg-slate-800' : 'bg-slate-100';
      borderClass = isDark ? 'border-slate-700' : 'border-slate-200';
      defaultIconColor = isDark ? '#ffffff' : '#0f172a';
      break;
    case 'glass':
      bgClass = isDark ? 'bg-white/10' : 'bg-indigo-50';
      borderClass = isDark ? 'border-white/10' : 'border-indigo-100';
      defaultIconColor = isDark ? '#ffffff' : '#6366f1';
      break;
    case 'transparent':
      bgClass = 'bg-transparent';
      borderClass = 'border-transparent';
      defaultIconColor = isDark ? '#ffffff' : '#0f172a';
      break;
  }

  const finalIconColor = iconColor || defaultIconColor;

  return (
    <TouchableOpacity 
      onPress={handlePress}
      className={`items-center justify-center rounded-full border active:opacity-70 ${bgClass} ${borderClass} ${className}`}
      style={{ width: size + 4, height: size + 4 }}
      accessibilityLabel="Voltar"
      accessibilityRole="button"
      hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
    >
      <ChevronLeft size={size} color={finalIconColor} style={Platform.OS === 'ios' ? { marginLeft: -1 } : {}} />
    </TouchableOpacity>
  );
}
