"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const LOGO_HEIGHT = 100;
const FEE_DEF = 50;
const R = 0.077;

const PROVIDERS_DEF = [
  { id: "mtn", name: "MTN Mobile Money", number: "0XX-XXX-XXXX", color: "#FFC300", bg: "#FFC30012", border: "#FFC30035" },
  { id: "telecel", name: "Telecel Cash", number: "0XX-XXX-XXXX", color: "#E40521", bg: "#E4052112", border: "#E4052135" },
  { id: "airteltigo", name: "AirtelTigo Money", number: "0XX-XXX-XXXX", color: "#0056A3", bg: "#0056A312", border: "#0056A335" },
];

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [siteSettings, setSiteSettings] = useState(null);

  useEffect(() => {
    fetch("/api/admin/settings").then(r=>r.json()).then(d=>{if(d.settings)setSiteSettings(d.settings);}).catch(()=>{});
  }, []);

  const ss = siteSettings || {};
  const FEE = ss.signupFeeGHS || FEE_DEF;
  const FEE_USD = (FEE * R).toFixed(2);
  const PROVIDERS = [
    { ...PROVIDERS_DEF[0], number: ss.mtnNumber || PROVIDERS_DEF[0].number },
    { ...PROVIDERS_DEF[1], number: ss.telecelNumber || PROVIDERS_DEF[1].number },
    { ...PROVIDERS_DEF[2], number: ss.airteltigoNumber || PROVIDERS_DEF[2].number },
  ];
  const [showPw, setShowPw] = useState(false);
  const [provider, setProvider] = useState(null);
  const [ddOpen, setDdOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirm: "", referral: "" });
  const [refNum, setRefNum] = useState("");
  const [created, setCreated] = useState(null);

  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const prov = PROVIDERS.find(p => p.id === provider);

  const step1 = (e) => {
    e.preventDefault(); setError("");
    if (!form.name || !form.email || !form.phone || !form.password) return setError("All fields are required.");
    if (!/\S+@\S+\.\S+/.test(form.email)) return setError("Enter a valid email address.");
    if (form.phone.length < 10) return setError("Enter a valid phone number.");
    if (form.password.length < 6) return setError("Password must be at least 6 characters.");
    if (form.password !== form.confirm) return setError("Passwords don't match.");
    setStep(2);
  };

  const step3 = async (e) => {
    e.preventDefault(); setError("");
    if (!refNum.trim()) return setError("Enter your payment reference number.");
    setLoading(true);

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name, email: form.email, phone: form.phone,
          password: form.password, referenceNumber: refNum.trim(),
          paymentProvider: provider || "", referralUsed: form.referral || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Registration failed"); setLoading(false); return; }
      setCreated(data.user);
      setStep(4);
    } catch (err) {
      setError("Network error. Try again.");
    }
    setLoading(false);
  };

  return (
    <div className="vb-auth-root">
      <style>{`
        .vb-auth-root{min-height:100vh;background:#0B0D10;color:#F0F0F2;font-family:'DM Sans',sans-serif;display:flex;flex-direction:column}
        .vb-auth-bg{position:fixed;inset:0;z-index:0;background-image:url(/backdrop.png);background-size:380px auto;background-repeat:repeat;opacity:0.03;pointer-events:none}
        .vb-auth-fade{position:fixed;inset:0;z-index:0;background:linear-gradient(180deg,#0B0D10 0%,transparent 30%,transparent 70%,#0B0D10 100%);pointer-events:none}
        .vb-auth-content{position:relative;z-index:1;flex:1;display:flex;align-items:center;justify-content:center;padding:40px 20px}
        .vb-auth-card{width:100%;max-width:460px;background:#12141A;border:1px solid #1E2028;border-radius:20px;padding:40px 36px;position:relative;overflow:visible}
        .vb-auth-glow{position:absolute;top:-80px;right:-80px;width:200px;height:200px;background:radial-gradient(circle,#E3172515 0%,transparent 70%);border-radius:50%;pointer-events:none}
        .vb-auth-logo{display:flex;justify-content:center;margin-bottom:28px}
        .vb-auth-title{font-family:'Bebas Neue',sans-serif;font-size:32px;letter-spacing:2px;text-align:center;margin-bottom:4px}
        .vb-auth-sub{font-size:14px;color:#555;text-align:center;margin-bottom:24px;line-height:1.6}
        .vb-progress{display:flex;gap:4px;margin-bottom:24px}
        .vb-pbar{flex:1;height:3px;border-radius:2px;background:#1E2028;transition:background 0.3s}
        .vb-pbar.act{background:#E31725}
        .vb-step-tag{display:flex;justify-content:center;margin-bottom:20px}
        .vb-step-tag span{font-size:11px;font-weight:700;letter-spacing:2px;color:#555;background:#1E2028;padding:4px 14px;border-radius:20px}
        .vb-fee{display:flex;align-items:center;justify-content:center;gap:8px;background:#0B963510;border:1px solid #0B963520;border-radius:10px;padding:12px 16px;margin-bottom:24px;text-align:center;flex-wrap:wrap}
        .vb-fee-amt{font-family:'Bebas Neue',sans-serif;font-size:22px;letter-spacing:1px;color:#0B9635}
        .vb-fee-usd{font-size:13px;color:#555}
        .vb-field{margin-bottom:16px}
        .vb-label{display:block;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#555;margin-bottom:6px}
        .vb-inp{width:100%;padding:14px 16px;background:#0B0D10;border:1px solid #1E2028;border-radius:10px;color:#F0F0F2;font-size:14px;font-family:'DM Sans',sans-serif;outline:none;transition:border-color 0.2s}
        .vb-inp:focus{border-color:#E31725;box-shadow:0 0 0 3px rgba(227,23,37,0.1)}
        .vb-inp::placeholder{color:#2A2D34}
        .vb-pw-w{position:relative}
        .vb-pw-w .vb-inp{padding-right:52px}
        .vb-pw-t{position:absolute;right:14px;top:50%;transform:translateY(-50%);background:none;border:none;color:#555;cursor:pointer;font-size:13px;font-family:'DM Sans',sans-serif}
        .vb-error{background:#E3172510;border:1px solid #E3172520;border-radius:10px;padding:12px 16px;margin-bottom:16px;font-size:13px;color:#E31725;font-weight:600}
        .vb-btn{width:100%;padding:16px;border:none;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all 0.2s}
        .vb-btn:disabled{opacity:0.5;cursor:not-allowed;transform:none!important}
        .vb-btn-r{background:#E31725;color:#fff}.vb-btn-r:hover{background:#c8131f;transform:translateY(-1px)}
        .vb-btn-g{background:#0B9635;color:#fff}.vb-btn-g:hover{background:#097a2b;transform:translateY(-1px)}
        .vb-btn-o{background:transparent;color:#F0F0F2;border:1px solid #2A2D34}.vb-btn-o:hover{border-color:#F0F0F2}
        .vb-btn-row{display:flex;gap:10px}.vb-btn-row>:first-child{flex:1}.vb-btn-row>:last-child{flex:2}
        .vb-link{color:#E31725;font-weight:700;text-decoration:none}
        .vb-foot{text-align:center;margin-top:20px;font-size:13px;color:#555}
        .vb-info{background:#0B0D10;border:1px solid #1E2028;border-radius:12px;padding:18px;margin-bottom:18px}
        .vb-info-r{display:flex;justify-content:space-between;align-items:center;font-size:14px;margin-bottom:10px}
        .vb-info-r:last-child{margin-bottom:0}
        .vb-info-d{height:1px;background:#1E2028;margin:14px 0}
        .vb-warn{background:#1E202840;border-radius:10px;padding:14px 16px;margin-bottom:18px;font-size:12px;color:#555;line-height:1.7}
        .vb-dd{position:relative;margin-bottom:12px}
        .vb-dd-trigger{width:100%;padding:14px 16px;background:#0B0D10;border:1px solid #1E2028;border-radius:12px;cursor:pointer;display:flex;align-items:center;justify-content:space-between;transition:border-color 0.2s}
        .vb-dd-trigger:hover{border-color:#2A2D34}
        .vb-dd-trigger.open{border-color:#E31725;border-radius:12px 12px 0 0}
        .vb-dd-menu{position:absolute;top:100%;left:0;right:0;background:#0B0D10;border:1px solid #1E2028;border-top:none;border-radius:0 0 12px 12px;z-index:50;overflow:hidden}
        .vb-dd-opt{padding:14px 16px;cursor:pointer;transition:background 0.15s;border-top:1px solid #151820;display:flex;align-items:center;gap:12px}
        .vb-dd-opt:hover{background:#151820}
        .vb-pay-card{border-radius:14px;padding:20px;margin-top:12px}
        .vb-pay-row{margin-bottom:12px}.vb-pay-row:last-child{margin-bottom:0}
        .vb-pay-lbl{font-size:10px;letter-spacing:1.5px;text-transform:uppercase;font-weight:700;margin-bottom:2px;opacity:0.6}
        .vb-pay-val{font-size:16px;font-weight:700}
        .vb-suc{background:#0B0D10;border:1px solid #0B963530;border-radius:12px;padding:20px;margin-bottom:20px}
        .vb-suc-r{margin-bottom:14px}.vb-suc-r:last-child{margin-bottom:0}
        .vb-suc-l{font-size:11px;color:#555;margin-bottom:3px}
        .vb-suc-v{font-size:16px;font-weight:700}
        .vb-page-foot{position:relative;z-index:1;text-align:center;padding:20px;font-size:11px;color:#333;border-top:1px solid #1E2028}
        .vb-page-foot img{margin-bottom:8px;opacity:0.4}
        .vb-prov-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0}
        @media(max-width:480px){
          .vb-auth-card{padding:24px 18px!important;border-radius:16px!important;max-width:100%!important}
          .vb-auth-title{font-size:26px!important}
          .vb-auth-content{padding:16px 12px!important}
          .vb-btn-row{flex-direction:column!important}.vb-btn-row>*{flex:unset!important}
          .vb-fee{flex-direction:column!important;gap:4px!important}
          .vb-info-r{flex-direction:column!important;align-items:flex-start!important;gap:4px!important}
        }
      `}</style>

      <div className="vb-auth-bg" /><div className="vb-auth-fade" />

      <div className="vb-auth-content">
        <div className="vb-auth-card">
          <div className="vb-auth-glow" />
          <div className="vb-auth-logo"><a href="/"><img src="/images/logo.png" alt="VB" style={{ height: LOGO_HEIGHT, width: "auto", objectFit: "contain" }} /></a></div>
          <div className="vb-progress">{[1,2,3,4].map(s => <div key={s} className={`vb-pbar ${step >= s ? "act" : ""}`} />)}</div>
          <div className="vb-step-tag"><span>STEP {step} OF 4</span></div>

          {/* STEP 1 */}
          {step === 1 && (<div>
            <h1 className="vb-auth-title">Create Your Account</h1>
            <p className="vb-auth-sub">Sign up to access AI-powered predictions</p>
            <div className="vb-fee"><span className="vb-fee-amt">Registration Fee: GH₵{FEE}</span><span className="vb-fee-usd">(≈ ${FEE_USD} USD)</span></div>
            <form onSubmit={step1}>
              <div className="vb-field"><label className="vb-label">Full Name</label><input className="vb-inp" placeholder="e.g. Kwame Asante" value={form.name} onChange={e => upd("name", e.target.value)} /></div>
              <div className="vb-field"><label className="vb-label">Email Address</label><input className="vb-inp" type="email" placeholder="e.g. kwame@email.com" value={form.email} onChange={e => upd("email", e.target.value)} /></div>
              <div className="vb-field"><label className="vb-label">Phone Number (SportyBet)</label><input className="vb-inp" type="tel" placeholder="e.g. 0241234567" value={form.phone} onChange={e => upd("phone", e.target.value)} /></div>
              <div className="vb-field"><label className="vb-label">Password</label><div className="vb-pw-w"><input className="vb-inp" type={showPw?"text":"password"} placeholder="Min 6 characters" value={form.password} onChange={e => upd("password", e.target.value)} /><button type="button" className="vb-pw-t" onClick={() => setShowPw(!showPw)}>{showPw?"Hide":"Show"}</button></div></div>
              <div className="vb-field"><label className="vb-label">Confirm Password</label><input className="vb-inp" type="password" placeholder="Re-enter" value={form.confirm} onChange={e => upd("confirm", e.target.value)} /></div>
              <div className="vb-field"><label className="vb-label">Referral Code (Optional)</label><input className="vb-inp" placeholder="e.g. VG-XXXX-XXXX" value={form.referral} onChange={e => upd("referral", e.target.value)} /></div>
              {error && <div className="vb-error">⚠ {error}</div>}
              <button type="submit" className="vb-btn vb-btn-r">Continue to Payment</button>
            </form>
            <div className="vb-foot">Already have an account? <a href="/login" className="vb-link">Log In</a></div>
          </div>)}

          {/* STEP 2 */}
          {step === 2 && (<div>
            <h1 className="vb-auth-title">Make Payment</h1>
            <p className="vb-auth-sub">Send registration fee to complete signup</p>
            <div className="vb-info">
              <div className="vb-info-r"><span style={{color:"#555"}}>Registration Fee</span><span style={{fontWeight:700}}>GH₵{FEE}</span></div>
              <div className="vb-info-d" />
              <div className="vb-info-r"><span style={{color:"#0B9635",fontWeight:700,fontSize:16}}>Total Due</span><div style={{textAlign:"right"}}><div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:24,color:"#0B9635",letterSpacing:1}}>GH₵{FEE}</div><div style={{fontSize:12,color:"#555"}}>≈ ${FEE_USD} USD</div></div></div>
            </div>
            <div className="vb-field"><label className="vb-label" style={{marginBottom:8}}>Select Payment Method</label>
              <div className="vb-dd">
                <div className={`vb-dd-trigger ${ddOpen?"open":""}`} onClick={() => setDdOpen(!ddOpen)}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>{prov ? <><div className="vb-prov-dot" style={{background:prov.color}} /><span style={{fontWeight:600,fontSize:14}}>{prov.name}</span></> : <span style={{color:"#2A2D34",fontSize:14}}>Tap to select</span>}</div>
                  <span style={{color:"#555",fontSize:12,transition:"transform 0.2s",transform:ddOpen?"rotate(180deg)":"none"}}>▼</span>
                </div>
                {ddOpen && <div className="vb-dd-menu">{PROVIDERS.map(p => (
                  <div key={p.id} className="vb-dd-opt" onClick={() => { setProvider(p.id); setDdOpen(false); }} style={{background:provider===p.id?p.bg:"transparent"}}>
                    <div className="vb-prov-dot" style={{background:p.color}} />
                    <div><div style={{fontWeight:700,fontSize:14,color:p.color}}>{p.name}</div><div style={{fontSize:11,color:"#555"}}>Send to: {p.number}</div></div>
                  </div>
                ))}</div>}
              </div>
              {prov && !ddOpen && <div className="vb-pay-card" style={{background:prov.bg,border:`1px solid ${prov.border}`}}>
                <div className="vb-pay-row"><div className="vb-pay-lbl" style={{color:prov.color}}>SEND TO</div><div className="vb-pay-val">{prov.number}</div></div>
                <div className="vb-pay-row"><div className="vb-pay-lbl" style={{color:prov.color}}>NAME</div><div className="vb-pay-val">VirtualBet GH</div></div>
                <div className="vb-pay-row"><div className="vb-pay-lbl" style={{color:prov.color}}>AMOUNT</div><div style={{display:"flex",alignItems:"baseline",gap:8}}><div className="vb-pay-val" style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,letterSpacing:1}}>GH₵{FEE}</div><span style={{fontSize:12,color:"#555"}}>(≈ ${FEE_USD})</span></div></div>
              </div>}
            </div>
            <div className="vb-warn">⚠️ <strong style={{color:"#888"}}>Important:</strong> After payment you'll get a reference number via SMS. Admin will verify before activating your account.</div>
            <div className="vb-btn-row"><button className="vb-btn vb-btn-o" onClick={() => {setError("");setStep(1)}}>Back</button><button className="vb-btn vb-btn-g" disabled={!prov} onClick={() => {setError("");setStep(3)}}>I've Paid →</button></div>
            {!prov && <div style={{textAlign:"center",marginTop:10,fontSize:12,color:"#555"}}>Select a payment method to continue</div>}
          </div>)}

          {/* STEP 3 */}
          {step === 3 && (<div>
            <h1 className="vb-auth-title">Submit Reference</h1>
            <p className="vb-auth-sub">Enter the reference from your <strong style={{color:prov?.color}}>{prov?.name}</strong> payment of <strong style={{color:"#0B9635"}}>GH₵{FEE}</strong></p>
            {prov && <div style={{display:"flex",alignItems:"center",gap:10,background:prov.bg,border:`1px solid ${prov.border}`,borderRadius:10,padding:"10px 14px",marginBottom:18}}><div className="vb-prov-dot" style={{background:prov.color}} /><div><div style={{fontWeight:700,fontSize:13,color:prov.color}}>{prov.name}</div><div style={{fontSize:11,color:"#555"}}>Sent to: {prov.number}</div></div></div>}
            <form onSubmit={step3}>
              <div className="vb-field"><label className="vb-label">Payment Reference Number</label><input className="vb-inp" placeholder="e.g. MTN-837465291" value={refNum} onChange={e => setRefNum(e.target.value)} /></div>
              <div className="vb-warn">🔒 Account will be <strong style={{color:"#888"}}>pending</strong> until admin verifies payment. Usually 5–30 minutes.</div>
              {error && <div className="vb-error">⚠ {error}</div>}
              <div className="vb-btn-row"><button type="button" className="vb-btn vb-btn-o" onClick={() => {setError("");setStep(2)}}>Back</button><button type="submit" className="vb-btn vb-btn-g" disabled={loading}>{loading?"Submitting...":"Submit →"}</button></div>
            </form>
          </div>)}

          {/* STEP 4 */}
          {step === 4 && (<div style={{textAlign:"center"}}>
            <div style={{fontSize:56,marginBottom:16}}>⏳</div>
            <h1 className="vb-auth-title">Registration Submitted</h1>
            <p className="vb-auth-sub">Payment of <strong style={{color:"#0B9635"}}>GH₵{FEE} (≈ ${FEE_USD})</strong> is being verified</p>
            <div className="vb-suc" style={{textAlign:"left"}}>
              {[
                { l: "Full Name", v: created?.name || form.name },
                { l: "SportyBet ID", v: created?.sportyBetId || `SB-${form.phone}`, c: "#0B9635", big: true },
                { l: "Referral Code", v: created?.referralCode || "—" },
                { l: "Reference", v: refNum, mono: true },
                { l: "Amount Paid", v: `GH₵${FEE} (≈ $${FEE_USD})`, c: "#0B9635" },
              ].map((r, i) => (<div key={r.l}>{i > 0 && <div style={{height:1,background:"#1E2028",margin:"12px 0"}} />}<div className="vb-suc-r"><div className="vb-suc-l">{r.l}</div><div className="vb-suc-v" style={{color:r.c||"#F0F0F2",fontFamily:r.mono?"monospace":r.big?"'Bebas Neue',sans-serif":"inherit",fontSize:r.big?22:16,letterSpacing:r.big?1:0}}>{r.v}</div></div></div>))}
            </div>
            <p style={{color:"#555",fontSize:13,marginBottom:24}}>Approval takes 5–30 minutes.</p>
            <a href="/login"><button className="vb-btn vb-btn-r">Go to Login</button></a>
          </div>)}
        </div>
      </div>

      <div className="vb-page-foot"><img src="/images/logo.png" alt="VB" style={{height:32,width:"auto",objectFit:"contain"}} /><div>© 2026 VirtualBet. 18+ Only.</div></div>
    </div>
  );
}
