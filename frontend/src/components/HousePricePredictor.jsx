import { useState, useEffect, useRef, useCallback } from "react";

const API_BASE = "https://housing-price-predictor-wlvr.onrender.com";

const COUNTIES = [
  { label: "Nairobi",  value: 2 },
  { label: "Kiambu",   value: 4 },
  { label: "Mombasa",  value: 1 },
  { label: "Nakuru",   value: 3 },
  { label: "Thika",    value: 6 },
  { label: "Eldoret",  value: 5 },
  { label: "Machakos", value: 7 },
  { label: "Kisumu",   value: 0 },
];

const PROPERTY_TYPES = [
  { label: "Bedsitter",  value: 0 },
  { label: "1 Bed",      value: 1 },
  { label: "2 Bed",      value: 2 },
  { label: "3 Bed",      value: 3 },
  { label: "Standalone", value: 4 },
];

// County positions on the Kenya map SVG
const COUNTY_MAP_POS = {
  2: [110, 148], // Nairobi
  4: [118, 138], // Kiambu
  1: [162, 205], // Mombasa
  3: [82,  128], // Nakuru
  6: [124, 130], // Thika
  5: [62,   95], // Eldoret
  7: [138, 185], // Machakos
  0: [48,  140], // Kisumu
};

const fmt = (v) =>
  "KSh " + new Intl.NumberFormat("en-KE", { maximumFractionDigits: 0 }).format(v);

const tierInfo = (v) => {
  if (v < 10000) return { label: "Low Cost", color: "#6b9fd4" };
  if (v < 30000) return { label: "Mid Range", color: "#7dba7d" };
  if (v < 70000) return { label: "Premium",   color: "#e8c97a" };
  return               { label: "Luxury",     color: "#d4829a" };
};

const affordColor = (p) => (p <= 30 ? "#7dba7d" : p <= 50 ? "#e8c97a" : "#d46b6b");
const affordLabel = (p) =>
  p <= 30
    ? "Comfortable — within the 30% guideline"
    : p <= 50
    ? "Stretched — above recommended threshold"
    : "High burden — over half your income";

// ─── Sub-components ──────────────────────────────────────────────────────────

function KenyaMap({ activeCounty, pulsing }) {
  const [cx, cy] = COUNTY_MAP_POS[activeCounty] || [110, 148];
  return (
    <svg
      viewBox="0 0 220 280"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        width: "100%",
        height: "100%",
        filter: pulsing ? "drop-shadow(0 0 16px rgba(232,201,122,0.6))" : "none",
        transition: "filter 0.4s ease",
      }}
      aria-label="Stylised map of Kenya highlighting selected county"
    >
      {/* Kenya silhouette */}
      <path
        d="M 80 12 L 115 10 L 135 22 L 160 28 L 175 50 L 185 68 L 192 90
           L 188 112 L 178 135 L 168 155 L 155 178 L 145 200 L 138 215
           L 128 228 L 118 240 L 105 252 L 90 255 L 78 248 L 68 236
           L 60 218 L 52 198 L 44 174 L 38 150 L 30 128 L 26 108
           L 28 88 L 36 68 L 46 50 L 58 34 L 68 20 Z"
        fill="rgba(232,201,122,0.055)"
        stroke="rgba(232,201,122,0.28)"
        strokeWidth="1.5"
      />
      {/* Lake Victoria notch */}
      <path
        d="M 30 128 Q 18 140 22 158 Q 28 170 38 150 Z"
        fill="rgba(14,12,9,0.85)"
        stroke="rgba(232,201,122,0.12)"
        strokeWidth="1"
      />
      {/* Ghost grid lines */}
      <line x1="26" y1="108" x2="192" y2="108" stroke="rgba(232,201,122,0.07)" strokeWidth="0.5" strokeDasharray="4 6" />
      <line x1="44" y1="174" x2="160" y2="174" stroke="rgba(232,201,122,0.07)" strokeWidth="0.5" strokeDasharray="4 6" />
      <line x1="110" y1="10" x2="110" y2="255" stroke="rgba(232,201,122,0.07)" strokeWidth="0.5" strokeDasharray="4 6" />

      {/* County dots */}
      {[
        { id: 2, x: 110, y: 148, label: "NAIROBI",  labelX: 120, labelY: 152 },
        { id: 1, x: 162, y: 205, label: "MOMBASA",  labelX: 168, labelY: 209 },
        { id: 0, x: 48,  y: 140, label: "KISUMU",   labelX: 8,   labelY: 137 },
        { id: 5, x: 62,  y: 95,  label: "ELDORET",  labelX: 26,  labelY: 93  },
        { id: 3, x: 82,  y: 128 },
        { id: 4, x: 118, y: 138 },
        { id: 6, x: 124, y: 130 },
        { id: 7, x: 138, y: 185 },
      ].map((dot, i) => (
        <g key={dot.id}>
          <circle
            cx={dot.x}
            cy={dot.y}
            r={dot.id === activeCounty ? 5.5 : 3.5}
            fill={dot.id === activeCounty ? "rgba(232,201,122,0.95)" : "rgba(232,201,122,0.45)"}
            style={{
              animation: `mapDotPulse 2.5s ${i * 0.5}s ease-in-out infinite`,
              transition: "r 0.3s, fill 0.3s",
            }}
          />
          {dot.id === activeCounty && (
            <circle
              cx={dot.x}
              cy={dot.y}
              r="10"
              fill="none"
              stroke="rgba(232,201,122,0.3)"
              strokeWidth="1"
            />
          )}
          {dot.label && (
            <text
              x={dot.labelX}
              y={dot.labelY}
              fill={dot.id === activeCounty ? "rgba(232,201,122,0.9)" : "rgba(232,201,122,0.45)"}
              fontFamily="DM Mono, monospace"
              fontSize="8"
              letterSpacing="0.05em"
            >
              {dot.label}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

function PillSelector({ options, value, onChange, cols = "auto-fill" }) {
  const gridCols =
    typeof cols === "number"
      ? `repeat(${cols}, 1fr)`
      : "repeat(auto-fill, minmax(90px, 1fr))";
  return (
    <div style={{ display: "grid", gridTemplateColumns: gridCols, gap: "0.45rem" }}>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          style={{
            padding: "0.5rem 0.6rem",
            background: value === opt.value ? "rgba(232,201,122,0.12)" : "rgba(255,255,255,0.025)",
            border: value === opt.value
              ? "1px solid rgba(232,201,122,0.45)"
              : "1px solid rgba(255,255,255,0.07)",
            borderRadius: 8,
            color: value === opt.value ? "#e8c97a" : "#4a4035",
            fontFamily: "'DM Mono', monospace",
            fontSize: "0.76rem",
            cursor: "pointer",
            transition: "all 0.18s",
            textAlign: "center",
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function SliderInput({ min, max, step, value, onChange }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: "0.35rem",
        }}
      >
        <span
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "0.95rem",
            color: "#d4c5a9",
          }}
        >
          Monthly household income
        </span>
        <span
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "0.95rem",
            fontWeight: 500,
            color: "#e8c97a",
            background: "rgba(232,201,122,0.08)",
            padding: "2px 10px",
            borderRadius: 4,
            border: "1px solid rgba(232,201,122,0.22)",
          }}
        >
          {fmt(value)}
        </span>
      </div>
      <p
        style={{
          fontSize: "0.71rem",
          color: "#6a5f4f",
          marginBottom: "0.75rem",
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        Your total combined monthly income (KSh)
      </p>
      <div
        style={{
          position: "relative",
          height: 6,
          background: "rgba(255,255,255,0.07)",
          borderRadius: 3,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            height: "100%",
            width: `${pct}%`,
            background: "linear-gradient(90deg, #8b6914, #e8c97a)",
            borderRadius: 3,
            transition: "width 0.08s",
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          style={{
            position: "absolute",
            top: -7,
            left: 0,
            width: "100%",
            height: 20,
            opacity: 0,
            cursor: "pointer",
            zIndex: 2,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: `${pct}%`,
            transform: "translate(-50%, -50%)",
            width: 18,
            height: 18,
            background: "#e8c97a",
            borderRadius: "50%",
            border: "3px solid #0e0c09",
            boxShadow: "0 0 10px rgba(232,201,122,0.45)",
            pointerEvents: "none",
            transition: "left 0.08s",
          }}
        />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "0.35rem",
        }}
      >
        <span style={{ fontSize: "0.62rem", color: "#3a3025", fontFamily: "'DM Mono', monospace" }}>
          KSh 10k
        </span>
        <span style={{ fontSize: "0.62rem", color: "#3a3025", fontFamily: "'DM Mono', monospace" }}>
          KSh 300k
        </span>
      </div>
    </div>
  );
}

function AffordabilityBar({ pct }) {
  const color = affordColor(pct);
  const capped = Math.min(pct, 100);
  return (
    <div
      style={{
        marginTop: "1.2rem",
        padding: "1.1rem 1.3rem",
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 12,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: "0.6rem",
        }}
      >
        <span
          style={{
            fontSize: "0.68rem",
            fontFamily: "'DM Mono', monospace",
            color: "#5a5040",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          Rent-to-income ratio
        </span>
        <span
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "1rem",
            fontWeight: 500,
            color,
          }}
        >
          {pct}%
        </span>
      </div>
      <div
        style={{
          height: 6,
          background: "rgba(255,255,255,0.06)",
          borderRadius: 3,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: "30%",
            top: 0,
            width: 1,
            height: "100%",
            background: "rgba(255,255,255,0.15)",
            zIndex: 1,
          }}
        />
        <div
          style={{
            height: "100%",
            width: `${capped}%`,
            background: `linear-gradient(90deg, #7dba7d, ${color})`,
            borderRadius: 3,
            transition: "width 0.6s ease",
          }}
        />
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "0.35rem",
        }}
      >
        <span style={{ fontSize: "0.63rem", color: "#3a3025", fontFamily: "'DM Mono', monospace" }}>0%</span>
        <span style={{ fontSize: "0.63rem", color: "rgba(255,255,255,0.14)", fontFamily: "'DM Mono', monospace" }}>
          30% guideline
        </span>
        <span style={{ fontSize: "0.63rem", color: "#3a3025", fontFamily: "'DM Mono', monospace" }}>100%</span>
      </div>
      <p style={{ margin: "0.5rem 0 0", fontSize: "0.73rem", color, fontFamily: "'DM Sans', sans-serif" }}>
        {affordLabel(pct)}
      </p>
    </div>
  );
}

function FeatureContributions({ contributions, mae }) {
  return (
    <div
      style={{
        marginTop: "1.2rem",
        padding: "1.1rem 1.3rem",
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(232,201,122,0.08)",
        borderRadius: 12,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: "1rem",
        }}
      >
        <span
          style={{
            fontSize: "0.68rem",
            fontFamily: "'DM Mono', monospace",
            color: "#5a5040",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          What drove this estimate
        </span>
        <span style={{ fontSize: "0.62rem", fontFamily: "'DM Mono', monospace", color: "#3a3025" }}>
          ± {fmt(mae)}
        </span>
      </div>
      {Object.entries(contributions).map(([label, pct]) => (
        <div key={label} style={{ marginBottom: "0.75rem" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "0.22rem",
            }}
          >
            <span style={{ fontSize: "0.73rem", fontFamily: "'DM Mono', monospace", color: "#7a6f5e" }}>
              {label}
            </span>
            <span style={{ fontSize: "0.73rem", fontFamily: "'DM Mono', monospace", color: "#e8c97a" }}>
              {pct}%
            </span>
          </div>
          <div style={{ height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 2 }}>
            <div
              style={{
                height: "100%",
                width: `${pct}%`,
                background: "linear-gradient(90deg, #4a3a10, #e8c97a)",
                borderRadius: 2,
                transition: "width 0.8s ease",
              }}
            />
          </div>
        </div>
      ))}
      <p
        style={{
          margin: "0.6rem 0 0",
          fontSize: "0.66rem",
          color: "#3a3025",
          fontFamily: "'DM Sans', sans-serif",
          lineHeight: 1.5,
        }}
      >
        Percentages reflect the Random Forest model's feature importances across all predictions.
      </p>
    </div>
  );
}

function CountyComparison({ comparisons, selectedCounty }) {
  const max = Math.max(...comparisons.map((c) => c.predicted_monthly_rent_ksh));
  return (
    <div
      style={{
        marginTop: "1.2rem",
        padding: "1.1rem 1.3rem",
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(232,201,122,0.1)",
        borderRadius: 12,
      }}
    >
      <p
        style={{
          fontSize: "0.68rem",
          fontFamily: "'DM Mono', monospace",
          color: "#5a5040",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          margin: "0 0 1rem",
        }}
      >
        All counties · same property &amp; income
      </p>
      {comparisons.map((c) => {
        const isSel = c.county_id === selectedCounty;
        const barW = (c.predicted_monthly_rent_ksh / max) * 100;
        const t = tierInfo(c.predicted_monthly_rent_ksh);
        return (
          <div key={c.county_id} style={{ marginBottom: "0.8rem" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: "0.2rem",
              }}
            >
              <span
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "0.76rem",
                  color: isSel ? "#e8c97a" : "#5a5040",
                  fontWeight: isSel ? 600 : 400,
                }}
              >
                {c.county}{isSel ? " ←" : ""}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span
                  style={{
                    fontSize: "0.62rem",
                    fontFamily: "'DM Mono', monospace",
                    color: t.color,
                  }}
                >
                  {t.label}
                </span>
                <span
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: "0.8rem",
                    color: isSel ? "#e8c97a" : "#7a6f5e",
                  }}
                >
                  {fmt(c.predicted_monthly_rent_ksh)}
                </span>
              </div>
            </div>
            <div style={{ height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 2 }}>
              <div
                style={{
                  height: "100%",
                  width: `${barW}%`,
                  background: isSel
                    ? "linear-gradient(90deg, #8b6914, #e8c97a)"
                    : "rgba(255,255,255,0.09)",
                  borderRadius: 2,
                  transition: "width 0.7s ease",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function HousePricePredictor() {
  const [county, setCounty] = useState(2);
  const [propertyType, setPropertyType] = useState(1);
  const [income, setIncome] = useState(50000);

  const [result, setResult] = useState(null);
  const [comparisons, setComparisons] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiStatus, setApiStatus] = useState("checking");
  const [mapPulsing, setMapPulsing] = useState(false);

  const predictorRef = useRef(null);

  // Inject global styles + fonts once
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap');
      *, *::before, *::after { box-sizing: border-box; }
      body { margin: 0; }
      @keyframes fadeUp   { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
      @keyframes scaleIn  { from { opacity:0; transform:scale(0.85); } to { opacity:1; transform:scale(1); } }
      @keyframes ambientFloat { 0%,100%{transform:translateY(0) scale(1);opacity:.3;} 50%{transform:translateY(-36px) scale(1.07);opacity:.55;} }
      @keyframes apiPulse { 0%,100%{opacity:1;} 50%{opacity:.3;} }
      @keyframes mapDotPulse { 0%,100%{opacity:.7;} 50%{opacity:1;} }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // API health check
  useEffect(() => {
    fetch(API_BASE + "/")
      .then((r) => setApiStatus(r.ok ? "online" : "offline"))
      .catch(() => setApiStatus("offline"));
  }, []);

  const handlePredict = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setComparisons(null);
    try {
      const [predRes, cmpRes] = await Promise.all([
        fetch(API_BASE + "/predict", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            county,
            monthly_income_ksh: income,
            property_type: propertyType,
          }),
        }),
        fetch(API_BASE + "/compare", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            monthly_income_ksh: income,
            property_type: propertyType,
          }),
        }),
      ]);
      if (!predRes.ok) throw new Error(`Server error: ${predRes.status}`);
      const predData = await predRes.json();
      setResult(predData);
      if (cmpRes.ok) {
        const cmpData = await cmpRes.json();
        setComparisons(cmpData.comparisons);
      }
      // Pulse the Kenya map
      setMapPulsing(true);
      setTimeout(() => setMapPulsing(false), 1600);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [county, income, propertyType]);

  const selectedCountyLabel = COUNTIES.find((c) => c.value === county)?.label ?? "";
  const tier = result ? tierInfo(result.predicted_monthly_rent_ksh) : null;

  // ── Shared style tokens ────────────────────────────────────────────────────
  const S = {
    page: {
      minHeight: "100vh",
      background: "#0e0c09",
      color: "#f0e6cc",
      fontFamily: "'DM Sans', sans-serif",
      overflowX: "hidden",
      position: "relative",
    },
    // ambient background orbs
    orb: (w, h, top, left, right, bottom, delay) => ({
      position: "fixed",
      width: w,
      height: h,
      borderRadius: "50%",
      background: "radial-gradient(circle, rgba(232,201,122,0.09), transparent 70%)",
      animation: `ambientFloat ${12 + delay}s ${delay}s ease-in-out infinite`,
      pointerEvents: "none",
      zIndex: 0,
      ...(top !== null && { top }),
      ...(left !== null && { left }),
      ...(right !== null && { right }),
      ...(bottom !== null && { bottom }),
    }),
    // nav
    nav: {
      position: "fixed",
      top: 0, left: 0, right: 0,
      zIndex: 100,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "1rem 2.5rem",
      background: "rgba(14,12,9,0.75)",
      backdropFilter: "blur(20px)",
      borderBottom: "1px solid rgba(255,255,255,0.05)",
    },
    sectionLabel: {
      textAlign: "center",
      marginBottom: "2.5rem",
    },
    card: {
      background: "rgba(255,255,255,0.025)",
      border: "1px solid rgba(232,201,122,0.13)",
      borderRadius: 18,
      padding: "2rem",
      backdropFilter: "blur(20px)",
      boxShadow: "0 30px 80px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.04)",
    },
    fieldGroup: { marginBottom: "1.8rem" },
    fieldLabel: {
      fontFamily: "'Playfair Display', serif",
      fontSize: "0.95rem",
      color: "#d4c5a9",
      display: "block",
      marginBottom: "0.35rem",
    },
    fieldDesc: {
      fontSize: "0.71rem",
      color: "#6a5f4f",
      marginBottom: "0.75rem",
      fontFamily: "'DM Sans', sans-serif",
    },
  };

  return (
    <div style={S.page}>
      {/* Ambient orbs */}
      <div style={S.orb(320, 320, "-80px", null, "8%", null,  0)}  aria-hidden="true" />
      <div style={S.orb(200, 200, null,   "3%",  null, "15%", 3)}  aria-hidden="true" />
      <div style={S.orb(160, 160, "45%",  null,  "2%", null,  6)}  aria-hidden="true" />
      <div style={S.orb(100, 100, "30%",  "12%", null, null,  1.5)} aria-hidden="true" />

      {/* ── Nav ── */}
      <nav style={S.nav}>
        <div
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "1.1rem",
            fontWeight: 700,
            color: "#e8c97a",
            letterSpacing: "-0.01em",
          }}
        >
          RentRadar{" "}
          <span style={{ color: "#f0e6cc", fontWeight: 400 }}>Kenya</span>
        </div>
        <div style={{ display: "flex", gap: "2rem", alignItems: "center" }}>
          <a
            href="#predictor"
            onClick={(e) => {
              e.preventDefault();
              predictorRef.current?.scrollIntoView({ behavior: "smooth" });
            }}
            style={{
              fontSize: "0.78rem",
              color: "#5a5040",
              textDecoration: "none",
              fontFamily: "'DM Mono', monospace",
              letterSpacing: "0.06em",
            }}
          >
            Predict
          </a>
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background:
                apiStatus === "online"
                  ? "#7dba7d"
                  : apiStatus === "offline"
                  ? "#d46b6b"
                  : "#e8c97a",
              boxShadow:
                apiStatus === "online"
                  ? "0 0 8px #7dba7d"
                  : "0 0 8px #e8c97a",
              animation: apiStatus !== "online" ? "apiPulse 1.5s infinite" : "none",
            }}
            title={
              apiStatus === "online"
                ? "API Online"
                : apiStatus === "offline"
                ? "API Offline"
                : "Connecting…"
            }
          />
        </div>
      </nav>

      {/* ── Hero ── */}
      <section
        style={{
          position: "relative",
          zIndex: 1,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexWrap: "wrap",
          gap: "3.5rem",
          padding: "8rem 2rem 4rem",
        }}
      >
        {/* Hero copy */}
        <div style={{ flex: "1 1 340px", maxWidth: 540 }}>
          {/* Eyebrow pill */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontFamily: "'DM Mono', monospace",
              fontSize: "0.7rem",
              letterSpacing: "0.14em",
              color: "#e8c97a",
              border: "1px solid rgba(232,201,122,0.2)",
              padding: "5px 14px",
              borderRadius: 100,
              marginBottom: "1.5rem",
              animation: "fadeUp 0.6s ease both",
            }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: "#e8c97a",
                display: "inline-block",
              }}
            />
            AI · 8 Counties · Random Forest
          </div>

          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "clamp(2.4rem, 6vw, 3.8rem)",
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              color: "#f0e6cc",
              margin: 0,
              animation: "fadeUp 0.7s 0.1s ease both",
              opacity: 0,
              animationFillMode: "forwards",
            }}
          >
            Know your rent
            <br />
            <em style={{ fontStyle: "italic", color: "#e8c97a" }}>before you move.</em>
          </h1>

          <p
            style={{
              marginTop: "1.4rem",
              fontSize: "1rem",
              color: "#7a6f5e",
              lineHeight: 1.7,
              maxWidth: 430,
              animation: "fadeUp 0.7s 0.2s ease both",
              opacity: 0,
              animationFillMode: "forwards",
            }}
          >
            Enter your county, property type, and income — get an ML-powered
            estimate in seconds, with affordability analysis and a cross-county comparison.
          </p>

          {/* Stats row */}
          <div
            style={{
              display: "flex",
              gap: "2rem",
              marginTop: "2.5rem",
              animation: "fadeUp 0.7s 0.3s ease both",
              opacity: 0,
              animationFillMode: "forwards",
            }}
          >
            {[
              { num: "91.7%",  label: "Model R²" },
              { num: "8",      label: "Counties" },
              { num: "5",      label: "Property types" },
            ].map(({ num, label }) => (
              <div key={label}>
                <div
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: "1.55rem",
                    fontWeight: 500,
                    color: "#e8c97a",
                    lineHeight: 1,
                  }}
                >
                  {num}
                </div>
                <div
                  style={{
                    fontSize: "0.68rem",
                    color: "#5a5040",
                    marginTop: 4,
                    fontFamily: "'DM Mono', monospace",
                    letterSpacing: "0.08em",
                  }}
                >
                  {label}
                </div>
              </div>
            ))}
          </div>

          {/* CTA row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1.2rem",
              marginTop: "2.5rem",
              animation: "fadeUp 0.7s 0.4s ease both",
              opacity: 0,
              animationFillMode: "forwards",
            }}
          >
            <button
              onClick={() =>
                predictorRef.current?.scrollIntoView({ behavior: "smooth" })
              }
              style={{
                padding: "0.85rem 2rem",
                background: "linear-gradient(135deg, #8b6914, #e8c97a 55%, #c9a84c)",
                border: "none",
                borderRadius: 8,
                color: "#1a1205",
                fontFamily: "'Playfair Display', serif",
                fontSize: "0.95rem",
                fontWeight: 700,
                letterSpacing: "0.06em",
                cursor: "pointer",
                boxShadow: "0 4px 24px rgba(232,201,122,0.28)",
                transition: "all 0.25s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 8px 32px rgba(232,201,122,0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "";
                e.currentTarget.style.boxShadow = "0 4px 24px rgba(232,201,122,0.28)";
              }}
            >
              Estimate my rent →
            </button>
          </div>
        </div>

        {/* Kenya map */}
        <div
          style={{
            flex: "0 0 auto",
            width: 220,
            height: 280,
            position: "relative",
            animation: "fadeUp 0.9s 0.5s ease both",
            opacity: 0,
            animationFillMode: "forwards",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: -30,
              background:
                "radial-gradient(ellipse at center, rgba(232,201,122,0.08), transparent 70%)",
              pointerEvents: "none",
            }}
          />
          <KenyaMap activeCounty={county} pulsing={mapPulsing} />
        </div>
      </section>

      {/* ── Divider ── */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          textAlign: "center",
          padding: "2rem",
          fontFamily: "'DM Mono', monospace",
          fontSize: "0.65rem",
          letterSpacing: "0.18em",
          color: "#5a5040",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
        }}
      >
        <div
          style={{
            height: 1,
            width: 80,
            background: "linear-gradient(90deg, transparent, rgba(232,201,122,0.3))",
          }}
        />
        RENT ESTIMATOR
        <div
          style={{
            height: 1,
            width: 80,
            background: "linear-gradient(90deg, rgba(232,201,122,0.3), transparent)",
          }}
        />
      </div>

      {/* ── Predictor section ── */}
      <section
        id="predictor"
        ref={predictorRef}
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 640,
          margin: "0 auto",
          padding: "0 1.5rem 6rem",
        }}
      >
        {/* Section heading */}
        <div style={S.sectionLabel}>
          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "1.8rem",
              fontWeight: 700,
              color: "#f0e6cc",
              margin: 0,
            }}
          >
            Find your price
          </h2>
          <p
            style={{
              fontSize: "0.78rem",
              color: "#5a5040",
              marginTop: "0.5rem",
              fontFamily: "'DM Mono', monospace",
              letterSpacing: "0.06em",
            }}
          >
            Model trained on Kenya rental market data · FastAPI backend
          </p>
        </div>

        {/* API status */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            marginBottom: "1.8rem",
          }}
        >
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background:
                apiStatus === "online"
                  ? "#7dba7d"
                  : apiStatus === "offline"
                  ? "#d46b6b"
                  : "#e8c97a",
              boxShadow: apiStatus === "online" ? "0 0 8px #7dba7d" : "none",
              animation: apiStatus !== "online" ? "apiPulse 1.5s infinite" : "none",
            }}
          />
          <span
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "0.68rem",
              letterSpacing: "0.1em",
              color: "#5a5040",
            }}
          >
            {apiStatus === "online"
              ? "API Connected · Kenya Rent Model"
              : apiStatus === "offline"
              ? "API Offline — predictions unavailable"
              : "Connecting to API…"}
          </span>
        </div>

        {/* Input card */}
        <div style={S.card}>
          {/* County */}
          <div style={S.fieldGroup}>
            <span style={S.fieldLabel}>County</span>
            <p style={S.fieldDesc}>Where the property is located</p>
            <PillSelector
              options={COUNTIES}
              value={county}
              onChange={setCounty}
              cols={4}
            />
          </div>

          {/* Property type */}
          <div style={S.fieldGroup}>
            <span style={S.fieldLabel}>Property type</span>
            <p style={S.fieldDesc}>The unit you're looking for</p>
            <PillSelector
              options={PROPERTY_TYPES}
              value={propertyType}
              onChange={setPropertyType}
              cols={5}
            />
          </div>

          {/* Income */}
          <div style={{ marginBottom: "0.5rem" }}>
            <SliderInput
              min={10000}
              max={300000}
              step={5000}
              value={income}
              onChange={setIncome}
            />
          </div>

          {/* Predict button */}
          <button
            onClick={handlePredict}
            disabled={loading}
            style={{
              width: "100%",
              marginTop: "1.5rem",
              padding: "1rem",
              background: loading
                ? "rgba(232,201,122,0.15)"
                : "linear-gradient(135deg, #8b6914 0%, #e8c97a 50%, #c9a84c 100%)",
              border: "none",
              borderRadius: 10,
              color: loading ? "#e8c97a" : "#1a1205",
              fontFamily: "'Playfair Display', serif",
              fontSize: "1rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.25s",
              boxShadow: loading ? "none" : "0 4px 20px rgba(232,201,122,0.28)",
            }}
          >
            {loading ? "Consulting the model…" : "Predict Rent →"}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              marginTop: "1rem",
              padding: "1rem 1.2rem",
              background: "rgba(212,100,100,0.07)",
              border: "1px solid rgba(212,100,100,0.2)",
              borderRadius: 10,
              animation: "fadeUp 0.3s ease both",
            }}
          >
            <p
              style={{
                color: "#d46b6b",
                margin: 0,
                fontSize: "0.83rem",
                fontFamily: "'DM Mono', monospace",
              }}
            >
              ⚠ {error}
            </p>
          </div>
        )}

        {/* Result */}
        {result && (
          <div
            style={{
              marginTop: "1.5rem",
              background: "rgba(232,201,122,0.04)",
              border: "1px solid rgba(232,201,122,0.2)",
              borderRadius: 18,
              padding: "2rem",
              boxShadow: "0 20px 60px rgba(232,201,122,0.07)",
              animation: "fadeUp 0.5s ease both",
            }}
          >
            {/* Meta */}
            <p
              style={{
                textAlign: "center",
                fontFamily: "'DM Mono', monospace",
                fontSize: "0.68rem",
                color: "#5a5040",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                margin: "0 0 0.5rem",
              }}
            >
              Estimated monthly rent · {selectedCountyLabel} · {result.property_type}
            </p>

            {/* Price */}
            <div
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "clamp(2rem, 8vw, 3rem)",
                fontWeight: 700,
                color: "#e8c97a",
                lineHeight: 1,
                textAlign: "center",
                animation: "scaleIn 0.45s 0.15s ease both",
                opacity: 0,
                animationFillMode: "forwards",
              }}
            >
              {fmt(result.predicted_monthly_rent_ksh)}
            </div>

            {/* Tier badge */}
            <div
              style={{
                marginTop: "0.8rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: tier.color,
                }}
              />
              <span
                style={{
                  fontSize: "0.72rem",
                  fontFamily: "'DM Mono', monospace",
                  color: tier.color,
                  letterSpacing: "0.1em",
                }}
              >
                {tier.label}
              </span>
            </div>

            <AffordabilityBar pct={result.affordability_pct} />

            {result.feature_contributions_pct && (
              <FeatureContributions
                contributions={result.feature_contributions_pct}
                mae={result.model_mae_ksh}
              />
            )}

            {comparisons && (
              <CountyComparison comparisons={comparisons} selectedCounty={county} />
            )}
          </div>
        )}
      </section>

      {/* ── Model trust strip ── */}
      <section
        style={{
          position: "relative",
          zIndex: 1,
          textAlign: "center",
          padding: "4rem 2rem",
          borderTop: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            gap: "2.5rem",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {[
            { num: "R² 0.917",      label: "Model accuracy" },
            { num: "±KSh 7,395",    label: "Mean abs. error" },
            { num: "Random Forest", label: "Algorithm" },
            { num: "3 features",    label: "County · Income · Type" },
            { num: "scikit-learn",  label: "ML framework" },
          ].map(({ num, label }) => (
            <div
              key={label}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}
            >
              <div
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "1.1rem",
                  fontWeight: 500,
                  color: "#e8c97a",
                }}
              >
                {num}
              </div>
              <div
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "0.62rem",
                  letterSpacing: "0.1em",
                  color: "#5a5040",
                }}
              >
                {label}
              </div>
            </div>
          ))}
        </div>
        <p
          style={{
            marginTop: "2rem",
            fontFamily: "'DM Mono', monospace",
            fontSize: "0.6rem",
            color: "#2a2520",
            letterSpacing: "0.05em",
          }}
        >
          Powered by FastAPI · scikit-learn · Kenya Housing Data · Deployed on Render + Vercel
        </p>
      </section>
    </div>
  );
}
