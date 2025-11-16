import { useState } from 'react';
import MVImage from '../../img/mv.webp';

export const SiteCapture = () => {
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
        <div className="site-capture">
            <div className="flex-site-capture">
                <section className="hero">
                    <img src={MVImage} alt="" />
                </section>

                <section className="content">
                    <form className="form" onSubmit={handleSubmit}>
                        <ul className="form-group">
                            <li className="input-form">
                                <label>URL</label>
                                <input className="input" value={url} onChange={e => setUrl(e.target.value)} />
                            </li>
                            <li className="input-form">
                                <label>Max Page</label>
                                <input className="input" type="number" value={maxPages} min={1} onChange={e => setMaxPages(Number(e.target.value))} />
                            </li>
                        </ul>

                        {/* 非表示 */}
                        <div style={{ display: "none" }}>
                            <input type="number" value={concurrency} min={1} onChange={e => setConcurrency(Number(e.target.value))} />
                        </div>

                        <button className="btn" type="submit" disabled={loading}>{loading ? "Capturing..." : "Capture Start"}</button>
                    </form>

                    <div className="log">
                        <h3>Log</h3>
                        <p>{log.map((l, i) => <div key={i}>{l}</div>)}</p>
                    </div>
                </section>
            </div>

            <div className="notice">
                <h3>注意事項</h3>
                <ul className="notice-items">
                    <li className="notice-item"><span>・</span>キャプチャ対象サイトの利用規約・著作権を必ず確認してください</li>
                    <li className="notice-item"><span>・</span>キャプチャはローカル環境のChromeを使用します</li>
                    <li className="notice-item"><span>・</span>大量ページのスクリーンショットは CPU・メモリ負荷が高くなる場合があります</li>
                    <li className="notice-item"><span>・</span>ヘッダー固定要素は微小な位置ズレが発生することがあります</li>
                    <li className="notice-item"><span>・</span>ページ内の動的コンテンツ（lazy load、スクロールで表示）はスクロール処理後にキャプチャされますが、完全保証ではありません</li>
                </ul>
            </div>
        </div>
    );
}