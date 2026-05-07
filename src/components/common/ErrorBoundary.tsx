import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Keep the public UI friendly while still surfacing enough detail in development.
    if (import.meta.env.DEV) {
      console.error("Humanitarians website render error", error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="container page">
          <div className="app-error-panel" role="alert">
            <h1>Something went wrong.</h1>
            <p>
              Please refresh the page. If the issue continues, contact the Humanitarians team
              through the details shared on the Donate / Join page.
            </p>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
