export default function Placeholder({ title }) {
  return (
    <div style={{
      maxWidth: 700, margin: "60px auto", textAlign: "center",
      color: "#94a3b8",
    }}>
      <h2 style={{ color: "#f1f5f9" }}>{title}</h2>
      <p>This page will display charts and analysis once data is imported.</p>
    </div>
  );
}
