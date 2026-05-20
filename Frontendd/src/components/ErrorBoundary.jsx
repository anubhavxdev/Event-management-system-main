import React from 'react';

/**
 * Reusable React Error Boundary component.
 *
 * Props:
 *  - fallback     (ReactNode | Function)  — Custom fallback UI. If a function,
 *                  receives { error, errorInfo, resetError }.
 *  - resetKeys    (Array)                 — When any value in this array changes,
 *                  the error state auto-resets (e.g. pass [location.pathname]).
 *  - onError      (Function)              — Optional callback invoked with (error, errorInfo).
 *  - level        (string)                — Label for logging: 'root' | 'layout' | 'route'.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render shows the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details to console with component stack trace
    const level = this.props.level || 'unknown';
    console.error(
      `[ErrorBoundary:${level}] Caught an error during rendering:`,
      error
    );
    console.error(
      `[ErrorBoundary:${level}] Component stack:`,
      errorInfo.componentStack
    );

    this.setState({ errorInfo });

    // Invoke optional callback (useful for telemetry/monitoring later)
    if (typeof this.props.onError === 'function') {
      this.props.onError(error, errorInfo);
    }
  }

  componentDidUpdate(prevProps) {
    // Auto-reset error state when resetKeys change (e.g. route navigation)
    if (this.state.hasError && this.props.resetKeys) {
      const prevKeys = prevProps.resetKeys || [];
      const currKeys = this.props.resetKeys || [];
      const hasChanged = currKeys.some((key, i) => key !== prevKeys[i]);

      if (hasChanged) {
        this.resetError();
      }
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // If a custom fallback is provided
      if (this.props.fallback) {
        // Function-as-fallback pattern
        if (typeof this.props.fallback === 'function') {
          return this.props.fallback({
            error: this.state.error,
            errorInfo: this.state.errorInfo,
            resetError: this.resetError,
          });
        }
        // Static ReactNode fallback
        return this.props.fallback;
      }

      // Default fallback UI
      return <DefaultFallback error={this.state.error} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

/**
 * Beautiful default fallback with Tailwind classes matching the app's design system.
 * Provides "Try Again" (resets boundary) and "Go Home" (navigates to /).
 */
function DefaultFallback({ error, resetError }) {
  return (
    <div className="flex items-center justify-center min-h-[300px] p-6">
      <div className="w-full max-w-md text-center space-y-5">
        {/* Icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <svg
            className="h-8 w-8 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
        </div>

        {/* Message */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Something went wrong
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            An unexpected error occurred while rendering this section.
            The rest of the application should still be functional.
          </p>
        </div>

        {/* Error details (collapsible, dev-friendly) */}
        {error && (
          <details className="text-left rounded-lg bg-gray-50 dark:bg-gray-800 p-3">
            <summary className="cursor-pointer text-xs font-medium text-gray-600 dark:text-gray-300 select-none">
              Error details
            </summary>
            <pre className="mt-2 whitespace-pre-wrap break-words text-xs text-red-600 dark:text-red-400">
              {error.toString()}
            </pre>
          </details>
        )}

        {/* Actions */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={resetError}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182"
              />
            </svg>
            Try Again
          </button>

          <a
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
              />
            </svg>
            Go Home
          </a>
        </div>
      </div>
    </div>
  );
}

/**
 * Minimal inline fallback for non-critical sections (Header/Footer).
 * Shows a thin banner instead of a full error card.
 */
export function InlineFallback({ label = 'section', resetError }) {
  return (
    <div className="w-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 flex items-center justify-between">
      <p className="text-sm text-red-700 dark:text-red-300">
        The {label} failed to load.
      </p>
      <button
        onClick={resetError}
        className="text-sm font-medium text-red-600 dark:text-red-400 underline hover:no-underline"
      >
        Retry
      </button>
    </div>
  );
}

export default ErrorBoundary;
