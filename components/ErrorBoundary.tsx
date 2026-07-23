"use client"

import { Component, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundaryInner extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
          <h1 className="font-heading text-2xl font-semibold text-ink">Something went wrong</h1>
          <p className="mt-2 text-sm text-slate-500">
            An unexpected error occurred while rendering the app.
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false })}
            className="mt-5 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-deep focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            Try again
          </button>
        </main>
      );
    }
    return this.props.children;
  }
}

export default function ErrorBoundary({ children }: ErrorBoundaryProps) {
  return <ErrorBoundaryInner>{children}</ErrorBoundaryInner>;
}
