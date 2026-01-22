import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// HARDCODED FOR TESTING/DEMO PURPOSES
app.get("/api/flight-messages", (req, res) => {
  res.json([
    {
      id: "m1",
      timestamp: "2026-01-20T14:02:11.000Z",
      message: "SYSTEMS INITIALIZED, READY FOR TAKEOFF"
    },
    {
      id: "m2",
      timestamp: "2026-01-20T14:02:24.000Z",
      message: "WIND ADRIFT INCREASING"
    },
    {
      id: "m3",
      timestamp: "2026-01-20T14:03:03.000Z",
      message: "MORDOR"
    },
    {
      id: "m4",
      timestamp: "2026-01-20T14:03:19.000Z",
      message: "GO KNIGHTS"
    },
    {
      id: "m5",
      timestamp: "2026-01-20T14:03:41.000Z",
      message: "HEADING STABLE"
    }
  ]);
});

app.listen(3001, () => {
  console.log("Test backend running on http://localhost:3001");
});
