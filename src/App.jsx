import { useState, useCallback, useRef } from "react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const CATEGORIES = {
  eğlence: { label: "Eğlence", color: "#f97316", keywords: ["netflix", "spotify", "sinema", "oyun", "steam", "bilet", "konser", "bar", "gece", "eğlence"] },
  yemek: { label: "Yemek & Restoran", color: "#ef4444", keywords: ["yemeksepeti", "getir", "trendyol yemek", "migros", "carrefour", "bim", "a101", "şok", "restoran", "cafe", "kahve", "pizza", "burger", "döner"] },
  market: { label: "Market & Alışveriş", color: "#8b5cf6", keywords: ["trendyol", "hepsiburada", "amazon", "n11", "lcw", "zara", "h&m", "mediamarkt", "teknosa", "market"] },
  ulaşım: { label: "Ulaşım", color: "#06b6d4", keywords: ["shell", "opet", "bp", "total", "akaryakıt", "benzin", "ist kart", "metro", "uber", "taksi", "otopark"] },
  fatura: { label: "Fatura & Abonelik", color: "#10b981", keywords: ["turkcell", "vodafone", "türk telekom", "ttnet", "elektrik", "doğalgaz", "su faturası", "sigorta"] },
  sağlık: { label: "Sağlık", color: "#ec4899", keywords: ["eczane", "hastane", "klinik", "doktor", "diş", "gözlük", "vitamin"] },
  diğer: { label: "Diğer", color: "#6b7280", keywords: [] },
};

function categorize(description) {
  const d = (description || "").toLowerCase();
  for (const [key, cat] of Object.entries(CATEGORIES)) {
    if (key === "diğer") continue;
    if (cat.keywords.some((k) => d.includes(k))) return key;
  }
  return "diğer";
}

const ASSET_RETURNS = {
  altin: { label: "Altın (XAU/TRY)", monthly: 0.031, icon: "🥇" },
  dolar: { label: "Dolar (USD/TRY)", monthly: 0.022, icon: "💵" },
  euro: { label: "Euro (EUR/TRY)", monthly: 0.019, icon: "💶" },
  faiz: { label: "Mevduat Faizi", monthly: 0.038, icon: "🏦" },
};

function calcOpportunityCost(amount, months, assetKey) {
  const rate = ASSET_RETURNS[assetKey].monthly;
  return amount * Math.pow(1 + rate, months) - amount;
}

function parseText(raw) {
  const lines = raw.split("\n").filter((l) => l.trim());
  const txns = [];
  lines.forEach((line) => {
    const amountMatch = line.match(/[\d.,]+/g);
    if (!amountMatch) return;
    const amount = parseFloat(amountMatch[amountMatch.length - 1].replace(",", "."));
    if (isNaN(amount) || amount <= 0) return;
    const desc = line.replace(/[\d.,]+/g, "").trim() || "İşlem";
    const cat = categorize(line);
    txns.push({ desc, amount, cat, date: new Date().toISOString().split("T")[0] });
  });
  return txns;
}

const SAMPLE_DATA = [
  { desc: "Netflix", amount: 189, cat: "eğlence" },
  { desc: "Spotify", amount: 99, cat: "eğlence" },
  { desc: "Steam Oyun", amount: 450, cat: "eğlence" },
  { desc: "Konser Bileti", amount: 750, cat: "eğlence" },
  { desc: "Bar & Gece", amount: 1200, cat: "eğlence" },
  { desc: "Yemeksepeti", amount: 890, cat: "yemek" },
  { desc: "Migros", amount: 2100, cat: "market" },
  { desc: "Shell Benzin", amount: 1500, cat: "ulaşım" },
  { desc: "Turkcell Fatura", amount: 399, cat: "fatura" },
  { desc: "Trendyol", amount: 1350, cat: "market" },
  { desc: "Eczane", amount: 280, cat: "sağlık" },
  { desc: "Uber", amount: 420, cat: "ulaşım" },
];

export default function App() {
  const [step, setStep] = useState("upload");
  const [transactions, setTransactions] = useState([]);
  const [pasteText, setPasteText] = useState("");
  const [selectedAsset, setSelectedAsset] = useState("altin");
  const [months, setMonths] = useState(3);
  const [goalCategory, setGoalCategory] = useState("eğlence");
  const [goalTarget, setGoalTarget] = useState(30);
  const [points, setPoints] = useState(0);
  const [goalAccepted, setGoalAccepted] = useState(false);
  const fileRef = useRef();

  const useSample = () => { setTransactions(SAMPLE_DATA); setStep("analysis"); };
  const handlePaste = () => { const parsed = parseText(pasteText); if (parsed.length > 0) { setTransactions(parsed); setStep("analysis"); } };

  const byCategory = Object.entries(transactions.reduce((acc, t) => { acc[t.cat] = (acc[t.cat] || 0) + t.amount; return acc; }, {})).map(([cat, total]) => ({ cat, total, ...CATEGORIES[cat] })).sort((a, b) => b.total - a.total);
  const totalSpend = transactions.reduce((s, t) => s + t.amount, 0);
  const topCat = byCategory[0];
  const entertainSpend = transactions.filter((t) => t.cat === "eğlence").reduce((s, t) => s + t.amount, 0);
  const opportunityGain = calcOpportunityCost(entertainSpend, months, selectedAsset);
  const trendData = [
    { ay: "2 Ay Önce", harcama: totalSpend * 0.72, eğlence: entertainSpend * 0.6 },
    { ay: "Geçen Ay", harcama: totalSpend * 0.88, eğlence: entertainSpend * 0.82 },
    { ay: "Bu Ay", harcama: totalSpend, eğlence: entertainSpend },
  ];
  const acceptGoal = () => { setGoalAccepted(true); setPoints((p) => p + 50); setStep("goals"); };

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#0a0a0f", minHeight: "100vh", color: "#e8e6ff" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;700&family=Syne:wght@700;800&display=swap" rel="stylesheet" />
      <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } .card { background: #12111f; border: 1px solid #1e1d35; border-radius: 16px; padding: 24px; } .btn-primary { background: linear-gradient(135deg, #7c5ff5, #5b8af5); color: white; border: none; border-radius: 12px; padding: 14px 28px; font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.2s; font-family: inherit; } .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(124,95,245,0.35); } .btn-secondary { background: transparent; color: #a09cc0; border: 1px solid #2d2b55; border-radius: 12px; padding: 12px 24px; font-size: 14px; cursor: pointer; transition: all 0.2s; font-family: inherit; } .pill { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; } textarea { background: #0d0c1a; border: 1px solid #2d2b55; border-radius: 12px; color: #e8e6ff; padding: 16px; font-size: 13px; resize: vertical; font-family: monospace; outline: none; width: 100%; transition: border-color 0.2s; } textarea:focus { border-color: #7c5ff5; } input[type=range] { width: 100%; accent-color: #7c5ff5; } select { background: #0d0c1a; border: 1px solid #2d2b55; border-radius: 10px; color: #e8e6ff; padding: 10px 14px; font-size: 14px; outline: none; cursor: pointer; font-family: inherit; } @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } } .fade-up { animation: fadeUp 0.5s ease forwards; }`}</style>

      <header style={{ borderBottom: "1px solid #1e1d35", padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64, position: "sticky", top: 0, background: "rgba(10,10,15,0.9)", backdropFilter: "blur(12px)", zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg,#7c5ff5,#5b8af5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>💎</div>
          <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 800, letterSpacing: "-0.5px" }}>FinWise</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {step !== "upload" && (<><button style={{ padding: "10px 20px", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 500, background: "transparent", color: "#6b6890", border: "none", fontFamily: "inherit" }} onClick={() => setStep("analysis")}>Analiz</button><button style={{ padding: "10px 20px", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 500, background: "transparent", color: "#6b6890", border: "none", fontFamily: "inherit" }} onClick={() => setStep("goals")}>Hedefler</button></>)}
          {points > 0 && (<div style={{ background: "linear-gradient(135deg,#f59e0b,#f97316)", borderRadius: 20, padding: "6px 14px", fontSize: 13, fontWeight: 700 }}>⭐ {points} puan</div>)}
        </div>
      </header>

      <main style={{ maxWidth: 960, margin: "0 auto", padding: "40px 24px" }}>
        {step === "upload" && (
          <div className="fade-up">
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(32px,5vw,52px)", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-2px", marginBottom: 16 }}>Paranı nereye<br /><span style={{ background: "linear-gradient(135deg,#7c5ff5,#5b8af5,#38bdf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>harcıyorsun?</span></h1>
              <p style={{ color: "#6b6890", fontSize: 16, maxWidth: 480, margin: "0 auto" }}>Banka ekstren veya harcamalarını yapıştır — sana fırsat maliyetini gösterelim.</p>
            </div>
            <div style={{ display: "grid", gap: 20, gridTemplateColumns: "1fr 1fr" }}>
              <div className="card">
                <div style={{ fontSize: 13, color: "#7c5ff5", fontWeight: 600, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.8px" }}>📋 Yapıştır</div>
                <p style={{ color: "#6b6890", fontSize: 13, marginBottom: 16 }}>Banka ekstrenden harcamaları kopyalayıp buraya yapıştır</p>
                <textarea rows={6} placeholder={"Netflix 189 TL\nYemeksepeti 450 TL\nShell Benzin 800 TL\n..."} value={pasteText} onChange={(e) => setPasteText(e.target.value)} />
                <button className="btn-primary" style={{ marginTop: 16, width: "100%" }} onClick={handlePaste}>Analiz Et →</button>
              </div>
              <div className="card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", background: "linear-gradient(135deg, #12111f, #1a1535)" }}>
                <div>
                  <div style={{ fontSize: 13, color: "#f97316", fontWeight: 600, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.8px" }}>🎯 Demo Dene</div>
                  <p style={{ color: "#6b6890", fontSize: 13, marginBottom: 24 }}>Henüz ekstren yok mu? Örnek verilerle nasıl çalıştığını gör.</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {["🎮 Eğlence: 2.688 ₺", "🍔 Yemek: 2.990 ₺", "🛒 Market: 3.450 ₺", "⛽ Ulaşım: 1.920 ₺"].map((item) => (<div key={item} style={{ fontSize: 13, color: "#a09cc0", display: "flex", alignItems: "center", gap: 8 }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: "#7c5ff5", display: "inline-block" }} />{item}</div>))}
                  </div>
                </div>
                <button className="btn-primary" style={{ marginTop: 24 }} onClick={useSample}>Demo Yükle →</button>
              </div>
            </div>
          </div>
        )}

        {step === "analysis" && (
          <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
              {[{ label: "Toplam Harcama", value: `${totalSpend.toLocaleString("tr-TR")} ₺`, icon: "💸", color: "#ef4444" }, { label: "En Yüksek Kategori", value: topCat?.label || "-", icon: "📊", color: "#f97316" }, { label: "Eğlenceye Giden", value: `${entertainSpend.toLocaleString("tr-TR")} ₺`, icon: "🎮", color: "#7c5ff5" }].map((item) => (
                <div key={item.label} className="card"><div style={{ fontSize: 24, marginBottom: 8 }}>{item.icon}</div><div style={{ fontSize: 22, fontWeight: 700, color: item.color, fontFamily: "'Syne', sans-serif" }}>{item.value}</div><div style={{ fontSize: 13, color: "#6b6890", marginTop: 4 }}>{item.label}</div></div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div className="card">
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 20 }}>Harcama Dağılımı</div>
                <ResponsiveContainer width="100%" height={200}><PieChart><Pie data={byCategory} dataKey="total" nameKey="label" cx="50%" cy="50%" outerRadius={80} paddingAngle={3}>{byCategory.map((entry) => (<Cell key={entry.cat} fill={entry.color} />))}</Pie><Tooltip formatter={(v) => `${v.toLocaleString("tr-TR")} ₺`} contentStyle={{ background: "#12111f", border: "1px solid #2d2b55", borderRadius: 8, color: "#e8e6ff" }} /></PieChart></ResponsiveContainer>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>{byCategory.map((c) => (<div key={c.cat} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#a09cc0" }}><span style={{ width: 8, height: 8, borderRadius: 2, background: c.color, display: "inline-block" }} />{c.label}</div>))}</div>
              </div>
              <div className="card">
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 20 }}>3 Aylık Trend</div>
                <ResponsiveContainer width="100%" height={200}><AreaChart data={trendData}><defs><linearGradient id="gTotal" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#7c5ff5" stopOpacity={0.3} /><stop offset="95%" stopColor="#7c5ff5" stopOpacity={0} /></linearGradient><linearGradient id="gEg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f97316" stopOpacity={0.3} /><stop offset="95%" stopColor="#f97316" stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="#1e1d35" /><XAxis dataKey="ay" stroke="#6b6890" tick={{ fontSize: 11 }} /><YAxis stroke="#6b6890" tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} /><Tooltip formatter={(v) => `${v.toLocaleString("tr-TR")} ₺`} contentStyle={{ background: "#12111f", border: "1px solid #2d2b55", borderRadius: 8, color: "#e8e6ff" }} /><Area type="monotone" dataKey="harcama" stroke="#7c5ff5" fill="url(#gTotal)" strokeWidth={2} name="Toplam" /><Area type="monotone" dataKey="eğlence" stroke="#f97316" fill="url(#gEg)" strokeWidth={2} name="Eğlence" /></AreaChart></ResponsiveContainer>
              </div>
            </div>
            <div className="card" style={{ background: "linear-gradient(135deg, #12111f, #1a1535)", border: "1px solid #2d2b55" }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>💡 Fırsat Maliyeti Hesabı</div>
              <p style={{ color: "#6b6890", fontSize: 13, marginBottom: 20 }}>Eğlenceye harcadığın parayı yatırsaydın ne olurdu?</p>
              <div style={{ display: "flex", gap: 16, marginBottom: 20, flexWrap: "wrap" }}>
                {Object.entries(ASSET_RETURNS).map(([key, asset]) => (<button key={key} onClick={() => setSelectedAsset(key)} style={{ padding: "10px 18px", borderRadius: 10, border: selectedAsset === key ? "2px solid #7c5ff5" : "1px solid #2d2b55", background: selectedAsset === key ? "rgba(124,95,245,0.15)" : "transparent", color: selectedAsset === key ? "#c4b5ff" : "#6b6890", cursor: "pointer", fontSize: 13, fontFamily: "inherit", transition: "all 0.2s" }}>{asset.icon} {asset.label}</button>))}
              </div>
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#6b6890", marginBottom: 8 }}><span>Süre: <strong style={{ color: "#e8e6ff" }}>{months} ay</strong></span><span>Aylık getiri: {(ASSET_RETURNS[selectedAsset].monthly * 100).toFixed(1)}%</span></div>
                <input type="range" min={1} max={24} value={months} onChange={(e) => setMonths(Number(e.target.value))} />
              </div>
              <div style={{ background: "rgba(124,95,245,0.1)", border: "1px solid rgba(124,95,245,0.3)", borderRadius: 12, padding: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ color: "#a09cc0", fontSize: 13, marginBottom: 4 }}>{months} ayda {ASSET_RETURNS[selectedAsset].label}'a yatırsaydın</div>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 32, fontWeight: 800, color: "#7c5ff5" }}>+{opportunityGain.toLocaleString("tr-TR", { maximumFractionDigits: 0 })} ₺</div>
                  <div style={{ color: "#6b6890", fontSize: 12, marginTop: 4 }}>{entertainSpend.toLocaleString("tr-TR")} ₺ eğlence harcaması üzerinden</div>
                </div>
                <div style={{ fontSize: 48 }}>{ASSET_RETURNS[selectedAsset].icon}</div>
              </div>
              <button className="btn-primary" style={{ marginTop: 20, width: "100%" }} onClick={() => setStep("goals")}>Tasarruf Görevi Al → +50 puan</button>
            </div>
          </div>
        )}

        {step === "goals" && (
          <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎯</div>
              <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, letterSpacing: "-1px", marginBottom: 8 }}>Tasarruf Hedefin</h2>
              <p style={{ color: "#6b6890", fontSize: 14 }}>Bir kategori seç, hedef belirle — 3 ay sonunda başarırsan puan kazan.</p>
            </div>
            <div className="card" style={{ textAlign: "center", background: "linear-gradient(135deg, #1a1535, #1a2035)" }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 48, fontWeight: 800, background: "linear-gradient(135deg,#f59e0b,#f97316)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{points} Puan</div>
              <div style={{ color: "#6b6890", fontSize: 13, marginTop: 4 }}>Mevcut bakiyen — markalardan ödül al</div>
              <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
                {["☕ Kahve", "🎬 Sinema", "🛒 İndirim", "✈️ Mil"].map((r) => (<span key={r} className="pill" style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.3)" }}>{r}</span>))}
              </div>
            </div>
            {!goalAccepted ? (
              <div className="card">
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 20 }}>Hedef Belirle</div>
                <div style={{ marginBottom: 16 }}><label style={{ fontSize: 13, color: "#a09cc0", display: "block", marginBottom: 8 }}>Kategori</label><select value={goalCategory} onChange={(e) => setGoalCategory(e.target.value)}>{Object.entries(CATEGORIES).map(([key, cat]) => (<option key={key} value={key}>{cat.label}</option>))}</select></div>
                <div style={{ marginBottom: 20 }}><div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#a09cc0", marginBottom: 8 }}><span>Azaltma hedefi</span><strong style={{ color: "#7c5ff5" }}>%{goalTarget}</strong></div><input type="range" min={10} max={80} step={5} value={goalTarget} onChange={(e) => setGoalTarget(Number(e.target.value))} /></div>
                <div style={{ background: "rgba(124,95,245,0.08)", borderRadius: 12, padding: 16, marginBottom: 20 }}><div style={{ fontSize: 13, color: "#a09cc0", marginBottom: 4 }}>Hedefin</div><div style={{ fontSize: 18, fontWeight: 700 }}>{CATEGORIES[goalCategory].label} harcamasını %{goalTarget} azalt</div><div style={{ fontSize: 13, color: "#6b6890", marginTop: 4 }}>3 ay içinde → <strong style={{ color: "#10b981" }}>+200 puan</strong> kazanırsın</div></div>
                <button className="btn-primary" style={{ width: "100%" }} onClick={acceptGoal}>Görevi Kabul Et ✓</button>
              </div>
            ) : (
              <div className="card" style={{ background: "linear-gradient(135deg, #0f2a1a, #12111f)", border: "1px solid #10b98133" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}><div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(16,185,129,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>✅</div><div><div style={{ fontWeight: 600 }}>Görev aktif!</div><div style={{ fontSize: 13, color: "#6b6890" }}>3 ay süren challenge başladı</div></div></div>
                <div style={{ background: "rgba(16,185,129,0.08)", borderRadius: 10, padding: 14, fontSize: 14 }}><strong style={{ color: "#10b981" }}>Hedef:</strong> {CATEGORIES[goalCategory].label} harcamasını %{goalTarget} azalt</div>
                <div style={{ marginTop: 16, fontSize: 13, color: "#6b6890" }}>Başardığında markalarımızdan ödül seçebileceksin.</div>
              </div>
            )}
            <div className="card">
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Rozetler</div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {[{ icon: "🔍", label: "İlk Analiz", earned: true }, { icon: "🎯", label: "Hedef Kurdu", earned: goalAccepted }, { icon: "📉", label: "İlk Tasarruf", earned: false }, { icon: "🏆", label: "3 Ay Şampiyonu", earned: false }, { icon: "💎", label: "Yatırımcı", earned: false }].map((badge) => (
                  <div key={badge.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, opacity: badge.earned ? 1 : 0.3, transition: "opacity 0.3s" }}>
                    <div style={{ width: 52, height: 52, borderRadius: 14, background: badge.earned ? "rgba(124,95,245,0.2)" : "#1a1a2e", border: badge.earned ? "1px solid #7c5ff5" : "1px solid #2d2b55", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>{badge.icon}</div>
                    <span style={{ fontSize: 11, color: "#a09cc0", textAlign: "center" }}>{badge.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <button className="btn-secondary" style={{ alignSelf: "center" }} onClick={() => setStep("analysis")}>← Analize Dön</button>
          </div>
        )}
      </main>
    </div>
  );
}
