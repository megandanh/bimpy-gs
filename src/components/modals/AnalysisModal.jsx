import "./analysisSelector.css";
import { useEffect, useMemo, useState } from "react";

const API = "http://localhost:5176";
const PAGE_SIZE = 4;

function formatDate(ms) {
    if (!ms) return "—";
    return new Date(ms).toLocaleString();
    }

function formatDuration(start, end) {
    if (!start) return "—";
    const endMs = end ?? Date.now();
    const sec = Math.max(0, Math.floor((endMs - start) / 1000));
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${String(s).padStart(2, "0")}s`;
}

export default function AnalysisModal({
    isOpen,
    onClose,
    selectedFlight,
    setSelectedFlight,
    onNext,
}) {
    const [flights, setFlights] = useState([]);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    // Fetch when modal opens
    useEffect(() => {
        if (!isOpen) return;

        setLoading(true);
        setErr("");
        setSearch("");
        setPage(0);

        fetch(`${API}/api/flights`)
        .then((r) => r.json())
        .then((data) => setFlights(data.flights || []))
        .catch((e) => setErr(String(e)))
        .finally(() => setLoading(false));
    }, [isOpen]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return flights;

        return flights.filter((f) => {
        const id = String(f.id ?? "").toLowerCase();
        const notes = String(f.notes ?? "").toLowerCase();
        const start = String(f.start_time ?? "");
        return id.includes(q) || notes.includes(q) || start.includes(q);
        });
    }, [flights, search]);

    const maxPage = Math.max(0, Math.ceil(filtered.length / PAGE_SIZE) - 1);

    const pageItems = useMemo(() => {
        const start = page * PAGE_SIZE;
        return filtered.slice(start, start + PAGE_SIZE);
    }, [filtered, page]);

    // Keep page valid if search shrinks results
    useEffect(() => {
        if (page > maxPage) setPage(maxPage);
    }, [page, maxPage]);

    if (!isOpen) return null;

    return (
        <div className="analysis-backdrop" onMouseDown={onClose}>
        <div className="analysis-modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="analysis-header">
            <h2 className="analysis-modal-title">ANALYZE FLIGHT</h2>
            <button className="analysis-x" onClick={onClose} aria-label="Close">
                ✕
            </button>
            </div>

            <div className="analysis-controls">
            <input
                className="analysis-search"
                placeholder="Search by flight id / notes / timestamp…"
                value={search}
                onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
                }}
            />
            </div>

            <div className="analysis-body">
            {loading ? (
                <div className="analysis-empty">Loading flights…</div>
            ) : err ? (
                <div className="analysis-empty">Error: {err}</div>
            ) : filtered.length === 0 ? (
                <div className="analysis-empty">No flights found.</div>
            ) : (
                <div className="analysis-results">
                {pageItems.map((f) => {
                    const selected = selectedFlight?.id === f.id;
                    return (
                    <button
                        key={f.id}
                        className={`analysis-row ${selected ? "selected" : ""}`}
                        onClick={() => setSelectedFlight(f)}
                    >
                        <div className="analysis-row-top">
                        <div className="analysis-id">Flight {f.id}</div>
                        <div className="analysis-samples">{f.samples ?? 0} samples</div>
                        </div>

                        <div className="analysis-row-bottom">
                        <div>Start: {formatDate(f.start_time)}</div>
                        <div>End: {f.end_time ? formatDate(f.end_time) : "— (incomplete)"}</div>
                        <div>Duration: {formatDuration(f.start_time, f.end_time)}</div>
                        </div>
                    </button>
                    );
                })}
                </div>
            )}
            </div>

            <div className="analysis-footer">
            <div className="analysis-pagination">
                <button
                className="analysis-pagebtn"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                Prev
                </button>
                <div className="analysis-pageinfo">
                Page {filtered.length ? page + 1 : 0} / {filtered.length ? maxPage + 1 : 0}
                </div>
                <button
                className="analysis-pagebtn"
                disabled={page >= maxPage}
                onClick={() => setPage((p) => Math.min(maxPage, p + 1))}
                >
                Next
                </button>
            </div>

            <div className="analysis-actions">
                <button
                className="analysis-next"
                disabled={!selectedFlight}
                onClick={onNext}
                >
                ANALYZE
                </button>
            </div>
            </div>
        </div>
        </div>
    );
}
