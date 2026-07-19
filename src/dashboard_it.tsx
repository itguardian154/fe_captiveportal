import { useState, useEffect, useCallback, useRef } from "react";
import logo from "./assets/logo.png";
import * as XLSX from "xlsx";

import { API_URL as API } from "./lib/config";

function getToken() {
  return localStorage.getItem("admin_token") || localStorage.getItem("it_token") || "";
}

function authHeaders() {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  };
}

// ─── Helper: Format WIB (tanpa konversi tambahan, backend sudah kirim WIB) ──
function formatToWIB(dateString: string | undefined | null, format: "datetime" | "time" | "date" = "datetime"): string {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";
    // Backend sudah mengirim dalam WIB, tidak perlu +7

    if (format === "time") {
      return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    }
    if (format === "date") {
      return date.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    }
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return "-";
  }
}

function formatDateWIB(dateString: string | undefined | null): string {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";
    // Backend sudah mengirim dalam WIB, tidak perlu +7
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch {
    return "-";
  }
}

function formatTimeWIB(dateString: string | undefined | null): string {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";
    // Backend sudah mengirim dalam WIB, tidak perlu +7
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return "-";
  }
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
    error:   { bg: "#fef2f2", border: "#fecaca", icon: "✕", iconColor: "#dc2626" },
    info:    { bg: "#eff6ff", border: "#bfdbfe", icon: "i", iconColor: "#2563eb" },
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

interface DashboardMetrics {
  totalUsers?: number;
  periodUsers?: number;
  activeUsers?: number;
  visitors?: { display: string; period: string; trend: string; trend_up?: boolean };
  active?: { display: string; trend: string; trend_up?: boolean };
  bandwidth?: { display: string; trend: string };
  session?: { display: string; trend: string };
}

interface TrafficData {
  hour: string;
  users: number;
}

interface Visitor {
  id: number;
  name: string;
  device?: string;
  ip_address?: string;
  mac_address?: string;
  login_time?: string;
  logout_time?: string;
  created_at?: string;
  duration?: string;
  status: string;
  phone?: string;
  provinsi?: string;
  kabupaten?: string;
  is_verified?: boolean;
}

interface SessionStats {
  avg: string;
  longest: string;
  shortest: string;
  bounce_rate: string;
  repeat_users: string;
}

interface TicketStats {
  valid_pct: number;
  bypass_pct: number;
}

interface BandwidthData {
  download: { gb: number; formatted: string };
  upload: { gb: number; formatted: string };
}

interface User {
  id: number;
  name: string;
  phone: string;
  ip_address?: string;
  mac_address?: string;
  provinsi?: string;
  kabupaten?: string;
  is_verified: boolean;
  created_at: string;
}

interface BandwidthSummary {
  total_download: number;
  total_upload: number;
  peak_download: number;
  peak_upload: number;
  average_download: number;
  average_upload: number;
}

interface BandwidthHistory {
  hour: string;
  download: number;
  upload: number;
}

interface TopUserBandwidth {
  name: string;
  phone: string;
  download: number;
  upload: number;
  total: number;
}

interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
  last_login?: string;
  created_at: string;
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
  users: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>),
  wifi: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0" /><path d="M1.42 9a16 16 0 0 1 21.16 0" /><path d="M8.53 16.11a6 6 0 0 1 6.95 0" /><circle cx="12" cy="20" r="1" fill="currentColor" /></svg>),
  database: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></svg>),
  clock: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>),
  grid: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>),
  user: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>),
  server: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" /><rect x="2" y="14" width="20" height="8" rx="2" /><line x1="6" y1="6" x2="6.01" y2="6" /><line x1="6" y1="18" x2="6.01" y2="18" /></svg>),
  chart: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /><line x1="2" y1="20" x2="22" y2="20" /></svg>),
  settings: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>),
  logout: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>),
  refresh: (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>),
  chevL: (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>),
  chevR: (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>),
  chevDown: (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>),
  trash: (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" /></svg>),
  search: (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>),
  calendar: (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>),
  mapPin: (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>),
  loginTime: (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></svg>),
  logoutTime: (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>),
  download: (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>),
  plus: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>),
  edit: (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3l4 4-7 7H10v-4l7-7z" /><path d="M4 20h16" /></svg>),
  save: (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>),
  cancel: (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>),
  excel: (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>),
  upload: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>),
  video: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="6" width="16" height="12" rx="2"/><path d="M22 10l-4 2 4 2v-4z"/></svg>),
  image: (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="2" width="20" height="20" rx="2"/><circle cx="8.5" cy="8.5" r="2.5"/><path d="M21 15l-5-4-3 3-4-4-5 5"/></svg>),
};

const navItems = [
  { icon: "grid", label: "Dashboard", page: "dashboard" },
  { icon: "user", label: "Users", page: "users" },
  { icon: "server", label: "Bandwidth", page: "bandwidth" },
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

// ─── PeriodFilter ─────────────────────────────────────────────────────────────
function PeriodFilter({ value, onChange, dateFrom, dateTo, onDateFromChange, onDateToChange }: PeriodFilterProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = PERIOD_OPTIONS.find(o => o.value === value);

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
        {selected?.label}
        <span style={{ color: "#a8c9ab", display: "flex", marginLeft: 2 }}>{Icon.chevDown}</span>
      </div>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", right: 0,
          background: "white", border: "1px solid #e4f0e6",
          borderRadius: 10, zIndex: 999, minWidth: 168,
          boxShadow: "0 8px 24px rgba(0,0,0,0.08)", overflow: "hidden",
        }}>
          {PERIOD_OPTIONS.map(opt => (
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

function periodLabel(value: string, dateFrom: string, dateTo: string): string {
  if (value === "custom" && dateFrom && dateTo) return `${dateFrom} – ${dateTo}`;
  return PERIOD_OPTIONS.find(o => o.value === value)?.label ?? "Hari Ini";
}

// ─── TradingChart (grafik ala trading/investasi: grid, area gradient, garis mulus, tooltip + crosshair) ──
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



// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
      <div style={{ width: 28, height: 28, border: "3px solid #e4f0e6", borderTop: "3px solid #166534", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    </div>
  );
}

// ─── Page: Dashboard ──────────────────────────────────────────────────────────
function PageDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [traffic, setTraffic] = useState<TrafficData[]>([]);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [sessions, setSessions] = useState<SessionStats | null>(null);
  const [tickets, setTickets] = useState<TicketStats | null>(null);
  const [bandwidth, setBandwidth] = useState<BandwidthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("today");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchAll = useCallback(async (p = "today", df = "", dt = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ period: p });
      if (p === "custom" && df && dt) { params.set("date_from", df); params.set("date_to", dt); }
      const q = `?${params.toString()}`;
      
      const [mRes, tRes, vRes, sRes, tkRes, bwRes] = await Promise.all([
        fetch(`${API}/api/admin/dashboard/metrics${q}`, { headers: authHeaders() }),
        fetch(`${API}/api/admin/dashboard/traffic${q}`, { headers: authHeaders() }),
        fetch(`${API}/api/admin/visitors${q}`, { headers: authHeaders() }),
        fetch(`${API}/api/admin/sessions/stats${q}`, { headers: authHeaders() }),
        fetch(`${API}/api/admin/tickets/stats${q}`, { headers: authHeaders() }),
        fetch(`${API}/api/admin/bandwidth${q}`, { headers: authHeaders() }),
      ]);
      
      const [m, t, v, sv, tk, bw] = await Promise.all([mRes.json(), tRes.json(), vRes.json(), sRes.json(), tkRes.json(), bwRes.json()]);
      
      // Dashboard metrics - API sekarang langsung return data di root
      if (m.success) {
        setMetrics({
          totalUsers: m.totalUsers || 0,
          periodUsers: m.periodUsers || 0,
          activeUsers: m.activeUsers || 0,
          visitors: m.visitors || { display: "0", period: "0", trend: "0%", trend_up: false },
          active: m.active || { display: "0", trend: "0 user terhubung", trend_up: false },
          bandwidth: m.bandwidth || { display: "0 B", trend: "0 B" },
          session: m.session || { display: "0 Mnt", trend: "0 Mnt" },
        });
      }
      
      if (t.success) setTraffic(t.traffic || []);
      if (v.success) setVisitors(v.data?.slice(0, 6) || []);
      if (sv.success !== false) setSessions(sv);
      if (tk.success !== false) setTickets(tk);
      if (bw.success) setBandwidth(bw);
    } catch (e) { 
      console.error("Fetch error:", e);
      toast("Gagal memuat data dashboard", "error");
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(period, dateFrom, dateTo); }, []);

  const handlePeriodChange = (p: string) => {
    setPeriod(p);
    if (p !== "custom") fetchAll(p, "", "");
  };

  const totalUsers = metrics?.totalUsers ?? 0;
  const periodUsers = metrics?.periodUsers ?? 0;
  const activeUsers = metrics?.activeUsers ?? 0;

  const metricCards = [
    { 
      id: "visitors", 
      icon: "users", 
      label: "Total Pengunjung", 
      sub: periodLabel(period, dateFrom, dateTo), 
      display: totalUsers.toString(), 
      unit: "User", 
      color: "#166534", 
      bg: "#f0fdf4", 
      border: "#bbf7d0", 
      trend: `+${periodUsers} pengunjung baru`,
      trendUp: periodUsers > 0,
    },
    { 
      id: "active", 
      icon: "wifi", 
      label: "Active Users", 
      sub: "Saat Ini", 
      display: activeUsers.toString(), 
      unit: "Terhubung", 
      color: "#15803d", 
      bg: "#f0fdf4", 
      border: "#86efac", 
      trend: `${activeUsers} user terhubung`, 
      trendUp: activeUsers > 0,
    },
    { 
      id: "bandwidth", 
      icon: "database", 
      label: "Total Bandwidth", 
      sub: "Terpakai", 
      display: metrics?.bandwidth?.display ?? "0 GB", 
      unit: "Digunakan", 
      color: "#7c3aed", 
      bg: "#faf5ff", 
      border: "#ddd6fe", 
      trend: metrics?.bandwidth?.trend ?? "-", 
      trendUp: null,
    },
    { 
      id: "session", 
      icon: "clock", 
      label: "Durasi Sesi", 
      sub: "Rata-rata", 
      display: metrics?.session?.display ?? "0 Mnt", 
      unit: "/ User", 
      color: "#c2410c", 
      bg: "#fff7ed", 
      border: "#fed7aa", 
      trend: metrics?.session?.trend ?? "-", 
      trendUp: true,
    },
  ];

  const validPct = tickets?.valid_pct ?? 0;
  const bypassPct = tickets?.bypass_pct ?? 0;
  const dlGb = bandwidth?.download?.gb ?? 0;
  const ulGb = bandwidth?.upload?.gb ?? 0;
  const totalGb = dlGb + ulGb || 1;

  const avBg = ["#dcfce7", "#dbeafe", "#fef9c3", "#ede9fe"];

  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <PeriodFilter value={period} onChange={handlePeriodChange} dateFrom={dateFrom} dateTo={dateTo} onDateFromChange={setDateFrom} onDateToChange={v => setDateTo(v)} />
      </div>

      {loading ? <Spinner /> : (
        <>
          <div style={s.cardGrid}>
            {metricCards.map((m, i) => (
              <div key={m.id} style={{ ...s.card, animationDelay: `${i * 65}ms` }}>
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
                  <span style={{ ...s.cNum, color: m.color }}>{m.display}</span>
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
                <span style={s.ptitle}>Trafik Pengunjung</span>
                <span style={s.psub}>Per jam — {periodLabel(period, dateFrom, dateTo)}</span>
              </div>
              <TradingChart
                categories={traffic.map(t => `${t.hour}:00`)}
                series={[
                  { label: "Pengunjung", color: "#16a34a", values: traffic.map(t => t.users), format: v => `${v} user` },
                ]}
                height={200}
              />
              <div style={{ marginBottom: 14 }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { label: "Download", val: bandwidth?.download?.formatted ?? "0 B", pct: `${Math.round((dlGb / totalGb) * 100)}%`, color: "#3b82f6" },
                  { label: "Upload", val: bandwidth?.upload?.formatted ?? "0 B", pct: `${Math.round((ulGb / totalGb) * 100)}%`, color: "#f97316" },
                ].map(bw => (
                  <div key={bw.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 11, color: "#8faa92", width: 56 }}>{bw.label}</span>
                    <div style={{ flex: 1, height: 4, background: "#f0faf2", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ width: bw.pct, height: "100%", background: bw.color, borderRadius: 3 }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: bw.color, width: 46, textAlign: "right" }}>{bw.val}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ ...s.panel, minWidth: 196, maxWidth: 226 }}>
              <div style={s.ph}>
                <span style={s.ptitle}>Validasi OTP</span>
                <span style={s.psub}>{periodLabel(period, dateFrom, dateTo)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "center", margin: "14px 0" }}>
                <svg viewBox="0 0 110 110" width="108" height="108">
                  <circle cx="55" cy="55" r="44" fill="none" stroke="#f0fdf4" strokeWidth="11" />
                  <circle cx="55" cy="55" r="44" fill="none" stroke="#16a34a" strokeWidth="11"
                    strokeDasharray={`${2 * Math.PI * 44 * (validPct / 100)} ${2 * Math.PI * 44 * (1 - validPct / 100)}`}
                    strokeLinecap="round" transform="rotate(-90 55 55)" />
                  <circle cx="55" cy="55" r="44" fill="none" stroke="#dc2626" strokeWidth="11"
                    strokeDasharray={`${2 * Math.PI * 44 * (bypassPct / 100)} ${2 * Math.PI * 44 * (1 - bypassPct / 100)}`}
                    strokeDashoffset={-(2 * Math.PI * 44 * (validPct / 100))}
                    strokeLinecap="round" transform="rotate(-90 55 55)" />
                  <text x="55" y="51" textAnchor="middle" fontSize="17" fontWeight="600" fill="#166534">{validPct}%</text>
                  <text x="55" y="64" textAnchor="middle" fontSize="9" fill="#a8c9ab">Tervalidasi</text>
                </svg>
              </div>
              {[
                { label: "Tervalidasi", pct: `${validPct}%`, color: "#16a34a" },
                { label: "Bypass OTP/Admin", pct: `${bypassPct}%`, color: "#dc2626" },
              ].map(lg => (
                <div key={lg.label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid #f0faf2" }}>
                  <div style={{ width: 7, height: 7, borderRadius: 2, background: lg.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: "#6b8f6e", flex: 1 }}>{lg.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: lg.color }}>{lg.pct}</span>
                </div>
              ))}
            </div>

            <div style={{ ...s.panel, minWidth: 170, maxWidth: 198 }}>
              <div style={s.ph}><span style={s.ptitle}>Statistik Sesi</span></div>
              {[
                { label: "Rata-rata", val: sessions?.avg ?? "0 mnt", color: "#c2410c" },
                { label: "Terpanjang", val: sessions?.longest ?? "0 mnt", color: "#1d4ed8" },
                { label: "Terpendek", val: sessions?.shortest ?? "0 mnt", color: "#7c3aed" },
                { label: "Bounce Rate", val: sessions?.bounce_rate ?? "0%", color: "#dc2626" },
                { label: "Repeat Users", val: sessions?.repeat_users ?? "0%", color: "#166534" },
              ].map(st => (
                <div key={st.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: "1px solid #f0faf2" }}>
                  <span style={{ fontSize: 12, color: "#6b8f6e" }}>{st.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: st.color }}>{st.val}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={s.panel}>
            <div style={{ ...s.ph, marginBottom: 12 }}>
              <span style={s.ptitle}>Pengguna Aktif Terkini</span>
              <button style={s.refBtn} onClick={() => fetchAll(period, dateFrom, dateTo)}>
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}>{Icon.refresh} Refresh</span>
              </button>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 900 }}>
                <thead>
                  <tr>
                    {["Nama", "Perangkat", "IP Address", "MAC Address", "Login", "Putus Koneksi", "Durasi", "Status"].map(h => (
                      <th key={h} style={s.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visitors.length === 0 ? (
                    <tr><td colSpan={8} style={{ textAlign: "center", padding: 32, color: "#a8c9ab", fontSize: 13 }}>Tidak ada data visitor</td></tr>
                  ) : visitors.map((u: Visitor, i: number) => (
                    <tr key={u.id} style={{ background: i % 2 === 0 ? "#fafff8" : "white" }}>
                      <td style={s.td}>
                        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                          <div style={{ ...s.av, background: avBg[i % 4] }}>
                            {u.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2) || "??"}
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 500, color: "#2d4a30" }}>{u.name || "-"}</span>
                        </div>
                      </td>
                      <td style={s.td}><span style={{ fontSize: 12, color: "#6b8f6e" }}>{u.device ?? "-"}</span></td>
                      <td style={s.td}><span style={s.ip}>{u.ip_address ?? "-"}</span></td>
                      <td style={s.td}><span style={s.ip}>{u.mac_address ?? "-"}</span></td>
                      <td style={s.td}>
                        <span style={{ fontSize: 12, color: "#4a6b4d", fontFamily: "'DM Mono',monospace" }}>
                          {formatTimeWIB(u.login_time ?? u.created_at)}
                        </span>
                      </td>
                      <td style={s.td}>
                        <span style={{ fontSize: 12, fontFamily: "'DM Mono',monospace", color: u.logout_time ? "#dc2626" : "#a8c9ab" }}>
                          {u.logout_time ? formatTimeWIB(u.logout_time) : (u.status === "Online" ? "Masih aktif" : "-")}
                        </span>
                      </td>
                      <td style={s.td}><span style={{ fontSize: 12, color: "#4a6b4d" }}>{u.duration ?? "-"}</span></td>
                      <td style={s.td}>
                        <span style={{ ...s.badge, ...(u.status === "Online" ? s.bon : u.status === "Idle" ? s.bidl : s.boff) }}>
                          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "currentColor", display: "inline-block", marginRight: 5, verticalAlign: "middle" }} />
                          {u.status || "Unknown"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  );
}

// ─── Page: Users ──────────────────────────────────────────────────────────────
type ViewMode = "table" | "group";

function PageUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [confirm, setConfirm] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [selectedKab, setSelectedKab] = useState<string | null>(null);
  const [period, setPeriod] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  const PERIOD_OPTIONS_USERS = [{ value: "all", label: "Semua" }, ...PERIOD_OPTIONS];

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/users`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) setUsers(data.data || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const filterByPeriod = (user: User) => {
    if (period === "all") return true;
    if (!user.created_at) return false;
    const d = new Date(user.created_at);
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
  };

  const filtered = users
    .filter(filterByPeriod)
    .filter(u =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.phone?.includes(search) ||
      u.provinsi?.toLowerCase().includes(search.toLowerCase()) ||
      u.kabupaten?.toLowerCase().includes(search.toLowerCase())
    );

  // Reset ke halaman 1 setiap kali filter/pencarian/periode berubah
  useEffect(() => { setCurrentPage(1); }, [search, period, dateFrom, dateTo, users.length]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedUsers = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  const grouped = filtered.reduce<Record<string, typeof filtered>>((acc, u) => {
    const key = u.provinsi ?? "Tidak Diketahui";
    if (!acc[key]) acc[key] = [];
    acc[key].push(u);
    return acc;
  }, {});

  
  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`${API}/api/admin/users/${id}`, { method: "DELETE", headers: authHeaders() });
      const data = await res.json();
      if (data.success || res.ok) {
        setUsers(prev => prev.filter(u => u.id !== id));
        toast("User berhasil dihapus", "success");
      } else {
        toast(data.message ?? "Gagal menghapus user", "error");
      }
    } catch {
      toast("Server error", "error");
    }
    setConfirm(null);
  };

  const exportToExcel = () => {
    setIsExporting(true);
    try {
      const exportData = filtered.map((user, idx) => ({
        "No": idx + 1,
        "Nama": user.name,
        "No. HP": user.phone,
        "IP Address": user.ip_address || "-",
        "MAC Address": user.mac_address || "-",
        "Provinsi": user.provinsi || "-",
        "Kabupaten": user.kabupaten || "-",
        "Status Verifikasi": user.is_verified ? "Verified" : "Unverified",
        "Tanggal Bergabung": formatDateWIB(user.created_at),
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      ws['!cols'] = [
        { wch: 5 }, { wch: 25 }, { wch: 15 }, { wch: 15 },
        { wch: 18 }, { wch: 20 }, { wch: 20 }, { wch: 18 }, { wch: 15 }
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Data Users");

      const periodText = period === "custom" && dateFrom && dateTo
        ? `${dateFrom}_sd_${dateTo}`
        : period;
      XLSX.writeFile(wb, `users_${periodText}_${new Date().toISOString().split("T")[0]}.xlsx`);
      toast(`Berhasil mengeksport ${filtered.length} data user`, "success");
    } catch (error) {
      console.error("Export error:", error);
      toast("Gagal mengekspor data", "error");
    }
    setIsExporting(false);
  };

  if (loading) return <Spinner />;

  const activeLabel = PERIOD_OPTIONS_USERS.find(o => o.value === period)?.label ?? "Semua";
  const avBg = ["#dcfce7", "#dbeafe", "#fef9c3", "#ede9fe"];

  const TableHead = () => (
    <thead>
      <tr>
        {["#", "Nama", "No. HP", "IP Address", "MAC Address", "Provinsi", "Kabupaten", "Verified", "Bergabung", "Aksi"].map(h => (
          <th key={h} style={s.th}>{h}</th>
        ))}
      </tr>
    </thead>
  );

  const UserRow = ({ u, i, globalIdx }: { u: User; i: number; globalIdx: number }) => (
    <tr style={{ background: i % 2 === 0 ? "#fafff8" : "white" }}>
      <td style={s.td}><span style={{ fontSize: 12, color: "#a8c9ab" }}>{globalIdx + 1}</span></td>
      <td style={s.td}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ ...s.av, background: avBg[globalIdx % 4] }}>
            {u.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2) || "??"}
          </div>
          <span style={{ fontSize: 13, fontWeight: 500, color: "#2d4a30" }}>{u.name}</span>
        </div>
      </td>
      <td style={s.td}><span style={s.ip}>{u.phone}</span></td>
      <td style={s.td}><span style={s.ip}>{u.ip_address ?? "-"}</span></td>
      <td style={s.td}><span style={s.ip}>{u.mac_address ?? "-"}</span></td>
      <td style={s.td}><span style={{ fontSize: 12, color: "#6b8f6e" }}>{u.provinsi ?? "-"}</span></td>
      <td style={s.td}><span style={{ fontSize: 12, color: "#6b8f6e" }}>{u.kabupaten ?? "-"}</span></td>
      <td style={s.td}>
        <span style={{ ...s.badge, ...(u.is_verified ? s.bon : s.boff) }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "currentColor", display: "inline-block", marginRight: 5, verticalAlign: "middle" }} />
          {u.is_verified ? "Verified" : "Unverified"}
        </span>
      </td>
      <td style={s.td}><span style={{ fontSize: 12, color: "#8faa92" }}>{formatDateWIB(u.created_at)}</span></td>
      <td style={s.td}>
        <button
          onClick={() => setConfirm(u.id)}
          style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", borderRadius: 6, padding: "4px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 12 }}
        >
          {Icon.trash} Hapus
        </button>
      </td>
    </tr>
  );

  // ─── Pagination Controls ───────────────────────────────────────────────────
  const Pagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 14, paddingTop: 12, borderTop: "1px solid #eef6ef", flexWrap: "wrap", gap: 10 }}>
        <span style={{ fontSize: 12, color: "#8faa92" }}>
          Menampilkan {(safePage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(safePage * ITEMS_PER_PAGE, filtered.length)} dari {filtered.length} user
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
      {confirm !== null && (
        <div style={s.overlay}>
          <div style={s.modal}>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#1a2e1c", marginBottom: 8 }}>Hapus User?</div>
            <div style={{ fontSize: 13, color: "#6b8f6e", marginBottom: 20 }}>Tindakan ini tidak dapat dibatalkan.</div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button style={s.btnGhost} onClick={() => setConfirm(null)}>Batal</button>
              <button style={s.btnDanger} onClick={() => handleDelete(confirm!)}>Hapus</button>
            </div>
          </div>
        </div>
      )}

      <div style={s.panel}>
        <div style={{ ...s.ph, marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
          <span style={s.ptitle}>Daftar Users ({filtered.length})</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f6fbf7", borderRadius: 8, padding: "6px 10px", border: "1px solid #d1e9d5" }}>
              <span style={{ color: "#a8c9ab", display: "flex" }}>{Icon.search}</span>
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Cari nama, whatsapp, provinsi..."
                style={{ border: "none", background: "transparent", fontSize: 13, outline: "none", width: 200, color: "#2d4a30" }}
              />
            </div>

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

            <UsersPeriodFilter
              value={period} onChange={setPeriod}
              dateFrom={dateFrom} dateTo={dateTo}
              onDateFromChange={setDateFrom} onDateToChange={setDateTo}
              options={PERIOD_OPTIONS_USERS}
            />
          </div>
        </div>

        {period !== "all" && (
          <div style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12, color: "#8faa92" }}>Bergabung:</span>
            <span style={{ fontSize: 12, background: "#f0fdf4", color: "#166534", padding: "2px 10px", borderRadius: 20, fontWeight: 600, border: "1px solid #bbf7d0" }}>
              {period === "custom" && dateFrom && dateTo ? `${dateFrom} – ${dateTo}` : activeLabel}
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
                  {paginatedUsers.map((u, i) => {
                    const globalIdx = (safePage - 1) * ITEMS_PER_PAGE + i;
                    return <UserRow key={u.id} u={u} i={i} globalIdx={globalIdx} />;
                  })}
                  {filtered.length === 0 && (
                    <tr><td colSpan={10} style={{ textAlign: "center", padding: 32, color: "#a8c9ab", fontSize: 13 }}>Tidak ada user ditemukan</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination />
          </>
        )}

        {viewMode === "group" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 8 }}>
              {Object.keys(grouped).sort().map((prov, idx) => {
                const cnt = grouped[prov].length;
                const pct = Math.round((cnt / filtered.length) * 100);
                const colors = ["#166534", "#1d4ed8", "#7c3aed", "#c2410c", "#b45309", "#0f766e", "#6d28d9", "#1e40af"];
                const col = colors[idx % colors.length];
                const isActive = selectedProvince === prov;
                return (
                  <div
                    key={prov}
                    onClick={() => { setSelectedProvince(isActive ? null : prov); setSelectedKab(null); }}
                    style={{
                      background: isActive ? "#f0fdf4" : "#fafff8",
                      border: isActive ? "1.5px solid #16a34a" : "1px solid #e4f0e6",
                      borderRadius: 8, padding: "10px 12px", cursor: "pointer", userSelect: "none",
                      transition: "all 0.15s",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ width: 7, height: 7, borderRadius: "50%", background: col, flexShrink: 0 }} />
                        <span style={{ fontSize: 11, fontWeight: 600, color: "#2d4a30", lineHeight: 1.3 }}>{prov}</span>
                      </div>
                      <span style={{ color: isActive ? "#16a34a" : "#a8c9ab", transform: isActive ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", display: "flex" }}>
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
                <div style={{ textAlign: "center", padding: 32, color: "#a8c9ab", fontSize: 13, gridColumn: "1 / -1" }}>Tidak ada user ditemukan</div>
              )}
            </div>

            {selectedProvince && grouped[selectedProvince] && (() => {
              const provUsers = grouped[selectedProvince];
              const kabGroups = provUsers.reduce<Record<string, typeof provUsers>>((acc, u) => {
                const k = u.kabupaten ?? "Tidak Diketahui";
                if (!acc[k]) acc[k] = [];
                acc[k].push(u);
                return acc;
              }, {});

              return (
                <div style={{ border: "1px solid #e4f0e6", borderRadius: 10, padding: "10px 12px", background: "white" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{ color: "#16a34a", display: "flex" }}>{Icon.mapPin}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#1a2e1c" }}>{selectedProvince}</span>
                    <span style={{ fontSize: 11, color: "#a8c9ab" }}>{Object.keys(kabGroups).length} kabupaten/kota</span>
                  </div>
                  {Object.keys(kabGroups).sort().map(kab => {
                    const kabKey = `${selectedProvince}::${kab}`;
                    const kabOpen = selectedKab === kabKey;
                    return (
                      <div key={kab} style={{ marginBottom: 8 }}>
                        <div
                          onClick={() => setSelectedKab(kabOpen ? null : kabKey)}
                          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, padding: "7px 10px", borderLeft: "3px solid #86efac", marginBottom: kabOpen ? 4 : 0, background: "#fafff8", cursor: "pointer", userSelect: "none", borderRadius: 4 }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: "#15803d" }}>{kab}</span>
                            <span style={{ fontSize: 11, color: "#a8c9ab" }}>({kabGroups[kab].length} user)</span>
                          </div>
                          <span style={{ color: "#a8c9ab", transform: kabOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", display: "flex" }}>
                            {Icon.chevDown}
                          </span>
                        </div>
                        {kabOpen && (
                          <div style={{ overflowX: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 860 }}>
                              <TableHead />
                              <tbody>
                                {kabGroups[kab].map((u, i) => {
                                  const globalIdx = filtered.findIndex(f => f.id === u.id);
                                  return <UserRow key={u.id} u={u} i={i} globalIdx={globalIdx} />;
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
        )}
      </div>
    </>
  );
}

// ─── UsersPeriodFilter ────────────────────────────────────────────────────────
function UsersPeriodFilter({ value, onChange, dateFrom, dateTo, onDateFromChange, onDateToChange, options }: PeriodFilterProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options?.find(o => o.value === value);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div onClick={() => setOpen(v => !v)} style={{ display: "flex", alignItems: "center", gap: 6, background: "white", border: "1px solid #d1e9d5", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 12, color: "#2d4a30", fontWeight: 500, userSelect: "none" }}>
        <span style={{ color: "#4caf50", display: "flex" }}>{Icon.calendar}</span>
        {selected?.label ?? "Filter Tanggal"}
        <span style={{ color: "#a8c9ab", display: "flex", marginLeft: 2 }}>{Icon.chevDown}</span>
      </div>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, background: "white", border: "1px solid #e4f0e6", borderRadius: 10, zIndex: 999, minWidth: 168, boxShadow: "0 8px 24px rgba(0,0,0,0.08)", overflow: "hidden" }}>
          {options?.map(opt => (
            <div key={opt.value} onClick={() => { onChange(opt.value); if (opt.value !== "custom") setOpen(false); }}
              style={{ padding: "9px 14px", fontSize: 13, cursor: "pointer", background: value === opt.value ? "#f0fdf4" : "white", color: value === opt.value ? "#166534" : "#4a6b4d", fontWeight: value === opt.value ? 600 : 400, borderLeft: value === opt.value ? "3px solid #16a34a" : "3px solid transparent" }}
              onMouseEnter={e => { if (value !== opt.value) e.currentTarget.style.background = "#f6fbf7"; }}
              onMouseLeave={e => { e.currentTarget.style.background = value === opt.value ? "#f0fdf4" : "white"; }}
            >
              {opt.label}
            </div>
          ))}
          {value === "custom" && (
            <div style={{ padding: "10px 14px 14px", borderTop: "1px solid #eef6ef", display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 11, color: "#8faa92", fontWeight: 500 }}>Dari</label>
              <input type="date" value={dateFrom} onChange={e => onDateFromChange(e.target.value)} style={{ fontSize: 12, padding: "5px 8px", borderRadius: 6, border: "1px solid #d1e9d5", outline: "none", color: "#2d4a30", background: "white", colorScheme: "light" }} />
              <label style={{ fontSize: 11, color: "#8faa92", fontWeight: 500 }}>Sampai</label>
              <input type="date" value={dateTo} onChange={e => onDateToChange(e.target.value)} style={{ fontSize: 12, padding: "5px 8px", borderRadius: 6, border: "1px solid #d1e9d5", outline: "none", color: "#2d4a30", background: "white", colorScheme: "light" }} />
              <button onClick={() => setOpen(false)} style={{ marginTop: 4, background: "#166534", color: "white", border: "none", borderRadius: 6, padding: "7px 0", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>Terapkan</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page: Bandwidth ──────────────────────────────────────────────────────────
function PageBandwidth() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("today");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [summary, setSummary] = useState<BandwidthSummary>({
    total_download: 0,
    total_upload: 0,
    peak_download: 0,
    peak_upload: 0,
    average_download: 0,
    average_upload: 0,
  });
  const [history, setHistory] = useState<BandwidthHistory[]>([]);
  const [topUsers, setTopUsers] = useState<TopUserBandwidth[]>([]);

  const fetchBandwidthData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ period });
      if (period === "custom" && dateFrom && dateTo) {
        params.set("date_from", dateFrom);
        params.set("date_to", dateTo);
      }
      const q = params.toString() ? `?${params.toString()}` : "";
      const res = await fetch(`${API}/api/admin/bandwidth/detailed${q}`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) {
        setSummary(data.summary);
        setHistory(data.history);
        setTopUsers(data.top_users);
      }
    } catch (e) {
      console.error("Fetch bandwidth error:", e);
    }
    setLoading(false);
  }, [period, dateFrom, dateTo]);

  useEffect(() => { fetchBandwidthData(); }, [fetchBandwidthData]);

  const handlePeriodChange = (p: string) => {
    setPeriod(p);
    if (p !== "custom") fetchBandwidthData();
  };

  const totalGB = summary.total_download + summary.total_upload || 1;
  const downloadPercent = (summary.total_download / totalGB) * 100;
  const uploadPercent = (summary.total_upload / totalGB) * 100;

  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <PeriodFilter value={period} onChange={handlePeriodChange} dateFrom={dateFrom} dateTo={dateTo} onDateFromChange={setDateFrom} onDateToChange={setDateTo} />
      </div>

      {loading ? <Spinner /> : (
        <>
          <div style={s.cardGrid}>
            <div style={s.card}>
              <div style={s.cLabel}>Total Download</div>
              <div style={{ ...s.cNum, color: "#3b82f6" }}>{summary.total_download.toFixed(2)} GB</div>
              <div style={{ fontSize: 11, color: "#8faa92", marginTop: 4 }}>Seluruh periode</div>
            </div>
            <div style={s.card}>
              <div style={s.cLabel}>Total Upload</div>
              <div style={{ ...s.cNum, color: "#00a933" }}>{summary.total_upload.toFixed(2)} GB</div>
              <div style={{ fontSize: 11, color: "#8faa92", marginTop: 4 }}>Seluruh periode</div>
            </div>
            <div style={s.card}>
              <div style={s.cLabel}>Peak Download</div>
              <div style={{ ...s.cNum, color: "#ef4444" }}>{summary.peak_download.toFixed(2)} Mbps</div>
              <div style={{ fontSize: 11, color: "#8faa92", marginTop: 4 }}>Tertinggi</div>
            </div>
            <div style={s.card}>
              <div style={s.cLabel}>Peak Upload</div>
              <div style={{ ...s.cNum, color: "#8b5cf6" }}>{summary.peak_upload.toFixed(2)} Mbps</div>
              <div style={{ fontSize: 11, color: "#8faa92", marginTop: 4 }}>Tertinggi</div>
            </div>
          </div>

          <div style={{ ...s.row, marginBottom: 12 }}>
            <div style={{ ...s.panel, flex: 1 }}>
              <div style={s.ph}>
                <span style={s.ptitle}>Distribusi Bandwidth</span>
                <span style={s.psub}>Download vs Upload</span>
              </div>
              <div style={{ marginTop: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: "#8faa92", width: 70 }}>Download</span>
                  <div style={{ flex: 1, height: 28, background: "#eff6ff", borderRadius: 6, overflow: "hidden" }}>
                    <div style={{ width: `${downloadPercent}%`, height: "100%", background: "#3b82f6", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 8, color: "white", fontSize: 11, fontWeight: 600 }}>
                      {downloadPercent > 15 && `${summary.total_download.toFixed(1)} GB`}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 12, color: "#8faa92", width: 70 }}>Upload</span>
                  <div style={{ flex: 1, height: 28, background: "#f0faf2", borderRadius: 6, overflow: "hidden" }}>
                    <div style={{ width: `${uploadPercent}%`, height: "100%", background: "#00a933", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 8, color: "white", fontSize: 11, fontWeight: 600 }}>
                      {uploadPercent > 15 && `${summary.total_upload.toFixed(1)} GB`}
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 24, marginTop: 16, paddingTop: 12, borderTop: "1px solid #eef6ef" }}>
                <div>
                  <div style={{ fontSize: 11, color: "#a8c9ab" }}>Rata-rata Download</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: "#3b82f6" }}>{summary.average_download.toFixed(2)} Mbps</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#a8c9ab" }}>Rata-rata Upload</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: "#00a933" }}>{summary.average_upload.toFixed(2)} Mbps</div>
                </div>
              </div>
            </div>

            <div style={{ ...s.panel, minWidth: 200 }}>
              <div style={s.ph}><span style={s.ptitle}>Ringkasan Cepat</span></div>
              <div style={{ marginTop: 8 }}>
                {[
                  { label: "Periode", value: periodLabel(period, dateFrom, dateTo), color: "#166534" },
                  { label: "Total Transfer", value: `${totalGB.toFixed(2)} GB`, color: "#7c3aed" },
                  { label: "Rasio D/U", value: `${(summary.total_download / (summary.total_upload || 1)).toFixed(1)}:1`, color: "#c2410c" },
                ].map(stat => (
                  <div key={stat.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f0faf2" }}>
                    <span style={{ fontSize: 12, color: "#6b8f6e" }}>{stat.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: stat.color }}>{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={s.panel}>
            <div style={s.ph}>
              <span style={s.ptitle}>Grafik Bandwidth</span>
              <span style={s.psub}>Per jam — {periodLabel(period, dateFrom, dateTo)}</span>
            </div>
            <div style={{ marginTop: 16 }}>
              <TradingChart
                categories={history.map(h => h.hour)}
                series={[
                  { label: "Download", color: "#3b82f6", values: history.map(h => h.download), format: v => `${v.toFixed(2)} Mbps` },
                  { label: "Upload", color: "#00a933", values: history.map(h => h.upload), format: v => `${v.toFixed(2)} Mbps` },
                ]}
                height={260}
                showLegend
              />
            </div>
          </div>

          <div style={s.panel}>
            <div style={s.ph}>
              <span style={s.ptitle}>Top 10 Pengguna Bandwidth</span>
              <span style={s.psub}>Pengguna dengan penggunaan tertinggi</span>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
                <thead>
                  <tr>
                    <th style={s.th}>#</th>
                    <th style={s.th}>Nama Pengguna</th>
                    <th style={s.th}>No. HP</th>
                    <th style={s.th}>Download</th>
                    <th style={s.th}>Upload</th>
                    <th style={s.th}>Total</th>
                    <th style={s.th}>Persentase</th>
                  </tr>
                </thead>
                <tbody>
                  {topUsers.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: "center", padding: 32, color: "#a8c9ab", fontSize: 13 }}>Belum ada data penggunaan bandwidth</td></tr>
                  ) : (
                    topUsers.map((user, idx) => {
                      const userTotal = user.total;
                      const pct = totalGB > 0 ? (userTotal / totalGB) * 100 : 0;
                      return (
                        <tr key={idx} style={{ background: idx % 2 === 0 ? "#fafff8" : "white" }}>
                          <td style={s.td}>{idx + 1}</td>
                          <td style={s.td}><span style={{ fontSize: 13, fontWeight: 500, color: "#2d4a30" }}>{user.name}</span></td>
                          <td style={s.td}><span style={s.ip}>{user.phone}</span></td>
                          <td style={s.td}><span style={{ fontSize: 12, color: "#3b82f6", fontWeight: 500 }}>{user.download.toFixed(2)} GB</span></td>
                          <td style={s.td}><span style={{ fontSize: 12, color: "#f97316", fontWeight: 500 }}>{user.upload.toFixed(2)} GB</span></td>
                          <td style={s.td}><span style={{ fontSize: 12, fontWeight: 600, color: "#7c3aed" }}>{user.total.toFixed(2)} GB</span></td>
                          <td style={s.td}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <div style={{ flex: 1, height: 4, background: "#e4f0e6", borderRadius: 2, width: 80 }}>
                                <div style={{ width: `${pct}%`, height: "100%", background: "#7c3aed", borderRadius: 2 }} />
                              </div>
                              <span style={{ fontSize: 11, color: "#a8c9ab" }}>{pct.toFixed(1)}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  );
}

// ─── Page: Laporan ────────────────────────────────────────────────────────────
interface ReportSummary {
  total_visitors: number;
  total_bandwidth_gb: number;
  avg_session_minutes: number;
  validasi_rate: number;
  total_users: number;
  active_users: number;
  returning_users?: number;
}

interface ReportDataItem {
  date: string;
  visitors: number;
  bandwidth_gb: number;
  sessions: number;
}

function PageLaporan() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("this_month");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [reportType, setReportType] = useState("visitors");
  const [summary, setSummary] = useState<ReportSummary>({
    total_visitors: 0,
    total_bandwidth_gb: 0,
    avg_session_minutes: 0,
    validasi_rate: 0,
    total_users: 0,
    active_users: 0,
    returning_users: 0,
  });
  const [reportData, setReportData] = useState<ReportDataItem[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  const reportTypes = [
    { value: "visitors", label: "Laporan Pengunjung", icon: "users" },
    { value: "bandwidth", label: "Laporan Bandwidth", icon: "database" },
    { value: "sessions", label: "Laporan Sesi", icon: "clock" },
    { value: "regional", label: "Laporan Per Daerah", icon: "mapPin" },
  ];

  const fetchReportData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ period, report_type: reportType });
      if (period === "custom" && dateFrom && dateTo) {
        params.set("date_from", dateFrom);
        params.set("date_to", dateTo);
      }
      const q = params.toString() ? `?${params.toString()}` : "";
      const res = await fetch(`${API}/api/admin/reports/data${q}`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) {
        setSummary(data.summary);
        setReportData(data.data);
      }
    } catch (e) {
      console.error("Fetch report error:", e);
    }
    setLoading(false);
  }, [period, dateFrom, dateTo, reportType]);

  useEffect(() => { fetchReportData(); }, [fetchReportData]);

  const handlePeriodChange = (p: string) => {
    setPeriod(p);
    if (p !== "custom") fetchReportData();
  };

  const exportToExcel = () => {
    setIsExporting(true);
    try {
      const exportData = reportData.map((item, idx) => ({
        "No": idx + 1,
        "Tanggal": item.date,
        "Pengunjung": item.visitors,
        "Bandwidth (GB)": item.bandwidth_gb,
        "Sesi": item.sessions,
      }));
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Laporan");
      XLSX.writeFile(wb, `laporan_${reportType}_${period}_${new Date().toISOString().split("T")[0]}.xlsx`);
      toast("Laporan berhasil diekspor", "success");
    } catch (error) {
      console.error("Export error:", error);
      toast("Gagal mengekspor laporan", "error");
    }
    setIsExporting(false);
  };

  const trendColor = reportType === "visitors" ? "#166534" : reportType === "bandwidth" ? "#7c3aed" : "#c2410c";
  const trendFormat = (v: number) =>
    reportType === "bandwidth" ? `${v.toFixed(1)} GB` : reportType === "sessions" ? `${v} sesi` : `${v} pengunjung`;
  const trendValues = reportData.map(d =>
    reportType === "visitors" ? d.visitors : reportType === "bandwidth" ? d.bandwidth_gb : d.sessions
  );

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
          <PeriodFilter value={period} onChange={handlePeriodChange} dateFrom={dateFrom} dateTo={dateTo} onDateFromChange={setDateFrom} onDateToChange={setDateTo} />
          <button
            onClick={exportToExcel}
            disabled={isExporting}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "#166534", color: "white", border: "none",
              borderRadius: 8, padding: "6px 14px", fontSize: 12,
              fontWeight: 500, cursor: isExporting ? "not-allowed" : "pointer",
              opacity: isExporting ? 0.6 : 1,
            }}
          >
            <span style={{ display: "flex" }}>{Icon.download}</span>
            {isExporting ? "Mengekspor..." : "Export Excel"}
          </button>
        </div>
      </div>

      {loading ? <Spinner /> : (
        <>
          <div style={s.cardGrid}>
            <div style={s.card}>
              <div style={s.cLabel}>Total Pengunjung</div>
              <div style={{ ...s.cNum, color: "#166534" }}>{summary.total_visitors.toLocaleString()}</div>
              <div style={{ fontSize: 11, color: "#8faa92" }}>Periode ini</div>
            </div>
            <div style={s.card}>
              <div style={s.cLabel}>Total Bandwidth</div>
              <div style={{ ...s.cNum, color: "#7c3aed" }}>{summary.total_bandwidth_gb.toFixed(1)} GB</div>
              <div style={{ fontSize: 11, color: "#8faa92" }}>Download + Upload</div>
            </div>
            <div style={s.card}>
              <div style={s.cLabel}>Rata-rata Sesi</div>
              <div style={{ ...s.cNum, color: "#c2410c" }}>{summary.avg_session_minutes} mnt</div>
              <div style={{ fontSize: 11, color: "#8faa92" }}>Per pengunjung</div>
            </div>
            <div style={s.card}>
              <div style={s.cLabel}>Validasi Rate</div>
              <div style={{ ...s.cNum, color: "#16a34a" }}>{summary.validasi_rate}%</div>
              <div style={{ fontSize: 11, color: "#8faa92" }}>OTP tervalidasi</div>
            </div>
          </div>

          <div style={s.panel}>
            <div style={s.ph}>
              <span style={s.ptitle}>Tren {reportTypes.find(t => t.value === reportType)?.label}</span>
              <span style={s.psub}>{periodLabel(period, dateFrom, dateTo)}</span>
            </div>
            <div style={{ marginTop: 16 }}>
              <TradingChart
                categories={reportData.map(d => d.date)}
                series={[{
                  label: reportTypes.find(t => t.value === reportType)?.label ?? "",
                  color: trendColor,
                  values: trendValues,
                  format: trendFormat,
                }]}
                height={220}
              />
            </div>
          </div>

          <div style={s.panel}>
            <div style={s.ph}>
              <span style={s.ptitle}>Data Detail</span>
              <span style={s.psub}>{reportData.length} record</span>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["#", "Tanggal", "Pengunjung", "Bandwidth (GB)", "Sesi", "Rata-rata/Sesi"].map(h => <th key={h} style={s.th}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((item, idx) => (
                    <tr key={idx} style={{ background: idx % 2 === 0 ? "#fafff8" : "white" }}>
                      <td style={s.td}>{idx + 1}</td>
                      <td style={s.td}>{item.date}</td>
                      <td style={s.td}>{item.visitors.toLocaleString()}</td>
                      <td style={s.td}>{item.bandwidth_gb.toFixed(1)} GB</td>
                      <td style={s.td}>{item.sessions}</td>
                      <td style={s.td}>{(item.bandwidth_gb / (item.sessions || 1)).toFixed(2)} GB</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={s.panel}>
            <div style={s.ph}><span style={s.ptitle}>Aktifitas Pengguna</span></div>
            <div style={{ marginTop: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: "#6b8f6e" }}>Total User Terdaftar</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#166534" }}>{summary.total_users.toLocaleString()}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: "#6b8f6e" }}>User Aktif</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#16a34a" }}>{summary.active_users.toLocaleString()}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: "#6b8f6e" }}>Returning User</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#1d4ed8" }}>{(summary.returning_users ?? 0).toLocaleString()}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: "#6b8f6e" }}>Tingkat Retensi</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#c2410c" }}>{Math.round((summary.active_users / (summary.total_users || 1)) * 100)}%</span>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

// ─── Page: Iklan Wajib Tonton ────────────────────────────────────────────────
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

// ─── Page: Pengaturan ─────────────────────────────────────────────────────────
function PagePengaturan() {
  const [loading, setLoading] = useState(false);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ 
    name: "", 
    email: "", 
    password: "",
    role: "it"
  });
  const [editingAdmin, setEditingAdmin] = useState<number | null>(null);
  const [editAdminData, setEditAdminData] = useState({ name: "", email: "" });


  const fetchAdminUsers = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("admin_token") || localStorage.getItem("it_token") || "";
      const res = await fetch(`${API}/api/admin/list`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        }
      });
      const data = await res.json();
      console.log("Fetch admin list:", data);
      if (data.success) setAdminUsers(data.data);
    } catch (e) { console.error("Fetch admin error:", e); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchAdminUsers(); }, [fetchAdminUsers]);

  const handleAddAdmin = async () => {
    if (!newAdmin.name || !newAdmin.email || !newAdmin.password) {
      toast("Semua field harus diisi", "error");
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("admin_token") || localStorage.getItem("it_token") || "";
      const res = await fetch(`${API}/api/admin/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: JSON.stringify({ 
          name: newAdmin.name, 
          email: newAdmin.email, 
          password: newAdmin.password,
          role: newAdmin.role
        }),
      });
      const data = await res.json();
      console.log("Register admin response:", data);
      if (data.success) {
        toast("Admin berhasil ditambahkan", "success");
        setNewAdmin({ name: "", email: "", password: "", role: "it" });
        setShowAddAdmin(false);
        fetchAdminUsers();
      } else {
        toast(data.message || "Gagal menambah admin", "error");
      }
    } catch (error) {
      console.error("Error:", error);
      toast("Server error", "error");
    }
    setLoading(false);
  };

  const handleDeleteAdmin = async (id: number) => {
    console.log("=== DELETE ADMIN ===");
    console.log("ID:", id);
    
    if (adminUsers.length <= 1) {
      toast("Minimal harus ada 1 admin", "error");
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("admin_token") || localStorage.getItem("it_token") || "";
      const res = await fetch(`${API}/api/admin/admins/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        }
      });
      const data = await res.json();
      console.log("Response:", data);
      if (data.success) {
        toast("Admin berhasil dihapus", "success");
        fetchAdminUsers();
      } else {
        toast(data.message || "Gagal hapus admin", "error");
      }
    } catch (error) {
      console.error("Error:", error);
      toast("Server error", "error");
    }
    setLoading(false);
  };

  const handleEditAdmin = (admin: AdminUser) => {
    setEditingAdmin(admin.id);
    setEditAdminData({ name: admin.name, email: admin.email });
  };

  const handleSaveEditAdmin = async (id: number) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("admin_token") || localStorage.getItem("it_token") || "";
      const res = await fetch(`${API}/api/admin/users/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: JSON.stringify({ name: editAdminData.name, email: editAdminData.email }),
      });
      const data = await res.json();
      if (data.success) {
        toast("Admin berhasil diupdate", "success");
        setEditingAdmin(null);
        fetchAdminUsers();
      } else {
        toast(data.message || "Gagal update admin", "error");
      }
    } catch (error) {
      console.error("Error:", error);
      toast("Server error", "error");
    }
    setLoading(false);
  };

  return (
    <div style={s.panel}>
      <div style={{ ...s.ph, marginBottom: 16 }}>
        <span style={s.ptitle}>Manajemen Admin</span>
        <button
          onClick={() => setShowAddAdmin(true)}
          style={{ background: "#166534", color: "white", border: "none", borderRadius: 6, padding: "6px 12px", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
        >
          <span style={{ display: "flex" }}>{Icon.plus}</span> Tambah Admin
        </button>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["#", "Nama", "Email", "Role", "Last Login", "Aksi"].map(h => <th key={h} style={s.th}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
    {adminUsers.map((admin, idx) => (
        <tr key={admin.id} style={{ background: idx % 2 === 0 ? "#fafff8" : "white" }}>
            <td style={s.td}>{idx + 1}</td>
            <td style={s.td}>
                {editingAdmin === admin.id ? (
                    <input value={editAdminData.name} onChange={e => setEditAdminData({ ...editAdminData, name: e.target.value })} style={{ padding: "4px 8px", borderRadius: 4, border: "1px solid #d1e9d5", fontSize: 12 }} />
                ) : admin.name}
            </td>
            <td style={s.td}>
                {editingAdmin === admin.id ? (
                    <input value={editAdminData.email} onChange={e => setEditAdminData({ ...editAdminData, email: e.target.value })} style={{ padding: "4px 8px", borderRadius: 4, border: "1px solid #d1e9d5", fontSize: 12 }} />
                ) : admin.email}
            </td>
            <td style={s.td}>
                <span style={{ 
                    ...s.badge, 
                    ...(admin.role === 'it' ? s.bon : s.bidl) 
                }}>
                    {admin.role === 'it' ? 'IT' : 'Marketing'}
                </span>
            </td>
            <td style={s.td}>
                {admin.last_login ? formatToWIB(admin.last_login, "datetime") : '-'}
            </td>
            <td style={s.td}>
                <div style={{ display: "flex", gap: 6 }}>
                    {editingAdmin === admin.id ? (
                        <button onClick={() => handleSaveEditAdmin(admin.id)} style={{ background: "#16a34a", color: "white", border: "none", borderRadius: 4, padding: "4px 8px", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                            {Icon.save} Simpan
                        </button>
                    ) : (
                        <button onClick={() => handleEditAdmin(admin)} style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 4, padding: "4px 8px", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                            {Icon.edit} Edit
                        </button>
                    )}
                    {editingAdmin !== admin.id && (
                        <button 
                            onClick={() => {
                                console.log("Hapus:", admin.id, admin.name);
                                handleDeleteAdmin(admin.id);
                            }} 
                            style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 4, padding: "4px 8px", fontSize: 11, cursor: "pointer", color: "#dc2626", display: "flex", alignItems: "center", gap: 4 }}
                        >
                            {Icon.trash} Hapus
                        </button>
                    )}
                </div>
            </td>
        </tr>
    ))}
</tbody>
                  </table>
      </div>

      {showAddAdmin && (
        <div style={s.overlay}>
          <div style={{ ...s.modal, width: 380 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#1a2e1c", marginBottom: 16 }}>Tambah Admin Baru</div>
            
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: "#6b8f6e", marginBottom: 4, display: "block" }}>Nama Lengkap</label>
              <input 
                type="text" 
                value={newAdmin.name} 
                onChange={e => setNewAdmin({ ...newAdmin, name: e.target.value })} 
                style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #d1e9d5", fontSize: 13, outline: "none" }} 
                placeholder="Masukkan nama lengkap"
              />
            </div>
            
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: "#6b8f6e", marginBottom: 4, display: "block" }}>Email</label>
              <input 
                type="email" 
                value={newAdmin.email} 
                onChange={e => setNewAdmin({ ...newAdmin, email: e.target.value })} 
                style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #d1e9d5", fontSize: 13, outline: "none" }} 
                placeholder="email@domain.com"
              />
            </div>
            
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: "#6b8f6e", marginBottom: 4, display: "block" }}>Password</label>
              <input 
                type="password" 
                value={newAdmin.password} 
                onChange={e => setNewAdmin({ ...newAdmin, password: e.target.value })} 
                style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #d1e9d5", fontSize: 13, outline: "none" }} 
                placeholder="Minimal 6 karakter"
              />
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: "#6b8f6e", marginBottom: 4, display: "block" }}>Role</label>
              <select
                value={newAdmin.role}
                onChange={e => setNewAdmin({ ...newAdmin, role: e.target.value })}
                style={{ 
                  width: "100%", 
                  padding: "8px 12px", 
                  borderRadius: 8, 
                  border: "1px solid #d1e9d5", 
                  fontSize: 13, 
                  outline: "none", 
                  background: "white", 
                  cursor: "pointer" 
                }}
              >
                <option value="it">IT</option>
                <option value="marketing">Marketing</option>
              </select>
              <div style={{ fontSize: 10, color: "#a8c9ab", marginTop: 4 }}>
                Pilih role untuk menentukan akses dashboard
              </div>
            </div>
            
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button 
                onClick={() => {
                  setShowAddAdmin(false);
                  setNewAdmin({ name: "", email: "", password: "", role: "it" });
                }} 
                style={s.btnGhost}
              >
                Batal
              </button>
              <button 
                onClick={handleAddAdmin} 
                disabled={loading} 
                style={{ ...s.btnPrimary, opacity: loading ? 0.6 : 1 }}
              >
                {loading ? "Menyimpan..." : "Tambah"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
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

  const adminName = localStorage.getItem("it_name") || "Admin IT";
  const adminInitials = adminName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  const pageTitles: Record<string, string> = {
    dashboard: "Dashboard Monitoring",
    users: "Manajemen Users",
    bandwidth: "Monitoring Bandwidth",
    laporan: "Laporan & Analisis",
    sponsor: "Manajemen Iklan",
    pengaturan: "Pengaturan Sistem",
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_name");
    localStorage.removeItem("admin_role");
    localStorage.removeItem("it_name");
    localStorage.removeItem("it_token");
    localStorage.removeItem("marketing_name");
    localStorage.removeItem("marketing_token");
    window.location.href = "/admin";
  };

  return (
    <div style={s.root}>
      <ToastContainer />

      <aside style={{ ...s.sidebar, width: sidebarW }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: open ? "22px 14px 18px" : "18px 0 14px", marginBottom: 0, gap: 12 }}>
          <img src={logo} alt="Saloka" style={{ width: 125, height: 80, objectFit: "contain", transition: "all 0.22s ease", flexShrink: 0 }} />
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
                    <div style={{ fontSize: 11, color: "#a8c9ab", marginTop: 2 }}>Administrator</div>
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
        {page === "users" && <PageUsers />}
        {page === "bandwidth" && <PageBandwidth />}
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
  sidebar: { background: "white", display: "flex", flexDirection: "column", transition: "width 0.22s ease", overflow: "hidden", flexShrink: 0, position: "fixed", left: 0, top: 0, bottom: 0, zIndex: 1000, borderRight: "1px solid #e4f0e6" },
  main: { flex: 1, padding: "20px 24px", overflowY: "auto", transition: "margin-left 0.22s ease", minHeight: "100vh" },
  topbar: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid #eef6ef" },
  pgTitle: { fontSize: 18, fontWeight: 600, color: "#1a2e1c" },
  pgDate: { fontSize: 12, color: "#a8c9ab", marginTop: 2 },
  clockBox: { fontFamily: "'DM Mono',monospace", fontSize: 15, color: "#166534", fontWeight: 500, background: "#f0fdf4", padding: "5px 12px", borderRadius: 8, border: "1px solid #bbf7d0" },
  adminBox: { display: "flex", alignItems: "center", gap: 8, background: "white", padding: "5px 12px", borderRadius: 8, border: "1px solid #d1e9d5" },
  adminAv: { width: 26, height: 26, borderRadius: "50%", background: "#dcfce7", color: "#166534", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700 },
  colBtn: { background: "#f0fdf4", border: "1px solid #d1e9d5", color: "#166534", cursor: "pointer", borderRadius: 6, width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
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
  ph: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
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