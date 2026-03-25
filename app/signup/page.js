"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const LOGO_H = 90;
const R = 0.077;
const DEF_FEE = 50;

const DEF_PROVS = [
  { id:"telecel", name:"Telecel Cash", short:"Telecel", number:"0503994665", acct:"ABEL AFRIYIE", color:"#E40521", dark:"#8B0315", bg:"linear-gradient(135deg,#E40521,#FF1744)", icon:"💳", dial:"*110#", steps:["Dial *110# on your Telecel line","Select Transfer/Send Money","Enter the number shown above","Enter the exact amount","Add reference as note","Confirm and enter PIN"] },
];

function SignupInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [ss, setSs] = useState(null);
  const [showPw, setShowPw] = useState(false);
  const [provider, setProvider] = useState(null);
  const [form, setForm] = useState({ name:"", email:"", phone:"", password:"", confirm:"", referral: "" });
  const [refNum, setRefNum] = useState("");
  const [senderName, setSenderName] = useState("");
  const [payScreenshot, setPayScreenshot] = useState(null);
  const [payPreview, setPayPreview] = useState(null);
  const [created, setCreated] = useState(null);
  const [copied, setCopied] = useState(null);
  const [timer, setTimer] = useState(1800);
  const timerRef = useRef(null);

  useEffect(() => { fetch("/api/admin/settings").then(r=>r.json()).then(d=>{if(d.settings)setSs(d.settings)}).catch(()=>{}); }, []);

  // Auto-fill referral code from ?ref= URL param
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) setForm(f => ({ ...f, referral: ref }));
  }, [searchParams]);

  const s = ss || {};
  const FEE = s.signupFeeGHS || DEF_FEE;
  const FEE_USD = (FEE * R).toFixed(2);
  const PROVS = [
    { ...DEF_PROVS[0], number: s.telecelNumber || DEF_PROVS[0].number, acct: s.telecelName || DEF_PROVS[0].acct },
  ];

  const pv = PROVS.find(p => p.id === provider);
  const upd = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    if (step === 3 && !timerRef.current) {
      timerRef.current = setInterval(() => setTimer(t => { if (t <= 0) { clearInterval(timerRef.current); return 0; } return t - 1; }), 1000);
    }
    return () => {};
  }, [step]);

  const handleScreenshot = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setErr("Please upload an image file"); return; }
    if (file.size > 10 * 1024 * 1024) { setErr("Image must be under 10MB"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => { setPayScreenshot(ev.target.result); setPayPreview(URL.createObjectURL(file)); };
    reader.readAsDataURL(file);
  };

  const copy = (text, id) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const goStep2 = (e) => {
    e.preventDefault(); setErr("");
    if (!form.name || !form.email || !form.phone || !form.password) return setErr("All fields are required");
    if (!/\S+@\S+\.\S+/.test(form.email)) return setErr("Enter a valid email");
    if (form.phone.length < 10) return setErr("Enter a valid phone number");
    if (form.password.length < 6) return setErr("Password must be at least 6 characters");
    if (form.password !== form.confirm) return setErr("Passwords don't match");
    setStep(2);
  };

  const submit = async (e) => {
    e.preventDefault(); setErr("");
    if (!refNum.trim()) return setErr("Enter your transaction reference");
    if (!payScreenshot) return setErr("Please upload your payment screenshot");
    setLoading(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name:form.name, email:form.email, phone:form.phone, password:form.password, referenceNumber:refNum.trim(), paymentProvider:provider||"", senderName:senderName.trim(), referralUsed:form.referral||null, paymentScreenshot:payScreenshot }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || "Registration failed"); setLoading(false); return; }
      setCreated(data.user); setStep(4);
    } catch (e) { setErr("Network error. Try again."); }
    setLoading(false);
  };

  const mins = Math.floor(timer / 60);
  const secs = timer % 60;

  return (
    <div className="su-root">
      <style>{`
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Bebas+Neue&family=Space+Mono:wght@400;700&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
.su-root{min-height:100vh;background:#0B0D10;color:#F0F0F2;font-family:'DM Sans',sans-serif;display:flex;flex-direction:column;position:relative;overflow-x:hidden}
.su-bg{position:fixed;inset:0;z-index:0;overflow:hidden}
.su-bg-orb{position:absolute;border-radius:50%;filter:blur(120px);opacity:.15;animation:orb 20s ease-in-out infinite}
.su-bg-orb:nth-child(1){width:500px;height:500px;background:#E31725;top:-20%;left:-10%;animation-delay:0s}
.su-bg-orb:nth-child(2){width:400px;height:400px;background:#0B9635;bottom:-15%;right:-10%;animation-delay:-7s}
.su-bg-orb:nth-child(3){width:300px;height:300px;background:#D4AF37;top:50%;left:50%;animation-delay:-14s}
@keyframes orb{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(40px,-30px) scale(1.1)}66%{transform:translate(-30px,20px) scale(.9)}}
.su-grid{position:fixed;inset:0;z-index:0;background-image:url(/backdrop.png);background-size:380px auto;background-repeat:repeat;opacity:.03}
.su-cnt{position:relative;z-index:1;flex:1;display:flex;align-items:center;justify-content:center;padding:32px 20px}
.su-card{width:100%;max-width:480px;position:relative}
.su-inner{background:rgba(18,20,26,.85);backdrop-filter:blur(40px);border:1px solid rgba(255,255,255,.06);border-radius:28px;padding:40px 32px;position:relative;overflow:hidden}
.su-inner::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,#E31725,#D4AF37,#0B9635,transparent)}
.su-logo{display:flex;justify-content:center;margin-bottom:28px}
.su-prog{display:flex;gap:4px;margin-bottom:28px}
.su-bar{flex:1;height:3px;border-radius:2px;background:#1E2028;transition:all .4s cubic-bezier(.4,0,.2,1)}.su-bar.on{background:linear-gradient(90deg,#E31725,#D4AF37)}
.su-step{text-align:center;margin-bottom:8px}
.su-step span{font-size:10px;font-weight:700;letter-spacing:3px;color:#333;text-transform:uppercase;background:rgba(227,23,37,.08);padding:4px 16px;border-radius:20px;border:1px solid rgba(227,23,37,.12)}
.su-h{font-size:32px;font-weight:800;font-family:'Bebas Neue',sans-serif;letter-spacing:2px;text-align:center;margin-bottom:4px}
.su-sub{font-size:14px;color:#555;text-align:center;margin-bottom:24px;line-height:1.6}
.su-fee{display:flex;align-items:center;justify-content:center;gap:12px;background:rgba(11,150,53,.06);border:1px solid rgba(11,150,53,.15);border-radius:14px;padding:14px 20px;margin-bottom:28px}
.su-fee-a{font-family:'Bebas Neue',monospace;font-size:22px;font-weight:700;color:#0B9635;letter-spacing:1px}
.su-fee-u{font-size:12px;color:#555}
.su-field{margin-bottom:16px}
.su-lbl{display:block;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#444;margin-bottom:6px}
.su-inp{width:100%;padding:14px 16px;background:rgba(11,13,16,.6);border:1px solid #1E2028;border-radius:12px;color:#F0F0F2;font-size:14px;font-family:'DM Sans';outline:none;transition:all .2s}.su-inp:focus{border-color:#E31725;box-shadow:0 0 0 3px rgba(227,23,37,.08)}.su-inp::placeholder{color:#2A2D34}
.su-pw{position:relative}.su-pw .su-inp{padding-right:56px}.su-pw-btn{position:absolute;right:14px;top:50%;transform:translateY(-50%);background:none;border:none;color:#555;cursor:pointer;font-size:12px;font-family:'DM Sans';font-weight:600}
.su-err{background:rgba(227,23,37,.06);border:1px solid rgba(227,23,37,.15);border-radius:12px;padding:12px 16px;margin-bottom:16px;font-size:13px;color:#E31725;font-weight:600;display:flex;align-items:center;gap:8px}
.su-btn{width:100%;padding:16px;border:none;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;font-family:'DM Sans';transition:all .2s;position:relative;overflow:hidden}
.su-btn:disabled{opacity:.4;cursor:not-allowed}.su-btn:active{transform:scale(.98)}
.su-btn-r{background:#E31725;color:#fff}.su-btn-r:hover:not(:disabled){box-shadow:0 8px 30px rgba(227,23,37,.3);transform:translateY(-1px)}
.su-btn-g{background:#0B9635;color:#fff}.su-btn-g:hover:not(:disabled){box-shadow:0 8px 30px rgba(11,150,53,.3);transform:translateY(-1px)}
.su-btn-o{background:transparent;color:#888;border:1px solid #1E2028}.su-btn-o:hover{border-color:#555;color:#F0F0F2}
.su-row{display:flex;gap:10px}.su-row>:first-child{flex:1}.su-row>:last-child{flex:2}
.su-foot{text-align:center;margin-top:20px;font-size:13px;color:#444}
.su-link{color:#E31725;font-weight:700;text-decoration:none}

/* PAYMENT PROVIDER CARDS */
.pv-grid{display:flex;flex-direction:column;gap:10px;margin-bottom:20px}
.pv-card{position:relative;border-radius:16px;padding:18px 20px;cursor:pointer;transition:all .3s cubic-bezier(.4,0,.2,1);border:2px solid transparent;display:flex;align-items:center;gap:16px;background:rgba(11,13,16,.5)}
.pv-card:hover{transform:translateY(-2px)}.pv-card.on{border-width:2px;transform:scale(1.02);box-shadow:0 12px 40px rgba(0,0,0,.3)}
.pv-dot{width:48px;height:48px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0}
.pv-info{flex:1}.pv-name{font-weight:700;font-size:15px}.pv-num{font-size:12px;color:#555;margin-top:2px;font-family:'Space Mono',monospace}
.pv-check{width:22px;height:22px;border-radius:50%;border:2px solid #333;display:flex;align-items:center;justify-content:center;transition:all .2s;flex-shrink:0;font-size:11px}
.pv-card.on .pv-check{border-color:currentColor}

/* PAYMENT DETAILS BOX */
.pay-box{border-radius:20px;padding:28px 24px;margin-bottom:20px;position:relative;overflow:hidden;animation:paySlide .5s cubic-bezier(.4,0,.2,1)}
@keyframes paySlide{from{opacity:0;transform:translateY(20px) scale(.95)}to{opacity:1;transform:translateY(0) scale(1)}}
.pay-box::before{content:'';position:absolute;top:0;left:-100%;width:100%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.05),transparent);animation:payShine 3s infinite}
@keyframes payShine{0%{left:-100%}100%{left:100%}}
.pay-hdr{text-align:center;margin-bottom:20px;font-size:11px;font-weight:800;letter-spacing:3px;text-transform:uppercase;opacity:.7}
.pay-row{display:flex;justify-content:space-between;align-items:center;padding:16px 0;border-bottom:1px solid rgba(255,255,255,.06)}.pay-row:last-child{border-bottom:none}
.pay-lbl{font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;opacity:.5}
.pay-val{font-family:'Space Mono',monospace;font-size:18px;font-weight:700;letter-spacing:1px;display:flex;align-items:center;gap:10px}
.pay-copy{padding:6px 14px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.05);color:#fff;font-size:11px;font-weight:700;cursor:pointer;font-family:'DM Sans';transition:all .2s;letter-spacing:.5px}
.pay-copy:hover{background:rgba(255,255,255,.12)}.pay-copy.ok{background:rgba(11,150,53,.2);border-color:rgba(11,150,53,.3);color:#0B9635}

/* TIMER */
.su-timer{display:flex;align-items:center;justify-content:center;gap:8px;background:rgba(212,175,55,.06);border:1px solid rgba(212,175,55,.12);border-radius:12px;padding:12px;margin-bottom:20px}
.su-timer-t{font-size:12px;color:#D4AF37;font-weight:600}
.su-timer-v{font-family:'Space Mono',monospace;font-size:18px;font-weight:700;color:#D4AF37;letter-spacing:2px}

/* STEPS */
.pay-steps{margin-bottom:20px}
.pay-st{display:flex;align-items:flex-start;gap:12px;padding:12px 0;border-bottom:1px solid rgba(255,255,255,.03);transition:all .2s}
.pay-st:hover{padding-left:8px}
.pay-sn{width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;flex-shrink:0;color:#0B0D10}
.pay-sc{font-size:13px;color:#666;line-height:1.6;flex:1}

/* SUCCESS */
.su-suc{background:rgba(11,150,53,.04);border:1px solid rgba(11,150,53,.12);border-radius:16px;padding:24px;margin-bottom:20px}
.su-suc-r{display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.03)}.su-suc-r:last-child{border-bottom:none}
.su-suc-l{font-size:11px;color:#444;font-weight:600;letter-spacing:1px;text-transform:uppercase}
.su-suc-v{font-size:15px;font-weight:700}

.su-warn{background:rgba(212,175,55,.04);border:1px solid rgba(212,175,55,.12);border-radius:12px;padding:14px 16px;margin-bottom:20px;font-size:12px;color:#888;line-height:1.7}
.su-pgfoot{position:relative;z-index:1;text-align:center;padding:20px;font-size:11px;color:#222;border-top:1px solid #0E1015}

@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
.fu{animation:fadeUp .4s cubic-bezier(.4,0,.2,1) both}
.fu1{animation-delay:.05s}.fu2{animation-delay:.1s}.fu3{animation-delay:.15s}.fu4{animation-delay:.2s}.fu5{animation-delay:.25s}

@media(max-width:480px){.su-inner{padding:28px 20px!important;border-radius:20px!important}.su-cnt{padding:16px 12px!important}.su-h{font-size:24px!important}.su-row{flex-direction:column!important}.su-row>*{flex:unset!important}.pay-val{font-size:15px!important}.pv-dot{width:40px!important;height:40px!important;font-size:20px!important;border-radius:10px!important}}
      `}</style>

      <div className="su-bg">
        <div className="su-bg-orb" /><div className="su-bg-orb" /><div className="su-bg-orb" />
      </div>
      <div className="su-grid" />

      <div className="su-cnt">
        <div className="su-card">
          <div className="su-inner">
            <div className="su-logo"><a href="/"><img src="/images/logo.png" alt="VB" style={{height:LOGO_H,width:"auto",objectFit:"contain"}} /></a></div>
            <div className="su-prog">{[1,2,3,4].map(i=><div key={i} className={`su-bar ${step>=i?"on":""}`} />)}</div>
            <div className="su-step"><span>STEP {step} OF 4</span></div>

            {/* ═══ STEP 1 — DETAILS ═══ */}
            {step===1&&(<div className="fu">
              <h1 className="su-h">Create Your Account</h1>
              <p className="su-sub">Sign up to access winning predictions</p>
              <div className="su-fee"><span className="su-fee-a">GH₵{FEE}</span><span className="su-fee-u">≈ ${FEE_USD} USD • Registration Fee</span></div>
              <form onSubmit={goStep2}>
                <div className="su-field fu fu1"><label className="su-lbl">Full Name</label><input className="su-inp" placeholder="e.g. Kwame Asante" value={form.name} onChange={e=>upd("name",e.target.value)} /></div>
                <div className="su-field fu fu2"><label className="su-lbl">Email Address</label><input className="su-inp" type="email" placeholder="e.g. kwame@email.com" value={form.email} onChange={e=>upd("email",e.target.value)} /></div>
                <div className="su-field fu fu3"><label className="su-lbl">Phone Number</label><input className="su-inp" type="tel" placeholder="e.g. 0241234567" value={form.phone} onChange={e=>upd("phone",e.target.value)} /></div>
                <div className="su-field fu fu4"><label className="su-lbl">Password</label><div className="su-pw"><input className="su-inp" type={showPw?"text":"password"} placeholder="Min 6 characters" value={form.password} onChange={e=>upd("password",e.target.value)} /><button type="button" className="su-pw-btn" onClick={()=>setShowPw(!showPw)}>{showPw?"Hide":"Show"}</button></div></div>
                <div className="su-field fu fu4"><label className="su-lbl">Confirm Password</label><input className="su-inp" type="password" placeholder="Re-enter password" value={form.confirm} onChange={e=>upd("confirm",e.target.value)} /></div>
                <div className="su-field fu fu5"><label className="su-lbl">Referral Code (Optional)</label><input className="su-inp" placeholder="e.g. VB-XXXX" value={form.referral} onChange={e=>upd("referral",e.target.value)} /></div>
                {err&&<div className="su-err">⚠ {err}</div>}
                <button type="submit" className="su-btn su-btn-r fu fu5">Continue to Payment</button>
              </form>
              <div className="su-foot">Already have an account? <a href="/login" className="su-link">Log In</a></div>
            </div>)}

            {/* ═══ STEP 2 — SELECT PROVIDER ═══ */}
            {step===2&&(<div className="fu">
              <h1 className="su-h">Select Payment Method</h1>
              <p className="su-sub">Choose your mobile money provider</p>
              <div className="su-fee"><span className="su-fee-a">GH₵{FEE}</span><span className="su-fee-u">≈ ${FEE_USD} USD</span></div>

              <div className="pv-grid">
                {PROVS.map((p,i)=>(
                  <div key={p.id} className={`pv-card fu fu${i+1} ${provider===p.id?"on":""}`} onClick={()=>setProvider(p.id)} style={{borderColor:provider===p.id?p.color:"transparent",background:provider===p.id?`rgba(${p.id==="mtn"?"255,195,0":p.id==="telecel"?"228,5,33":"0,86,163"},.06)`:"rgba(11,13,16,.5)"}}>
                    <div className="pv-dot" style={{background:p.bg}}>{p.icon}</div>
                    <div className="pv-info">
                      <div className="pv-name" style={{color:provider===p.id?p.color:"#F0F0F2"}}>{p.name}</div>
                      <div className="pv-num">{p.number} • {p.acct}</div>
                    </div>
                    <div className="pv-check" style={{borderColor:provider===p.id?p.color:"#333",background:provider===p.id?p.color:"transparent",color:provider===p.id?"#0B0D10":"transparent"}}>✓</div>
                  </div>
                ))}
              </div>

              {err&&<div className="su-err">⚠ {err}</div>}
              <div className="su-row">
                <button className="su-btn su-btn-o" onClick={()=>{setErr("");setStep(1)}}>Back</button>
                <button className="su-btn su-btn-g" disabled={!pv} onClick={()=>{setErr("");setStep(3)}}>Continue →</button>
              </div>
              {!pv&&<div style={{textAlign:"center",marginTop:10,fontSize:12,color:"#333"}}>Select a provider to continue</div>}
            </div>)}

            {/* ═══ STEP 3 — PAY & SUBMIT ═══ */}
            {step===3&&pv&&(<div className="fu">
              <h1 className="su-h">Complete Payment</h1>
              <p className="su-sub">Send <strong style={{color:"#0B9635"}}>GH₵{FEE}</strong> via <strong style={{color:pv.color}}>{pv.short}</strong></p>

              <div className="su-timer">
                <span className="su-timer-t">⏱ Time remaining</span>
                <span className="su-timer-v">{mins}:{secs.toString().padStart(2,"0")}</span>
              </div>

              {/* Payment details box */}
              <div className="pay-box" style={{background:`linear-gradient(135deg,${pv.dark}15,${pv.color}08)`,border:`1px solid ${pv.color}25`}}>
                <div className="pay-hdr" style={{color:pv.color}}>↓ SEND TO ↓</div>

                <div className="pay-row">
                  <div><div className="pay-lbl">Mobile Money Number</div></div>
                  <div className="pay-val" style={{color:pv.color}}>
                    <span>{pv.number}</span>
                    <button className={`pay-copy ${copied==="num"?"ok":""}`} onClick={()=>copy(pv.number,"num")}>{copied==="num"?"✓ Copied":"Copy"}</button>
                  </div>
                </div>

                <div className="pay-row">
                  <div><div className="pay-lbl">Account Name</div></div>
                  <div className="pay-val">{pv.acct}</div>
                </div>

                <div className="pay-row">
                  <div><div className="pay-lbl">Amount</div></div>
                  <div className="pay-val" style={{color:"#0B9635"}}>
                    <span>GH₵{FEE}.00</span>
                    <button className={`pay-copy ${copied==="amt"?"ok":""}`} onClick={()=>copy(String(FEE),"amt")}>{copied==="amt"?"✓ Copied":"Copy"}</button>
                  </div>
                </div>
              </div>

              {/* Steps */}
              <div className="pay-steps">
                {pv.steps.map((st,i)=>(
                  <div key={i} className={`pay-st fu fu${Math.min(i+1,5)}`}>
                    <div className="pay-sn" style={{background:pv.bg}}>{i+1}</div>
                    <div className="pay-sc">{st}</div>
                  </div>
                ))}
              </div>

              <div className="su-warn">🔒 <strong style={{color:"#D4AF37"}}>Important:</strong> After sending, you'll receive a transaction code via SMS. Enter it below along with your payment screenshot for verification.</div>

              {/* Reference form */}
              <form onSubmit={submit}>
                <div className="su-field"><label className="su-lbl">{pv.id==="mtn"?"Transaction Code":pv.id==="telecel"?"Transaction ID":"Reference Number"}</label><input className="su-inp" placeholder={pv.id==="mtn"?"e.g. 8374652910":pv.id==="telecel"?"e.g. 000012345678":"e.g. REF-123456"} value={refNum} onChange={e=>setRefNum(e.target.value)} style={{borderColor:pv.color+"30",fontFamily:"'Space Mono',monospace"}} /></div>
                <div className="su-field"><label className="su-lbl">Sender Name (as on MoMo)</label><input className="su-inp" placeholder="e.g. Abel Afriyie" value={senderName} onChange={e=>setSenderName(e.target.value)} /></div>

                <div className="su-field">
                  <label className="su-lbl">Upload Payment Screenshot *</label>
                  {!payPreview ? (
                    <label style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"28px 16px",border:"2px dashed #E3172540",borderRadius:14,cursor:"pointer",background:"rgba(227,23,37,.03)",transition:"all .2s"}}>
                      <div style={{fontSize:28,marginBottom:6}}>📤</div>
                      <div style={{fontSize:13,fontWeight:600,color:"#888"}}>Tap to upload screenshot</div>
                      <div style={{fontSize:11,color:"#444",marginTop:2}}>PNG, JPG, WEBP</div>
                      <input type="file" accept="image/*" onChange={handleScreenshot} style={{display:"none"}} />
                    </label>
                  ) : (
                    <div style={{position:"relative",borderRadius:14,overflow:"hidden",border:"2px solid #0B963530"}}>
                      <img src={payPreview} alt="Payment proof" style={{width:"100%",maxHeight:200,objectFit:"contain",background:"#0B0D10"}} />
                      <button type="button" onClick={()=>{setPayScreenshot(null);setPayPreview(null)}} style={{position:"absolute",top:8,right:8,width:28,height:28,borderRadius:"50%",background:"#E31725",border:"none",color:"#fff",fontSize:14,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
                      <div style={{padding:"8px 12px",background:"#0B963510",fontSize:12,fontWeight:600,color:"#0B9635",textAlign:"center"}}>Screenshot attached</div>
                    </div>
                  )}
                </div>

                <div style={{background:"rgba(227,23,37,.04)",border:"1px solid rgba(227,23,37,.12)",borderRadius:12,padding:"12px 14px",marginBottom:16,fontSize:12,lineHeight:1.7}}>
                  <div style={{fontWeight:700,color:"#E31725",marginBottom:2}}>WARNING</div>
                  <div style={{color:"#888"}}>Uploading a fake or manipulated payment screenshot will result in an <strong style={{color:"#E31725"}}>immediate and permanent ban</strong>. You will lose access to the website and will not be able to register again, even with different details. All screenshots are verified manually.</div>
                </div>

                {err&&<div className="su-err">⚠ {err}</div>}
                <div className="su-row">
                  <button type="button" className="su-btn su-btn-o" onClick={()=>{setErr("");setStep(2)}}>Back</button>
                  <button type="submit" className="su-btn su-btn-g" disabled={loading}>{loading?"Submitting...":"Submit Registration"}</button>
                </div>
              </form>
            </div>)}

            {/* ═══ STEP 4 — SUCCESS ═══ */}
            {step===4&&(<div className="fu" style={{textAlign:"center"}}>
              <div style={{fontSize:64,marginBottom:16,animation:"fadeUp .5s"}}>⏳</div>
              <h1 className="su-h">Registration Submitted</h1>
              <p className="su-sub">Your payment of <strong style={{color:"#0B9635"}}>GH₵{FEE}</strong> is being verified</p>

              <div className="su-suc">
                {[
                  {l:"Full Name",v:created?.name||form.name},
                  {l:"SportyBet ID",v:created?.sportyBetId||`SB-${form.phone}`,c:"#0B9635",mono:true},
                  {l:"Payment",v:`GH₵${FEE} via ${pv?.name||"MoMo"}`,c:"#0B9635"},
                  {l:"Reference",v:refNum,mono:true},
                  {l:"Status",v:"Pending Verification",c:"#D4AF37"},
                ].map(r=>(
                  <div key={r.l} className="su-suc-r">
                    <span className="su-suc-l">{r.l}</span>
                    <span className="su-suc-v" style={{color:r.c||"#F0F0F2",fontFamily:r.mono?"'Space Mono',monospace":"inherit"}}>{r.v}</span>
                  </div>
                ))}
              </div>

              <p style={{color:"#444",fontSize:13,marginBottom:24,lineHeight:1.7}}>Your payment is being verified. This usually takes <strong style={{color:"#888"}}>5–30 minutes</strong>. You'll be able to login once approved.</p>
              <a href="/login"><button className="su-btn su-btn-r">Go to Login →</button></a>
            </div>)}
          </div>
        </div>
      </div>

      <div className="su-pgfoot"><img src="/images/logo.png" alt="VB" style={{height:28,width:"auto",objectFit:"contain",opacity:.3,marginBottom:6,display:"block",margin:"0 auto 6px"}} /><div>© 2026 VirtualBet. 18+ Only. Gamble Responsibly.</div></div>
    </div>
  );
}

export default function SignupPage() {
  return <Suspense><SignupInner /></Suspense>;
}
