import React from 'react';
import { TouchableOpacity, ActivityIndicator } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { feedback } from '@/utils/haptics';

interface IconButtonProps {
  icon: LucideIcon;
  onPress: () => void;
  variant?: 'header' | 'glass' | 'default' | 'outline' | 'ghost' | 'primary';
  size?: 'sm' | 'md' | 'lg' | number;
  iconSize?: number;
  color?: string;
  className?: string;
  isLoading?: boolean;
  disabled?: boolean;
}

export default function IconButton({
  icon: Icon,
  onPress,
  variant = 'header',
  size = 'md',
  iconSize,
  color,
  className = '',
  isLoading = false,
  disabled = false,
}: IconButtonProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const sizeValue = typeof size === 'number' 
    ? size 
    : size === 'sm' ? 36 : size === 'lg' ? 56 : 48; // md = 48 (h-12)

  const finalIconSize = iconSize || (typeof size === 'string' 
    ? size === 'sm' ? 16 : size === 'lg' ? 24 : 20 
    : 20);

  const handlePress = () => {
    if (isLoading || disabled) return;
    feedback.light();
    onPress();
  };

  let bgClass = '';
  let borderClass = '';
  let defaultIconColor = '';

  switch (variant) {
    case 'glass':
    case 'header':
      // Standard Glass Header Button
      bgClass = isDark ? 'bg-white/10' : 'bg-indigo-50';
      borderClass = isDark ? 'border-white/10' : 'border-indigo-100';
      defaultIconColor = isDark ? '#ffffff' : '#6366f1';
      break;
    case 'outline':
      bgClass = 'bg-transparent';
      borderClass = isDark ? 'border-slate-800' : 'border-slate-200';
      defaultIconColor = isDark ? '#cbd5e1' : '#64748b';
      break;
    case 'ghost':
      bgClass = 'bg-transparent';
      borderClass = 'border-transparent';
      defaultIconColor = isDark ? '#cbd5e1' : '#64748b';
      break;
    case 'primary':
      bgClass = 'bg-primary';
      borderClass = 'border-primary';
      defaultIconColor = '#ffffff';
      break;
    default:
      bgClass = isDark ? 'bg-slate-800' : 'bg-slate-100';
      borderClass = isDark ? 'border-slate-700' : 'border-slate-200';
      defaultIconColor = isDark ? '#ffffff' : '#0f172a';
      break;
  }

  const finalIconColor = color || defaultIconColor;

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || isLoading}
      style={{ width: sizeValue, height: sizeValue }}
      className={`items-center justify-center rounded-full border ${bgClass} ${borderClass} ${disabled || isLoading ? 'opacity-50' : 'active:opacity-70'} ${className}`}
      accessibilityRole="button"
      hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={finalIconColor} />
      ) : (
        <Icon size={finalIconSize} color={finalIconColor} />
      )}
    </TouchableOpacity>
  );
}
