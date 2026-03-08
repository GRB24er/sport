"use client";
import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

const LOGO = 60;
const R = 0.077;
const fB = (v) => `GH₵${v.toLocaleString()} ($${(v * R).toFixed(2)})`;
const PKGS = [
  { id:"gold", name:"Gold", odds:"3–5", price:200, color:"#D4AF37", icon:"🥇", max:1, next:"platinum", tag:"Starter", features:["1 AI Prediction","3–5 Odds","Basic Support","SportyBet Integration"] },
  { id:"platinum", name:"Platinum", odds:"5–15", price:500, color:"#94A7BD", icon:"🥈", max:2, next:"diamond", tag:"Pro", features:["2 AI Predictions","5–15 Odds","Priority Support","SportyBet Integration","Weekly Tips"] },
  { id:"diamond", name:"Diamond", odds:"15–50", price:1000, color:"#7DD3E8", icon:"💎", max:4, next:null, tag:"Elite", features:["4 AI Predictions","15–50 Odds","24/7 Support","SportyBet Integration","Daily Accumulators","Mega Odds"] },
];
const getPkg = id => PKGS.find(p => p.id === id) || PKGS[0];

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState("overview");
  const [sidebar, setSidebar] = useState(false);
  const [preds, setPreds] = useState([]);
  const [refs, setRefs] = useState({ referrals: [], stats: { total: 0, approved: 0, bonusGHS: 0 } });
  const [predsUsed, setPredsUsed] = useState(0);
  const [expanded, setExpanded] = useState(null);
  const [preview, setPreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [upgradeModal, setUpgradeModal] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (session?.user?.role === "admin") router.push("/admin");
  }, [status, session, router]);

  useEffect(() => {
    if (session?.user?.id && session.user.id !== "admin") {
      setPredsUsed(session.user.predictionsUsed || 0);
      fetch("/api/predictions?limit=50").then(r => r.json()).then(d => setPreds(d.predictions || [])).catch(() => {});
      fetch("/api/referrals").then(r => r.json()).then(d => setRefs(d)).catch(() => {});
    }
  }, [session]);

  if (status === "loading" || !session) return <div style={{ minHeight: "100vh", background: "#0B0D10", display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ width: 40, height: 40, border: "3px solid #1E2028", borderTopColor: "#E31725", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>;

  const user = session.user;
  const pkg = getPkg(user.package);
  const nextPkg = pkg.next ? getPkg(pkg.next) : null;
  const locked = predsUsed >= pkg.max;
  const left = Math.max(0, pkg.max - predsUsed);

  const handleFile = (e) => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = ev => setPreview(ev.target.result); r.readAsDataURL(f); };

  const runAI = async () => {
    setAnalyzing(true);
    try {
      const res = await fetch("/api/predictions/ai", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: preview, imageName: "screenshot.png" }),
      });
      const data = await res.json();
      if (res.status === 429) { setUpgradeModal(true); setAnalyzing(false); setPreview(null); return; }
      if (!res.ok) { alert(data.error || "Failed"); setAnalyzing(false); return; }
      setPredsUsed(data.predictionsUsed);
      setPreds(p => [data.prediction, ...p]);
      setTab("predictions");
    } catch (e) { alert("Network error"); }
    setAnalyzing(false); setPreview(null);
  };

  const TABS = [
    { id: "overview", icon: "📊", label: "Overview" },
    { id: "predict", icon: "🤖", label: "AI Predict" },
    { id: "predictions", icon: "📋", label: "Predictions" },
    { id: "referrals", icon: "🔗", label: "Referrals" },
    { id: "packages", icon: "📦", label: "Packages" },
    { id: "sportybet", icon: "⚽", label: "SportyBet" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0B0D10", color: "#F0F0F2", fontFamily: "'DM Sans',sans-serif" }}>
      <style>{`
        @keyframes slideIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulseDot{0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes glow{0%,100%{box-shadow:0 0 12px rgba(227,23,37,.15)}50%{box-shadow:0 0 24px rgba(227,23,37,.3)}}
        @keyframes lockShake{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}
        @keyframes scaleIn{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}
        .as{animation:slideIn .5s cubic-bezier(.16,1,.3,1) both}
        .d1{animation-delay:.1s}.d2{animation-delay:.2s}.d3{animation-delay:.3s}.d4{animation-delay:.4s}.d5{animation-delay:.5s}
        .dbg{position:fixed;inset:0;z-index:0;background-image:url(/backdrop.png);background-size:380px auto;background-repeat:repeat;opacity:.02;pointer-events:none}
        @media(max-width:768px){
          .dside{position:fixed!important;left:-260px;top:53px;bottom:0;z-index:85;transition:left .3s!important;width:240px!important}
          .dside.open{left:0!important}
          .dover{display:none;position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:80}
          .dover.show{display:block!important}
          .dham{display:block!important}
          .dmain{padding:20px 16px!important}
          .dsgrid{grid-template-columns:1fr 1fr!important}
          .dpicks{grid-template-columns:1fr!important}
          .dpkgs{grid-template-columns:1fr!important}
          .drgrid{grid-template-columns:1fr!important}
          .duname{display:none!important}
          .dhdr{padding:10px 16px!important}
        }
        @media(max-width:480px){.dsgrid{grid-template-columns:1fr!important}.dmain{padding:16px 12px!important}}
      `}</style>

      <div className="dbg" />

      {/* HEADER */}
      <header className="dhdr" style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 24px",borderBottom:"1px solid #151820",background:"#0B0D10F0",backdropFilter:"blur(20px)",position:"sticky",top:0,zIndex:90 }}>
        <div style={{ display:"flex",alignItems:"center",gap:12 }}>
          <button className="dham" style={{ display:"none",background:"none",border:"none",color:"#F0F0F2",fontSize:22,cursor:"pointer" }} onClick={() => setSidebar(!sidebar)}>☰</button>
          <a href="/"><img src="/images/logo.png" alt="VB" style={{ height:LOGO, width:"auto",objectFit:"contain" }} /></a>
        </div>
        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
          <span style={{ fontSize:10,fontWeight:700,letterSpacing:1,padding:"4px 12px",borderRadius:8,background:pkg.color+"18",color:pkg.color }}>{pkg.icon} {pkg.name}</span>
          <div style={{ display:"flex",alignItems:"center",gap:8,background:"#12141A",border:"1px solid #151820",borderRadius:10,padding:"6px 14px 6px 8px" }}>
            <div style={{ width:28,height:28,borderRadius:8,background:"#E31725",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:11,color:"#fff" }}>{user.name?.split(" ").map(w=>w[0]).join("")}</div>
            <span className="duname" style={{ fontSize:13,fontWeight:600,color:"#888" }}>{user.name}</span>
          </div>
          <button onClick={() => signOut({ callbackUrl: "/" })} style={{ background:"none",border:"1px solid #1E2028",color:"#555",padding:"6px 14px",borderRadius:8,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans'" }}>Logout</button>
        </div>
      </header>

      <div style={{ display:"flex",position:"relative",zIndex:1,minHeight:"calc(100vh - 53px)" }}>
        <div className={`dover ${sidebar?"show":""}`} onClick={() => setSidebar(false)} />

        {/* SIDEBAR */}
        <aside className={`dside ${sidebar?"open":""}`} style={{ width:220,background:"#0E1015",borderRight:"1px solid #151820",padding:"16px 0",flexShrink:0,display:"flex",flexDirection:"column" }}>
          <nav style={{ flex:1 }}>
            {TABS.map(t => (
              <div key={t.id} onClick={() => {setTab(t.id);setSidebar(false)}} style={{ display:"flex",alignItems:"center",gap:10,padding:"12px 20px",cursor:"pointer",borderLeft: tab===t.id?"3px solid #E31725":"3px solid transparent",background:tab===t.id?"#E3172508":"transparent",color:tab===t.id?"#F0F0F2":"#555",transition:"all .15s",fontSize:13,fontWeight:500 }}>
                <span style={{ fontSize:16,width:22,textAlign:"center" }}>{t.icon}</span><span>{t.label}</span>
                {t.id==="predict" && <span style={{ marginLeft:"auto",fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:10,background:locked?"#E3172520":"#0B963520",color:locked?"#E31725":"#0B9635" }}>{locked?"🔒":left}</span>}
              </div>
            ))}
          </nav>
          <div style={{ padding:"14px 20px",borderTop:"1px solid #151820" }}>
            <div style={{ fontSize:10,color:"#444",fontWeight:700,letterSpacing:1,marginBottom:6 }}>PREDICTIONS</div>
            <div style={{ height:6,background:"#151820",borderRadius:3,overflow:"hidden",marginBottom:6 }}><div style={{ width:`${Math.min((predsUsed/pkg.max)*100,100)}%`,height:"100%",background:locked?"#E31725":"#0B9635",borderRadius:3,transition:"width .5s" }} /></div>
            <div style={{ fontSize:11,color:locked?"#E31725":"#0B9635",fontWeight:700 }}>{predsUsed}/{pkg.max} {locked?"• Upgrade":"used"}</div>
          </div>
        </aside>

        {/* CONTENT */}
        <main className="dmain" style={{ flex:1,padding:"28px 32px",overflowY:"auto",maxHeight:"calc(100vh - 53px)" }}>

          {/* OVERVIEW */}
          {tab === "overview" && (<div className="as">
            <h1 style={{ fontFamily:"'Bebas Neue'",fontSize:28,letterSpacing:2,marginBottom:4 }}>Welcome, {user.name?.split(" ")[0]}</h1>
            <p style={{ fontSize:14,color:"#555",marginBottom:20 }}>Your prediction dashboard</p>

            <div className="dsgrid" style={{ display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20 }}>
              {[{l:"Package",v:`${pkg.icon} ${pkg.name}`,c:pkg.color,s:`${pkg.odds} Odds`},{l:"Predictions Left",v:locked?"0":String(left),c:locked?"#E31725":"#0B9635",s:locked?"Upgrade to continue":`${predsUsed} of ${pkg.max} used`},{l:"Referrals",v:String(refs.stats?.approved||0),c:"#0B9635",s:`Bonus: ${fB(refs.stats?.bonusGHS||0)}`},{l:"SportyBet",v:user.sportyBetId||"—",c:"#0B9635",s:"Active"}].map((s,i)=>(
                <div key={s.l} className={`as d${i+1}`} style={{ background:"#12141A",border:"1px solid #151820",borderRadius:14,padding:20 }}>
                  <div style={{ fontSize:10,fontWeight:700,letterSpacing:2,color:"#444",textTransform:"uppercase",marginBottom:6 }}>{s.l}</div>
                  <div style={{ fontFamily:"'Bebas Neue'",fontSize:s.l==="SportyBet"?18:26,letterSpacing:1,color:s.c }}>{s.v}</div>
                  <div style={{ fontSize:11,color:"#444",marginTop:2 }}>{s.s}</div>
                </div>
              ))}
            </div>

            {locked ? (
              <div className="as d3" style={{ background:"#E3172505",border:"1px solid #E3172520",borderRadius:14,padding:22,marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:14 }}>
                <div><div style={{ fontSize:11,color:"#E31725",fontWeight:700,letterSpacing:2,marginBottom:4 }}>🔒 PREDICTIONS LOCKED</div><div style={{ fontWeight:700,fontSize:15 }}>You've used all {pkg.max} prediction{pkg.max>1?"s":""}</div><div style={{ fontSize:13,color:"#555",marginTop:4 }}>{nextPkg?`Upgrade to ${nextPkg.name}`:"Renew Diamond"}</div></div>
                <button onClick={() => setUpgradeModal(true)} style={{ background:"#E31725",color:"#fff",border:"none",padding:"12px 24px",borderRadius:10,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans'",animation:"glow 3s infinite" }}>{nextPkg?`Upgrade to ${nextPkg.name}`:"Renew Diamond"}</button>
              </div>
            ) : (
              <div className="as d3" style={{ background:"#0B963505",border:"1px solid #0B963520",borderRadius:14,padding:22,marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:14 }}>
                <div><div style={{ fontSize:11,color:"#0B9635",fontWeight:700,letterSpacing:2,marginBottom:4 }}>🤖 AI PREDICTION ENGINE</div><div style={{ fontWeight:700,fontSize:15 }}>Upload screenshot for instant predictions</div><div style={{ fontSize:13,color:"#555",marginTop:4 }}><strong style={{ color:"#0B9635" }}>{left}</strong> prediction{left!==1?"s":""} remaining</div></div>
                <button onClick={() => setTab("predict")} style={{ background:"#0B9635",color:"#fff",border:"none",padding:"12px 24px",borderRadius:10,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans'" }}>Upload & Predict</button>
              </div>
            )}

            <div className="as d4" style={{ background:"#12141A",border:"1px solid #151820",borderRadius:14,padding:22,marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12 }}>
              <div><div style={{ fontSize:10,color:"#444",fontWeight:700,letterSpacing:2,marginBottom:4 }}>REFERRAL CODE</div><div style={{ fontFamily:"'Bebas Neue'",fontSize:26,letterSpacing:3 }}>{user.referralCode||"—"}</div><div style={{ fontSize:12,color:"#444",marginTop:2 }}>Earn {fB(10)} per referral</div></div>
              <button onClick={() => navigator.clipboard?.writeText(user.referralCode||"")} style={{ background:"#151820",color:"#666",border:"none",padding:"8px 16px",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans'" }}>📋 Copy</button>
            </div>

            {preds.length > 0 && (<div className="as d5"><div style={{ fontSize:10,fontWeight:700,letterSpacing:2,color:"#444",marginBottom:10 }}>LATEST PREDICTIONS</div>
              {preds.slice(0,2).map(p => (<div key={p._id||p.id} style={{ background:"#12141A",border:"1px solid #151820",borderRadius:14,padding:"14px 18px",marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer" }} onClick={() => setTab("predictions")}>
                <div><span style={{ fontSize:10,fontWeight:700,padding:"3px 10px",borderRadius:6,background:p.type==="ai"?"#0B963518":"#D4AF3718",color:p.type==="ai"?"#0B9635":"#D4AF37" }}>{p.type==="ai"?"🤖 AI":"👨‍💼 Admin"}</span><div style={{ fontWeight:700,fontSize:14,marginTop:4 }}>{p.match}</div></div>
                <div style={{ fontFamily:"'Bebas Neue'",fontSize:22,color:"#0B9635" }}>{p.totalOdd}x</div>
              </div>))}
            </div>)}
          </div>)}

          {/* PREDICT */}
          {tab === "predict" && (<div className="as">
            <h1 style={{ fontFamily:"'Bebas Neue'",fontSize:28,letterSpacing:2,marginBottom:4 }}>AI Prediction Engine</h1>
            <p style={{ fontSize:14,color:"#555",marginBottom:24 }}>Upload your SportyBet screenshot</p>

            {locked ? (
              <div style={{ textAlign:"center",padding:48 }}>
                <div style={{ width:120,height:120,borderRadius:"50%",border:"3px solid #E3172530",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 20px",animation:"glow 3s infinite" }}><span style={{ fontSize:64,animation:"lockShake .6s ease" }}>🔒</span></div>
                <div style={{ fontFamily:"'Bebas Neue'",fontSize:28,letterSpacing:2,marginBottom:6 }}>Predictions Locked</div>
                <p style={{ color:"#555",fontSize:14,marginBottom:24,maxWidth:360,margin:"0 auto 24px",lineHeight:1.6 }}>You've used all <strong>{pkg.max}</strong> prediction{pkg.max>1?"s":""} on <strong style={{ color:pkg.color }}>{pkg.name}</strong>.{nextPkg?` Upgrade to ${nextPkg.name} for ${nextPkg.max} predictions.`:` Renew to continue.`}</p>
                <button onClick={() => setUpgradeModal(true)} style={{ background:nextPkg?.color||pkg.color,color:nextPkg?.id==="diamond"?"#000":"#fff",border:"none",padding:"16px 40px",borderRadius:12,fontSize:16,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans'",animation:"glow 3s infinite" }}>{nextPkg?`🚀 Upgrade to ${nextPkg.name} — ${fB(nextPkg.price)}`:`♻️ Renew — ${fB(pkg.price)}`}</button>
              </div>
            ) : (<>
              <div className="dsgrid" style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:20 }}>
                <div style={{ background:"#12141A",border:"1px solid #151820",borderRadius:14,padding:18 }}><div style={{ fontSize:10,fontWeight:700,letterSpacing:2,color:"#444",marginBottom:6 }}>REMAINING</div><div style={{ fontFamily:"'Bebas Neue'",fontSize:26,color:"#0B9635" }}>{left}/{pkg.max}</div></div>
                <div style={{ background:"#12141A",border:"1px solid #151820",borderRadius:14,padding:18 }}><div style={{ fontSize:10,fontWeight:700,letterSpacing:2,color:"#444",marginBottom:6 }}>PACKAGE</div><div style={{ fontFamily:"'Bebas Neue'",fontSize:20,color:pkg.color }}>{pkg.icon} {pkg.name}</div></div>
                <div style={{ background:"#12141A",border:"1px solid #151820",borderRadius:14,padding:18 }}><div style={{ fontSize:10,fontWeight:700,letterSpacing:2,color:"#444",marginBottom:6 }}>ODDS RANGE</div><div style={{ fontFamily:"'Bebas Neue'",fontSize:20 }}>{pkg.odds} Odds</div></div>
              </div>

              <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display:"none" }} />

              {!preview && !analyzing && (
                <div onClick={() => fileRef.current?.click()} style={{ border:"2px dashed #1E2028",borderRadius:18,padding:"52px 24px",textAlign:"center",cursor:"pointer",transition:"all .2s" }}>
                  <div style={{ fontSize:48,marginBottom:8 }}>📸</div>
                  <div style={{ fontWeight:700,fontSize:16,marginBottom:4 }}>Upload SportyBet Screenshot</div>
                  <div style={{ color:"#444",fontSize:13 }}>Tap to select from your phone</div>
                </div>
              )}

              {preview && !analyzing && (
                <div style={{ background:"#12141A",border:"1px solid #0B963520",borderRadius:14,padding:24,textAlign:"center",animation:"scaleIn .4s cubic-bezier(.16,1,.3,1)" }}>
                  <img src={preview} style={{ maxWidth:"100%",maxHeight:260,borderRadius:12,border:"1px solid #151820",marginBottom:16 }} />
                  <div style={{ fontWeight:700,marginBottom:12 }}>Screenshot Ready</div>
                  <div style={{ display:"flex",gap:10,justifyContent:"center" }}>
                    <button onClick={() => setPreview(null)} style={{ background:"transparent",color:"#F0F0F2",border:"1px solid #2A2D34",padding:"12px 24px",borderRadius:10,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans'" }}>Cancel</button>
                    <button onClick={runAI} style={{ background:"#0B9635",color:"#fff",border:"none",padding:"12px 24px",borderRadius:10,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans'" }}>🤖 Analyze</button>
                  </div>
                </div>
              )}

              {analyzing && (
                <div style={{ background:"#12141A",border:"1px solid #0B963520",borderRadius:14,padding:44,textAlign:"center",animation:"scaleIn .4s" }}>
                  <div style={{ width:48,height:48,border:"3px solid #151820",borderTopColor:"#0B9635",borderRadius:"50%",animation:"spin .8s linear infinite",margin:"0 auto 16px" }} />
                  <div style={{ fontWeight:700,fontSize:16,color:"#0B9635",marginBottom:4 }}>AI Analyzing...</div>
                  <div style={{ color:"#444",fontSize:13,marginBottom:20 }}>Processing data & calculating odds</div>
                  <div style={{ display:"flex",gap:14,justifyContent:"center",flexWrap:"wrap" }}>
                    {["Reading data","Analyzing teams","Calculating odds","Generating picks"].map((s,i) => (
                      <div key={s} style={{ display:"flex",alignItems:"center",gap:6,animation:`fadeIn .4s ${i*.4}s both` }}><div style={{ width:6,height:6,borderRadius:"50%",background:"#0B9635",animation:"pulseDot 1.2s infinite" }} /><span style={{ fontSize:11,color:"#444" }}>{s}</span></div>
                    ))}
                  </div>
                </div>
              )}
            </>)}
          </div>)}

          {/* PREDICTIONS */}
          {tab === "predictions" && (<div className="as">
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:10 }}>
              <h1 style={{ fontFamily:"'Bebas Neue'",fontSize:28,letterSpacing:2 }}>My Predictions ({preds.length})</h1>
              <button onClick={() => setTab("predict")} disabled={locked} style={{ background:locked?"#333":"#E31725",color:"#fff",border:"none",padding:"8px 16px",borderRadius:8,fontSize:12,fontWeight:700,cursor:locked?"not-allowed":"pointer",fontFamily:"'DM Sans'",opacity:locked?.5:1 }}>{locked?"🔒 Locked":"+ New"}</button>
            </div>
            {preds.length === 0 ? <div style={{ textAlign:"center",padding:48,color:"#444" }}><div style={{ fontSize:48,marginBottom:8 }}>🤖</div><div style={{ fontWeight:700 }}>No predictions yet</div></div> :
            preds.map((p, idx) => (
              <div key={p._id||idx} className={`as d${Math.min(idx+1,5)}`} style={{ background:"#12141A",border:`1px solid ${p.type==="ai"?"#0B963515":"#D4AF3715"}`,borderRadius:14,marginBottom:12,overflow:"hidden" }}>
                <div style={{ padding:"14px 18px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",gap:10 }} onClick={() => setExpanded(expanded===(p._id||idx)?null:(p._id||idx))}>
                  <div><span style={{ fontSize:10,fontWeight:700,padding:"3px 10px",borderRadius:6,background:p.type==="ai"?"#0B963518":"#D4AF3718",color:p.type==="ai"?"#0B9635":"#D4AF37" }}>{p.type==="ai"?"🤖 AI":"👨‍💼 Admin"}</span><div style={{ fontWeight:700,fontSize:14,marginTop:4 }}>{p.match}</div></div>
                  <div style={{ textAlign:"right" }}><div style={{ fontFamily:"'Bebas Neue'",fontSize:22,color:"#0B9635" }}>{p.totalOdd}x</div><div style={{ fontSize:10,color:"#444" }}>{p.confidence}%</div></div>
                </div>
                {expanded === (p._id||idx) && (
                  <div style={{ padding:"0 18px 18px",borderTop:"1px solid #151820",animation:"fadeIn .3s" }}>
                    <div style={{ background:"#0B0D10",borderRadius:10,padding:14,margin:"14px 0",fontSize:13,color:"#666",lineHeight:1.7 }}>{p.analysis}</div>
                    <div className="dpicks" style={{ display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10 }}>
                      {p.predictions?.map((pk,i) => (
                        <div key={i} style={{ background:"#0B0D10",border:"1px solid #151820",borderRadius:10,padding:14 }}>
                          <div style={{ fontSize:10,color:"#444",fontWeight:700,letterSpacing:1,marginBottom:4 }}>{pk.market}</div>
                          <div style={{ fontSize:16,fontWeight:800,marginBottom:4 }}>{pk.pick}</div>
                          <div style={{ display:"flex",justifyContent:"space-between" }}><span style={{ color:"#0B9635",fontWeight:700 }}>{pk.odd}x</span><span style={{ fontSize:10,color:"#444" }}>{pk.confidence}%</span></div>
                        </div>
                      ))}
                    </div>
                    {p.adminNote && <div style={{ background:"#D4AF3708",border:"1px solid #D4AF3718",borderRadius:8,padding:"8px 12px",marginTop:10,fontSize:12,color:"#D4AF37" }}>💡 {p.adminNote}</div>}
                  </div>
                )}
              </div>
            ))}
          </div>)}

          {/* REFERRALS */}
          {tab === "referrals" && (<div className="as">
            <h1 style={{ fontFamily:"'Bebas Neue'",fontSize:28,letterSpacing:2,marginBottom:4 }}>Referrals</h1>
            <p style={{ fontSize:14,color:"#555",marginBottom:20 }}>Earn <strong style={{ color:"#0B9635" }}>{fB(10)}</strong> per approved signup</p>
            <div style={{ background:"#12141A",border:"1px solid #0B963520",borderRadius:14,padding:22,marginBottom:16 }}>
              <div className="drgrid" style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,textAlign:"center" }}>
                <div><div style={{ fontFamily:"'Bebas Neue'",fontSize:28 }}>{refs.stats?.total||0}</div><div style={{ fontSize:11,color:"#444" }}>Total</div></div>
                <div><div style={{ fontFamily:"'Bebas Neue'",fontSize:28,color:"#0B9635" }}>{refs.stats?.approved||0}</div><div style={{ fontSize:11,color:"#444" }}>Approved</div></div>
                <div><div style={{ fontFamily:"'Bebas Neue'",fontSize:28,color:"#0B9635" }}>{fB(refs.stats?.bonusGHS||0)}</div><div style={{ fontSize:11,color:"#444" }}>Bonus</div></div>
              </div>
            </div>
            <div style={{ background:"#12141A",border:"1px solid #151820",borderRadius:14,padding:22,marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12 }}>
              <div><div style={{ fontSize:10,color:"#444",fontWeight:700,letterSpacing:2,marginBottom:4 }}>YOUR CODE</div><div style={{ fontFamily:"'Bebas Neue'",fontSize:28,letterSpacing:3 }}>{user.referralCode}</div></div>
              <button onClick={() => navigator.clipboard?.writeText(user.referralCode||"")} style={{ background:"#151820",color:"#666",border:"none",padding:"8px 16px",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans'" }}>📋 Copy</button>
            </div>
            <div style={{ background:"#12141A",border:"1px solid #151820",borderRadius:14,padding:22 }}>
              {(refs.referrals||[]).length === 0 ? <div style={{ textAlign:"center",padding:28,color:"#444" }}>No referrals yet</div> :
              (refs.referrals||[]).map((r,i) => (
                <div key={i} style={{ display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:i<refs.referrals.length-1?"1px solid #151820":"none" }}>
                  <div><div style={{ fontWeight:700,fontSize:14 }}>{r.name}</div><div style={{ fontSize:12,color:"#444" }}>{r.phone}</div></div>
                  <span style={{ fontSize:10,fontWeight:700,padding:"3px 10px",borderRadius:10,background:r.status==="approved"?"#0B963518":"#D4AF3718",color:r.status==="approved"?"#0B9635":"#D4AF37" }}>{r.status}</span>
                </div>
              ))}
            </div>
          </div>)}

          {/* PACKAGES */}
          {tab === "packages" && (<div className="as">
            <h1 style={{ fontFamily:"'Bebas Neue'",fontSize:28,letterSpacing:2,marginBottom:4 }}>Packages</h1>
            <p style={{ fontSize:14,color:"#555",marginBottom:24 }}>Your plan and upgrade options</p>
            <div className="dpkgs" style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14 }}>
              {PKGS.map((p,i) => { const cur = user.package === p.id; return (
                <div key={p.id} className={`as d${i+1}`} style={{ background:"#12141A",borderRadius:16,padding:24,border:`${cur?"2px":"1px"} solid ${cur?p.color+"60":"#151820"}`,position:"relative",overflow:"hidden",transition:"all .2s" }}>
                  {p.id==="diamond" && <div style={{ position:"absolute",top:0,left:0,right:0,height:3,background:"#E31725" }} />}
                  {cur && <div style={{ position:"absolute",top:12,right:12,fontSize:9,fontWeight:700,padding:"3px 10px",borderRadius:4,background:"#0B963518",color:"#0B9635",letterSpacing:1 }}>CURRENT</div>}
                  <div style={{ fontSize:32,marginBottom:4 }}>{p.icon}</div>
                  <h3 style={{ fontFamily:"'Bebas Neue'",fontSize:26,letterSpacing:2,color:p.color,marginBottom:2 }}>{p.name}</h3>
                  <div style={{ color:"#444",fontSize:12,marginBottom:4 }}>{p.tag} • {p.odds} Odds</div>
                  <div style={{ fontFamily:"'Bebas Neue'",fontSize:14,color:"#888",marginBottom:14 }}>{p.max} prediction{p.max>1?"s":""}</div>
                  <div style={{ fontFamily:"'Bebas Neue'",fontSize:32,letterSpacing:1,marginBottom:2 }}>GH₵{p.price.toLocaleString()}</div>
                  <div style={{ color:"#333",fontSize:12,marginBottom:18 }}>≈ ${(p.price*R).toFixed(2)}</div>
                  {p.features.map(f => <div key={f} style={{ display:"flex",alignItems:"center",gap:8,marginBottom:6,fontSize:13,color:"#666" }}><span style={{ color:"#0B9635" }}>✓</span>{f}</div>)}
                  <button disabled={cur} onClick={() => setUpgradeModal(true)} style={{ width:"100%",marginTop:16,padding:"14px",border:cur?"1px solid #2A2D34":"none",borderRadius:10,background:cur?"transparent":"#E31725",color:cur?"#F0F0F2":"#fff",fontSize:14,fontWeight:700,cursor:cur?"not-allowed":"pointer",fontFamily:"'DM Sans'",opacity:cur?.5:1 }}>{cur?"Current Plan":"Upgrade"}</button>
                </div>
              );})}
            </div>
          </div>)}

          {/* SPORTYBET */}
          {tab === "sportybet" && (<div className="as">
            <h1 style={{ fontFamily:"'Bebas Neue'",fontSize:28,letterSpacing:2,marginBottom:24 }}>SportyBet Integration</h1>
            <div style={{ background:"#12141A",border:"1px solid #0B963520",borderRadius:14,padding:22,maxWidth:440 }}>
              <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:20 }}>
                <div style={{ width:48,height:48,background:"#0B963512",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24 }}>⚽</div>
                <div><div style={{ fontWeight:800,fontSize:16 }}>SportyBet Account</div><div style={{ color:"#0B9635",fontSize:13,fontWeight:600 }}>Connected</div></div>
              </div>
              {[{l:"ID",v:user.sportyBetId,c:"#0B9635"},{l:"PHONE",v:user.phone},{l:"EMAIL",v:user.email||"—"},{l:"PACKAGE",v:`${pkg.icon} ${pkg.name} — ${pkg.odds} Odds`,c:pkg.color},{l:"PREDICTIONS",v:`${predsUsed}/${pkg.max} used`,c:locked?"#E31725":"#0B9635"}].map(r=>(
                <div key={r.l} style={{ marginBottom:16 }}><div style={{ fontSize:10,color:"#444",fontWeight:700,letterSpacing:2,marginBottom:3 }}>{r.l}</div><div style={{ fontSize:16,fontWeight:700,color:r.c||"#F0F0F2" }}>{r.v}</div></div>
              ))}
            </div>
          </div>)}
        </main>
      </div>

      {/* UPGRADE MODAL */}
      {upgradeModal && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,.75)",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:20,animation:"fadeIn .2s" }} onClick={() => setUpgradeModal(false)}>
          <div style={{ background:"#12141A",border:"1px solid #1E2028",borderRadius:20,padding:36,maxWidth:420,width:"100%",animation:"scaleIn .3s cubic-bezier(.16,1,.3,1)",position:"relative" }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setUpgradeModal(false)} style={{ position:"absolute",top:16,right:16,background:"none",border:"none",color:"#555",fontSize:20,cursor:"pointer" }}>✕</button>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontSize:48,marginBottom:12 }}>{nextPkg?.icon||pkg.icon}</div>
              <div style={{ fontFamily:"'Bebas Neue'",fontSize:28,letterSpacing:2,marginBottom:4 }}>{nextPkg?`Upgrade to ${nextPkg.name}`:"Renew Diamond"}</div>
              <div style={{ color:"#444",fontSize:14,marginBottom:20 }}>{nextPkg?`${nextPkg.max} predictions • ${nextPkg.odds} Odds`:`${pkg.max} more predictions`}</div>
              <div style={{ background:"#0B0D10",borderRadius:12,padding:18,marginBottom:20,border:"1px solid #151820",textAlign:"left" }}>
                {[{l:"Package",v:`${(nextPkg||pkg).icon} ${(nextPkg||pkg).name}`,c:(nextPkg||pkg).color},{l:"Predictions",v:String((nextPkg||pkg).max)},{l:"Total",v:fB((nextPkg||pkg).price),c:"#0B9635"}].map((r,i)=>(
                  <div key={r.l}>{i>0&&<div style={{height:1,background:"#151820",margin:"10px 0"}} />}<div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:"#444"}}>{r.l}</span><span style={{fontWeight:700,color:r.c||"#F0F0F2"}}>{r.v}</span></div></div>
                ))}
              </div>
              <div style={{ fontSize:12,color:"#444",marginBottom:16,lineHeight:1.6 }}>Contact admin via WhatsApp to complete upgrade.</div>
              <a href="https://wa.me/YOUR_NUMBER_HERE" target="_blank" rel="noopener noreferrer"><button style={{ width:"100%",padding:16,background:"#0B9635",color:"#fff",border:"none",borderRadius:10,fontSize:16,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans'" }}>💬 Contact Admin</button></a>
              <button onClick={() => setUpgradeModal(false)} style={{ width:"100%",marginTop:10,padding:14,background:"transparent",color:"#F0F0F2",border:"1px solid #2A2D34",borderRadius:10,fontSize:14,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans'" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
