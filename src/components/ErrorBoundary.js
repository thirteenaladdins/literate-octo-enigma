import React from "react";
import { logError } from "../utils/errorHandler";
import { ERROR_MESSAGES } from "../constants";

/**
 * Error Boundary component to catch React errors
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    logError(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: "2rem",
            textAlign: "center",
            minHeight: "50vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <h2 style={{ marginBottom: "1rem", color: "#ff6b6b" }}>
            Something went wrong
          </h2>
          <p style={{ marginBottom: "2rem", color: "#666" }}>
            {ERROR_MESSAGES.UNKNOWN_ERROR}
          </p>
          <button
            onClick={this.handleReset}
            style={{
              padding: "0.75rem 1.5rem",
              backgroundColor: "#1DA1F2",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "1rem",
            }}
            aria-label="Try again"
          >
            Try again
          </button>
          {process.env.NODE_ENV === "development" && this.state.error && (
            <details style={{ marginTop: "2rem", textAlign: "left", maxWidth: "600px" }}>
              <summary style={{ cursor: "pointer", marginBottom: "0.5rem" }}>
                Error details (development only)
              </summary>
              <pre
                style={{
                  background: "#1a1a1a",
                  padding: "1rem",
                  borderRadius: "8px",
                  overflow: "auto",
                  fontSize: "0.875rem",
                }}
              >
                {this.state.error.toString()}
                {this.state.error.stack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

