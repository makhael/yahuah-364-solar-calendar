"use client";

import React from 'react';

export class CalendarErrorBoundary extends React.Component<{children: React.ReactNode}, { hasError: boolean, error: Error | null }> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Calendar Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-destructive text-destructive-foreground rounded-lg m-4">
          <h2 className="text-xl font-bold mb-2">Something went wrong with the calendar.</h2>
          <p className="text-sm mb-4">Please try refreshing the page.</p>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-destructive-foreground/20 rounded hover:bg-destructive-foreground/30 transition-colors"
          >
            Try Again
          </button>
          {this.state.error && (
            <details className="mt-4 text-xs">
              <summary>Error Details</summary>
              <pre className="mt-2 p-2 bg-black/20 rounded overflow-auto">
                {this.state.error.toString()}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
