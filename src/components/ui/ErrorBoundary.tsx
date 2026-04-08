import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { AlertCircle, RefreshCw } from 'lucide-react-native';
import { captureError } from '@/services/sentryService';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    captureError(error, { componentStack: errorInfo.componentStack ?? undefined });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <View className="flex-1 items-center justify-center bg-white dark:bg-slate-950 px-6">
          <View className="w-20 h-20 bg-rose-50 dark:bg-rose-900/10 rounded-full items-center justify-center mb-6 border border-rose-100 dark:border-rose-800">
            <AlertCircle size={40} color="#f43f5e" />
          </View>

          <Text style={{ fontFamily: 'Inter-Black' }} className="text-xl font-black text-slate-900 dark:text-white mb-2 text-center">
            Ops! Algo correu mal.
          </Text>

          <Text className="text-slate-500 dark:text-slate-400 text-center mb-10 leading-6">
            Ocorreu um erro inesperado na aplicação. Pedimos desculpa pelo incómodo.
          </Text>

          <TouchableOpacity
            onPress={this.handleReset}
            className="flex-row items-center bg-primary px-8 py-4 rounded-2xl shadow-lg"
          >
            <View className="mr-2">
              <RefreshCw size={20} color="white" />
            </View>
            <Text className="text-white font-bold text-base">Tentar Novamente</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}
