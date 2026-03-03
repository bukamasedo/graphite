import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import i18n from '@/i18n';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error);
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const t = (key: string) => i18n.t(key);
      return (
        <div
          className="h-screen w-screen flex flex-col items-center justify-center gap-4"
          style={{ background: 'var(--bg-primary)' }}
        >
          <AlertTriangle size={40} className="text-destructive" />
          <h1 className="text-lg font-semibold text-text-primary">
            {t('error.title')}
          </h1>
          <p className="text-sm text-text-muted max-w-md text-center">
            {t('error.description')}
          </p>
          <Button onClick={this.handleReload} className="mt-2">
            <RotateCcw size={14} />
            {t('error.reload')}
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
