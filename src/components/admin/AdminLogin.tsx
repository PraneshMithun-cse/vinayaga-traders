"use client";

import { useState } from "react";
import Image from "next/image";
import { useAdmin } from "@/context/AdminContext";

export default function AdminLogin() {
  const { login } = useAdmin();
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState(false);
  const [showPass, setShowPass] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ok = login(user.trim(), pass.trim());
    if (!ok) {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  }

  const inp: React.CSSProperties = {
    width: "100%",
    padding: "14px 16px",
    borderRadius: 12,
    border: `1.5px solid ${error ? "#E53E3E" : "#E8E8E8"}`,
    fontSize: 15,
    color: "#282C3F",
    outline: "none",
    backgroundColor: "white",
    boxSizing: "border-box",
    fontFamily: "inherit",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#F0F4FF",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: 20,
          padding: 32,
          width: "100%",
          maxWidth: 380,
          boxShadow: "0 8px 32px rgba(0,80,255,0.12)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 28 }}>
          <Image src="/vinayaga-logo.png" alt="Vinayaga Traders" width={64} height={64} style={{ objectFit: "contain", borderRadius: 12, marginBottom: 12 }} />
          <div style={{ fontSize: 20, fontWeight: 800, color: "#282C3F" }}>Admin Panel</div>
          <div style={{ fontSize: 13, color: "rgba(2,6,12,0.45)", marginTop: 4 }}>Vinayaga Traders</div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: "rgba(2,6,12,0.55)", marginBottom: 6, display: "block" }}>USERNAME</label>
            <input
              style={inp}
              placeholder="Enter username"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              autoComplete="username"
            />
          </div>

          <div style={{ position: "relative" }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "rgba(2,6,12,0.55)", marginBottom: 6, display: "block" }}>PASSWORD</label>
            <input
              style={inp}
              type={showPass ? "text" : "password"}
              placeholder="Enter password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPass((s) => !s)}
              style={{ position: "absolute", right: 14, bottom: 14, background: "none", border: "none", cursor: "pointer", color: "rgba(2,6,12,0.4)", fontSize: 13 }}
            >
              {showPass ? "Hide" : "Show"}
            </button>
          </div>

          {error && (
            <div style={{ backgroundColor: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#B91C1C", fontWeight: 600 }}>
              Incorrect username or password
            </div>
          )}

          <button
            type="submit"
            style={{
              width: "100%",
              padding: "15px",
              backgroundColor: "#0050FF",
              color: "white",
              border: "none",
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 800,
              cursor: "pointer",
              marginTop: 4,
            }}
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
