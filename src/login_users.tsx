import { API_URL as SHARED_API_URL } from "./lib/config";
import { useState, useEffect, useRef } from "react";
import logo from "./assets/logo.png";
import bgTessellation from "./assets/Background.jpeg";
import provinsiData from "./data/provinsi.json";
import kabupatenData from "./data/kabupaten.json";

// ================= TOAST =================
function Toast({ msg, type }: { msg: string; type: "error" | "success" | "info" }) {
  const bg =
    type === "error" ? "#c62828" : type === "success" ? "#2e7d32" : "#1565c0";
  const icon =
    type === "error" ? "⚠" : type === "success" ? "✓" : "ℹ";
  return (
    <div
      style={{
        position: "fixed",
        top: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        background: bg,
        color: "white",
        padding: "12px 16px",
        borderRadius: "12px",
        fontSize: "13px",
        fontWeight: 600,
        zIndex: 9999,
        whiteSpace: "normal",
        wordBreak: "break-word",
        width: "max-content",
        maxWidth: "calc(100vw - 32px)",
        boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
        display: "flex",
        alignItems: "flex-start",
        gap: "8px",
        animation: "toastIn 0.2s ease",
        fontFamily: "Arial, sans-serif",
        textAlign: "left",
      }}
    >
      <span style={{ fontSize: "15px", flexShrink: 0 }}>{icon}</span>
      {msg}
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-10px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ================= SEARCHABLE DROPDOWN =================
function SearchableDropdown({
  options,
  value,
  onChange,
  placeholder = "Pilih...",
  disabled = false,
}: {
  options: { id: string; name: string }[];
  value: string;
  onChange: (id: string, name: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.id === value);
  const filtered = options.filter((o) =>
    o.name.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = () => {
    if (disabled) return;
    setOpen((prev) => !prev);
    setSearch("");
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  return (
    <div ref={wrapRef} style={{ position: "relative", width: "100%" }}>
      <div
        onClick={handleOpen}
        style={{
          width: "100%",
          padding: "12px",
          borderRadius: "12px",
          border: "1px solid #e0e0e0",
          outline: "none",
          background: "white",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.5 : 1,
          fontSize: "14px",
          color: selected ? "#111" : "#aaa",
          boxSizing: "border-box",
        }}
      >
        <span>{selected ? selected.name : placeholder}</span>
        <span style={{ fontSize: "11px", color: "#999" }}>▾</span>
      </div>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            background: "white",
            border: "1px solid #e0e0e0",
            borderRadius: "12px",
            zIndex: 999,
            overflow: "hidden",
            boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 12px",
              borderBottom: "1px solid #f0f0f0",
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#aaa"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ flexShrink: 0 }}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari..."
              style={{
                border: "none",
                outline: "none",
                fontSize: "13px",
                width: "100%",
                minWidth: 0,
                padding: "0 0 0 4px",
                background: "white",
              }}
            />
          </div>

          <div style={{ maxHeight: "180px", overflowY: "auto" }}>
            {filtered.length === 0 ? (
              <div style={{ padding: "12px", color: "#aaa", fontSize: "13px", textAlign: "center" }}>
                Tidak ditemukan
              </div>
            ) : (
              filtered.map((o) => (
                <div
                  key={o.id}
                  onClick={() => { onChange(o.id, o.name); setOpen(false); }}
                  style={{
                    padding: "10px 12px",
                    fontSize: "13px",
                    cursor: "pointer",
                    background: o.id === value ? "#f0f7f0" : "white",
                    color: o.id === value ? "#1b5e20" : "#111",
                    fontWeight: o.id === value ? 600 : 400,
                    textAlign: "left",
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = "#f5f5f5")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = o.id === value ? "#f0f7f0" : "white")}
                >
                  {o.name}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ================= APP =================
export default function App() {
  const [nama, setNama] = useState("");
  const [wa, setWa] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);

  const [provinsi, setProvinsi] = useState("");
  const [provinsiId, setProvinsiId] = useState("");
  const [kabupaten, setKabupaten] = useState("");
  const [kabupatenId, setKabupatenId] = useState("");

  const [provinsiList, setProvinsiList] = useState<any[]>([]);
  const [kabupatenList, setKabupatenList] = useState<any[]>([]);

  const [_isLoggedIn, setIsLoggedIn] = useState(false);
  const [step, setStep] = useState(1);
  const [resendTimer, setResendTimer] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [toast, setToast] = useState<{ msg: string; type: "error" | "success" | "info" } | null>(null);

  // ================= STATE UNTUK IKLAN DARI ADMIN =================
  const [ads, setAds] = useState<any[]>([]);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isLoadingAds, setIsLoadingAds] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const showToast = (msg: string, type: "error" | "success" | "info" = "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ================= API URL =================
  // Base URL backend diambil dari satu sumber terpusat (src/lib/config.ts / .env)
  const API_URL = SHARED_API_URL;
  const ADMIN_API_URL = SHARED_API_URL; // dulu port beda (8000 vs 8001), sekarang satu backend jadi disamakan
  const WEBSITE_URL = "https://salokapark.com/?utm_source=google&utm_medium=sem&utm_campaign=awareness&gad_source=1&gad_campaignid=12838190797&gclid=CjwKCAjw3ejRBhAdEiwADkqPn0UL_tR99nUxH2S9eC8zBwq8pWLW-sw3H_lBhfmwgIWVbTpwbASI-hoCjKgQAvD_BwE";

  // ================= FUNGSI REDIRECT LANGSUNG =================
  const redirectToWebsite = () => {
    window.location.href = WEBSITE_URL;
  };

  // ================= AMBIL IKLAN DARI API ADMIN =================
  useEffect(() => {
    const fetchAds = async () => {
      try {
        console.log("Fetching ads from:", `${ADMIN_API_URL}/api/sponsors/active`);
        const res = await fetch(`${ADMIN_API_URL}/api/sponsors/active`);
        const data = await res.json();
        console.log("Response data:", data);
        
        if (data.success && data.data && data.data.length > 0) {
          // ✅ TANPA TITLE & SPONSOR_NAME
          const formattedAds = data.data.map((ad: any) => ({
            id: ad.id,
            type: ad.type || (ad.file_type?.includes('video') ? 'video' : 'image'),
            file: ad.file_path ? `${ADMIN_API_URL}/storage/${ad.file_path}` : null,
            duration: ad.duration || 5,
            isActive: ad.isActive || ad.is_active === 1 || ad.is_active === true,
          }));
          console.log("Formatted ads (tanpa judul):", formattedAds);
          setAds(formattedAds);
          if (formattedAds.length > 0) {
            setRemainingSeconds(formattedAds[0].duration);
          }
        } else {
          console.log("No active ads found, using fallback");
          setAds([
            {
              id: "default1",
              type: "image",
              file: null,
              duration: 5,
              isActive: true,
            },
          ]);
          setRemainingSeconds(5);
        }
      } catch (error) {
        console.error("Gagal ambil iklan:", error);
        setAds([
          {
            id: "default1",
            type: "image",
            file: null,
            duration: 5,
            isActive: true,
          },
        ]);
        setRemainingSeconds(5);
      } finally {
        setIsLoadingAds(false);
      }
    };
    
    fetchAds();
  }, []);

  // Hentikan countdown saat komponen unmount
  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (imageTimerRef.current) clearTimeout(imageTimerRef.current);
    };
  }, []);

  // Mulai countdown ketika remainingSeconds berubah
  useEffect(() => {
    if (remainingSeconds > 0) {
      if (countdownRef.current) clearInterval(countdownRef.current);
      countdownRef.current = setInterval(() => {
        setRemainingSeconds(prev => {
          if (prev <= 1) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [remainingSeconds]);

  // Timer untuk gambar
  const startImageTimer = () => {
    if (imageTimerRef.current) clearTimeout(imageTimerRef.current);
    if (ads[currentAdIndex] && ads[currentAdIndex].type === "image") {
      const duration = ads[currentAdIndex].duration * 1000;
      imageTimerRef.current = setTimeout(() => {
        setRemainingSeconds(0);
      }, duration);
    }
  };

  // Connect ke WiFi + redirect langsung (tetap menunggu hitung mundur selesai)
  const handleSkip = () => {
    if (remainingSeconds > 0) return;
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (imageTimerRef.current) clearTimeout(imageTimerRef.current);
    
    setIsLoggedIn(true);
    localStorage.setItem("isLoggedIn", "true");
    const nomor = wa.startsWith("08") ? "62" + wa.slice(1) : wa;
    localStorage.setItem("phone", nomor);
    
    kirimData();
  };

  // KIRIM DATA LOGIN + Redirect Langsung
  const kirimData = async () => {
    let nomor = wa;
    if (nomor.startsWith("08")) nomor = "62" + nomor.slice(1);
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nama, phone: nomor, provinsi, kabupaten }),
      });
      const data = await res.json();
      
      if (res.status === 409) { 
        showToast(data.message || "Nomor sudah pernah login", "error");
        redirectToWebsite();
        return; 
      }
      
      if (data.success) { 
        showToast("Berhasil connect ke WiFi!", "success");
        redirectToWebsite();
        return; 
      }
      
      showToast(data.message || "Gagal mengirim data", "error");
    } catch {
      showToast("Gagal koneksi ke server", "error");
    }
  };

  useEffect(() => {
    if (Array.isArray(provinsiData)) setProvinsiList(provinsiData);
    else setProvinsiList([]);
    const login = localStorage.getItem("isLoggedIn");
    if (login === "true") setIsLoggedIn(true);
  }, []);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const iv = setInterval(() => {
      setResendTimer((t) => { if (t <= 1) { clearInterval(iv); return 0; } return t - 1; });
    }, 1000);
    return () => clearInterval(iv);
  }, [resendTimer]);

  const handleProvinsi = (id: string) => {
    const selected = provinsiList.find((p) => p.id == id);
    setProvinsiId(id);
    setProvinsi(selected ? selected.name : "");
    setKabupaten("");
    setKabupatenId("");
    const data = (kabupatenData as any)[id] || [];
    const normalized = data.map((k: any, i: number) =>
      typeof k === "string" ? { id: String(i), name: k } : k
    );
    setKabupatenList(normalized);
  };

  const handleOtpChange = (index: number, val: string) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    if (digit && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const paste = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newOtp = ["", "", "", "", "", ""];
    paste.split("").forEach((ch, j) => { newOtp[j] = ch; });
    setOtp(newOtp);
    const nextEmpty = newOtp.findIndex((v) => !v);
    otpRefs.current[nextEmpty === -1 ? 5 : nextEmpty]?.focus();
  };

  const requestOtp = async (nomor: string) => {
    const res = await fetch(`${API_URL}/api/auth/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: nomor }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Gagal kirim OTP");
  };

  const sendOtp = async () => {
    if (!nama.trim()) return showToast("Masukkan nama lengkap");
    if (!wa.trim()) return showToast("Masukkan nomor WhatsApp");
    if (!provinsi) return showToast("Pilih provinsi terlebih dahulu");
    if (!kabupaten) return showToast("Pilih kabupaten terlebih dahulu");
    let nomor = wa;
    if (nomor.startsWith("08")) nomor = "62" + nomor.slice(1);
    try {
      await requestOtp(nomor);
      setOtp(["", "", "", "", "", ""]);
      setStep(2);
      setResendTimer(30);
      showToast("OTP telah dikirim ke WhatsApp Anda", "info");
    } catch (err: any) {
      showToast(err.message || "Server error saat kirim OTP");
    }
  };

  const resendOtp = async () => {
    let nomor = wa;
    if (nomor.startsWith("08")) nomor = "62" + nomor.slice(1);
    try {
      await requestOtp(nomor);
      setOtp(["", "", "", "", "", ""]);
      setResendTimer(30);
      setTimeout(() => otpRefs.current[0]?.focus(), 50);
      showToast("OTP telah dikirim ulang", "info");
    } catch (err: any) {
      showToast(err.message || "Server error saat kirim ulang OTP");
    }
  };

  const verifyOtp = async () => {
    const otpString = otp.join("");
    if (otpString.length < 6) return showToast("Masukkan OTP 6 digit");
    let nomor = wa;
    if (nomor.startsWith("08")) nomor = "62" + nomor.slice(1);
    try {
      const res = await fetch(`${API_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: nomor, otp: otpString }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast("OTP benar!", "success");
        setStep(3);
        setCurrentAdIndex(0);
        if (ads.length > 0 && ads[0]) {
          setRemainingSeconds(ads[0].duration);
          if (ads[0].type === "image") {
            setTimeout(() => startImageTimer(), 100);
          }
        }
      } else {
        showToast(data.message || "OTP salah");
      }
    } catch {
      showToast("Server error verifikasi OTP");
    }
  };

  const formattedWa = wa
    ? "+62 " + (wa.startsWith("08") ? wa.slice(1) : wa).replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3")
    : "";

  const currentAd = ads[currentAdIndex];

  return (
    <div className={`page${step === 3 ? " fit-viewport" : ""}`} style={{ backgroundImage: `url(${bgTessellation})` }}>
      {toast && <Toast msg={toast.msg} type={toast.type} />}

      <div className={step === 1 ? "card" : "card card-otp"}>

        {/* ---- HEADER ---- */}
        {step === 1 && (
          <div className="header">
            <img src={logo} alt="logo" className="logo" />
            <h1>Saloka Theme Park</h1>
            <p className="subtitle">Masukkan data untuk melanjutkan koneksi</p>
          </div>
        )}

        {step === 2 && (
          <div className="header-otp">
            <h1>Verifikasi</h1>
            <p className="otp-info">Kode OTP telah dikirim ke WhatsApp</p>
            <p className="otp-phone">{formattedWa}</p>
          </div>
        )}

        {step === 3 && (
          <div className="header">
            <img src={logo} alt="logo" className="logo" />
            <h1>Selamat Datang!</h1>
            <p className="subtitle">Tonton iklan sebentar untuk connect WiFi</p>
          </div>
        )}

        {/* ---- FORM ---- */}
        <div className="form">

          {/* STEP 1 */}
          {step === 1 && (
            <>
              <input
                placeholder="Nama Lengkap"
                value={nama}
                onChange={(e) => setNama(e.target.value.replace(/[^a-zA-Z\s]/g, ""))}
              />
              <input
                type="tel"
                inputMode="numeric"
                placeholder="WhatsApp"
                value={wa}
                onChange={(e) => setWa(e.target.value.replace(/\D/g, ""))}
              />
              <SearchableDropdown
                options={provinsiList}
                value={provinsiId}
                onChange={(id) => handleProvinsi(id)}
                placeholder="Pilih Provinsi"
              />
              <SearchableDropdown
                options={kabupatenList}
                value={kabupatenId}
                onChange={(id, name) => { setKabupatenId(id); setKabupaten(name); }}
                placeholder="Pilih Kabupaten"
                disabled={!provinsi}
              />
              <button className="btn-connect" onClick={sendOtp}>Verifikasi</button>
            </>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <>
              <div className="otp-row">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    type="tel"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    onPaste={handleOtpPaste}
                    className="otp-box"
                  />
                ))}
              </div>

              <p className="resend-text">
                Tidak menerima kode?{" "}
                {resendTimer > 0 ? (
                  <span className="resend-timer">({resendTimer}s)</span>
                ) : (
                  <button className="btn-resend" onClick={resendOtp}>Kirim ulang</button>
                )}
              </p>

              <button className="btn-connect" onClick={verifyOtp}>Verifikasi</button>
              <button className="btn-back" onClick={() => setStep(1)}>← Kembali</button>
            </>
          )}

          {/* STEP 3 — IKLAN WAJIB TONTON */}
          {step === 3 && (
            <>
              <div className="ad-stage">
                {/* Loading state */}
                {isLoadingAds && (
                  <div className="ad-media ad-media-loading">
                    <div className="ad-spinner" />
                    <p style={{ color: 'white', marginTop: '10px', fontSize: '14px' }}>Memuat iklan...</p>
                  </div>
                )}

                {/* ✅ KONTEN IKLAN - TANPA JUDUL & SPONSOR */}
                {!isLoadingAds && currentAd && (
                  <div className="ad-media">
                   {currentAd.type === "video" ? (
                      <video
                        ref={videoRef}
                        src={currentAd.file}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="ad-media-content"
                      />
                    ) : (
                      <img
                        src={currentAd.file || "https://via.placeholder.com/400x600?text=Saloka+Theme+Park"}
                        alt="Iklan"
                        className="ad-media-content"
                        onLoad={() => {
                          console.log("Image loaded:", currentAd.file);
                          if (currentAd.type === "image" && remainingSeconds > 0) {
                            startImageTimer();
                          }
                        }}
                        onError={(e) => {
                          console.error("Image failed to load:", currentAd.file);
                          (e.target as HTMLImageElement).src = "https://via.placeholder.com/400x600?text=Saloka+Theme+Park";
                        }}
                      />
                    )}

                    {/* ❌ JUDUL & SPONSOR DIHAPUS DARI SINI */}
                  </div>
                )}

                {/* Dot indicator jika lebih dari 1 iklan */}
                {ads.length > 1 && (
                  <div className="ad-dots">
                    {ads.map((_, i) => (
                      <div
                        key={i}
                        onClick={() => {
                          if (remainingSeconds <= 0 && i !== currentAdIndex) {
                            if (imageTimerRef.current) clearTimeout(imageTimerRef.current);
                            if (countdownRef.current) clearInterval(countdownRef.current);
                            setCurrentAdIndex(i);
                            const newAd = ads[i];
                            setRemainingSeconds(newAd.duration);
                            if (newAd.type === "image") {
                              setTimeout(() => startImageTimer(), 100);
                            }
                          }
                        }}
                        className="ad-dot"
                        style={{
                          width: i === currentAdIndex ? "20px" : "7px",
                          background: i === currentAdIndex ? "#2e7d32" : "#ddd",
                          cursor: remainingSeconds <= 0 ? "pointer" : "not-allowed",
                          opacity: remainingSeconds <= 0 ? 1 : 0.5,
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Tombol Connect */}
              <button
                className={`ad-connect-btn ${remainingSeconds <= 0 ? "active" : "disabled"}`}
                onClick={handleSkip}
                disabled={remainingSeconds > 0}
              >
                {remainingSeconds > 0 ? `Tunggu ${remainingSeconds} detik` : "Connect ke WiFi"}
              </button>

              <p className="ad-countdown-text">
                {remainingSeconds > 0
                  ? "Nikmati akses WiFi gratis sebentar lagi"
                  : "WiFi gratis Anda sudah siap ✓"}
              </p>
            </>
          )}

          <p className="footer-text">Saloka Ceria Tiada Habisnya</p>
        </div>
      </div>

      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; font-family: Arial, sans-serif; }

        .page {
          min-height: 100vh;
          min-height: 100dvh;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 16px;
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          background-attachment: fixed;
        }

        /* Dikunci pas 1 layar (tanpa scroll) HANYA untuk halaman iklan/sponsor (step 3) */
        .page.fit-viewport {
          height: 100vh;
          height: 100dvh;
          min-height: 0;
          overflow: hidden;
        }

        .card {
          width: 420px;
          max-width: 100%;
          background: white;
          border-radius: 20px;
          padding: 24px 32px 18px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.08);
          text-align: center;
        }

        .page.fit-viewport .card {
          max-height: 100%;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          padding: 20px 32px 16px;
        }

        .card-otp {
          padding: 18px 32px 16px;
        }

        .header { margin-bottom: 14px; flex-shrink: 0; }
        .header-otp { margin-bottom: 12px; flex-shrink: 0; }

        .logo {
          width: 100px;
          display: block;
          margin: 0 auto 8px;
        }

        h1 {
          margin: 0 0 4px;
          color: #1b5e20;
          font-size: 22px;
          font-weight: 700;
        }

        .subtitle {
          margin: 0;
          color: #777;
          font-size: 13px;
        }

        .otp-info {
          margin: 4px 0 8px;
          font-size: 13px;
          color: #777;
        }

        .otp-phone {
          margin: 0 0 4px;
          font-size: 14px;
          font-weight: 600;
          color: #333;
        }

        .form {
          display: flex;
          flex-direction: column;
          gap: 10px;
          flex: 1;
          min-height: 0;
        }

        input, select {
          width: 100%;
          padding: 12px;
          border-radius: 12px;
          border: 1px solid #e0e0e0;
          outline: none;
          font-size: 14px;
          font-family: Arial, sans-serif;
          color: #111;
          flex-shrink: 0;
        }

        input::placeholder { color: #aaa; }

        .otp-row {
          display: flex;
          gap: 8px;
          justify-content: center;
          flex-shrink: 0;
        }

        .otp-box {
          width: 50px !important;
          height: 50px !important;
          padding: 0 !important;
          border-radius: 12px !important;
          border: 1px solid #e0e0e0 !important;
          text-align: center !important;
          font-size: 20px !important;
          font-weight: 700 !important;
          color: #111 !important;
          outline: none !important;
          background: white !important;
        }

        .otp-box:focus {
          border-color: #2e7d32 !important;
        }

        .resend-text {
          margin: 0;
          font-size: 12px;
          color: #777;
          flex-shrink: 0;
        }

        .resend-timer { color: #aaa; font-size: 12px; }

        .btn-resend {
          background: none;
          border: none;
          font-size: 12px;
          color: #777;
          cursor: pointer;
          padding: 0;
          font-family: Arial, sans-serif;
          text-decoration: underline;
        }

        .btn-connect {
          width: 100%;
          padding: 13px;
          background: linear-gradient(135deg, #1b5e20, #2e7d32);
          color: white;
          border: none;
          border-radius: 14px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          font-family: Arial, sans-serif;
          flex-shrink: 0;
        }

        .btn-connect:hover { opacity: 0.92; }

        .btn-back {
          background: transparent;
          border: none;
          color: #2e7d32;
          font-size: 13px;
          cursor: pointer;
          font-family: Arial, sans-serif;
          padding: 0;
          margin-top: -2px;
          flex-shrink: 0;
        }

        .footer-text {
          margin: 2px 0 0;
          font-size: 12px;
          color: #bbb;
          flex-shrink: 0;
        }

        /* ---- AD STYLES ---- */
        .ad-stage {
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex: 1;
          min-height: 0;
        }

        .ad-media {
          position: relative;
          width: 100%;
          flex: 1;
          min-height: 0;
          border-radius: 18px;
          overflow: hidden;
          background: #0d1b0f;
          box-shadow: 0 10px 28px rgba(0,0,0,0.16);
        }

        .ad-media-content {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .ad-media-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #f0f3f0;
        }

        .ad-spinner {
          width: 30px;
          height: 30px;
          border: 3px solid #dcecdd;
          border-top: 3px solid #2e7d32;
          border-radius: 50%;
          animation: adSpin 0.8s linear infinite;
        }

        @keyframes adSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .ad-dots {
          display: flex;
          justify-content: center;
          gap: 6px;
          margin: 0;
          flex-shrink: 0;
        }

        .ad-dot {
          height: 7px;
          border-radius: 4px;
          transition: all 0.3s;
          cursor: pointer;
        }

        .ad-connect-btn {
          width: 100%;
          padding: 13px;
          border: none;
          border-radius: 14px;
          font-size: 15px;
          font-weight: 700;
          font-family: Arial, sans-serif;
          color: white;
          transition: all 0.3s;
          flex-shrink: 0;
        }

        .ad-connect-btn.disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .ad-connect-btn.active {
          background: linear-gradient(135deg, #1b5e20, #2e7d32);
          cursor: pointer;
        }

        .ad-connect-btn.active:hover { opacity: 0.92; }

        .ad-countdown-text {
          margin: 2px 0 0;
          font-size: 12px;
          color: #777;
          flex-shrink: 0;
        }

        /* ================= TABLET ================= */
        @media (max-width: 768px) {
          .page { padding: 12px; }
          .card {
            width: 100%;
            max-width: 400px;
            padding: 18px 24px 14px;
            border-radius: 18px;
          }
          .card-otp { padding: 16px 24px 14px; }
          .logo { width: 80px; margin-bottom: 6px; }
          h1 { font-size: 20px; }
          .subtitle, .otp-info { font-size: 12px; }
        }

        /* ================= MOBILE ================= */
        @media (max-width: 480px) {
          .page {
            padding: 10px;
            padding-bottom: env(safe-area-inset-bottom, 10px);
          }
          .card {
            width: 100%;
            max-width: 100%;
            padding: 14px 16px 12px;
            border-radius: 16px;
          }
          .card-otp { padding: 14px 16px 12px; }
          .header { margin-bottom: 10px; }
          .logo { width: 64px; margin-bottom: 4px; }
          h1 { font-size: 17px; }
          .form { gap: 7px; }
          input, select {
            padding: 10px 12px;
            font-size: 13px;
            border-radius: 11px;
          }
          .btn-connect {
            padding: 11px;
            font-size: 14px;
            border-radius: 12px;
          }
          .btn-back { font-size: 12px; }
          .otp-row { gap: 6px; }
          .otp-box {
            width: 42px !important;
            height: 46px !important;
            font-size: 18px !important;
            border-radius: 10px !important;
          }
          .footer-text { font-size: 10px; }
          .ad-stage { gap: 6px; }
          .ad-connect-btn { padding: 11px; font-size: 14px; border-radius: 12px; }
          .ad-countdown-text { font-size: 11px; }
        }

        /* ================= MOBILE KECIL / LAYAR PENDEK ================= */
        @media (max-width: 359px), (max-height: 640px) {
          .card { padding: 12px 12px 10px; }
          .header { margin-bottom: 6px; }
          .logo { width: 52px; margin-bottom: 2px; }
          h1 { font-size: 15px; }
          .subtitle, .otp-info { font-size: 11px; }
          .form { gap: 5px; }
          .otp-row { gap: 4px; }
          .otp-box {
            width: 38px !important;
            height: 42px !important;
            font-size: 16px !important;
            border-radius: 9px !important;
          }
          .footer-text { display: none; }
        }
      `}</style>
    </div>
  );
}