import "./remote.css";
import { useEffect, useState } from "react";

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

const toPct_1000_2000 = (v) => {
  const x = clamp(Number(v ?? 1500), 1000, 2000);
  return Math.round(((x - 1000) / 1000) * 100); // 1000->0, 2000->100
};

function ChannelBar({ label, value }) {
  const pct = toPct_1000_2000(value);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "90px 1fr 60px", gap: 10, alignItems: "center", marginBottom: 10 }}>
      <div style={{ opacity: 0.9 }}>{label}</div>

      {/* bar */}
      <div
        style={{
          height: 14,
          borderRadius: 999,
          background: "#3b3b3b",     
          border: "1px solid #5a5a5a",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: "#cfcfcf",   
            borderRadius: 999,
          }}
        />
      </div>

      {/* percent */}
      <div style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", opacity: 0.9 }}>
        {pct}%
      </div>
    </div>
  );
}

export default function RemotePanel({
  remote = { ch: Array(12).fill(1500), arm: 0, kill: 0 },
}) {
    const ch = remote.ch ?? Array(12).fill(1500);

    const roll = ch[0];
    const pitch = ch[1];
    const throttle = ch[2];
    const yaw = ch[3];

    return (
      <div className="panel">
        <h2 className="panel-title">REMOTE</h2>
        <div className="connection-verification">
          Connection: {remote.connection ? "ON" : "OFF"}
        </div>
        <div style={{ marginBottom: 12 }}>
          Arm: {remote.arm ? "ON" : "OFF"} | Kill: {remote.kill ? "ON" : "OFF"}
        </div>

        <ChannelBar label="Throttle" value={throttle} />
        <ChannelBar label="Yaw" value={yaw} />
        <ChannelBar label="Pitch" value={pitch} />
        <ChannelBar label="Roll" value={roll} />
      </div>
    );
}