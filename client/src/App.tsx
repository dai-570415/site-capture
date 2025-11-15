import React, { useState } from "react";

function App() {
  const [url, setUrl] = useState("https://example.com");
  const [maxPages, setMaxPages] = useState(20);
  const [concurrency, setConcurrency] = useState(3);
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  const appendLog = (t: string) => setLog(l => [t, ...l].slice(0, 100));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    appendLog(`Starting capture: ${url}`);

    try {
      const resp = await fetch("/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startUrl: url, maxPages, concurrency })
      });

      if (!resp.ok) {
        const j = await resp.json().catch(() => null);
        appendLog(`Server error: ${j?.error ?? resp.statusText}`);
        setLoading(false);
        return;
      }

      // receive zip blob and trigger download
      const blob = await resp.blob();
      const a = document.createElement("a");
      const urlBlob = window.URL.createObjectURL(blob);
      a.href = urlBlob;
      a.download = "screenshots.zip";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(urlBlob);
      appendLog("Download triggered.");
    } catch (err) {
      appendLog("Fetch error: " + String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 800, margin: "0 auto", fontFamily: "Arial, sans-serif" }}>
      <h1>Site Capturer (local)</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 8 }}>
          <label>Start URL: </label>
          <input style={{ width: "70%" }} value={url} onChange={e => setUrl(e.target.value)} />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>Max pages: </label>
          <input type="number" value={maxPages} min={1} onChange={e => setMaxPages(Number(e.target.value))} />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label>Concurrency: </label>
          <input type="number" value={concurrency} min={1} onChange={e => setConcurrency(Number(e.target.value))} />
        </div>
        <button type="submit" disabled={loading}>{loading ? "Capturing..." : "Start Capture & Download ZIP"}</button>
      </form>

      <section style={{ marginTop: 20 }}>
        <h2>Log</h2>
        <div style={{ maxHeight: 300, overflow: "auto", background: "#f5f5f5", padding: 10 }}>
          {log.map((l, i) => <div key={i} style={{ fontFamily: "monospace", fontSize: 12 }}>{l}</div>)}
        </div>
      </section>
    </div>
  );
}

export default App;
