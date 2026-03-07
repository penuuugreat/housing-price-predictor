import { useState, useEffect } from "react";

const API_BASE = "http://localhost:8000";

const formatCurrency = (val) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(val * 100000);

const SliderInput = ({ label, name, min, max, step, value, onChange, description, unit }) => {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div style={{ marginBottom: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.4rem" }}>
        <label style={{ fontFamily: "'Playfair Display', serif", fontSize: "1rem", color: "#d4c5a9", letterSpacing: "0.03em" }}>
          {label}
        </label>
        <span style={{
          fontFamily: "'DM Mono', monospace", fontSize: "1.1rem", fontWeight: "600",
          color: "#e8c97a", background: "rgba(232,201,122,0.1)", padding: "2px 10px",
          borderRadius: "4px", border: "1px solid rgba(232,201,122,0.25)"
        }}>
          {value}{unit}
        </span>
      </div>
      <p style={{ fontSize: "0.72rem", color: "#7a6f5e", marginBottom: "0.6rem", fontFamily: "'DM Sans', sans-serif" }}>
        {description}
      </p>
      <div style={{ position: "relative", height: "6px", background: "rgba(255,255,255,0.08)", borderRadius: "3px" }}>
        <div style={{
          position: "absolute", left: 0, top: 0, height: "100%",
          width: `${pct}%`, background: "linear-gradient(90deg, #8b6914, #e8c97a)",
          borderRadius: "3px", transition: "width 0.1s"
        }} />
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(name, parseFloat(e.target.value))}
          style={{
            position: "absolute", top: "-7px", left: 0, width: "100%", height: "20px",
            opacity: 0, cursor: "pointer", zIndex: 2
          }}
        />
        <div style={{
          position: "absolute", top: "50%", left: `${pct}%`,
          transform: "translate(-50%, -50%)",
          width: "18px", height: "18px",
          background: "#e8c97a", borderRadius: "50%",
          border: "3px solid #1a1510", boxShadow: "0 0 10px rgba(232,201,122,0.5)",
          pointerEvents: "none", transition: "left 0.1s"
        }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.3rem" }}>
        <span style={{ fontSize: "0.65rem", color: "#4a4035", fontFamily: "'DM Mono', monospace" }}>{min}</span>
        <span style={{ fontSize: "0.65rem", color: "#4a4035", fontFamily: "'DM Mono', monospace" }}>{max}</span>
      </div>
    </div>
  );
};

const Particle = ({ style }) => (
  <div style={{
    position: "absolute", borderRadius: "50%",
    background: "radial-gradient(circle, rgba(232,201,122,0.15), transparent)",
    animation: "float 8s ease-in-out infinite",
    ...style
  }} />
);

export default function HousePricePredictor() {
  const [inputs, setInputs] = useState({ MedInc: 5.0, AveRooms: 5.0, AveOccup: 3.0 });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiStatus, setApiStatus] = useState("checking");
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap');
      @keyframes float {
        0%, 100% { transform: translateY(0) scale(1); opacity: 0.4; }
        50% { transform: translateY(-30px) scale(1.1); opacity: 0.7; }
      }
      @keyframes fadeSlideUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; } 50% { opacity: 0.4; }
      }
      @keyframes shimmer {
        0% { background-position: -200% center; }
        100% { background-position: 200% center; }
      }
      @keyframes countUp {
        from { opacity: 0; transform: scale(0.8); }
        to { opacity: 1; transform: scale(1); }
      }
    `;
    document.head.appendChild(style);
    checkHealth();
    return () => document.head.removeChild(style);
  }, []);

  const checkHealth = async () => {
    try {
      const res = await fetch(`${API_BASE}/`);
      if (res.ok) setApiStatus("online");
      else setApiStatus("offline");
    } catch {
      setApiStatus("offline");
    }
  };

  const handleChange = (name, val) => setInputs(prev => ({ ...prev, [name]: val }));

  const handlePredict = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setRevealed(false);
    try {
      const res = await fetch(`${API_BASE}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inputs),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setResult(data.predicted_house_price);
      setTimeout(() => setRevealed(true), 100);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const confidenceLabel = (price) => {
    if (price < 1.5) return { label: "Below Market", color: "#6b9fd4" };
    if (price < 3.0) return { label: "Mid Range", color: "#7dba7d" };
    if (price < 5.0) return { label: "Premium", color: "#e8c97a" };
    return { label: "Luxury", color: "#d4829a" };
  };

  const tier = result !== null ? confidenceLabel(result) : null;

  return (
    <div style={{
      minHeight: "100vh", background: "#0e0c09",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "2rem", position: "relative", overflow: "hidden",
      fontFamily: "'DM Sans', sans-serif"
    }}>
      {/* Ambient particles */}
      <Particle style={{ width: 300, height: 300, top: "-5%", right: "10%", animationDelay: "0s" }} />
      <Particle style={{ width: 200, height: 200, bottom: "10%", left: "5%", animationDelay: "3s" }} />
      <Particle style={{ width: 150, height: 150, top: "50%", right: "5%", animationDelay: "5s" }} />

      {/* Grain texture overlay */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 1,
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
        opacity: 0.4
      }} />

      <div style={{ maxWidth: 560, width: "100%", position: "relative", zIndex: 2 }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem", animation: "fadeSlideUp 0.8s ease both" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "1rem" }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: apiStatus === "online" ? "#7dba7d" : apiStatus === "offline" ? "#d46b6b" : "#e8c97a",
              animation: apiStatus === "checking" ? "pulse 1s infinite" : "none",
              boxShadow: `0 0 8px ${apiStatus === "online" ? "#7dba7d" : "#e8c97a"}`
            }} />
            <span style={{ fontSize: "0.7rem", fontFamily: "'DM Mono', monospace", color: "#5a5040", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              {apiStatus === "online" ? "API Connected" : apiStatus === "offline" ? "API Offline" : "Connecting..."}
            </span>
          </div>

          <h1 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(2rem, 5vw, 2.8rem)",
            fontWeight: 700, color: "#f0e6cc",
            margin: 0, lineHeight: 1.1, letterSpacing: "-0.02em"
          }}>
            House Price
            <br />
            <em style={{ color: "#e8c97a", fontStyle: "italic" }}>Oracle</em>
          </h1>
          <p style={{ color: "#5a5040", fontSize: "0.85rem", marginTop: "0.8rem", letterSpacing: "0.04em" }}>
            California Housing · Linear Regression Model
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(232,201,122,0.12)",
          borderRadius: "16px", padding: "2rem",
          backdropFilter: "blur(20px)",
          boxShadow: "0 30px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
          animation: "fadeSlideUp 0.8s 0.2s ease both"
        }}>
          <SliderInput
            label="Median Income" name="MedInc"
            min={0.5} max={15} step={0.1} value={inputs.MedInc}
            onChange={handleChange} unit="×$10k"
            description="Median income of households in the block group"
          />
          <SliderInput
            label="Average Rooms" name="AveRooms"
            min={1} max={15} step={0.1} value={inputs.AveRooms}
            onChange={handleChange} unit=" rooms"
            description="Average number of rooms per household"
          />
          <SliderInput
            label="Average Occupancy" name="AveOccup"
            min={1} max={10} step={0.1} value={inputs.AveOccup}
            onChange={handleChange} unit=" people"
            description="Average number of occupants per household"
          />

          {/* Predict Button */}
          <button
            onClick={handlePredict}
            disabled={loading || apiStatus === "offline"}
            style={{
              width: "100%", padding: "1rem",
              background: loading
                ? "rgba(232,201,122,0.15)"
                : "linear-gradient(135deg, #8b6914 0%, #e8c97a 50%, #c9a84c 100%)",
              backgroundSize: loading ? "auto" : "200% auto",
              border: "none", borderRadius: "10px",
              color: loading ? "#e8c97a" : "#1a1205",
              fontFamily: "'Playfair Display', serif",
              fontSize: "1rem", fontWeight: 700, letterSpacing: "0.08em",
              cursor: loading || apiStatus === "offline" ? "not-allowed" : "pointer",
              transition: "all 0.3s ease",
              boxShadow: loading ? "none" : "0 4px 20px rgba(232,201,122,0.3)",
              animation: loading ? "shimmer 1.5s linear infinite" : "none",
              opacity: apiStatus === "offline" ? 0.4 : 1,
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundPosition = "right center"; }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.backgroundPosition = "left center"; }}
          >
            {loading ? "Consulting the Model..." : "Predict Price →"}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            marginTop: "1rem", padding: "1rem 1.2rem",
            background: "rgba(212, 100, 100, 0.08)",
            border: "1px solid rgba(212,100,100,0.2)", borderRadius: "10px",
            animation: "fadeSlideUp 0.4s ease both"
          }}>
            <p style={{ color: "#d46b6b", margin: 0, fontSize: "0.85rem", fontFamily: "'DM Mono', monospace" }}>
              ⚠ {error}
            </p>
          </div>
        )}

        {/* Result */}
        {result !== null && (
          <div style={{
            marginTop: "1.5rem",
            background: "rgba(232,201,122,0.05)",
            border: "1px solid rgba(232,201,122,0.2)", borderRadius: "16px",
            padding: "2rem", textAlign: "center",
            animation: revealed ? "fadeSlideUp 0.6s ease both" : "none",
            boxShadow: "0 20px 60px rgba(232,201,122,0.08)"
          }}>
            <p style={{ color: "#5a5040", fontSize: "0.72rem", fontFamily: "'DM Mono', monospace", letterSpacing: "0.15em", textTransform: "uppercase", margin: "0 0 0.5rem" }}>
              Estimated Value
            </p>
            <div style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "clamp(2rem, 8vw, 3.2rem)", fontWeight: 700,
              color: "#e8c97a", lineHeight: 1,
              animation: "countUp 0.5s 0.2s ease both", opacity: 0,
              animationFillMode: "forwards"
            }}>
              {formatCurrency(result)}
            </div>
            <div style={{ marginTop: "1rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: tier.color }} />
              <span style={{ fontSize: "0.75rem", fontFamily: "'DM Mono', monospace", color: tier.color, letterSpacing: "0.1em" }}>
                {tier.label}
              </span>
            </div>
            <p style={{ color: "#3a3025", fontSize: "0.7rem", marginTop: "1rem", fontFamily: "'DM Mono', monospace" }}>
              Raw model output: {result.toFixed(4)} × $100K
            </p>
          </div>
        )}

        {/* Footer */}
        <p style={{ textAlign: "center", color: "#2a2520", fontSize: "0.65rem", marginTop: "2rem", fontFamily: "'DM Mono', monospace", letterSpacing: "0.05em" }}>
          Powered by FastAPI · scikit-learn · California Housing Dataset
        </p>
      </div>
    </div>
  );
}
