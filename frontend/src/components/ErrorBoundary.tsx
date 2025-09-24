import React from 'react';

type Props = { children: React.ReactNode; fallback?: React.ReactNode };

type State = { hasError: boolean; error?: Error };

class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: undefined };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    // You can also log the error to an external service here
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught an error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback as React.ReactElement;
      return (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded">
          <strong>Ha ocurrido un error al renderizar esta sección.</strong>
          <div className="mt-2 text-sm">Intenta recargar la página. Revisa la consola para más detalles.</div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
