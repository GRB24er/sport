"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

const LOGO_HEIGHT = 100;

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    if (!phone || !password) return setError("Phone number and password are required.");
    if (phone.length < 10) return setError("Enter a valid phone number.");
    setLoading(true);

    try {
      const res = await signIn("credentials", { phone, password, redirect: false });

      if (res?.error) {
        setError(res.error);
        setLoading(false);
        return;
      }

      // Redirect based on role
      if (phone === "0200000000") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError("Login failed. Try again.");
      setLoading(false);
    }
  };

  return (
    <div className="vb-auth-root">
      <style>{`
        .vb-auth-root{min-height:100vh;background:#0B0D10;color:#F0F0F2;font-family:'DM Sans',sans-serif;display:flex;flex-direction:column}
        .vb-auth-bg{position:fixed;inset:0;z-index:0;background-image:url(/backdrop.png);background-size:380px auto;background-repeat:repeat;background-position:center top;opacity:0.03;pointer-events:none}
        .vb-auth-fade{position:fixed;inset:0;z-index:0;background:linear-gradient(180deg,#0B0D10 0%,transparent 30%,transparent 70%,#0B0D10 100%);pointer-events:none}
        .vb-auth-content{position:relative;z-index:1;flex:1;display:flex;align-items:center;justify-content:center;padding:40px 20px}
        .vb-auth-card{width:100%;max-width:420px;background:#12141A;border:1px solid #1E2028;border-radius:20px;padding:40px 36px;position:relative;overflow:hidden}
        .vb-auth-glow{position:absolute;top:-80px;right:-80px;width:200px;height:200px;background:radial-gradient(circle,#E3172515 0%,transparent 70%);border-radius:50%;pointer-events:none}
        .vb-auth-logo{display:flex;justify-content:center;margin-bottom:32px}
        .vb-auth-title{font-family:'Bebas Neue',sans-serif;font-size:32px;letter-spacing:2px;text-align:center;margin-bottom:4px}
        .vb-auth-subtitle{font-size:14px;color:#555;text-align:center;margin-bottom:28px}
        .vb-input-group{margin-bottom:18px}
        .vb-input-label{display:block;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#555;margin-bottom:6px}
        .vb-input{width:100%;padding:14px 16px;background:#0B0D10;border:1px solid #1E2028;border-radius:10px;color:#F0F0F2;font-size:14px;font-family:'DM Sans',sans-serif;outline:none;transition:border-color 0.2s}
        .vb-input:focus{border-color:#E31725;box-shadow:0 0 0 3px rgba(227,23,37,0.1)}
        .vb-input::placeholder{color:#2A2D34}
        .vb-input-pw-wrap{position:relative}
        .vb-input-pw-wrap .vb-input{padding-right:52px}
        .vb-pw-toggle{position:absolute;right:14px;top:50%;transform:translateY(-50%);background:none;border:none;color:#555;cursor:pointer;font-size:13px;font-family:'DM Sans',sans-serif}
        .vb-pw-toggle:hover{color:#F0F0F2}
        .vb-error{background:#E3172510;border:1px solid #E3172525;border-radius:10px;padding:12px 16px;margin-bottom:18px;font-size:13px;color:#E31725;font-weight:600}
        .vb-auth-btn{width:100%;padding:16px;background:#E31725;color:#fff;border:none;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;letter-spacing:0.5px;transition:all 0.2s;margin-top:4px}
        .vb-auth-btn:hover{background:#c8131f;transform:translateY(-1px);box-shadow:0 8px 24px rgba(227,23,37,0.3)}
        .vb-auth-btn:disabled{opacity:0.6;cursor:not-allowed;transform:none;box-shadow:none}
        .vb-auth-link{color:#E31725;font-weight:700;cursor:pointer;text-decoration:none}
        .vb-auth-footer-text{text-align:center;margin-top:24px;font-size:13px;color:#555}
        .vb-auth-page-footer{position:relative;z-index:1;text-align:center;padding:20px;font-size:11px;color:#333;border-top:1px solid #1E2028}
        .vb-auth-page-footer img{margin-bottom:8px;opacity:0.4}
        @media(max-width:480px){
          .vb-auth-card{padding:28px 22px!important;border-radius:16px!important}
          .vb-auth-title{font-size:28px!important}
          .vb-auth-content{padding:24px 16px!important}
        }
      `}</style>

      <div className="vb-auth-bg" />
      <div className="vb-auth-fade" />

      <div className="vb-auth-content">
        <div className="vb-auth-card">
          <div className="vb-auth-glow" />
          <div className="vb-auth-logo">
            <a href="/"><img src="/images/logo.png" alt="VirtualBet" style={{ height: LOGO_HEIGHT, width: "auto", objectFit: "contain" }} /></a>
          </div>

          <h1 className="vb-auth-title">Welcome Back</h1>
          <p className="vb-auth-subtitle">Log in to access your predictions</p>

          <form onSubmit={handleLogin}>
            <div className="vb-input-group">
              <label className="vb-input-label">Phone Number</label>
              <input className="vb-input" type="tel" placeholder="e.g. 0241234567" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div className="vb-input-group">
              <label className="vb-input-label">Password</label>
              <div className="vb-input-pw-wrap">
                <input className="vb-input" type={showPw ? "text" : "password"} placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} />
                <button type="button" className="vb-pw-toggle" onClick={() => setShowPw(!showPw)}>{showPw ? "Hide" : "Show"}</button>
              </div>
            </div>

            {error && <div className="vb-error">⚠ {error}</div>}
            <button type="submit" className="vb-auth-btn" disabled={loading}>{loading ? "Logging in..." : "Log In"}</button>
          </form>

          <div className="vb-auth-footer-text">
            Don't have an account? <a href="/signup" className="vb-auth-link">Sign Up</a>
          </div>
        </div>
      </div>

      <div className="vb-auth-page-footer">
        <img src="/images/logo.png" alt="VirtualBet" style={{ height: 32, width: "auto", objectFit: "contain" }} />
        <div>© 2026 VirtualBet. 18+ Only. Gamble responsibly.</div>
      </div>
    </div>
  );
}
