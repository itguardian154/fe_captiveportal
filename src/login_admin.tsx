import { useState } from "react";
import logo from "./assets/logo.png";
import bgTessellation from "./assets/Background.jpeg";

import { API_URL as API } from "./lib/config";

export default function LoginAdmin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { alert("Email dan password wajib diisi!"); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      
      console.log("RESPONSE:", data);
      
      if (data.success) {
        const adminData = data.data?.admin || data.admin || {};
        const adminName = adminData.name || "Admin";
        const adminRole = adminData.role || "it";
        
        console.log("Admin Data:", adminData);
        console.log("Name:", adminName);
        console.log("Role:", adminRole);
        
        // ===== SIMPAN DENGAN PREFIX ROLE =====
        localStorage.setItem(`${adminRole}_token`, data.token);
        localStorage.setItem(`${adminRole}_name`, adminName);
        localStorage.setItem(`${adminRole}_email`, adminData.email || "");
        localStorage.setItem(`${adminRole}_id`, String(adminData.id || ""));
        localStorage.setItem("admin_role", adminRole); // Tetap simpan role global
        
        console.log("SAVED - Name:", localStorage.getItem(`${adminRole}_name`));
        console.log("SAVED - Role:", adminRole);
        
        // ===== REDIRECT =====
        if (adminRole === "marketing") {
          window.location.href = "/dashboard_marketing";
        } else {
          window.location.href = "/dashboard_it";
        }
        return;
      }

      alert("Email atau password salah!");
    } catch (err) {
      console.error(err);
      alert("Server error! Pastikan backend sudah berjalan.");
    }
    setLoading(false);
  };

  return (
    <div className="page" style={{ backgroundImage: `url(${bgTessellation})` }}>
      <div className="card">
        <div className="header">
          <img src={logo} alt="logo" className="logo" />
          <h1>Login Dashboard Wifi</h1>
          <p>Silakan login untuk melanjutkan</p>
        </div>

        <div className="form">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
          />
          <div className="password-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
            />
            <button className="toggle-password" onClick={() => setShowPassword(p => !p)} tabIndex={-1}>
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
          <button className="connect" onClick={handleLogin} disabled={loading}>
            {loading ? "Memproses..." : "Login"}
          </button>
        </div>

        <div className="roles">
          <span>Admin IT</span>
          <span className="divider">|</span>
          <span>Admin Marketing</span>
        </div>
      </div>

      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; font-family: Arial, sans-serif; }
        .page {
           min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 24px;
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            background-attachment: fixed;
        }
        .card { width:420px; background:white; border-radius:20px; padding:30px 28px; box-shadow:0 20px 40px rgba(0,0,0,0.08); text-align:center; }
        .logo { width:120px; display:block; margin:0 auto 10px; }
        h1 { margin:0; color:#1b5e20; font-size:22px; }
        p  { margin:6px 0 10px; color:#777; font-size:13px; }
        .form { display:flex; flex-direction:column; gap:12px; }
        input { width:100%; padding:12px; border-radius:12px; border:1px solid #e0e0e0; outline:none; font-size:14px; }
        input:focus { border-color:#2e7d32; }
        .password-wrapper { position:relative; display:flex; align-items:center; }
        .password-wrapper input { padding-right:44px; }
        .toggle-password { position:absolute; right:12px; background:none; border:none; cursor:pointer; padding:0; display:flex; align-items:center; }
        .connect { margin-top:10px; padding:14px; background:linear-gradient(135deg,#1b5e20,#2e7d32); color:white; border:none; border-radius:14px; font-weight:bold; cursor:pointer; font-size:15px; }
        .connect:hover:not(:disabled) { opacity:0.92; }
        .connect:disabled { opacity:0.6; cursor:not-allowed; }
        .roles { margin-top:20px; font-size:12px; color:#bbb; display:flex; justify-content:center; align-items:center; gap:8px; }
        .divider { color:#e0e0e0; }
      `}</style>
    </div>
  );
}