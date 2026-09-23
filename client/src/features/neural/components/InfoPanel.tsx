const systems = [
  ["Reasoning", "Idle"],
  ["Vision", "Idle"],
  ["Robotics", "Offline"],
  ["Knowledge", "Ready"],
  ["Automation", "Ready"],
  ["GPU", "Unknown"],
] as const;

export function InfoPanel() {
  return (
    <aside className="neural-info glass-panel" aria-label="Subsystem preview">
      <div className="neural-info-topline">SYSTEM OVERVIEW <span>01 / 06</span></div>
      <h2>Neural activity</h2>
      <p className="neural-info-caption">Subsystem preview</p>
      <div className="neural-info-divider" />
      <dl>
        {systems.map(([label, status]) => (
          <div className="neural-info-row" key={label}>
            <dt><span className={`neural-status-dot neural-status-${status.toLowerCase()}`} />{label}</dt>
            <dd>{status}</dd>
          </div>
        ))}
      </dl>
      <p className="neural-placeholder">Preview values · live telemetry coming later</p>
    </aside>
  );
}
