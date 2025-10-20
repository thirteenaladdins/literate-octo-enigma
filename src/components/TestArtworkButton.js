import React, { useState } from "react";

const TestArtworkButton = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [dryRun, setDryRun] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  const testArtwork = async () => {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch("http://localhost:3001/api/test-artwork", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ dryRun }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
      } else {
        setError(data.message || "Failed to generate artwork");
      }
    } catch (err) {
      setError("Failed to connect to server. Make sure to run: npm run server");
      console.error("Test error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="test-artwork-container">
      <div className="test-artwork-card">
        <div
          className="test-title"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h3 style={{ margin: 0 }}>🧪 Test AI Artwork Generation</h3>
          <button
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Expand panel" : "Collapse panel"}
            title={collapsed ? "Expand" : "Minimize"}
            disabled={loading && !collapsed}
            style={{ cursor: "pointer" }}
          >
            {collapsed ? "Expand" : "Minimize"}
          </button>
        </div>

        {!collapsed && (
          <>
            <p className="test-description">
              Generate and test the complete artwork pipeline from the UI
            </p>

            <div className="test-controls">
              <label className="test-checkbox">
                <input
                  type="checkbox"
                  checked={dryRun}
                  onChange={(e) => setDryRun(e.target.checked)}
                  disabled={loading}
                />
                <span>Dry Run (don't post to Twitter)</span>
              </label>

              <button
                className="test-button"
                onClick={testArtwork}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Generating...
                  </>
                ) : (
                  <>🎨 Generate Test Artwork</>
                )}
              </button>
            </div>

            {loading && (
              <div className="test-status">
                <p>
                  This may take 30-60 seconds...
                  <br />
                  <small>
                    AI is generating concept, creating code, and capturing
                    screenshot
                  </small>
                </p>
              </div>
            )}

            {result && (
              <div className="test-result success">
                <h4>✅ Success!</h4>
                <p>{result.message}</p>
                <details>
                  <summary>View Output</summary>
                  <pre>{result.output}</pre>
                </details>
              </div>
            )}

            {error && (
              <div className="test-result error">
                <h4>❌ Error</h4>
                <p>{error}</p>
              </div>
            )}

            <div className="test-info">
              <p>
                <strong>Note:</strong> Make sure the API server is running:
              </p>
              <code>npm run server</code>
              <p>Or run both server and app together:</p>
              <code>npm run dev:all</code>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TestArtworkButton;
