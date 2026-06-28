import { useState, useEffect } from "react";

const API_BASE = "https://housing-price-predictor-wlvr.onrender.com";


const COUNTIES = [
  { label: "Nairobi",   value: 2 },
  { label: "Kiambu",    value: 4 },
  { label: "Mombasa",   value: 1 },
  { label: "Nakuru",    value: 3 },
  { label: "Thika",     value: 6 },
  { label: "Eldoret",   value: 5 },
  { label: "Machakos",  value: 7 },
  { label: "Kisumu",    value: 0 },
];

const PROPERTY_TYPES = [
  { label: "Bedsitter",  value: 0 },
  { label: "1 Bedroom",  value: 1 },
  { label: "2 Bedroom",  value: 2 },
  { label: "3 Bedroom",  value: 3 },
  { label: "Standalone", value: 4 },
];


const fmt = (val) =>
  "KSh " + new Intl.NumberFormat("en-KE", { maximumFractionDigits: 0 }).format(val);

const rentTier = (rent) => {
  if (rent < 10000) return { label: "Low Cost",  color: "#6b9fd4" };
  if (rent < 30000) return { label: "Mid Range",  color: "#7dba7d" };
  if (rent < 70000) return { label: "Premium",    color: "#e8c97a" };
  return                     { label: "Luxury",    color: "#d4829a" };
};

const affordColor = (pct) => {
  if (pct <= 30) return "#7dba7d";
  if (pct <= 50) return "#e8c97a";
  return "#d46b6b";
};

const affordLabel = (pct) => {
  if (pct <= 30) return "Comfortable — within the 30% guideline";
  if (pct <= 50) return "Stretched — above recommended threshold";
  return "High burden — over half your income";
};


const SliderInput = ({ label, min, max, step, value, onChange, description }) => {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div style={{ marginBottom: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.4rem" }}>
        <label style={{ fontFamily: "'Playfair Display', serif", fontSize: "1rem", color: "#d4c5a9" }}>{label}</label>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "1rem", fontWeight: 600, color: "#e8c97a", background: "rgba(232,201,122,0.1)", padding: "2px 10px", borderRadius: 4, border: "1px solid rgba(232,201,122,0.25)" }}>
          {fmt(value)}
        </span>
      </div>
      <p style={{ fontSize: "0.72rem", color: "#7a6f5e", marginBottom: "0.6rem", fontFamily: "'DM Sans', sans-serif" }}>{description}</p>
      <div style={{ position: "relative", height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 3 }}>
        <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${pct}%`, background: "linear-gradient(90deg, #8b6914, #e8c97a)", borderRadius: 3, transition: "width 0.1s" }} />
        <input type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
          style={{ position: "absolute", top: -7, left: 0, width: "100%", height: 20, opacity: 0, cursor: "pointer", zIndex: 2 }} />
        <div style={{ position: "absolute", top: "50%", left: `${pct}%`, transform: "translate(-50%, -50%)", width: 18, height: 18, background: "#e8c97a", borderRadius: "50%", border: "3px solid #1a1510", boxShadow: "0 0 10px rgba(232,201,122,0.5)", pointerEvents: "none", transition: "left 0.1s" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.3rem" }}>
        <span style={{ fontSize: "0.65rem", color: "#4a4035", fontFamily: "'DM Mono', monospace" }}>{fmt(min)}</span>
        <span style={{ fontSize: "0.65rem", color: "#4a4035", fontFamily: "'DM Mono', monospace" }}>{fmt(max)}</span>
      </div>
    </div>
  );
};

const PillSelector = ({ label, description, options, value, onChange, cols = 0 }) => (
  <div style={{ marginBottom: "2rem" }}>
    <label style={{ fontFamily: "'Playfair Display', serif", fontSize: "1rem", color: "#d4c5a9", display: "block", marginBottom: "0.4rem" }}>{label}</label>
    {description && <p style={{ fontSize: "0.72rem", color: "#7a6f5e", marginBottom: "0.8rem", fontFamily: "'DM Sans', sans-serif" }}>{description}</p>}
    <div style={{ display: "grid", gridTemplateColumns: cols ? `repeat(${cols}, 1fr)` : "repeat(auto-fill, minmax(90px, 1fr))", gap: "0.5rem" }}>
      {options.map(opt => (
        <button key={opt.value} onClick={() => onChange(opt.value)} style={{
          padding: "0.55rem 0.8rem",
          background: value === opt.value ? "rgba(232,201,122,0.15)" : "rgba(255,255,255,0.03)",
          border: value === opt.value ? "1px solid rgba(232,201,122,0.5)" : "1px solid rgba(255,255,255,0.08)",
          borderRadius: 8, color: value === opt.value ? "#e8c97a" : "#5a5040",
          fontFamily: "'DM Mono', monospace", fontSize: "0.78rem", cursor: "pointer", transition: "all 0.2s",
        }}>{opt.label}</button>
      ))}
    </div>
  </div>
);

const AffordabilityBar = ({ pct }) => {
  const color = affordColor(pct);
  const capped = Math.min(pct, 100);
  return (
    <div style={{ marginTop: "1.5rem", padding: "1.2rem 1.4rem", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.6rem" }}>
        <span style={{ fontSize: "0.72rem", fontFamily: "'DM Mono', monospace", color: "#5a5040", letterSpacing: "0.1em", textTransform: "uppercase" }}>Rent-to-Income Ratio</span>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "1.1rem", fontWeight: 600, color }}>{pct}%</span>
      </div>
      <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", left: "30%", top: 0, width: 1, height: "100%", background: "rgba(255,255,255,0.15)", zIndex: 1 }} />
        <div style={{ height: "100%", width: `${capped}%`, background: `linear-gradient(90deg, #7dba7d, ${color})`, borderRadius: 3, transition: "width 0.6s ease" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.4rem" }}>
        <span style={{ fontSize: "0.65rem", color: "#3a3025", fontFamily: "'DM Mono', monospace" }}>0%</span>
        <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.15)", fontFamily: "'DM Mono', monospace" }}>30% guideline</span>
        <span style={{ fontSize: "0.65rem", color: "#3a3025", fontFamily: "'DM Mono', monospace" }}>100%</span>
      </div>
      <p style={{ margin: "0.6rem 0 0", fontSize: "0.75rem", color, fontFamily: "'DM Sans', sans-serif" }}>{affordLabel(pct)}</p>
    </div>
  );
};

const FeatureContributions = ({ contributions, mae }) => (
  <div style={{ marginTop: "1.5rem", padding: "1.2rem 1.4rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(232,201,122,0.08)", borderRadius: 12 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "1rem" }}>
      <span style={{ fontSize: "0.72rem", fontFamily: "'DM Mono', monospace", color: "#5a5040", letterSpacing: "0.1em", textTransform: "uppercase" }}>
        What drove this estimate
      </span>
      <span style={{ fontSize: "0.65rem", fontFamily: "'DM Mono', monospace", color: "#3a3025" }}>
        ± {fmt(mae)}
      </span>
    </div>
    {Object.entries(contributions).map(([label, pct]) => (
      <div key={label} style={{ marginBottom: "0.8rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
          <span style={{ fontSize: "0.75rem", fontFamily: "'DM Mono', monospace", color: "#7a6f5e" }}>{label}</span>
          <span style={{ fontSize: "0.75rem", fontFamily: "'DM Mono', monospace", color: "#e8c97a" }}>{pct}%</span>
        </div>
        <div style={{ height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 2 }}>
          <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg, #4a3a10, #e8c97a)", borderRadius: 2, transition: "width 0.8s ease" }} />
        </div>
      </div>
    ))}
    <p style={{ margin: "0.8rem 0 0", fontSize: "0.68rem", color: "#3a3025", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5 }}>
      Percentages reflect the Random Forest model's feature importances across all predictions. The ± figure is the model's mean absolute error on test data.
    </p>
  </div>
);

const CountyComparisonChart = ({ comparisons, selectedCounty }) => {
  const max = Math.max(...comparisons.map(c => c.predicted_monthly_rent_ksh));
  return (
    <div style={{ marginTop: "1.5rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(232,201,122,0.1)", borderRadius: 14, padding: "1.4rem", animation: "fadeSlideUp 0.6s ease both" }}>
      <p style={{ margin: "0 0 1.2rem", fontSize: "0.72rem", fontFamily: "'DM Mono', monospace", color: "#5a5040", letterSpacing: "0.1em", textTransform: "uppercase" }}>
        All Counties · Same Property &amp; Income
      </p>
      {comparisons.map(c => {
        const isSelected = c.county_id === selectedCounty;
        const barPct = (c.predicted_monthly_rent_ksh / max) * 100;
        const tier = rentTier(c.predicted_monthly_rent_ksh);
        return (
          <div key={c.county_id} style={{ marginBottom: "0.9rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.25rem" }}>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.78rem", color: isSelected ? "#e8c97a" : "#5a5040", fontWeight: isSelected ? 600 : 400 }}>
                {c.county}{isSelected ? " ←" : ""}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: "0.62rem", fontFamily: "'DM Mono', monospace", color: tier.color }}>{tier.label}</span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.82rem", color: isSelected ? "#e8c97a" : "#7a6f5e" }}>{fmt(c.predicted_monthly_rent_ksh)}</span>
              </div>
            </div>
            <div style={{ height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 2 }}>
              <div style={{ height: "100%", width: `${barPct}%`, background: isSelected ? "linear-gradient(90deg, #8b6914, #e8c97a)" : "rgba(255,255,255,0.1)", borderRadius: 2, transition: "width 0.7s ease" }} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const Particle = ({ style }) => (
  <div style={{ position: "absolute", borderRadius: "50%", background: "radial-gradient(circle, rgba(232,201,122,0.15), transparent)", animation: "float 8s ease-in-out infinite", ...style }} />
);

export default function HousePricePredictor() {
  const [county, setCounty] = useState(2);
  const [income, setIncome] = useState(50000);
  const [propertyType, setPropertyType] = useState(1);

  const [result, setResult] = useState(null);
  const [comparisons, setComparisons] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [apiStatus, setApiStatus] = useState("checking");
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400;500&display=swap');
      @keyframes float { 0%,100%{transform:translateY(0) scale(1);opacity:.4} 50%{transform:translateY(-30px) scale(1.1);opacity:.7} }
      @keyframes fadeSlideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
      @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
      @keyframes countUp { from{opacity:0;transform:scale(0.8)} to{opacity:1;transform:scale(1)} }
    `;
    document.head.appendChild(style);
    checkHealth();
    return () => document.head.removeChild(style);
  }, []);

  const checkHealth = async () => {
    try {
      const res = await fetch(`${API_BASE}/`);
      setApiStatus(res.ok ? "online" : "offline");
    } catch { setApiStatus("offline"); }
  };

  const handlePredict = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setComparisons(null);
    setRevealed(false);
    try {
      const [predRes, cmpRes] = await Promise.all([
        fetch(`${API_BASE}/predict`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ county, monthly_income_ksh: income, property_type: propertyType }),
        }),
        fetch(`${API_BASE}/compare`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ monthly_income_ksh: income, property_type: propertyType }),
        }),
      ]);
      if (!predRes.ok) throw new Error(`Server error: ${predRes.status}`);
      const predData = await predRes.json();
      setResult(predData);
      if (cmpRes.ok) {
        const cmpData = await cmpRes.json();
        setComparisons(cmpData.comparisons);
      }
      setTimeout(() => setRevealed(true), 100);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const tier = result ? rentTier(result.predicted_monthly_rent_ksh) : null;
  const selectedCounty = COUNTIES.find(c => c.value === county);

  return (
    <div style={{ minHeight: "100vh", background: "#0e0c09", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem", position: "relative", overflow: "hidden", fontFamily: "'DM Sans', sans-serif" }}>
      <Particle style={{ width: 300, height: 300, top: "-5%", right: "10%", animationDelay: "0s" }} />
      <Particle style={{ width: 200, height: 200, bottom: "10%", left: "5%", animationDelay: "3s" }} />
      <Particle style={{ width: 150, height: 150, top: "50%", right: "5%", animationDelay: "5s" }} />

      <div style={{ maxWidth: 600, width: "100%", position: "relative", zIndex: 2 }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem", animation: "fadeSlideUp 0.8s ease both" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: "1rem" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: apiStatus === "online" ? "#7dba7d" : apiStatus === "offline" ? "#d46b6b" : "#e8c97a", animation: apiStatus === "checking" ? "pulse 1s infinite" : "none", boxShadow: `0 0 8px ${apiStatus === "online" ? "#7dba7d" : "#e8c97a"}` }} />
            <span style={{ fontSize: "0.7rem", fontFamily: "'DM Mono', monospace", color: "#5a5040", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              {apiStatus === "online" ? "API Connected" : apiStatus === "offline" ? "API Offline" : "Connecting..."}
            </span>
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(2rem, 5vw, 2.8rem)", fontWeight: 700, color: "#f0e6cc", margin: 0, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
            RentRadar Kenya<br />
          </h1>
          <p style={{ color: "#5a5040", fontSize: "0.82rem", marginTop: "0.8rem", letterSpacing: "0.04em" }}>
            8 Counties · 5 Property Types · Random Forest Model
          </p>
        </div>

        {/* Input Card */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(232,201,122,0.12)", borderRadius: 16, padding: "2rem", backdropFilter: "blur(20px)", boxShadow: "0 30px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)", animation: "fadeSlideUp 0.8s 0.2s ease both" }}>

          {/* County */}
          <PillSelector
            label="County"
            description="Where the property is located"
            options={COUNTIES}
            value={county}
            onChange={setCounty}
            cols={4}
          />

          {/* Property Type */}
          <PillSelector
            label="Property Type"
            description="The type of unit you're looking for"
            options={PROPERTY_TYPES}
            value={propertyType}
            onChange={setPropertyType}
          />

          {/* Income */}
          <SliderInput
            label="Monthly Household Income"
            min={10000} max={300000} step={5000}
            value={income}
            onChange={setIncome}
            description="Your total monthly household income (KSh)"
          />

          {/* Predict */}
          <button onClick={handlePredict} disabled={loading} style={{ width: "100%", padding: "1rem", background: loading ? "rgba(232,201,122,0.15)" : "linear-gradient(135deg, #8b6914 0%, #e8c97a 50%, #c9a84c 100%)", border: "none", borderRadius: 10, color: loading ? "#e8c97a" : "#1a1205", fontFamily: "'Playfair Display', serif", fontSize: "1rem", fontWeight: 700, letterSpacing: "0.08em", cursor: loading ? "not-allowed" : "pointer", transition: "all 0.3s ease", boxShadow: loading ? "none" : "0 4px 20px rgba(232,201,122,0.3)" }}>
            {loading ? "Consulting the Model..." : "Predict Rent →"}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div style={{ marginTop: "1rem", padding: "1rem 1.2rem", background: "rgba(212,100,100,0.08)", border: "1px solid rgba(212,100,100,0.2)", borderRadius: 10, animation: "fadeSlideUp 0.4s ease both" }}>
            <p style={{ color: "#d46b6b", margin: 0, fontSize: "0.85rem", fontFamily: "'DM Mono', monospace" }}>⚠ {error}</p>
          </div>
        )}

        {/* Result */}
        {result && (
          <div style={{ marginTop: "1.5rem", background: "rgba(232,201,122,0.05)", border: "1px solid rgba(232,201,122,0.2)", borderRadius: 16, padding: "2rem", animation: revealed ? "fadeSlideUp 0.6s ease both" : "none", boxShadow: "0 20px 60px rgba(232,201,122,0.08)" }}>
            <p style={{ color: "#5a5040", fontSize: "0.72rem", fontFamily: "'DM Mono', monospace", letterSpacing: "0.15em", textTransform: "uppercase", margin: "0 0 0.5rem", textAlign: "center" }}>
              Estimated Monthly Rent · {selectedCounty?.label} · {result.property_type}
            </p>

            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(2rem, 8vw, 3.2rem)", fontWeight: 700, color: "#e8c97a", lineHeight: 1, textAlign: "center", animation: "countUp 0.5s 0.2s ease both", opacity: 0, animationFillMode: "forwards" }}>
              {fmt(result.predicted_monthly_rent_ksh)}
            </div>

            <div style={{ marginTop: "1rem", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: tier.color }} />
              <span style={{ fontSize: "0.75rem", fontFamily: "'DM Mono', monospace", color: tier.color, letterSpacing: "0.1em" }}>{tier.label}</span>
            </div>

            {/* Affordability */}
            <AffordabilityBar pct={result.affordability_pct} />

            {/* What drove this */}
            {result.feature_contributions_pct && (
              <FeatureContributions
                contributions={result.feature_contributions_pct}
                mae={result.model_mae_ksh}
              />
            )}

            {/* County comparison */}
            {comparisons && (
              <CountyComparisonChart comparisons={comparisons} selectedCounty={county} />
            )}
          </div>
        )}

        <p style={{ textAlign: "center", color: "#2a2520", fontSize: "0.65rem", marginTop: "2rem", fontFamily: "'DM Mono', monospace", letterSpacing: "0.05em" }}>
          Powered by FastAPI · scikit-learn · Kenya Housing Data · R² {0.9167}
        </p>
      </div>
    </div>
  );
}
