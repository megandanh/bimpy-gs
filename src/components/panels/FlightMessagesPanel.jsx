import { useEffect, useState } from "react";
import "./flightMessages.css";

function MessageCard({ ts, text }) {
  const timeStr = new Date(ts).toLocaleString();
  return (
    <div className="msg-card">
      <div className="msg-ts">{timeStr}</div>
      <div className="msg-text">{text}</div>
    </div>
  );
}

export default function FlightMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);

        const res = await fetch("http://localhost:3001/api/flight-messages");
        const data = await res.json();

        if (!cancelled) setMessages(data);
      } catch (e) {
        if (!cancelled) setMessages([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="panel flight-messages-panel">
      <div className="panel-header">
        <h2 className="panel-title">FLIGHT MESSAGES</h2>
      </div>

      <div className="messages-scroll">
        {messages.length === 0 && !loading ? (
          <div className="empty">No messages.</div>
        ) : (
          messages.map((m) => (
            <MessageCard key={m.id} ts={m.timestamp} text={m.message} />
          ))
        )}
      </div>
    </div>
  );
}
