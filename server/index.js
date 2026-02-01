import express from "express";
import cors from "cors";
import Database from "better-sqlite3";

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb"}));

const db = new Database("bimpy.sqlite");

db.pragma("journal_mode = WAL");

db.exec(`
    CREATE TABLE IF NOT EXISTS flights (
        id TEXT PRIMARY KEY,
        start_time INTEGER NOT NULL,
        end_time INTEGER,
        notes TEXT
    );

    CREATE TABLE IF NOT EXISTS telemetry_logs (
        id  INTEGER PRIMARY KEY AUTOINCREMENT,
        flight_id TEXT NOT NULL,
        t_ms INTEGER NOT NULL, 
        altitude REAL, 
        latitude REAL,
        longitude REAL,
        speed REAL, 
        pressure REAL,
        elapsed_ms REAL,
        battery REAL,
        distance REAL,
        displacement REAL,
        FOREIGN KEY (flight_id) REFERENCES flights(id)
    );

    CREATE INDEX IF NOT EXISTS idx_logs_flight_time
    ON telemetry_logs (flight_id, t_ms);
`);

// flight start
app.post("/api/flights/start", (req, res) => {
    const { flight_id, start_time } = req.body;
    db.prepare("INSERT INTO flights (id, start_time) VALUES (?, ?)") 
        .run(String(flight_id), start_time);
    res.json({ ok: true });
});

// flight stop
app.post("/api/flights/stop", (req, res) => {
    const { flight_id, end_time } = req.body;
    db.prepare("UPDATE flights SET end_time = ? WHERE id = ? ")
    .run(end_time, String(flight_id));
    res.json({ ok: true });
})

const insertLog = db.prepare(`
    INSERT INTO telemetry_logs (
        flight_id, t_ms,
        altitude, latitude, longitude, speed, pressure,
        elapsed_ms, battery, distance, displacement
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertBatch = db.transaction((rows) => {
    for (const r of rows) {
        insertLog.run(
            String(r.flight_id),
            r.t_ms,
            r.altitude ?? null,
            r.latitude ?? null,
            r.longitude ?? null,
            r.speed ?? null,
            r.pressure ?? null,
            r.elapsed_ms ?? null, 
            r.battery ?? null,
            r.distance ?? null,
            r.displacement ?? null,
        );
    }
});

app.post("/api/logs/batch", (req, res) => {
    const rows = req.body?.rows || [];
    if (!rows.length) return res.json({ ok: true, inserted: 0 });
    insertBatch(rows);
    res.json({ ok: true, inserted: rows.length });
});

app.get("/api/flights", (req, res) => {
    const flights = db.prepare(`
        SELECT f.*,
            (SELECT COUNT(*) FROM telemetry_logs t WHERE t.flight_id = f.id) AS samples
        FROM flights f
        ORDER BY start_time DESC
    `).all();
    res.json({ flights });
});

app.get("/api/flights/:id/logs", (req, res) => {
    const id = String(req.params.id);
    const logs = db.prepare(`
        SELECT * FROM telemetry_logs
        WHERE flight_id = ?
        ORDER BY t_ms ASC
    `).all(id);
    res.json({ logs });
});


app.listen(5176, () => console.log("Local API running on http://localhost:5176"));