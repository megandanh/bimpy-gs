function BatteryRow({ label, value }) {
    return (
        <div className="launch-display">
            <div className="launch-labels">{label}</div>
            <div className="launch-vals">{value}</div>
        </div>
    );
}

export default function BatteryPanel({ battery }) {
    return (
        <div className="panel">
            <h2 className="panel-title">BATTERY</h2>
            <div style={{ marginTop: 12 }}>
                <BatteryRow label="Voltage:"   value={`${battery.bat_mv} mV`} />
                <BatteryRow label="Current:"   value={`${battery.bat_a} A`} />
                <BatteryRow label="Used:"      value={`${battery.bat_mah} mAh`} />
                <BatteryRow label="Remaining:" value={`${battery.bat_pct} %`} />
            </div>
        </div>
    );
}