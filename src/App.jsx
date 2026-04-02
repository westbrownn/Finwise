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

      <header style={{ borderBottom: "1px solid #1e1d35", padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between",
