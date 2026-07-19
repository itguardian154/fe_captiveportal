import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import logo from "./assets/logo.png";
import * as XLSX from "xlsx";

import { API_URL as API } from "./lib/config";

// ─── Auth Helpers ─────────────────────────────────────────────────────────────
function getToken() {
  return localStorage.getItem("marketing_token") || localStorage.getItem("admin_token") || localStorage.getItem("token") || "";
}

function authHeaders() {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  };
}


// ─── Toast System ─────────────────────────────────────────────────────────────
type ToastType = "success" | "error" | "info";
interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

let toastId = 0;
let globalAddToast: ((msg: string, type: ToastType) => void) | null = null;

function toast(message: string, type: ToastType = "info") {
  if (globalAddToast) globalAddToast(message, type);
}

function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    globalAddToast = (message, type) => {
      const id = ++toastId;
      setToasts(prev => [...prev, { id, message, type }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
    };
    return () => { globalAddToast = null; };
  }, []);

  const colorMap: Record<ToastType, { bg: string; border: string; icon: string; iconColor: string }> = {
    success: { bg: "#f0fdf4", border: "#86efac", icon: "✓", iconColor: "#16a34a" },
    error: { bg: "#fef2f2", border: "#fecaca", icon: "✕", iconColor: "#dc2626" },
    info: { bg: "#eff6ff", border: "#bfdbfe", icon: "i", iconColor: "#2563eb" },
  };

  return (
    <div style={{ position: "fixed", top: 20, right: 20, zIndex: 99999, display: "flex", flexDirection: "column", gap: 8, pointerEvents: "none" }}>
      {toasts.map(t => {
        const c = colorMap[t.type];
        return (
          <div
            key={t.id}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              background: c.bg, border: `1px solid ${c.border}`,
              borderRadius: 10, padding: "11px 16px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
              fontSize: 13, color: "#1a2e1c", fontFamily: "'DM Sans',sans-serif",
              fontWeight: 500, minWidth: 240, maxWidth: 340,
              animation: "toastIn 0.25s ease",
              pointerEvents: "auto",
            }}
          >
            <span style={{
              width: 20, height: 20, borderRadius: "50%",
              background: c.iconColor, color: "white",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 700, flexShrink: 0,
            }}>
              {c.icon}
            </span>
            {t.message}
          </div>
        );
      })}
    </div>
  );
}

// ─── Type Definitions ─────────────────────────────────────────────────────────
interface PeriodFilterProps {
  value: string;
  onChange: (value: string) => void;
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (date: string) => void;
  onDateToChange: (date: string) => void;
  options?: Array<{ value: string; label: string }>;
}

interface Contact {
  id: number;
  name: string;
  no_hp?: string;
  phone?: string;
  whatsapp?: string;
  hp?: string;
  phone_number?: string;
  provinsi?: string;
  kabupaten?: string;
  is_contacted?: boolean;
  created_at?: string;
}

interface FormData {
  name: string;
  no_hp: string;
  provinsi: string;
  kabupaten: string;
}

interface AdData {
  id: string;
  title: string;
  type: "video" | "image";
  file: string | null;
  fileName: string;
  duration: number;
  isActive: boolean;
  createdAt: string;
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icon = {
  grid: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>),
  users: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>),
  map: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" /><line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" /></svg>),
  chart: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /><line x1="2" y1="20" x2="22" y2="20" /></svg>),
  settings: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>),
  logout: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>),
  chevDown: (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>),
  chevRight: (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>),
  search: (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>),
  calendar: (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>),
  plus: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>),
  phone: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.35 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.59a16 16 0 0 0 6.5 6.5l.91-.9a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg>),
  totalUsers: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>),
  pin: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>),
  mapPin: (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>),
  building: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>),
  trash: (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" /></svg>),
  excel: (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>),
  save: (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>),
  refresh: (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>),
  lock: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>),
  user: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>),
  upload: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>),
  video: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="6" width="16" height="12" rx="2"/><path d="M22 10l-4 2 4 2v-4z"/></svg>),
  image: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="2" width="20" height="20" rx="2"/><circle cx="8.5" cy="8.5" r="2.5"/><path d="M21 15l-5-4-3 3-4-4-5 5"/></svg>),
  edit: (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3l4 4-7 7H10v-4l7-7z" /><path d="M4 20h16" /></svg>),
  chevL: (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>),
  chevR: (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>),
};

const navItems = [
  { icon: "grid", label: "Dashboard", page: "dashboard" },
  { icon: "users", label: "Kontak", page: "kontak" },
  { icon: "map", label: "Wilayah", page: "wilayah" },
  { icon: "chart", label: "Laporan", page: "laporan" },
  { icon: "upload", label: "Iklan", page: "sponsor" },
  { icon: "settings", label: "Pengaturan", page: "pengaturan" },
];

const PERIOD_OPTIONS = [
  { value: "today", label: "Hari Ini" },
  { value: "yesterday", label: "Kemarin" },
  { value: "this_week", label: "Minggu Ini" },
  { value: "last_week", label: "Minggu Lalu" },
  { value: "this_month", label: "Bulan Ini" },
  { value: "last_month", label: "Bulan Lalu" },
  { value: "this_year", label: "Tahun Ini" },
  { value: "custom", label: "Kustom..." },
];

const PERIOD_OPTIONS_WITH_ALL = [{ value: "all", label: "Semua" }, ...PERIOD_OPTIONS];

const avBg = ["#dcfce7", "#dbeafe", "#fef9c3", "#ede9fe"];
const provinsiColors = ["#166534", "#1d4ed8", "#7c3aed", "#c2410c", "#b45309", "#0f766e", "#6d28d9", "#1e40af"];

function getInitials(name: string): string {
  if (!name) return "?";
  return name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
}

// ─── Helper: get phone number from contact ──────────────────────────────────
function getPhoneNumber(c: Contact): string {
  return c.no_hp || c.phone || c.whatsapp || c.hp || c.phone_number || "";
}

// ─── Period helpers ───────────────────────────────────────────────────────────
function matchesPeriod(dateStr: string | undefined, period: string, dateFrom: string, dateTo: string): boolean {
  if (period === "all") return true;
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (period === "today") return d >= today;
  if (period === "yesterday") { const y = new Date(today); y.setDate(y.getDate() - 1); return d >= y && d < today; }
  if (period === "this_week") { const sw = new Date(today); sw.setDate(today.getDate() - today.getDay()); return d >= sw; }
  if (period === "last_week") { const sw = new Date(today); sw.setDate(today.getDate() - today.getDay()); const slw = new Date(sw); slw.setDate(sw.getDate() - 7); return d >= slw && d < sw; }
  if (period === "this_month") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  if (period === "last_month") { const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1); return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear(); }
  if (period === "this_year") return d.getFullYear() === now.getFullYear();
  if (period === "custom" && dateFrom && dateTo) { const from = new Date(dateFrom); const to = new Date(dateTo); to.setHours(23, 59, 59); return d >= from && d <= to; }
  return true;
}

// ─── periodLabel dengan parameter options (sama seperti IT) ──────────────────
function periodLabel(value: string, dateFrom: string, dateTo: string, options: Array<{ value: string; label: string }> = PERIOD_OPTIONS): string {
  if (value === "custom" && dateFrom && dateTo) return `${dateFrom} – ${dateTo}`;
  return options.find(o => o.value === value)?.label ?? "Hari Ini";
}

// ─── PeriodFilter ─────────────────────────────────────────────────────────────
function PeriodFilter({ value, onChange, dateFrom, dateTo, onDateFromChange, onDateToChange, options = PERIOD_OPTIONS }: PeriodFilterProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find(o => o.value === value);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div
        onClick={() => setOpen(v => !v)}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "white", border: "1px solid #d1e9d5",
          borderRadius: 8, padding: "6px 12px", cursor: "pointer",
          fontSize: 12, color: "#2d4a30", fontWeight: 500, userSelect: "none",
        }}
      >
        <span style={{ color: "#4caf50", display: "flex" }}>{Icon.calendar}</span>
        {selected?.label ?? "Filter Tanggal"}
        <span style={{ color: "#a8c9ab", display: "flex", marginLeft: 2 }}>{Icon.chevDown}</span>
      </div>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", right: 0,
          background: "white", border: "1px solid #e4f0e6",
          borderRadius: 10, zIndex: 999, minWidth: 168,
          boxShadow: "0 8px 24px rgba(0,0,0,0.08)", overflow: "hidden",
        }}>
          {options.map(opt => (
            <div
              key={opt.value}
              onClick={() => { onChange(opt.value); if (opt.value !== "custom") setOpen(false); }}
              style={{
                padding: "9px 14px", fontSize: 13, cursor: "pointer",
                background: value === opt.value ? "#f0fdf4" : "white",
                color: value === opt.value ? "#166534" : "#4a6b4d",
                fontWeight: value === opt.value ? 600 : 400,
                borderLeft: value === opt.value ? "3px solid #16a34a" : "3px solid transparent",
              }}
              onMouseEnter={e => { if (value !== opt.value) e.currentTarget.style.background = "#f6fbf7"; }}
              onMouseLeave={e => { e.currentTarget.style.background = value === opt.value ? "#f0fdf4" : "white"; }}
            >
              {opt.label}
            </div>
          ))}
          {value === "custom" && (
            <div style={{ padding: "10px 14px 14px", borderTop: "1px solid #eef6ef", display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 11, color: "#8faa92", fontWeight: 500 }}>Dari</label>
              <input
                type="date" value={dateFrom}
                onChange={e => onDateFromChange(e.target.value)}
                style={{ fontSize: 12, padding: "5px 8px", borderRadius: 6, border: "1px solid #d1e9d5", outline: "none", color: "#2d4a30", background: "white", colorScheme: "light" }}
              />
              <label style={{ fontSize: 11, color: "#8faa92", fontWeight: 500 }}>Sampai</label>
              <input
                type="date" value={dateTo}
                onChange={e => onDateToChange(e.target.value)}
                style={{ fontSize: 12, padding: "5px 8px", borderRadius: 6, border: "1px solid #d1e9d5", outline: "none", color: "#2d4a30", background: "white", colorScheme: "light" }}
              />
              <button
                onClick={() => setOpen(false)}
                style={{ marginTop: 4, background: "#166534", color: "white", border: "none", borderRadius: 6, padding: "7px 0", fontSize: 12, cursor: "pointer", fontWeight: 600 }}
              >
                Terapkan
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
      <div style={{ width: 28, height: 28, border: "3px solid #e4f0e6", borderTop: "3px solid #166534", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    </div>
  );
}

// ─── TradingChart (grafik ala trading/investasi: grid, area gradient, garis mulus, tooltip + crosshair) ──
// Disamakan persis dengan chart pada Dashboard IT.
interface TradingSeries {
  label: string;
  color: string;
  values: number[];
  format?: (v: number) => string;
}

function TradingChart({
  categories,
  series,
  height = 220,
  showLegend = false,
}: {
  categories: string[];
  series: TradingSeries[];
  height?: number;
  showLegend?: boolean;
}) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const n = categories.length;
  const hasData = n > 0 && series.length > 0 && series.some(s => s.values.length > 0);

  if (!hasData) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: height * 0.7, color: "#a8c9ab", fontSize: 13 }}>
        Tidak ada data untuk ditampilkan
      </div>
    );
  }

  const vbW = 900;
  const pad = { top: 18, right: 14, bottom: 26, left: 48 };
  const chartW = vbW - pad.left - pad.right;
  const chartH = height - pad.top - pad.bottom;

  const allValues = series.flatMap(s => s.values);
  const rawMax = Math.max(...allValues, 0);
  const rawMin = Math.min(...allValues, 0);
  const span = rawMax - rawMin || 1;
  const maxVal = rawMax + span * 0.1;
  const minVal = rawMin >= 0 ? Math.max(0, rawMin - span * 0.1) : rawMin - span * 0.1;
  const range = maxVal - minVal || 1;

  const xStep = n > 1 ? chartW / (n - 1) : 0;
  const getX = (i: number) => pad.left + i * xStep;
  const getY = (v: number) => pad.top + chartH - ((v - minVal) / range) * chartH;

  const smoothPath = (values: number[]) => {
    if (values.length === 0) return "";
    if (values.length === 1) {
      const x = getX(0), y = getY(values[0]);
      return `M ${x},${y} L ${x},${y}`;
    }
    let d = `M ${getX(0)},${getY(values[0])}`;
    for (let i = 1; i < values.length; i++) {
      const x0 = getX(i - 1), y0 = getY(values[i - 1]);
      const x1 = getX(i), y1 = getY(values[i]);
      const midX = (x0 + x1) / 2;
      d += ` C ${midX},${y0} ${midX},${y1} ${x1},${y1}`;
    }
    return d;
  };

  const areaPath = (values: number[]) => {
    if (values.length === 0) return "";
    const line = smoothPath(values);
    const baseline = pad.top + chartH;
    return `${line} L ${getX(values.length - 1)},${baseline} L ${getX(0)},${baseline} Z`;
  };

  const gridCount = 4;
  const gridYs = Array.from({ length: gridCount + 1 }, (_, i) => pad.top + (chartH / gridCount) * i);
  const labelStep = Math.max(1, Math.ceil(n / 9));

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    const relX = (e.clientX - rect.left) / rect.width;
    const mx = relX * vbW;
    let idx = Math.round((mx - pad.left) / (xStep || 1));
    idx = Math.max(0, Math.min(n - 1, idx));
    setHoverIdx(idx);
  };

  const hoverX = hoverIdx !== null ? getX(hoverIdx) : 0;
  const hoverLeftPct = (hoverX / vbW) * 100;

  return (
    <div
      ref={containerRef}
      style={{ position: "relative", width: "100%", height }}
      onMouseMove={handleMove}
      onMouseLeave={() => setHoverIdx(null)}
    >
      <svg viewBox={`0 0 ${vbW} ${height}`} width="100%" height={height} preserveAspectRatio="none" style={{ display: "block", cursor: "crosshair" }}>
        <defs>
          {series.map(sr => (
            <linearGradient key={sr.label} id={`tg-${sr.label.replace(/\s+/g, "-")}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={sr.color} stopOpacity="0.32" />
              <stop offset="100%" stopColor={sr.color} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>

        {gridYs.map((y, i) => (
          <line key={i} x1={pad.left} y1={y} x2={vbW - pad.right} y2={y} stroke="#eef4ee" strokeWidth="1" />
        ))}
        {gridYs.map((y, i) => {
          const val = maxVal - (range / gridCount) * i;
          const disp = Math.abs(val) >= 1000 ? `${(val / 1000).toFixed(1)}k` : val.toFixed(val % 1 === 0 ? 0 : 1);
          return (
            <text key={i} x={pad.left - 8} y={y + 3} textAnchor="end" fontSize="9.5" fill="#a8c9ab" fontFamily="'DM Mono',monospace">
              {disp}
            </text>
          );
        })}

        {categories.map((c, i) => {
          if (i % labelStep !== 0 && i !== n - 1) return null;
          return (
            <text key={i} x={getX(i)} y={height - 6} textAnchor="middle" fontSize="9.5" fill="#a8c9ab" fontFamily="'DM Mono',monospace">
              {c}
            </text>
          );
        })}

        {hoverIdx !== null && (
          <line x1={getX(hoverIdx)} y1={pad.top} x2={getX(hoverIdx)} y2={pad.top + chartH} stroke="#9fc7a3" strokeWidth="1" strokeDasharray="3 3" />
        )}

        {series.map(sr => (
          <path key={`area-${sr.label}`} d={areaPath(sr.values)} fill={`url(#tg-${sr.label.replace(/\s+/g, "-")})`} stroke="none" />
        ))}
        {series.map(sr => (
          <path key={`line-${sr.label}`} d={smoothPath(sr.values)} fill="none" stroke={sr.color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        ))}

        {series.map(sr => {
          const lastIdx = sr.values.length - 1;
          if (lastIdx < 0) return null;
          const lx = getX(lastIdx), ly = getY(sr.values[lastIdx]);
          return (
            <g key={`end-${sr.label}`}>
              <circle cx={lx} cy={ly} r="8" fill={sr.color} opacity="0.16" />
              <circle cx={lx} cy={ly} r="3.5" fill="white" stroke={sr.color} strokeWidth="2" />
            </g>
          );
        })}

        {hoverIdx !== null && series.map(sr => (
          sr.values[hoverIdx] !== undefined && (
            <circle key={`hov-${sr.label}`} cx={getX(hoverIdx)} cy={getY(sr.values[hoverIdx])} r="4.5" fill="white" stroke={sr.color} strokeWidth="2.2" />
          )
        ))}
      </svg>

      {hoverIdx !== null && (
        <div
          style={{
            position: "absolute",
            left: `${hoverLeftPct}%`,
            top: 6,
            transform: hoverLeftPct > 70 ? "translateX(-100%)" : hoverLeftPct < 10 ? "translateX(0%)" : "translateX(-50%)",
            background: "white",
            border: "1px solid #d1e9d5",
            borderRadius: 8,
            padding: "8px 11px",
            fontSize: 11,
            boxShadow: "0 6px 20px rgba(0,0,0,0.10)",
            pointerEvents: "none",
            whiteSpace: "nowrap",
            zIndex: 10,
          }}
        >
          <div style={{ color: "#8faa92", fontWeight: 600, marginBottom: 4 }}>{categories[hoverIdx]}</div>
          {series.map(sr => (
            <div key={sr.label} style={{ display: "flex", alignItems: "center", gap: 6, color: "#2d4a30", padding: "1px 0" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: sr.color, display: "inline-block", flexShrink: 0 }} />
              <span style={{ color: "#6b8f6e" }}>{sr.label}:</span>
              <strong>{sr.format ? sr.format(sr.values[hoverIdx] ?? 0) : sr.values[hoverIdx] ?? 0}</strong>
            </div>
          ))}
        </div>
      )}

      {showLegend && (
        <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 4 }}>
          {series.map(sr => (
            <div key={sr.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 10, height: 10, background: sr.color, borderRadius: 3 }} />
              <span style={{ fontSize: 11, color: "#6b8f6e" }}>{sr.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Helper: build daily trend ───────────────────────────────────────────────
function buildDailyTrend(list: Contact[]): Array<{ date: string; value: number }> {
  const map: Record<string, number> = {};
  list.forEach(c => {
    if (!c.created_at) return;
    const key = c.created_at.slice(0, 10);
    map[key] = (map[key] || 0) + 1;
  });
  return Object.keys(map).sort().map(date => ({ date: date.slice(5).split("-").reverse().join("/"), value: map[date] }));
}

// ─── Helper: group by region ──────────────────────────────────────────────────
function groupByRegion(list: Contact[]) {
  const grouped: Record<string, Contact[]> = {};
  list.forEach(c => {
    const key = c.provinsi || "Tidak Diketahui";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(c);
  });
  return grouped;
}

// ════════════════════════════════════════════════════════════════════════════
// PAGE: DASHBOARD
// ════════════════════════════════════════════════════════════════════════════
function PageDashboard() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("this_month");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/marketing/contacts`, { 
        headers: authHeaders() 
      });
      const data = await res.json();
      console.log("Dashboard API Response:", data);
      if (data.success) {
        setContacts(data.data || []);
      } else {
        toast(data.message || "Gagal mengambil data kontak", "error");
      }
    } catch (e) { 
      console.error("Fetch error:", e);
      toast("Gagal terhubung ke server", "error");
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filtered = contacts.filter(c => matchesPeriod(c.created_at, period, dateFrom, dateTo));

  const total = filtered.length;
  const contacted = filtered.filter(c => c.is_contacted).length;
  const uncontacted = total - contacted;
  const contactedPct = total > 0 ? Math.round((contacted / total) * 100) : 0;
  const uncontactedPct = total > 0 ? Math.round((uncontacted / total) * 100) : 0;
  const totalProvinsi = new Set(filtered.map(c => c.provinsi).filter(Boolean)).size;
  const totalKabupaten = new Set(filtered.map(c => c.kabupaten).filter(Boolean)).size;

  const sebaranProvinsi = Object.entries(
    filtered.reduce<Record<string, number>>((acc, c) => {
      const key = c.provinsi || "Tidak Diketahui";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {})
  ).map(([provinsi, total]) => ({ provinsi, total })).sort((a, b) => b.total - a.total);

  const trend = buildDailyTrend(filtered);

  const recent = [...filtered]
    .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""))
    .slice(0, 6);

  const metricCards = [
    { label: "Total Kontak", sub: periodLabel(period, dateFrom, dateTo), value: total, unit: "Orang", color: "#166534", bg: "#f0fdf4", border: "#bbf7d0", icon: "totalUsers", trend: "Data tersimpan", trendUp: true },
    { label: "Sudah Dihubungi", sub: `${contactedPct}% dari total`, value: contacted, unit: "Kontak", color: "#15803d", bg: "#f0fdf4", border: "#86efac", icon: "phone", trend: "Follow up aktif", trendUp: true },
    { label: "Total Provinsi", sub: "Terjangkau", value: totalProvinsi, unit: "Provinsi", color: "#7c3aed", bg: "#faf5ff", border: "#ddd6fe", icon: "pin", trend: "Tersebar luas", trendUp: true },
    { label: "Total Kabupaten", sub: "Terjangkau", value: totalKabupaten, unit: "Kabupaten", color: "#c2410c", bg: "#fff7ed", border: "#fed7aa", icon: "building", trend: "Cakupan wilayah", trendUp: null },
  ];

  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <PeriodFilter value={period} onChange={setPeriod} dateFrom={dateFrom} dateTo={dateTo} onDateFromChange={setDateFrom} onDateToChange={setDateTo} />
      </div>

      {loading ? <Spinner /> : (
        <>
          <div style={s.cardGrid}>
            {metricCards.map((m, i) => (
              <div key={m.label} style={{ ...s.card, animationDelay: `${i * 65}ms` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={s.cLabel}>{m.label}</div>
                    <div style={s.cSub}>{m.sub}</div>
                  </div>
                  <div style={{ ...s.icoBox, background: m.bg, border: `1px solid ${m.border}`, color: m.color }}>
                    {Icon[m.icon as keyof typeof Icon]}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 5, marginTop: 12 }}>
                  <span style={{ ...s.cNum, color: m.color }}>{m.value}</span>
                  <span style={s.cUnit}>{m.unit}</span>
                </div>
                <div style={{ fontSize: 11, marginTop: 4, color: m.trendUp === true ? "#15803d" : m.trendUp === false ? "#dc2626" : "#a8c9ab" }}>
                  {m.trend}
                </div>
              </div>
            ))}
          </div>

          <div style={s.row}>
            <div style={{ ...s.panel, flex: 1 }}>
              <div style={s.ph}>
                <span style={s.ptitle}>Tren Pendaftaran Kontak</span>
                <span style={s.psub}>Per hari — {periodLabel(period, dateFrom, dateTo)}</span>
              </div>
              <TradingChart
                categories={trend.map(t => t.date)}
                series={[
                  { label: "Kontak Baru", color: "#16a34a", values: trend.map(t => t.value), format: v => `${v} kontak` },
                ]}
                height={200}
              />
            </div>

            <div style={{ ...s.panel, minWidth: 196, maxWidth: 226 }}>
              <div style={s.ph}>
                <span style={s.ptitle}>Rekap Kontak</span>
                <span style={s.psub}>{periodLabel(period, dateFrom, dateTo)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "center", margin: "14px 0" }}>
                <svg viewBox="0 0 110 110" width="108" height="108">
                  <circle cx="55" cy="55" r="44" fill="none" stroke="#f0fdf4" strokeWidth="11" />
                  <circle cx="55" cy="55" r="44" fill="none" stroke="#16a34a" strokeWidth="11"
                    strokeDasharray={`${2 * Math.PI * 44 * (contactedPct / 100)} ${2 * Math.PI * 44 * (1 - contactedPct / 100)}`}
                    strokeLinecap="round" transform="rotate(-90 55 55)" />
                  <circle cx="55" cy="55" r="44" fill="none" stroke="#1d4ed8" strokeWidth="11"
                    strokeDasharray={`${2 * Math.PI * 44 * (uncontactedPct / 100)} ${2 * Math.PI * 44 * (1 - uncontactedPct / 100)}`}
                    strokeDashoffset={-(2 * Math.PI * 44 * (contactedPct / 100))}
                    strokeLinecap="round" transform="rotate(-90 55 55)" />
                  <text x="55" y="51" textAnchor="middle" fontSize="17" fontWeight="600" fill="#166534">{total}</text>
                  <text x="55" y="64" textAnchor="middle" fontSize="9" fill="#a8c9ab">Total Kontak</text>
                </svg>
              </div>
              {[
                { label: "Sudah Dihubungi", pct: `${contactedPct}%`, color: "#16a34a" },
                { label: "Belum Dihubungi", pct: `${uncontactedPct}%`, color: "#1d4ed8" },
              ].map(lg => (
                <div key={lg.label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid #f0faf2" }}>
                  <div style={{ width: 7, height: 7, borderRadius: 2, background: lg.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: "#6b8f6e", flex: 1 }}>{lg.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: lg.color }}>{lg.pct}</span>
                </div>
              ))}
            </div>

            <div style={{ ...s.panel, minWidth: 200, maxWidth: 240 }}>
              <div style={s.ph}><span style={s.ptitle}>Sebaran Provinsi</span></div>
              {sebaranProvinsi.slice(0, 6).map((p, i) => (
                <div key={p.provinsi} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid #f0faf2" }}>
                  <div style={{ width: 7, height: 7, borderRadius: 2, background: provinsiColors[i % 8], flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: "#6b8f6e", flex: 1 }}>{p.provinsi}</span>
                  <div style={{ flex: 1, height: 4, background: "#f0faf2", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ width: `${total > 0 ? (p.total / total) * 100 : 0}%`, height: "100%", background: provinsiColors[i % 8], borderRadius: 3 }} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: provinsiColors[i % 8], width: 22, textAlign: "right" }}>{p.total}</span>
                </div>
              ))}
              {sebaranProvinsi.length === 0 && (
                <div style={{ fontSize: 12, color: "#a8c9ab", textAlign: "center", padding: "20px 0" }}>Belum ada data</div>
              )}
            </div>
          </div>

          <div style={s.panel}>
            <div style={{ ...s.ph, marginBottom: 12 }}>
              <span style={s.ptitle}>Kontak Terbaru</span>
              <button style={s.refBtn} onClick={fetchAll}>
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}>{Icon.refresh} Refresh</span>
              </button>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
                <thead>
                  <tr>
                    {["Nama", "No. WhatsApp", "Provinsi", "Kabupaten", "Bergabung", "Status"].map(h => (
                      <th key={h} style={s.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recent.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: "center", padding: 32, color: "#a8c9ab", fontSize: 13 }}>Tidak ada data kontak</td></tr>
                  ) : recent.map((c, i) => {
                    const phone = getPhoneNumber(c);
                    return (
                      <tr key={c.id} style={{ background: i % 2 === 0 ? "#fafff8" : "white" }}>
                        <td style={s.td}>
                          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                            <div style={{ ...s.av, background: avBg[i % 4] }}>{getInitials(c.name)}</div>
                            <span style={{ fontSize: 13, fontWeight: 500, color: "#2d4a30" }}>{c.name}</span>
                          </div>
                        </td>
                        <td style={s.td}>
                          {phone ? (
                            <a href={`https://wa.me/${phone.replace(/^0/, "")}`} target="_blank" rel="noreferrer" style={{ ...s.ip, color: "#166534", textDecoration: "none", fontWeight: 600 }}>{phone}</a>
                          ) : (
                            <span style={{ fontSize: 12, color: "#a8c9ab" }}>-</span>
                          )}
                        </td>
                        <td style={s.td}><span style={{ fontSize: 12, color: "#6b8f6e" }}>{c.provinsi ?? "-"}</span></td>
                        <td style={s.td}><span style={{ fontSize: 12, color: "#6b8f6e" }}>{c.kabupaten ?? "-"}</span></td>
                        <td style={s.td}><span style={{ fontSize: 12, color: "#8faa92" }}>{c.created_at?.slice(0, 10) ?? "-"}</span></td>
                        <td style={s.td}>
                          <span style={{ ...s.badge, ...(c.is_contacted ? s.bon : s.bidl) }}>
                            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "currentColor", display: "inline-block", marginRight: 5, verticalAlign: "middle" }} />
                            {c.is_contacted ? "Dihubungi" : "Belum"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// PAGE: KONTAK - DENGAN PENGELOMPOKAN DAERAH & PAGINATION
// ════════════════════════════════════════════════════════════════════════════
type ViewMode = "table" | "group";

function PageKontak() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterProvinsi, setFilterProvinsi] = useState("Semua");
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [period, setPeriod] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormData>({ name: "", no_hp: "", provinsi: "", kabupaten: "" });
  const [editId, setEditId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  
  // ─── Pagination State ─────────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/marketing/contacts`, { 
        headers: authHeaders() 
      });
      const data = await res.json();
      console.log("Kontak API Response:", data);
      if (data.success) {
        setContacts(data.data || []);
      } else {
        toast(data.message || "Gagal mengambil data kontak", "error");
      }
    } catch (e) { 
      console.error("Fetch error:", e);
      toast("Gagal terhubung ke server", "error");
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const allProvinsi = ["Semua", ...Array.from(new Set(contacts.map(c => c.provinsi).filter(Boolean) as string[]))];

  const filtered = useMemo(() => contacts
    .filter(c => matchesPeriod(c.created_at, period, dateFrom, dateTo))
    .filter(c => filterProvinsi === "Semua" || c.provinsi === filterProvinsi)
    .filter(c => filterStatus === "Semua" || (filterStatus === "Dihubungi" ? c.is_contacted : !c.is_contacted))
    .filter(c => {
      const q = search.toLowerCase();
      const phone = getPhoneNumber(c);
      return c.name?.toLowerCase().includes(q) || 
             phone?.includes(search) || 
             c.kabupaten?.toLowerCase().includes(q) || 
             c.provinsi?.toLowerCase().includes(q);
    }), [contacts, period, dateFrom, dateTo, filterProvinsi, filterStatus, search]);

  // Reset ke halaman 1 setiap kali filter/pencarian/periode berubah
  useEffect(() => { setCurrentPage(1); }, [search, filterProvinsi, filterStatus, period, dateFrom, dateTo, contacts.length]);

  const grouped = useMemo(() => groupByRegion(filtered), [filtered]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedUsers = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  const toggleGroup = (prov: string) => setExpandedGroups(prev => ({ ...prev, [prov]: !prev[prov] }));

  useEffect(() => {
    const keys = Object.keys(grouped);
    if (keys.length === 0) return;
    setExpandedGroups(prev => {
      const missing = keys.filter(k => prev[k] === undefined);
      // ✅ FIX: kalau tidak ada key baru, kembalikan `prev` apa adanya (referensi
      // sama) supaya React tidak menganggap state berubah dan tidak render ulang.
      // Sebelumnya di sini selalu return objek baru (`{...prev}`) walau isinya
      // identik, sehingga effect ini + render ulang saling memicu tanpa henti
      // (infinite loop) dan bikin klik "halaman selanjutnya" jadi tidak responsif.
      if (missing.length === 0) return prev;
      const next = { ...prev };
      missing.forEach(k => { next[k] = true; });
      return next;
    });
  }, [grouped]);

  function openAdd() {
    setForm({ name: "", no_hp: "", provinsi: "", kabupaten: "" });
    setEditId(null);
    setShowModal(true);
  }

  function openEdit(c: Contact) {
    const phone = getPhoneNumber(c);
    setForm({ name: c.name, no_hp: phone, provinsi: c.provinsi ?? "", kabupaten: c.kabupaten ?? "" });
    setEditId(c.id);
    setShowModal(true);
  }

  async function saveForm() {
    if (!form.name.trim() || !form.no_hp.trim()) { 
      toast("Nama dan No. HP wajib diisi", "error"); 
      return; 
    }
    try {
      const url = editId ? `${API}/api/marketing/contacts/${editId}` : `${API}/api/marketing/contacts`;
      const payload = {
        name: form.name,
        no_hp: form.no_hp,
        provinsi: form.provinsi,
        kabupaten: form.kabupaten,
      };
      const res = await fetch(url, { 
        method: editId ? "PUT" : "POST", 
        headers: authHeaders(), 
        body: JSON.stringify(payload) 
      });
      const data = await res.json();
      if (data.success || res.ok) {
        toast(editId ? "Kontak berhasil diperbarui" : "Kontak berhasil ditambahkan", "success");
        await fetchAll();
        setShowModal(false);
      } else {
        toast(data.message ?? "Gagal menyimpan kontak", "error");
      }
    } catch (e) { 
      toast("Server error", "error"); 
    }
  }

  async function doDelete() {
    if (!deleteId) return;
    try {
      const res = await fetch(`${API}/api/marketing/contacts/${deleteId}`, { 
        method: "DELETE", 
        headers: authHeaders() 
      });
      const data = await res.json();
      if (data.success || res.ok) {
        toast("Kontak berhasil dihapus", "success");
        await fetchAll();
      } else {
        toast(data.message ?? "Gagal menghapus kontak", "error");
      }
    } catch (e) { 
      toast("Server error", "error"); 
    }
    setDeleteId(null);
  }

  const exportToExcel = () => {
    setIsExporting(true);
    try {
      const exportData = filtered.map((c, idx) => ({
        "No": idx + 1,
        "Nama": c.name,
        "No. WhatsApp": getPhoneNumber(c) || "-",
        "Provinsi": c.provinsi || "-",
        "Kabupaten": c.kabupaten || "-",
        "Status": c.is_contacted ? "Dihubungi" : "Belum Dihubungi",
        "Tanggal Daftar": c.created_at?.slice(0, 10) || "-",
      }));
      const ws = XLSX.utils.json_to_sheet(exportData);
      ws['!cols'] = [{ wch: 5 }, { wch: 25 }, { wch: 16 }, { wch: 20 }, { wch: 20 }, { wch: 16 }, { wch: 14 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Data Kontak");
      const periodText = period === "custom" && dateFrom && dateTo ? `${dateFrom}_sd_${dateTo}` : period;
      XLSX.writeFile(wb, `kontak_${periodText}_${new Date().toISOString().split("T")[0]}.xlsx`);
      toast(`Berhasil mengekspor ${filtered.length} data kontak`, "success");
    } catch (error) {
      console.error("Export error:", error);
      toast("Gagal mengekspor data", "error");
    }
    setIsExporting(false);
  };

  if (loading) return <Spinner />;

  const TableHead = () => (
    <thead>
      <tr>
        {["#", "Nama", "No. WhatsApp", "Provinsi", "Kabupaten", "Status", "Bergabung", "Aksi"].map(h => (
          <th key={h} style={s.th}>{h}</th>
        ))}
      </tr>
    </thead>
  );

  const ContactRow = ({ c, i, globalIdx }: { c: Contact; i: number; globalIdx: number }) => {
    const phone = getPhoneNumber(c);
    return (
      <tr style={{ background: i % 2 === 0 ? "#fafff8" : "white" }}>
        <td style={s.td}><span style={{ fontSize: 12, color: "#a8c9ab" }}>{globalIdx + 1}</span></td>
        <td style={s.td}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ ...s.av, background: avBg[globalIdx % 4] }}>{getInitials(c.name)}</div>
            <span style={{ fontSize: 13, fontWeight: 500, color: "#2d4a30" }}>{c.name}</span>
          </div>
        </td>
        <td style={s.td}>
          {phone ? (
            <a href={`https://wa.me/${phone.replace(/^0/, "")}`} target="_blank" rel="noreferrer" style={{ ...s.ip, color: "#166534", textDecoration: "none", fontWeight: 600 }}>{phone}</a>
          ) : (
            <span style={{ fontSize: 12, color: "#a8c9ab" }}>-</span>
          )}
        </td>
        <td style={s.td}><span style={{ fontSize: 12, color: "#6b8f6e" }}>{c.provinsi ?? "-"}</span></td>
        <td style={s.td}><span style={{ fontSize: 12, color: "#6b8f6e" }}>{c.kabupaten ?? "-"}</span></td>
        <td style={s.td}>
          <span style={{ ...s.badge, ...(c.is_contacted ? s.bon : s.bidl) }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "currentColor", display: "inline-block", marginRight: 5, verticalAlign: "middle" }} />
            {c.is_contacted ? "Dihubungi" : "Belum"}
          </span>
        </td>
        <td style={s.td}><span style={{ fontSize: 12, color: "#8faa92" }}>{c.created_at?.slice(0, 10) ?? "-"}</span></td>
        <td style={s.td}>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => openEdit(c)} style={{ fontSize: 11, color: "#1d4ed8", background: "#dbeafe", border: "1px solid #bfdbfe", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontWeight: 500 }}>Edit</button>
            <button onClick={() => setDeleteId(c.id)} style={{ fontSize: 11, color: "#dc2626", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontWeight: 500 }}>Hapus</button>
          </div>
        </td>
      </tr>
    );
  };

  // ─── Pagination Controls ───────────────────────────────────────────────────
  const Pagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14, paddingTop: 12, borderTop: "1px solid #eef6ef", flexWrap: "wrap", gap: 10 }}>
        <span style={{ fontSize: 12, color: "#8faa92" }}>
          Menampilkan {(safePage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(safePage * ITEMS_PER_PAGE, filtered.length)} dari {filtered.length} kontak
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={safePage === 1}
            style={{ ...s.pageBtn, opacity: safePage === 1 ? 0.4 : 1, cursor: safePage === 1 ? "not-allowed" : "pointer" }}
          >
            {Icon.chevL}
          </button>
          <span style={{
            fontSize: 12, fontWeight: 600, color: "#166534",
            background: "#f0fdf4", border: "1px solid #bbf7d0",
            borderRadius: 6, padding: "5px 12px", minWidth: 92,
            textAlign: "center",
          }}>
            {safePage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
            style={{ ...s.pageBtn, opacity: safePage === totalPages ? 0.4 : 1, cursor: safePage === totalPages ? "not-allowed" : "pointer" }}
          >
            {Icon.chevR}
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      {deleteId !== null && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#1a2e1c", marginBottom: 8 }}>Hapus Kontak?</div>
            <div style={{ fontSize: 13, color: "#6b8f6e", marginBottom: 20 }}>
              Data <strong>{contacts.find(c => c.id === deleteId)?.name}</strong> akan dihapus permanen.
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button style={s.btnGhost} onClick={() => setDeleteId(null)}>Batal</button>
              <button style={s.btnDanger} onClick={doDelete}>Hapus</button>
            </div>
          </div>
        </div>
      )}

      <div style={s.panel}>
        <div style={{ ...s.ph, marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
          <span style={s.ptitle}>Daftar Kontak ({filtered.length})</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f6fbf7", borderRadius: 8, padding: "6px 10px", border: "1px solid #d1e9d5" }}>
              <span style={{ color: "#a8c9ab", display: "flex" }}>{Icon.search}</span>
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Cari nama, no hp, wilayah..."
                style={{ border: "none", background: "transparent", fontSize: 13, outline: "none", width: 190, color: "#2d4a30" }}
              />
            </div>

            <select value={filterProvinsi} onChange={e => setFilterProvinsi(e.target.value)}
              style={{ fontSize: 12, color: "#2d4a30", border: "1px solid #d1e9d5", borderRadius: 8, padding: "6px 10px", background: "white", outline: "none", cursor: "pointer" }}>
              {allProvinsi.map(p => <option key={p}>{p}</option>)}
            </select>

            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              style={{ fontSize: 12, color: "#2d4a30", border: "1px solid #d1e9d5", borderRadius: 8, padding: "6px 10px", background: "white", outline: "none", cursor: "pointer" }}>
              {["Semua", "Dihubungi", "Belum"].map(p => <option key={p}>{p}</option>)}
            </select>

            <div style={{ display: "flex", background: "#f6fbf7", borderRadius: 8, padding: 3, border: "1px solid #d1e9d5", gap: 2 }}>
              <button
                onClick={() => setViewMode("table")}
                style={{ padding: "5px 12px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 500, background: viewMode === "table" ? "white" : "transparent", color: viewMode === "table" ? "#166534" : "#8faa92", boxShadow: viewMode === "table" ? "0 1px 4px rgba(0,0,0,0.06)" : "none", transition: "all 0.15s" }}
              >
                Tabel
              </button>
              <button
                onClick={() => setViewMode("group")}
                style={{ padding: "5px 12px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 500, display: "flex", alignItems: "center", gap: 4, background: viewMode === "group" ? "white" : "transparent", color: viewMode === "group" ? "#166534" : "#8faa92", boxShadow: viewMode === "group" ? "0 1px 4px rgba(0,0,0,0.06)" : "none", transition: "all 0.15s" }}
              >
                {Icon.mapPin} Per Daerah
              </button>
            </div>

            <button
              onClick={exportToExcel}
              disabled={isExporting || filtered.length === 0}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "#166534", color: "white", border: "none",
                borderRadius: 8, padding: "6px 12px", fontSize: 12,
                fontWeight: 500, cursor: (isExporting || filtered.length === 0) ? "not-allowed" : "pointer",
                opacity: (isExporting || filtered.length === 0) ? 0.6 : 1,
              }}
            >
              <span style={{ display: "flex" }}>{Icon.excel}</span>
              {isExporting ? "Mengekspor..." : "Export Excel"}
            </button>

            <PeriodFilter value={period} onChange={setPeriod} dateFrom={dateFrom} dateTo={dateTo} onDateFromChange={setDateFrom} onDateToChange={setDateTo} options={PERIOD_OPTIONS_WITH_ALL} />

            <button onClick={openAdd} style={{ fontSize: 12, color: "white", background: "#166534", border: "none", borderRadius: 8, padding: "6px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontWeight: 500 }}>
              {Icon.plus} Tambah
            </button>
          </div>
        </div>

        {period !== "all" && (
          <div style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12, color: "#8faa92" }}>Bergabung:</span>
            <span style={{ fontSize: 12, background: "#f0fdf4", color: "#166534", padding: "2px 10px", borderRadius: 20, fontWeight: 600, border: "1px solid #bbf7d0" }}>
              {periodLabel(period, dateFrom, dateTo, PERIOD_OPTIONS_WITH_ALL)}
            </span>
            <button
              onClick={() => { setPeriod("all"); setDateFrom(""); setDateTo(""); }}
              style={{ fontSize: 11, color: "#a8c9ab", background: "none", border: "none", cursor: "pointer", padding: 0, textDecoration: "underline" }}
            >
              Reset
            </button>
          </div>
        )}

        {viewMode === "table" && (
          <>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
                <TableHead />
                <tbody>
                  {paginatedUsers.map((c, i) => {
                    const globalIdx = (safePage - 1) * ITEMS_PER_PAGE + i;
                    return <ContactRow key={c.id} c={c} i={i} globalIdx={globalIdx} />;
                  })}
                  {filtered.length === 0 && (
                    <tr><td colSpan={8} style={{ textAlign: "center", padding: 32, color: "#a8c9ab", fontSize: 13 }}>Tidak ada kontak ditemukan</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination />
          </>
        )}

        {viewMode === "group" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Ringkasan Card Provinsi - Seperti Dashboard IT */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 8 }}>
              {Object.keys(grouped).sort().map((prov, idx) => {
                const cnt = grouped[prov].length;
                const pct = Math.round((cnt / filtered.length) * 100);
                const col = provinsiColors[idx % provinsiColors.length];
                const isActive = expandedGroups[prov] !== false;

                return (
                  <div
                    key={prov}
                    onClick={() => toggleGroup(prov)}
                    style={{
                      background: isActive ? "#f0fdf4" : "#fafff8",
                      border: isActive ? "1.5px solid #16a34a" : "1px solid #e4f0e6",
                      borderRadius: 8,
                      padding: "10px 12px",
                      cursor: "pointer",
                      userSelect: "none",
                      transition: "all 0.15s",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 7, height: 7, borderRadius: "50%", background: col, flexShrink: 0 }} />
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#2d4a30", lineHeight: 1.3 }}>{prov}</span>
                      </div>
                      <span style={{ 
                        color: isActive ? "#16a34a" : "#a8c9ab", 
                        transform: isActive ? "rotate(180deg)" : "rotate(0deg)", 
                        transition: "transform 0.2s", 
                        display: "flex" 
                      }}>
                        {Icon.chevDown}
                      </span>
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 600, color: col, fontFamily: "'DM Mono',monospace" }}>{cnt}</div>
                    <div style={{ height: 4, background: "#e4f0e6", borderRadius: 2, marginTop: 6, overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: col, borderRadius: 2 }} />
                    </div>
                    <div style={{ fontSize: 10, color: "#a8c9ab", marginTop: 3 }}>{pct}% dari total</div>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <div style={{ textAlign: "center", padding: 32, color: "#a8c9ab", fontSize: 13, gridColumn: "1 / -1" }}>Tidak ada kontak ditemukan</div>
              )}
            </div>

            {/* Detail Per Provinsi - Hanya tampilkan yang di-expand */}
            {Object.keys(grouped).sort().map(prov => {
              const provContacts = grouped[prov];
              const isOpen = expandedGroups[prov] !== false;
              const kabGroups = provContacts.reduce<Record<string, Contact[]>>((acc, c) => {
                const k = c.kabupaten ?? "Tidak Diketahui";
                if (!acc[k]) acc[k] = [];
                acc[k].push(c);
                return acc;
              }, {});

              if (!isOpen) return null;

              return (
                <div key={prov} style={{ border: "1px solid #e4f0e6", borderRadius: 10, overflow: "hidden" }}>
                  <div style={{ padding: "8px 12px", background: "#f6fbf7", borderBottom: "1px solid #eef6ef" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: "#16a34a", display: "flex" }}>{Icon.mapPin}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#1a2e1c" }}>{prov}</span>
                      <span style={{ fontSize: 11, background: "#dcfce7", color: "#166534", borderRadius: 20, padding: "1px 8px", fontWeight: 600 }}>
                        {provContacts.length} kontak
                      </span>
                      <span style={{ fontSize: 11, color: "#a8c9ab" }}>· {Object.keys(kabGroups).length} kabupaten/kota</span>
                    </div>
                  </div>

                  <div style={{ padding: "8px 12px 12px" }}>
                    {Object.keys(kabGroups).sort().map(kab => (
                      <div key={kab} style={{ marginBottom: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 4px 6px 10px", borderLeft: "3px solid #86efac", marginBottom: 4, background: "#fafff8" }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "#15803d" }}>{kab}</span>
                          <span style={{ fontSize: 11, color: "#a8c9ab" }}>({kabGroups[kab].length} kontak)</span>
                        </div>
                        <div style={{ overflowX: "auto" }}>
                          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 860 }}>
                            <TableHead />
                            <tbody>
                              {kabGroups[kab].map((c, i) => {
                                const globalIdx = filtered.findIndex(f => f.id === c.id);
                                return <ContactRow key={c.id} c={c} i={i} globalIdx={globalIdx} />;
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <div style={{ fontWeight: 600, fontSize: 15, color: "#1a2e1c", marginBottom: 16 }}>{editId ? "Edit Kontak" : "Tambah Kontak Baru"}</div>
            {[
              { key: "name", label: "Nama Lengkap", placeholder: "Masukkan nama..." },
              { key: "no_hp", label: "No. HP", placeholder: "0812xxxxxxxx" },
              { key: "provinsi", label: "Provinsi", placeholder: "Nama provinsi..." },
              { key: "kabupaten", label: "Kabupaten/Kota", placeholder: "Nama kabupaten..." },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: "#6b8f6e", fontWeight: 500, display: "block", marginBottom: 4 }}>{f.label}</label>
                <input
                  value={form[f.key as keyof FormData]}
                  onChange={e => setForm(v => ({ ...v, [f.key as keyof FormData]: e.target.value }))}
                  placeholder={f.placeholder}
                  style={{ width: "100%", border: "1px solid #d1e9d5", borderRadius: 8, padding: "8px 12px", fontSize: 13, outline: "none", color: "#2d4a30", fontFamily: "inherit" }}
                />
              </div>
            ))}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
              <button onClick={() => setShowModal(false)} style={s.btnGhost}>Batal</button>
              <button onClick={saveForm} style={s.btnPrimary}>{editId ? "Simpan" : "Tambah"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// PAGE: WILAYAH - DENGAN PENGELOMPOKAN SEPERTI DASHBOARD IT
// ════════════════════════════════════════════════════════════════════════════
function PageWilayah() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [selectedProvinsi, setSelectedProvinsi] = useState<string | null>(null);
  const [selectedKabupaten, setSelectedKabupaten] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/marketing/contacts`, { 
        headers: authHeaders() 
      });
      const data = await res.json();
      console.log("Wilayah API Response:", data);
      if (data.success) {
        setContacts(data.data || []);
      } else {
        toast(data.message || "Gagal mengambil data wilayah", "error");
      }
    } catch (e) { 
      console.error("Fetch error:", e);
      toast("Gagal terhubung ke server", "error");
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filtered = contacts
    .filter(c => matchesPeriod(c.created_at, period, dateFrom, dateTo))
    .filter(c => {
      const q = search.toLowerCase();
      return !q || c.provinsi?.toLowerCase().includes(q) || c.kabupaten?.toLowerCase().includes(q);
    });

  const grouped = groupByRegion(filtered);
  const totalProvinsi = Object.keys(grouped).length;
  const totalKabupaten = new Set(filtered.map(c => c.kabupaten).filter(Boolean)).size;

  const exportToExcel = () => {
    setIsExporting(true);
    try {
      const rows: any[] = [];
      Object.keys(grouped).sort().forEach(prov => {
        const provContacts = grouped[prov];
        const kabGroups = provContacts.reduce<Record<string, Contact[]>>((acc, c) => {
          const k = c.kabupaten ?? "Tidak Diketahui";
          if (!acc[k]) acc[k] = [];
          acc[k].push(c);
          return acc;
        }, {});
        Object.keys(kabGroups).sort().forEach(kab => {
          const list = kabGroups[kab];
          const dihubungi = list.filter(c => c.is_contacted).length;
          rows.push({
            "Provinsi": prov,
            "Kabupaten/Kota": kab,
            "Total Kontak": list.length,
            "Sudah Dihubungi": dihubungi,
            "Belum Dihubungi": list.length - dihubungi,
          });
        });
      });
      const ws = XLSX.utils.json_to_sheet(rows);
      ws['!cols'] = [{ wch: 22 }, { wch: 22 }, { wch: 14 }, { wch: 16 }, { wch: 16 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Wilayah");
      XLSX.writeFile(wb, `wilayah_${period}_${new Date().toISOString().split("T")[0]}.xlsx`);
      toast("Data wilayah berhasil diekspor", "success");
    } catch (e) {
      console.error(e);
      toast("Gagal mengekspor data wilayah", "error");
    }
    setIsExporting(false);
  };

  if (loading) return <Spinner />;

  const TableHeadWilayah = () => (
    <thead>
      <tr>
        {["#", "Nama", "No. WhatsApp", "Status", "Bergabung"].map(h => (
          <th key={h} style={{ ...s.th, fontSize: 9 }}>{h}</th>
        ))}
      </tr>
    </thead>
  );

  const ContactRowWilayah = ({ c, i, globalIdx }: { c: Contact; i: number; globalIdx: number }) => {
    const phone = getPhoneNumber(c);
    return (
      <tr style={{ background: i % 2 === 0 ? "#fafff8" : "white" }}>
        <td style={s.td}><span style={{ fontSize: 11, color: "#a8c9ab" }}>{globalIdx + 1}</span></td>
        <td style={s.td}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ ...s.av, width: 24, height: 24, fontSize: 9, background: avBg[globalIdx % 4] }}>{getInitials(c.name)}</div>
            <span style={{ fontSize: 12, fontWeight: 500, color: "#2d4a30" }}>{c.name}</span>
          </div>
        </td>
        <td style={s.td}>
          {phone ? (
            <a href={`https://wa.me/${phone.replace(/^0/, "")}`} target="_blank" rel="noreferrer" style={{ ...s.ip, color: "#166534", textDecoration: "none", fontWeight: 600, fontSize: 10 }}>{phone}</a>
          ) : (
            <span style={{ fontSize: 11, color: "#a8c9ab" }}>-</span>
          )}
        </td>
        <td style={s.td}>
          <span style={{ ...s.badge, fontSize: 10, ...(c.is_contacted ? s.bon : s.bidl) }}>
            <span style={{ width: 4, height: 4, borderRadius: "50%", background: "currentColor", display: "inline-block", marginRight: 4, verticalAlign: "middle" }} />
            {c.is_contacted ? "Dihubungi" : "Belum"}
          </span>
        </td>
        <td style={s.td}><span style={{ fontSize: 11, color: "#8faa92" }}>{c.created_at?.slice(0, 10) ?? "-"}</span></td>
      </tr>
    );
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "white", borderRadius: 8, padding: "6px 10px", border: "1px solid #d1e9d5" }}>
          <span style={{ color: "#a8c9ab", display: "flex" }}>{Icon.search}</span>
          <input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Cari provinsi / kabupaten..."
            style={{ border: "none", background: "transparent", outline: "none", fontSize: 13, color: "#2d4a30", width: 200 }} 
          />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <PeriodFilter value={period} onChange={setPeriod} dateFrom={dateFrom} dateTo={dateTo} onDateFromChange={setDateFrom} onDateToChange={setDateTo} options={PERIOD_OPTIONS_WITH_ALL} />
          <button
            onClick={exportToExcel}
            disabled={isExporting || filtered.length === 0}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "#166534", color: "white", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 500, cursor: isExporting ? "not-allowed" : "pointer", opacity: isExporting ? 0.6 : 1 }}
          >
            <span style={{ display: "flex" }}>{Icon.excel}</span>
            {isExporting ? "Mengekspor..." : "Export Excel"}
          </button>
        </div>
      </div>

      <div style={s.cardGrid}>
        <div style={s.card}>
          <div style={s.cLabel}>Total Kontak</div>
          <div style={{ ...s.cNum, color: "#166534" }}>{filtered.length}</div>
          <div style={{ fontSize: 11, color: "#8faa92", marginTop: 4 }}>{periodLabel(period, dateFrom, dateTo, PERIOD_OPTIONS_WITH_ALL)}</div>
        </div>
        <div style={s.card}>
          <div style={s.cLabel}>Total Provinsi</div>
          <div style={{ ...s.cNum, color: "#7c3aed" }}>{totalProvinsi}</div>
          <div style={{ fontSize: 11, color: "#8faa92", marginTop: 4 }}>Wilayah terjangkau</div>
        </div>
        <div style={s.card}>
          <div style={s.cLabel}>Total Kabupaten/Kota</div>
          <div style={{ ...s.cNum, color: "#c2410c" }}>{totalKabupaten}</div>
          <div style={{ fontSize: 11, color: "#8faa92", marginTop: 4 }}>Wilayah terjangkau</div>
        </div>
      </div>

      <div style={s.panel}>
        <div style={{ ...s.ph, marginBottom: 12 }}>
          <span style={s.ptitle}>Rincian Per Provinsi & Kabupaten</span>
          <span style={s.psub}>{filtered.length} total kontak</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10, marginBottom: 16 }}>
          {Object.keys(grouped).sort().map((prov, idx) => {
            const provContacts = grouped[prov];
            const pct = filtered.length > 0 ? Math.round((provContacts.length / filtered.length) * 100) : 0;
            const col = provinsiColors[idx % provinsiColors.length];
            const isActive = selectedProvinsi === prov;

            return (
              <div
                key={prov}
                onClick={() => {
                  setSelectedProvinsi(isActive ? null : prov);
                  setSelectedKabupaten(null);
                }}
                style={{
                  background: isActive ? "#f0fdf4" : "#fafff8",
                  border: isActive ? "1.5px solid #16a34a" : "1px solid #e4f0e6",
                  borderRadius: 8,
                  padding: "10px 12px",
                  cursor: "pointer",
                  userSelect: "none",
                  transition: "all 0.15s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: col, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#2d4a30", lineHeight: 1.3 }}>{prov}</span>
                  </div>
                  <span style={{ 
                    color: isActive ? "#16a34a" : "#a8c9ab", 
                    transform: isActive ? "rotate(180deg)" : "rotate(0deg)", 
                    transition: "transform 0.2s", 
                    display: "flex" 
                  }}>
                    {Icon.chevDown}
                  </span>
                </div>
                <div style={{ fontSize: 20, fontWeight: 600, color: col, fontFamily: "'DM Mono',monospace" }}>{provContacts.length}</div>
                <div style={{ height: 4, background: "#e4f0e6", borderRadius: 2, marginTop: 6, overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: col, borderRadius: 2 }} />
                </div>
                <div style={{ fontSize: 10, color: "#a8c9ab", marginTop: 3 }}>{pct}% dari total</div>
              </div>
            );
          })}
          {Object.keys(grouped).length === 0 && (
            <div style={{ textAlign: "center", padding: 32, color: "#a8c9ab", fontSize: 13, gridColumn: "1 / -1" }}>
              Tidak ada data wilayah ditemukan
            </div>
          )}
        </div>

        {selectedProvinsi && grouped[selectedProvinsi] && (() => {
          const provContacts = grouped[selectedProvinsi];
          const kabGroups = provContacts.reduce<Record<string, Contact[]>>((acc, c) => {
            const k = c.kabupaten ?? "Tidak Diketahui";
            if (!acc[k]) acc[k] = [];
            acc[k].push(c);
            return acc;
          }, {});

          return (
            <div style={{ border: "1px solid #e4f0e6", borderRadius: 10, padding: "10px 12px", background: "white", marginTop: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ color: "#16a34a", display: "flex" }}>{Icon.mapPin}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#1a2e1c" }}>{selectedProvinsi}</span>
                <span style={{ fontSize: 11, color: "#a8c9ab" }}>{Object.keys(kabGroups).length} kabupaten/kota</span>
                <button
                  onClick={() => setSelectedProvinsi(null)}
                  style={{ marginLeft: "auto", fontSize: 11, color: "#dc2626", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, padding: "2px 10px", cursor: "pointer" }}
                >
                  Tutup
                </button>
              </div>

              {Object.keys(kabGroups).sort().map(kab => {
                const kabKey = `${selectedProvinsi}::${kab}`;
                const kabOpen = selectedKabupaten === kabKey;

                return (
                  <div key={kab} style={{ marginBottom: 8 }}>
                    <div
                      onClick={() => setSelectedKabupaten(kabOpen ? null : kabKey)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "7px 10px",
                        borderLeft: "3px solid #86efac",
                        marginBottom: kabOpen ? 4 : 0,
                        background: "#fafff8",
                        cursor: "pointer",
                        userSelect: "none",
                        borderRadius: 4,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#15803d" }}>{kab}</span>
                        <span style={{ fontSize: 11, color: "#a8c9ab" }}>({kabGroups[kab].length} kontak)</span>
                      </div>
                      <span style={{ 
                        color: "#a8c9ab", 
                        transform: kabOpen ? "rotate(180deg)" : "rotate(0deg)", 
                        transition: "transform 0.2s", 
                        display: "flex" 
                      }}>
                        {Icon.chevDown}
                      </span>
                    </div>

                    {kabOpen && (
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 500 }}>
                          <TableHeadWilayah />
                          <tbody>
                            {kabGroups[kab].map((c, i) => {
                              const globalIdx = filtered.findIndex(f => f.id === c.id);
                              return <ContactRowWilayah key={c.id} c={c} i={i} globalIdx={globalIdx} />;
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// PAGE: LAPORAN
// ════════════════════════════════════════════════════════════════════════════
function PageLaporan() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("this_month");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [reportType, setReportType] = useState("registrasi");
  const [isExporting, setIsExporting] = useState(false);

  const reportTypes = [
    { value: "registrasi", label: "Laporan Registrasi", icon: "totalUsers" },
    { value: "status", label: "Laporan Status Kontak", icon: "phone" },
    { value: "wilayah", label: "Laporan Wilayah", icon: "map" },
  ];

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/marketing/contacts`, { 
        headers: authHeaders() 
      });
      const data = await res.json();
      console.log("Laporan API Response:", data);
      if (data.success) {
        setContacts(data.data || []);
      } else {
        toast(data.message || "Gagal mengambil data laporan", "error");
      }
    } catch (e) { 
      console.error("Fetch error:", e);
      toast("Gagal terhubung ke server", "error");
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filtered = contacts.filter(c => matchesPeriod(c.created_at, period, dateFrom, dateTo));
  const total = filtered.length;
  const contacted = filtered.filter(c => c.is_contacted).length;
  const uncontacted = total - contacted;
  const totalProvinsi = new Set(filtered.map(c => c.provinsi).filter(Boolean)).size;
  const totalKabupaten = new Set(filtered.map(c => c.kabupaten).filter(Boolean)).size;
  const contactedRate = total > 0 ? Math.round((contacted / total) * 100) : 0;

  const trend = buildDailyTrend(filtered);
  const trendContacted = buildDailyTrend(filtered.filter(c => c.is_contacted));

  const sebaranProvinsi = Object.entries(
    filtered.reduce<Record<string, number>>((acc, c) => {
      const key = c.provinsi || "Tidak Diketahui";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {})
  ).map(([provinsi, total]) => ({ provinsi, total })).sort((a, b) => b.total - a.total);

  const exportToExcel = () => {
    setIsExporting(true);
    try {
      let exportData: any[] = [];
      if (reportType === "wilayah") {
        exportData = sebaranProvinsi.map((p, idx) => ({ "No": idx + 1, "Provinsi": p.provinsi, "Total Kontak": p.total, "Persentase": `${total > 0 ? ((p.total / total) * 100).toFixed(1) : 0}%` }));
      } else {
        exportData = filtered.map((c, idx) => ({
          "No": idx + 1,
          "Nama": c.name,
          "No. WhatsApp": getPhoneNumber(c) || "-",
          "Provinsi": c.provinsi || "-",
          "Kabupaten": c.kabupaten || "-",
          "Status": c.is_contacted ? "Dihubungi" : "Belum Dihubungi",
          "Tanggal Daftar": c.created_at?.slice(0, 10) || "-",
        }));
      }
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Laporan");
      XLSX.writeFile(wb, `laporan_${reportType}_${period}_${new Date().toISOString().split("T")[0]}.xlsx`);
      toast("Laporan berhasil diekspor", "success");
    } catch (e) {
      console.error(e);
      toast("Gagal mengekspor laporan", "error");
    }
    setIsExporting(false);
  };

  if (loading) return <Spinner />;

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {reportTypes.map(type => (
            <button
              key={type.value}
              onClick={() => setReportType(type.value)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 16px", borderRadius: 8, fontSize: 13,
                fontWeight: 500, cursor: "pointer", border: "1px solid #d1e9d5",
                background: reportType === type.value ? "#166534" : "white",
                color: reportType === type.value ? "white" : "#2d4a30",
                transition: "all 0.15s",
              }}
            >
              <span style={{ display: "flex", color: reportType === type.value ? "white" : "#166534" }}>
                {Icon[type.icon as keyof typeof Icon]}
              </span>
              {type.label}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <PeriodFilter value={period} onChange={setPeriod} dateFrom={dateFrom} dateTo={dateTo} onDateFromChange={setDateFrom} onDateToChange={setDateTo} />
          <button
            onClick={exportToExcel}
            disabled={isExporting}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "#166534", color: "white", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 500, cursor: isExporting ? "not-allowed" : "pointer", opacity: isExporting ? 0.6 : 1 }}
          >
            <span style={{ display: "flex" }}>{Icon.excel}</span>
            {isExporting ? "Mengekspor..." : "Export Excel"}
          </button>
        </div>
      </div>

      <>
        <div style={s.cardGrid}>
          <div style={s.card}>
            <div style={s.cLabel}>Total Kontak</div>
            <div style={{ ...s.cNum, color: "#166534" }}>{total.toLocaleString()}</div>
            <div style={{ fontSize: 11, color: "#8faa92" }}>Periode ini</div>
          </div>
          <div style={s.card}>
            <div style={s.cLabel}>Sudah Dihubungi</div>
            <div style={{ ...s.cNum, color: "#16a34a" }}>{contacted.toLocaleString()}</div>
            <div style={{ fontSize: 11, color: "#8faa92" }}>{contactedRate}% dari total</div>
          </div>
          <div style={s.card}>
            <div style={s.cLabel}>Belum Dihubungi</div>
            <div style={{ ...s.cNum, color: "#1d4ed8" }}>{uncontacted.toLocaleString()}</div>
            <div style={{ fontSize: 11, color: "#8faa92" }}>Perlu follow up</div>
          </div>
          <div style={s.card}>
            <div style={s.cLabel}>Cakupan Wilayah</div>
            <div style={{ ...s.cNum, color: "#7c3aed" }}>{totalProvinsi} / {totalKabupaten}</div>
            <div style={{ fontSize: 11, color: "#8faa92" }}>Provinsi / Kabupaten</div>
          </div>
        </div>

        <div style={s.panel}>
          <div style={s.ph}>
            <span style={s.ptitle}>Tren {reportTypes.find(t => t.value === reportType)?.label}</span>
            <span style={s.psub}>{periodLabel(period, dateFrom, dateTo)}</span>
          </div>
          <div style={{ marginTop: 16 }}>
            {reportType === "registrasi" && (
              <TradingChart
                categories={trend.map(t => t.date)}
                series={[{ label: "Kontak Baru", color: "#166534", values: trend.map(t => t.value), format: v => `${v} kontak` }]}
                height={220}
              />
            )}
            {reportType === "status" && (
              <TradingChart
                categories={trendContacted.map(t => t.date)}
                series={[{ label: "Dihubungi", color: "#16a34a", values: trendContacted.map(t => t.value), format: v => `${v} kontak` }]}
                height={220}
              />
            )}
            {reportType === "wilayah" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {sebaranProvinsi.map((p, i) => (
                  <div key={p.provinsi} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 12, color: "#6b8f6e", width: 140 }}>{p.provinsi}</span>
                    <div style={{ flex: 1, height: 18, background: "#f0faf2", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ width: `${total > 0 ? (p.total / total) * 100 : 0}%`, height: "100%", background: provinsiColors[i % 8], borderRadius: 4 }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: provinsiColors[i % 8], width: 36, textAlign: "right" }}>{p.total}</span>
                  </div>
                ))}
                {sebaranProvinsi.length === 0 && <div style={{ textAlign: "center", color: "#a8c9ab", fontSize: 13, padding: 20 }}>Tidak ada data</div>}
              </div>
            )}
          </div>
        </div>

        <div style={s.panel}>
          <div style={s.ph}>
            <span style={s.ptitle}>Data Detail</span>
            <span style={s.psub}>{filtered.length} record</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>{["#", "Nama", "No. WhatsApp", "Provinsi", "Kabupaten", "Status", "Tanggal"].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {filtered.slice(0, 50).map((c, idx) => {
                  const phone = getPhoneNumber(c);
                  return (
                    <tr key={c.id} style={{ background: idx % 2 === 0 ? "#fafff8" : "white" }}>
                      <td style={s.td}>{idx + 1}</td>
                      <td style={s.td}>{c.name}</td>
                      <td style={s.td}>
                        {phone ? (
                          <span style={s.ip}>{phone}</span>
                        ) : (
                          <span style={{ fontSize: 12, color: "#a8c9ab" }}>-</span>
                        )}
                      </td>
                      <td style={s.td}>{c.provinsi ?? "-"}</td>
                      <td style={s.td}>{c.kabupaten ?? "-"}</td>
                      <td style={s.td}>
                        <span style={{ ...s.badge, ...(c.is_contacted ? s.bon : s.bidl) }}>{c.is_contacted ? "Dihubungi" : "Belum"}</span>
                      </td>
                      <td style={s.td}>{c.created_at?.slice(0, 10) ?? "-"}</td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: "center", padding: 32, color: "#a8c9ab", fontSize: 13 }}>Tidak ada data</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {filtered.length > 50 && (
            <div style={{ fontSize: 11, color: "#a8c9ab", marginTop: 8, textAlign: "center" }}>Menampilkan 50 dari {filtered.length} record. Gunakan Export Excel untuk data lengkap.</div>
          )}
        </div>
      </>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// PAGE: IKLAN (WAJIB TONTON)
// ════════════════════════════════════════════════════════════════════════════
function PageSponsor() {
  const [ads, setAds] = useState<AdData[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<"video" | "image">("image");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    id: "",
    title: "",
    sponsor_name: "",
    type: "image" as "image" | "video",
    file: null as string | null,
    file_obj: null as File | null,
    fileName: "",
    duration: 5,
    isActive: true,
  });

  const fetchAds = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API}/api/admin/sponsors`, {
        headers: authHeaders()
      });
      const data = await response.json();
      if (data.success) {
        const mappedAds: AdData[] = data.data.map((item: any) => ({
          id: String(item.id),
          title: item.title,
          type: item.type === "video" ? "video" : "image",
          file: item.file_path ? `${API}/storage/${item.file_path}` : null,
          fileName: item.file_name || "",
          duration: item.duration,
          isActive: item.isActive === 1 || item.isActive === true,
          createdAt: item.created_at,
        }));
        setAds(mappedAds);
      } else {
        toast("Gagal mengambil data iklan", "error");
      }
    } catch (error) {
      console.error("Error fetching ads:", error);
      toast("Server error saat mengambil iklan", "error");
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAds(); }, [fetchAds]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");

    if (!isVideo && !isImage) {
      toast("Hanya file video atau gambar yang diperbolehkan", "error");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setPreviewType(isVideo ? "video" : "image");

    setFormData(prev => ({
      ...prev,
      type: isVideo ? "video" : "image",
      file_obj: file,
      fileName: file.name
    }));
  };

  const handleSave = async () => {
    if (!formData.title.trim()) { toast("Judul iklan harus diisi", "error"); return; }
    if (!formData.sponsor_name.trim()) { toast("Nama sponsor harus diisi", "error"); return; }
    if (!formData.file_obj && !editingId) { toast("Pilih file video atau gambar", "error"); return; }
    if (formData.duration < 1 || formData.duration > 60) {
      toast("Durasi wajib tonton antara 1-60 detik", "error");
      return;
    }

    setLoading(true);
    try {
      const url = editingId
        ? `${API}/api/admin/sponsors/${editingId}`
        : `${API}/api/admin/sponsors`;

      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title);
      formDataToSend.append("sponsor_name", formData.sponsor_name);
      formDataToSend.append("duration", String(formData.duration));
      formDataToSend.append("is_active", formData.isActive ? "1" : "0");

      if (formData.file_obj) {
        formDataToSend.append("file", formData.file_obj);
      }

      if (editingId) {
        formDataToSend.append("_method", "PUT");
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken()}`,
          Accept: "application/json",
        },
        body: formDataToSend,
      });

      const result = await response.json();

      if (result.success) {
        toast(editingId ? "Iklan berhasil diupdate" : "Iklan berhasil ditambahkan", "success");
        setShowModal(false);
        resetForm();
        fetchAds();
      } else {
        toast(result.message || "Gagal menyimpan iklan", "error");
      }
    } catch (error) {
      console.error("Save error:", error);
      toast("Terjadi kesalahan saat menyimpan", "error");
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    setLoading(true);
    try {
      const response = await fetch(`${API}/api/admin/sponsors/${deleteConfirm}`, {
        method: "DELETE",
        headers: authHeaders()
      });
      const result = await response.json();

      if (result.success) {
        toast("Iklan berhasil dihapus", "success");
        fetchAds();
      } else {
        toast(result.message || "Gagal menghapus iklan", "error");
      }
    } catch (error) {
      toast("Server error saat menghapus", "error");
    } finally {
      setLoading(false);
      setDeleteConfirm(null);
    }
  };

  const toggleActive = async (id: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${API}/api/admin/sponsors/${id}/toggle`, {
        method: "PATCH",
        headers: authHeaders()
      });
      const result = await response.json();

      if (result.success) {
        toast(`Status iklan ${result.data.isActive ? "diaktifkan" : "dinonaktifkan"}`, "success");
        fetchAds();
      } else {
        toast("Gagal mengubah status", "error");
      }
    } catch (error) {
      toast("Server error", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (ad: AdData) => {
    setFormData({
      id: ad.id,
      title: ad.title,
      sponsor_name: "",
      type: ad.type,
      file: ad.file,
      file_obj: null,
      fileName: ad.fileName,
      duration: ad.duration,
      isActive: ad.isActive,
    });
    setPreviewUrl(ad.file);
    setPreviewType(ad.type);
    setEditingId(ad.id);
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      id: "",
      title: "",
      sponsor_name: "",
      type: "image",
      file: null,
      file_obj: null,
      fileName: "",
      duration: 5,
      isActive: true,
    });
    setPreviewUrl(null);
    setEditingId(null);
  };

  const activeAds = ads.filter(ad => ad.isActive);
  const inactiveAds = ads.filter(ad => !ad.isActive);

  if (loading && ads.length === 0) return <Spinner />;

  const AdPreview = ({ data }: { data: AdData }) => (
    <div style={{ background: "#f5f5f5", borderRadius: 16, overflow: "hidden", width: 320 }}>
      <div style={{ background: "#000", minHeight: 180, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {data.type === "video" ? (
          <video src={data.file || undefined} controls style={{ width: "100%", maxHeight: 180 }} />
        ) : (
          <img src={data.file || undefined} alt={data.title} style={{ width: "100%", maxHeight: 180, objectFit: "cover" }} />
        )}
      </div>
      <div style={{ padding: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <strong>{data.title}</strong>
          <span style={{ fontSize: 11, background: "#e4f0e6", padding: "2px 8px", borderRadius: 20 }}>
            {data.type === "video" ? "🎬 Video" : "🖼️ Gambar"}
          </span>
        </div>
        <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
          ⏱️ Wajib tonton: <strong>{data.duration}</strong> detik
        </div>
        <div style={{ fontSize: 11, color: data.isActive ? "#16a34a" : "#dc2626", marginTop: 4 }}>
          {data.isActive ? "✅ Aktif" : "❌ Tidak Aktif"}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ ...s.ph, marginBottom: 0 }}>
        <span style={s.ptitle}>Manajemen Iklan (Wajib Tonton)</span>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          style={{ background: "#166534", color: "white", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
        >
          {Icon.plus} Tambah Iklan
        </button>
      </div>

      <div style={{ background: "#f0fdf4", borderRadius: 8, padding: "8px 12px", fontSize: 11, color: "#166534", border: "1px solid #bbf7d0" }}>
        Upload file gambar atau video.
      </div>

      {deleteConfirm && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Hapus Iklan?</div>
            <div style={{ fontSize: 13, color: "#666", marginBottom: 20 }}>Yakin ingin menghapus iklan ini?</div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => setDeleteConfirm(null)} style={s.btnGhost}>Batal</button>
              <button onClick={confirmDelete} style={s.btnDanger}>Hapus</button>
            </div>
          </div>
        </div>
      )}

      <div style={s.panel}>
        <div style={s.ph}>
          <span style={s.ptitle}>Iklan Aktif</span>
          <span style={s.psub}>{activeAds.length} sedang tayang</span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 12 }}>
          {activeAds.map(ad => (
            <div key={ad.id} style={{ border: "1px solid #e4f0e6", borderRadius: 16, overflow: "hidden" }}>
              <AdPreview data={ad} />
              <div style={{ display: "flex", gap: 8, padding: 12, borderTop: "1px solid #eef6ef", background: "#fafafa" }}>
                <button onClick={() => handleEdit(ad)} style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 6, padding: "4px 12px", fontSize: 11, cursor: "pointer" }}>Edit</button>
                <button onClick={() => toggleActive(ad.id)} style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 6, padding: "4px 12px", fontSize: 11, cursor: "pointer" }}>Nonaktifkan</button>
                <button onClick={() => setDeleteConfirm(ad.id)} style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, padding: "4px 12px", fontSize: 11, cursor: "pointer", color: "#dc2626" }}>Hapus</button>
              </div>
            </div>
          ))}
          {activeAds.length === 0 && (
            <div style={{ textAlign: "center", padding: 40, color: "#a8c9ab", width: "100%" }}>Belum ada iklan aktif. Klik "Tambah Iklan" untuk mulai.</div>
          )}
        </div>
      </div>

      {inactiveAds.length > 0 && (
        <div style={s.panel}>
          <div style={s.ph}>
            <span style={s.ptitle}>Iklan Tidak Aktif</span>
            <span style={s.psub}>{inactiveAds.length} iklan</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 12, opacity: 0.7 }}>
            {inactiveAds.map(ad => (
              <div key={ad.id} style={{ border: "1px solid #e4f0e6", borderRadius: 16, overflow: "hidden" }}>
                <AdPreview data={ad} />
                <div style={{ display: "flex", gap: 8, padding: 12, borderTop: "1px solid #eef6ef", background: "#fafafa" }}>
                  <button onClick={() => handleEdit(ad)} style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 6, padding: "4px 12px", fontSize: 11, cursor: "pointer" }}>Edit</button>
                  <button onClick={() => toggleActive(ad.id)} style={{ background: "#dcfce7", border: "1px solid #86efac", borderRadius: 6, padding: "4px 12px", fontSize: 11, cursor: "pointer", color: "#166534" }}>Aktifkan</button>
                  <button onClick={() => setDeleteConfirm(ad.id)} style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 6, padding: "4px 12px", fontSize: 11, cursor: "pointer", color: "#dc2626" }}>Hapus</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showModal && (
        <div style={s.overlay}>
          <div style={{ ...s.modal, width: 560, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>{editingId ? "Edit Iklan" : "Tambah Iklan Baru"}</div>

            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500 }}>Judul Iklan *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #d1e9d5", fontSize: 13, outline: "none" }}
                  placeholder="Contoh: Promo Akhir Tahun"
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 500 }}>Sponsor *</label>
                <input
                  type="text"
                  value={formData.sponsor_name}
                  onChange={e => setFormData({ ...formData, sponsor_name: e.target.value })}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #d1e9d5", fontSize: 13, outline: "none" }}
                  placeholder="Contoh: Telkomsel"
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 500 }}>File (Video/Image) *</label>
                <input
                  type="file"
                  accept="video/*,image/*"
                  onChange={handleFileChange}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #d1e9d5", fontSize: 13 }}
                />
                {formData.fileName && (
                  <div style={{ fontSize: 11, color: "#666", marginTop: 4 }}>📁 {formData.fileName}</div>
                )}
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 500 }}>Durasi Wajib Tonton (detik) *</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={formData.duration}
                  onChange={e => setFormData({ ...formData, duration: parseInt(e.target.value) || 5 })}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #d1e9d5", fontSize: 13, outline: "none" }}
                />
              </div>

              <div>
                <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  <span style={{ fontSize: 12 }}>Aktif (tampil di halaman captive portal)</span>
                </label>
              </div>
            </div>

            {previewUrl && (
              <div style={{ marginTop: 16, padding: 12, background: "#f6fbf7", borderRadius: 12 }}>
                <div style={{ fontSize: 11, color: "#6b8f6e", marginBottom: 8 }}>Preview:</div>
                {previewType === "video" ? (
                  <video src={previewUrl} controls style={{ width: "100%", borderRadius: 8, maxHeight: 200 }} />
                ) : (
                  <img src={previewUrl} alt="Preview" style={{ width: "100%", borderRadius: 8, maxHeight: 200, objectFit: "cover" }} />
                )}
                <div style={{ fontSize: 11, textAlign: "center", marginTop: 8, color: "#c2410c" }}>
                  ⏱️ Wajib tonton: {formData.duration} detik
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 20 }}>
              <button onClick={() => { setShowModal(false); resetForm(); }} style={s.btnGhost}>Batal</button>
              <button onClick={handleSave} disabled={loading} style={{ ...s.btnPrimary, opacity: loading ? 0.6 : 1 }}>
                {loading ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Password field helpers ───────────────────────────────────────────────────
const eyeIcon = (visible: boolean) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {visible ? (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </>
    ) : (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </>
    )}
  </svg>
);

const pwInputStyle: React.CSSProperties = {
  width: "100%", padding: "8px 38px 8px 12px", borderRadius: 8,
  border: "1px solid #d1e9d5", fontSize: 13, outline: "none",
  color: "#2d4a30", fontFamily: "inherit",
};

function PasswordField({
  label, value, onChange, show, onToggleShow, placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void;
  show: boolean; onToggleShow: () => void; placeholder: string;
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontSize: 12, color: "#6b8f6e", fontWeight: 500, display: "block", marginBottom: 4 }}>{label}</label>
      <div style={{ position: "relative" }}>
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={pwInputStyle}
        />
        <button
          type="button"
          onClick={onToggleShow}
          style={{
            position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
            background: "none", border: "none", cursor: "pointer", color: "#a8c9ab",
            display: "flex", alignItems: "center", padding: 4,
          }}
          tabIndex={-1}
        >
          {eyeIcon(show)}
        </button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// PAGE: PENGATURAN
// ════════════════════════════════════════════════════════════════════════════
function PagePengaturan() {
  const [name, setName] = useState(localStorage.getItem("marketing_name") || localStorage.getItem("admin_name") || "Admin Marketing");
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(name);
  const [loading, setLoading] = useState(false);

  const [pwOld, setPwOld] = useState("");
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState("");

  const saveName = async () => {
    if (!nameDraft.trim()) { toast("Nama tidak boleh kosong", "error"); return; }
    setLoading(true);
    try {
      localStorage.setItem("marketing_name", nameDraft);
      localStorage.setItem("admin_name", nameDraft);
      setName(nameDraft);
      setEditingName(false);
      toast("Nama profil berhasil diperbarui", "success");
    } catch (e) {
      toast("Gagal menyimpan nama", "error");
    }
    setLoading(false);
  };

  function resetPwForm() {
    setPwOld(""); setPwNew(""); setPwConfirm("");
    setShowOld(false); setShowNew(false); setShowConfirm(false);
    setPwError("");
  }

  async function savePassword() {
    setPwError("");

    if (!pwOld.trim() || !pwNew.trim() || !pwConfirm.trim()) {
      setPwError("Semua kolom password wajib diisi");
      return;
    }
    if (pwNew.length < 8) {
      setPwError("Password baru minimal 8 karakter");
      return;
    }
    if (pwNew !== pwConfirm) {
      setPwError("Konfirmasi password baru tidak cocok");
      return;
    }
    if (pwNew === pwOld) {
      setPwError("Password baru tidak boleh sama dengan password lama");
      return;
    }

    setPwLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/change-password`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({
          current_password: pwOld,
          new_password: pwNew,
          new_password_confirmation: pwConfirm,
        }),
      });
      const data = await res.json();
      if (res.ok && (data.success ?? true)) {
        toast("Password berhasil diubah", "success");
        resetPwForm();
      } else {
        setPwError(data.message ?? "Gagal mengubah password. Periksa password lama Anda.");
      }
    } catch (e) {
      setPwError("Terjadi kesalahan server. Coba lagi.");
    }
    setPwLoading(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={s.panel}>
        <div style={{ ...s.ph, marginBottom: 14 }}>
          <span style={s.ptitle}>Profil Saya</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#dcfce7", color: "#166534", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, flexShrink: 0 }}>
            {getInitials(name)}
          </div>
          <div style={{ flex: 1 }}>
            {editingName ? (
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  value={nameDraft}
                  onChange={e => setNameDraft(e.target.value)}
                  style={{ flex: 1, padding: "7px 10px", borderRadius: 6, border: "1px solid #d1e9d5", fontSize: 13, outline: "none" }}
                />
                <button onClick={saveName} disabled={loading} style={{ ...s.btnPrimary, padding: "6px 12px", display: "flex", alignItems: "center", gap: 4 }}>{Icon.save} Simpan</button>
                <button onClick={() => { setEditingName(false); setNameDraft(name); }} style={{ ...s.btnGhost, padding: "6px 12px" }}>Batal</button>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#1a2e1c" }}>{name}</div>
                  <div style={{ fontSize: 11, color: "#a8c9ab", marginTop: 2 }}>Marketing Administrator</div>
                </div>
                <button onClick={() => setEditingName(true)} style={{ fontSize: 11, color: "#166534", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}>Edit Nama</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={s.panel}>
        <div style={{ ...s.ph, marginBottom: 14 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "#166534", display: "flex" }}>{Icon.lock}</span>
            <span style={s.ptitle}>Ubah Password</span>
          </span>
          <span style={s.psub}>Pastikan password baru kuat dan mudah diingat</span>
        </div>

        <div style={{ maxWidth: 360 }}>
          <PasswordField
            label="Password Lama"
            value={pwOld}
            onChange={setPwOld}
            show={showOld}
            onToggleShow={() => setShowOld(v => !v)}
            placeholder="Masukkan password lama"
          />
          <PasswordField
            label="Password Baru"
            value={pwNew}
            onChange={setPwNew}
            show={showNew}
            onToggleShow={() => setShowNew(v => !v)}
            placeholder="Minimal 8 karakter"
          />
          <PasswordField
            label="Konfirmasi Password Baru"
            value={pwConfirm}
            onChange={setPwConfirm}
            show={showConfirm}
            onToggleShow={() => setShowConfirm(v => !v)}
            placeholder="Ulangi password baru"
          />

          {pwError && (
            <div style={{
              fontSize: 12, color: "#dc2626", background: "#fef2f2",
              border: "1px solid #fecaca", borderRadius: 8, padding: "8px 12px",
              marginBottom: 12,
            }}>
              {pwError}
            </div>
          )}

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button
              onClick={resetPwForm}
              style={s.btnGhost}
              type="button"
            >
              Batal
            </button>
            <button
              onClick={savePassword}
              disabled={pwLoading}
              style={{ ...s.btnPrimary, opacity: pwLoading ? 0.6 : 1, display: "flex", alignItems: "center", gap: 6 }}
              type="button"
            >
              {Icon.save} {pwLoading ? "Menyimpan..." : "Simpan Password"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN: MARKETING DASHBOARD
// ════════════════════════════════════════════════════════════════════════════
export default function MarketingDashboard() {
  const [time, setTime] = useState(new Date());
  const open = true;
  const [page, setPage] = useState("dashboard");
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fmt = time.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const fmtDate = time.toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const sidebarW = 220;

  const adminName = localStorage.getItem("marketing_name") || localStorage.getItem("admin_name") || "Admin Marketing";
  const adminInitials = getInitials(adminName);

  const pageTitles: Record<string, string> = {
    dashboard: "Dashboard Marketing",
    kontak: "Manajemen Kontak",
    wilayah: "Wilayah & Sebaran",
    laporan: "Laporan & Analisis",
    sponsor: "Manajemen Iklan",
    pengaturan: "Pengaturan Akun",
  };

  const handleLogout = async () => {
    try { 
      await fetch(`${API}/api/marketing/logout`, { method: "POST", headers: authHeaders() }); 
    } catch (e) { /* ignore */ }
    localStorage.removeItem("marketing_token");
    localStorage.removeItem("admin_token");
    localStorage.removeItem("token");
    localStorage.removeItem("admin_role");
    localStorage.removeItem("admin_name");
    localStorage.removeItem("marketing_name");
    window.location.href = "/admin";
  };

  return (
    <div style={s.root}>
      <ToastContainer />

      <aside style={{ ...s.sidebar, width: sidebarW }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "22px 14px 18px", marginBottom: 0, gap: 12 }}>
          <img src={logo} alt="Saloka" style={{ width: 125, height: 80, objectFit: "contain", flexShrink: 0 }} />
        </div>

        <nav style={{ flex: 1, padding: "4px 8px" }}>
          {navItems.map(item => (
            <div
              key={item.page}
              onClick={() => setPage(item.page)}
              style={{ ...s.navRow, ...(page === item.page ? s.navOn : {}), cursor: "pointer", justifyContent: "flex-start", padding: "10px 12px" }}
            >
              <span style={{ ...s.navIco, color: page === item.page ? "#166534" : "#a8c9ab" }}>
                {Icon[item.icon as keyof typeof Icon]}
              </span>
              {open && <span style={{ ...s.navLbl, color: page === item.page ? "#166534" : "#6b8f6e" }}>{item.label}</span>}
            </div>
          ))}
        </nav>
      </aside>

      <main style={{ ...s.main, marginLeft: sidebarW }}>
        <header style={s.topbar}>
          <div>
            <div style={s.pgTitle}>{pageTitles[page]}</div>
            <div style={s.pgDate}>{fmtDate}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={s.clockBox}>{fmt}</div>
            <div ref={profileRef} style={{ position: "relative" }}>
              <div onClick={() => setProfileOpen(v => !v)} style={{ ...s.adminBox, cursor: "pointer", outline: profileOpen ? "2px solid #bbf7d0" : "none" }}>
                <div style={s.adminAv}>{adminInitials}</div>
                <span style={{ fontSize: 13, fontWeight: 500, color: "#2d4a30" }}>{adminName}</span>
                <span style={{ color: "#a8c9ab", display: "flex", alignItems: "center", transition: "transform 0.2s", transform: profileOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
                  {Icon.chevDown}
                </span>
              </div>
              {profileOpen && (
                <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, background: "white", border: "1px solid #e4f0e6", borderRadius: 10, minWidth: 200, zIndex: 9999, boxShadow: "0 8px 24px rgba(0,0,0,0.08)", overflow: "hidden" }}>
                  <div style={{ padding: "12px 14px", borderBottom: "1px solid #eef6ef" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#1a2e1c" }}>{adminName}</div>
                    <div style={{ fontSize: 11, color: "#a8c9ab", marginTop: 2 }}>Marketing Administrator</div>
                  </div>
                  <button
                    onClick={handleLogout}
                    style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "10px 14px", border: "none", background: "transparent", cursor: "pointer", fontSize: 12, color: "#dc2626", transition: "background 0.15s" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#fef2f2"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                  >
                    <span style={{ display: "flex" }}>{Icon.logout}</span>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {page === "dashboard" && <PageDashboard />}
        {page === "kontak" && <PageKontak />}
        {page === "wilayah" && <PageWilayah />}
        {page === "laporan" && <PageLaporan />}
        {page === "sponsor" && <PageSponsor />}
        {page === "pengaturan" && <PagePengaturan />}
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'DM Sans', sans-serif; background: #f2f6f2; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes toastIn { from { opacity: 0; transform: translateX(16px); } to { opacity: 1; transform: translateX(0); } }
        input::placeholder { color: #c4ddc6; }
        input[type="date"]::-webkit-calendar-picker-indicator { cursor: pointer; opacity: 0.5; }
        input[type="date"] { color-scheme: light; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: #f0faf2; }
        ::-webkit-scrollbar-thumb { background: #c4ddc6; border-radius: 10px; }
      `}</style>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  root: { display: "flex", minHeight: "100vh", background: "#f2f6f2", fontFamily: "'DM Sans',sans-serif" },
  sidebar: { background: "white", display: "flex", flexDirection: "column", overflow: "hidden", flexShrink: 0, position: "fixed", left: 0, top: 0, bottom: 0, zIndex: 1000, borderRight: "1px solid #e4f0e6" },
  main: { flex: 1, padding: "20px 24px", overflowY: "auto", minHeight: "100vh" },
  topbar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid #eef6ef" },
  pgTitle: { fontSize: 18, fontWeight: 600, color: "#1a2e1c" },
  pgDate: { fontSize: 12, color: "#a8c9ab", marginTop: 2 },
  clockBox: { fontFamily: "'DM Mono',monospace", fontSize: 15, color: "#166534", fontWeight: 500, background: "#f0fdf4", padding: "5px 12px", borderRadius: 8, border: "1px solid #bbf7d0" },
  adminBox: { display: "flex", alignItems: "center", gap: 8, background: "white", padding: "5px 12px", borderRadius: 8, border: "1px solid #d1e9d5" },
  adminAv: { width: 26, height: 26, borderRadius: "50%", background: "#dcfce7", color: "#166534", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 },
  navRow: { display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, margin: "2px 0", whiteSpace: "nowrap", transition: "background 0.15s" },
  navOn: { background: "#f0fdf4" },
  navIco: { width: 20, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  navLbl: { fontSize: 13, fontWeight: 500 },
  cardGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(158px,1fr))", gap: 12, marginBottom: 14 },
  card: { background: "white", borderRadius: 12, padding: "14px 15px", border: "1px solid #e4f0e6", animation: "fadeUp 0.35s ease both" },
  cLabel: { fontSize: 12, color: "#6b8f6e", fontWeight: 500 },
  cSub: { fontSize: 11, color: "#a8c9ab", marginTop: 1 },
  icoBox: { width: 34, height: 34, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" },
  cNum: { fontSize: 24, fontWeight: 600, fontFamily: "'DM Mono',monospace" },
  cUnit: { fontSize: 11, color: "#a8c9ab" },
  panel: { background: "white", borderRadius: 12, padding: "14px 16px", border: "1px solid #e4f0e6", marginBottom: 12 },
  ph: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 8 },
  ptitle: { fontSize: 13, fontWeight: 600, color: "#1a2e1c" },
  psub: { fontSize: 11, color: "#a8c9ab" },
  row: { display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap" },
  th: { fontSize: 10, color: "#a8c9ab", fontWeight: 500, textAlign: "left", padding: "8px 10px", textTransform: "uppercase", letterSpacing: 0.5, borderBottom: "1px solid #eef6ef" },
  td: { padding: "9px 10px", borderBottom: "1px solid #f5fbf5" },
  av: { width: 27, height: 27, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 600, color: "#166534" },
  ip: { background: "#f0faf2", borderRadius: 4, padding: "2px 6px", fontSize: 11, fontFamily: "'DM Mono',monospace", color: "#4a6b4d" },
  badge: { padding: "3px 9px", borderRadius: 20, fontSize: 11, fontWeight: 600 },
  bon: { background: "#f0fdf4", color: "#166534" },
  bidl: { background: "#fffbeb", color: "#d97706" },
  boff: { background: "#fef2f2", color: "#dc2626" },
  refBtn: { fontSize: 12, color: "#166534", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 6, padding: "5px 10px", cursor: "pointer" },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 },
  modal: { background: "white", borderRadius: 12, padding: "24px", width: 320, boxShadow: "0 8px 32px rgba(0,0,0,0.1)", border: "1px solid #e4f0e6" },
  btnGhost: { fontSize: 13, padding: "7px 16px", borderRadius: 7, border: "1px solid #d1e9d5", background: "white", cursor: "pointer", color: "#6b8f6e" },
  btnDanger: { fontSize: 13, padding: "7px 16px", borderRadius: 7, border: "none", background: "#dc2626", color: "white", cursor: "pointer" },
  btnPrimary: { fontSize: 13, padding: "7px 16px", borderRadius: 7, border: "none", background: "#166534", color: "white", cursor: "pointer" },
  pageBtn: { minWidth: 28, height: 28, padding: "0 8px", borderRadius: 6, border: "1px solid #d1e9d5", background: "white", color: "#4a6b4d", fontSize: 12, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
};