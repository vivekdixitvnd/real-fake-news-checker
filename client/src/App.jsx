import React, { useState } from "react";
import axios from "axios";

function App() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCheck = async () => {
    if (!text.trim()) {
      alert("Please enter some text!");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await axios.post("http://localhost:5000/api/check", { text });
      setResult(response.data);
    } catch (err) {
      console.error(err);
      alert("Error checking news!");
    } finally {
      setLoading(false);
    }
  };

  // Helper to display proper result text and color
  const renderResultHeader = (status) => {
    if (status === "VERIFIED_TRUE") {
      return <h2 style={{ color: "green" }}>Result: REAL (Verified via Fact Check)</h2>;
    } else if (status === "VERIFIED_FALSE") {
      return <h2 style={{ color: "red" }}>Result: FAKE (Verified via Fact Check)</h2>;
    } else {
      return <h2 style={{ color: "orange" }}>Result: UNVERIFIED (No matching fact check found)</h2>;
    }
  };

  return (
    <div className="app">
      <h1>📰 Real or Fake News Checker</h1>
      <textarea
        placeholder="Enter news headline or paragraph..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
      />
      <button onClick={handleCheck} disabled={loading}>
        {loading ? "Checking..." : "Check News"}
      </button>

      {result && (
        <div className="result">
          {renderResultHeader(result.status)}

          <p><strong>ML Prediction:</strong> {result.mlStatus} (Confidence: {(result.mlConfidence * 100).toFixed(2)}%)</p>

          {result.newsSource && (
            <>
              <p><strong>Matched News Source:</strong> {result.newsSource}</p>
              <p><a href={result.newsLink} target="_blank" rel="noopener noreferrer">View Article</a></p>
            </>
          )}

          {result.factCheckSource && (
            <>
              <p><strong>Fact Checked By:</strong> {result.factCheckSource}</p>
              <p><strong>Fact Rating:</strong> {result.factCheckRating}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
