"use client"
import { useState, useEffect } from "react";

// ╔══════════════════════════════════════════════════════╗
// ║  LOGO SIZE — Change these to resize your logo       ║
// ╚══════════════════════════════════════════════════════╝
const HEADER_LOGO_HEIGHT = 100;
const FOOTER_LOGO_HEIGHT = 140;

const WINS = [
  { teams: "NAP vs ARS / INT vs MUN", stake: "300", won: "1,355.95" },
  { teams: "HDH vs SCF / POR vs JUV", stake: "130", won: "848.11" },
  { teams: "TOT vs ARS / LIV vs MUN", stake: "200", won: "1,028.79" },
  { teams: "ARS vs MCI / INT vs FCB / PSG vs BMU", stake: "400", won: "1,052.98" },
  { teams: "BMU vs VCF / PSG vs CHE", stake: "200", won: "670.78" },
  { teams: "Multiple — 3 Legs", stake: "500", won: "3,045.17" },
];

export default function App() {
  const [show, setShow] = useState(false);
  useEffect(() => { setTimeout(() => setShow(true), 100); }, []);

  return (
    <div className="vb-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Bebas+Neue&display=swap');
        *{margin:0;padding:0;box-sizing:border-box}
        body{background:#0F1114;overflow-x:hidden;scroll-behavior:smooth}
        a{text-decoration:none;color:inherit}

        .vb-root{min-height:100vh;background:#0F1114;color:#F0F0F2;font-family:'DM Sans',sans-serif;position:relative;overflow-x:hidden}

        /* ── Animations ── */
        @keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
        @keyframes softPulse{0%,100%{opacity:0.7}50%{opacity:1}}

        /* ── Buttons ── */
        .btn-p{background:#0B9635;color:#fff;border:none;border-radius:8px;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;letter-spacing:0.5px;transition:all 0.2s;padding:10px 24px;font-size:13px}
        .btn-p:hover{background:#087a2a;transform:translateY(-1px);box-shadow:0 8px 24px rgba(11,150,53,0.3)}
        .btn-o{background:transparent;color:#F0F0F2;border:1px solid #3A3D44;border-radius:8px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all 0.2s;padding:10px 24px;font-size:13px}
        .btn-o:hover{border-color:#F0F0F2}

        /* ── Watermark ── */
        .vb-watermark{position:fixed;inset:0;z-index:0;background-image:url(/backdrop.png);background-size:380px auto;background-repeat:repeat;background-position:center top;opacity:0.03;pointer-events:none}
        .vb-watermark-fade{position:fixed;inset:0;z-index:0;background:linear-gradient(180deg,#0F1114 0%,transparent 20%,transparent 80%,#0F1114 100%);pointer-events:none}

        /* ── Header ── */
        .vb-header{border-bottom:1px solid #1E2028;position:sticky;top:0;z-index:100;background:#0F1114E8;backdrop-filter:blur(20px)}
        .vb-header-inner{max-width:1200px;margin:0 auto;display:flex;justify-content:space-between;align-items:center;padding:14px 32px}
        .vb-nav-links{display:flex;gap:28px;align-items:center}
        .vb-nav-link{font-size:13px;color:#666;font-weight:500;cursor:pointer;transition:color 0.2s;letter-spacing:0.3px;background:none;border:none;font-family:'DM Sans',sans-serif;text-decoration:none}
        .vb-nav-link:hover{color:#F0F0F2}
        .vb-header-btns{display:flex;gap:8px;align-items:center}

        /* ── Hero ── */
        .vb-hero-flex{max-width:1100px;margin:0 auto;padding:80px 32px 60px;display:flex;align-items:center;gap:60px;flex-wrap:wrap}
        .vb-hero-text{flex:1;min-width:340px}
        .vb-hero-h1{font-family:'Bebas Neue',sans-serif;font-size:clamp(48px,8vw,80px);line-height:0.95;letter-spacing:2px;margin:0 0 20px}
        .vb-hero-p{font-size:16px;color:#888;line-height:1.75;max-width:480px;margin:0 0 28px;font-weight:400}
        .vb-hero-btns{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:36px}
        .vb-hero-btns .btn-p,.vb-hero-btns .btn-o{padding:16px 40px;font-size:16px}
        .vb-hero-stats{display:flex;gap:32px}
        .vb-hero-stat-val{font-family:'Bebas Neue',sans-serif;font-size:26px;letter-spacing:1px}
        .vb-hero-stat-label{font-size:11px;color:#555;font-weight:500;letter-spacing:0.5px}
        .vb-hero-phone{flex:0 0 280px}
        .vb-phone-frame{width:260px;margin:0 auto;background:#000;border-radius:30px;padding:8px;border:2px solid #2A2D34;animation:float 5s ease-in-out infinite;box-shadow:0 20px 60px rgba(0,0,0,0.5)}
        .vb-phone-inner{border-radius:24px;overflow:hidden;background:#fff}

        /* ── Sections ── */
        .vb-section{padding:70px 32px}
        .vb-section-inner{max-width:900px;margin:0 auto}
        .vb-section-label{font-size:11px;font-weight:700;letter-spacing:4px;margin-bottom:8px;text-align:center}
        .vb-section-title{font-family:'Bebas Neue',sans-serif;font-size:42px;text-align:center;letter-spacing:2px;margin-bottom:36px}

        /* ── Steps ── */
        .vb-steps{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
        .vb-step{background:#16181D;border-radius:14px;padding:28px 20px;border:1px solid #1E2028;text-align:center}

        /* ── Wins ── */
        .vb-wins{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}
        .vb-win{background:#16181D;border-radius:12px;padding:18px 20px;border:1px solid #1E2028;display:flex;justify-content:space-between;align-items:center;gap:12px}
        .vb-win-teams{font-size:12px;font-weight:600;color:#F0F0F2;margin-bottom:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .vb-proof-stats{display:flex;justify-content:center;gap:32px;margin-top:28px;padding:20px 0;border-top:1px solid #1E2028}

        /* ── CTA ── */
        .vb-cta{padding:80px 32px;text-align:center}
        .vb-cta h2{font-family:'Bebas Neue',sans-serif;font-size:clamp(36px,6vw,56px);letter-spacing:2px;margin-bottom:12px}
        .vb-cta .btn-p{padding:18px 52px;font-size:17px}

        /* ── Footer ── */
        .vb-footer{border-top:1px solid #1E2028;background:#0C0E11}
        .vb-footer-grid{max-width:1100px;margin:0 auto;padding:48px 32px;display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:40px}
        .vb-footer-col h4{font-family:'Bebas Neue',sans-serif;font-size:16px;letter-spacing:2px;color:#F0F0F2;margin-bottom:14px}
        .vb-footer-link{font-size:13px;color:#555;cursor:pointer;transition:color 0.2s;display:block;margin-bottom:10px;background:none;border:none;font-family:'DM Sans',sans-serif;padding:0;text-align:left;text-decoration:none}
        .vb-footer-link:hover{color:#F0F0F2}
        .vb-footer-bar{border-top:1px solid #1E2028;padding:16px 32px}
        .vb-footer-bar-inner{max-width:1100px;margin:0 auto;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px}
        .vb-social{display:flex;gap:10px}
        .vb-social-icon{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;transition:all 0.2s}
        .vb-social-icon:hover{opacity:0.8}

        /* ── WhatsApp ── */
        .vb-whatsapp{position:fixed;bottom:28px;right:28px;z-index:200;width:56px;height:56px;border-radius:50%;background:#25D366;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(37,211,102,0.4);cursor:pointer;transition:all 0.2s;text-decoration:none}
        .vb-whatsapp:hover{transform:scale(1.1);box-shadow:0 6px 28px rgba(37,211,102,0.5)}

        /* ═══════════════════════════════════════════════════ */
        /* ══ TABLET — max 768px ═══════════════════════════ */
        /* ═══════════════════════════════════════════════════ */
        @media(max-width:768px){
          .vb-header-inner{padding:10px 16px}
          .vb-nav-links{display:none!important}
          .btn-p,.btn-o{padding:8px 16px!important;font-size:12px!important}

          .vb-hero-flex{flex-direction:column!important;gap:32px!important;padding:40px 20px 32px!important}
          .vb-hero-text{min-width:unset!important}
          .vb-hero-h1{font-size:48px!important}
          .vb-hero-p{font-size:14px!important}
          .vb-hero-btns{flex-direction:column!important}
          .vb-hero-btns .btn-p,.vb-hero-btns .btn-o{width:100%!important;text-align:center!important;padding:14px 28px!important;font-size:14px!important}
          .vb-hero-stats{gap:20px!important}
          .vb-hero-stat-val{font-size:22px!important}
          .vb-hero-phone{flex:unset!important;width:100%!important;display:flex!important;justify-content:center!important}
          .vb-phone-frame{width:220px!important}

          .vb-section{padding:48px 20px!important}
          .vb-section-title{font-size:32px!important;margin-bottom:28px!important}

          .vb-steps{grid-template-columns:1fr 1fr!important;gap:12px!important}
          .vb-step{padding:22px 16px!important}

          .vb-wins{grid-template-columns:1fr!important;gap:10px!important}
          .vb-win{padding:14px 16px!important}
          .vb-win-teams{font-size:11px!important}
          .vb-proof-stats{flex-direction:column!important;align-items:center!important;gap:16px!important}

          .vb-cta{padding:48px 20px!important}
          .vb-cta .btn-p{width:100%!important;padding:16px 36px!important;font-size:15px!important}

          .vb-footer-grid{grid-template-columns:1fr 1fr!important;gap:24px!important;padding:36px 20px!important}
          .vb-footer-bar{padding:14px 20px!important}

          .vb-whatsapp{bottom:20px!important;right:20px!important;width:50px!important;height:50px!important}
          .vb-wa-icon{width:24px!important;height:24px!important}
          .vb-watermark{background-size:260px auto!important}
        }

        /* ═══════════════════════════════════════════════════ */
        /* ══ SMALL MOBILE — max 480px ════════════════════ */
        /* ═══════════════════════════════════════════════════ */
        @media(max-width:480px){
          .vb-hero-flex{padding:28px 16px 24px!important}
          .vb-hero-h1{font-size:38px!important}
          .vb-hero-stats{flex-wrap:wrap!important}
          .vb-section{padding:36px 16px!important}
          .vb-steps{grid-template-columns:1fr!important}
          .vb-footer-grid{grid-template-columns:1fr!important;gap:28px!important;padding:28px 16px!important}
          .vb-footer-bar{padding:12px 16px!important}
          .vb-cta{padding:40px 16px!important}
        }
      `}</style>

      {/* WATERMARK */}
      <div className="vb-watermark" />
      <div className="vb-watermark-fade" />

      <div style={{ position:"relative", zIndex:1 }}>

        {/* ═══ HEADER ═══ */}
        <header className="vb-header">
          <div className="vb-header-inner">
            <a href="/"><img src="/images/logo.png" alt="VirtualBet" style={{ height:HEADER_LOGO_HEIGHT, width:"auto", objectFit:"contain" }} /></a>
            <div className="vb-nav-links">
              <a href="#how-it-works" className="vb-nav-link">How It Works</a>
              <a href="#results" className="vb-nav-link">Results</a>
              <a href="#contact" className="vb-nav-link">Contact</a>
            </div>
            <div className="vb-header-btns">
              <a href="/login"><button className="btn-o">Log In</button></a>
              <a href="/signup"><button className="btn-p">Sign Up</button></a>
            </div>
          </div>
        </header>

        {/* ═══ TICKER ═══ */}
        <div style={{ background:"#0B9635", padding:"7px 0", overflow:"hidden" }}>
          <div style={{ display:"flex", animation:"ticker 25s linear infinite", whiteSpace:"nowrap" }}>
            {[...WINS,...WINS].map((w,i) => (
              <span key={i} style={{ padding:"0 32px", fontSize:12, fontWeight:600, letterSpacing:0.3 }}>
                🏆 {w.teams.split("/")[0].trim()} — Won <strong>GHS {w.won}</strong>
              </span>
            ))}
          </div>
        </div>

        {/* ═══ HERO ═══ */}
        <section style={{ position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:"-20%", left:"15%", width:500, height:500, background:"radial-gradient(circle, #0B963512 0%, transparent 70%)", borderRadius:"50%", filter:"blur(80px)", pointerEvents:"none" }} />
          <div style={{ position:"absolute", bottom:"-10%", right:"10%", width:400, height:400, background:"radial-gradient(circle, #0B963508 0%, transparent 70%)", borderRadius:"50%", filter:"blur(60px)", pointerEvents:"none" }} />

          <div className="vb-hero-flex">
            <div className="vb-hero-text" style={{ opacity:show?1:0, transform:show?"none":"translateY(30px)", transition:"all 0.9s cubic-bezier(0.16,1,0.3,1)" }}>
              <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"#0B963510", border:"1px solid #0B963525", borderRadius:6, padding:"5px 14px", marginBottom:20 }}>
                <span style={{ width:6, height:6, borderRadius:"50%", background:"#0B9635", animation:"softPulse 2s infinite" }} />
                <span style={{ fontSize:11, color:"#0B9635", fontWeight:700, letterSpacing:2 }}>LIVE AI PREDICTIONS</span>
              </div>

              <h1 className="vb-hero-h1">SPORTYBET<br/><span style={{ color:"#D4AF37" }}>INSTANT FOOTBALL</span></h1>

              <p className="vb-hero-p">
                Our AI hacks the prediction system instantly using your SportyBet screenshot as reference. Upload from your phone. Get winning predictions. Collect your money.
              </p>

              <div className="vb-hero-btns">
                <a href="/signup"><button className="btn-p">Get Started</button></a>
                <a href="#results"><button className="btn-o">See Results ↓</button></a>
              </div>

              <div className="vb-hero-stats">
                {[{val:"12,000+",label:"Winners"},{val:"GHS 245K+",label:"Total Won"},{val:"94%",label:"Win Rate"}].map(s=>(
                  <div key={s.label}>
                    <div className="vb-hero-stat-val">{s.val}</div>
                    <div className="vb-hero-stat-label">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="vb-hero-phone" style={{ opacity:show?1:0, transform:show?"none":"translateX(50px)", transition:"all 1s 0.2s cubic-bezier(0.16,1,0.3,1)" }}>
              <div className="vb-phone-frame">
                <div className="vb-phone-inner">
                  <div style={{ background:"#0B9635", padding:"8px 14px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span style={{ color:"#fff", fontSize:11, fontWeight:700 }}>Bet History</span>
                    <span style={{ color:"#fff", fontSize:11, fontWeight:700 }}>GHS 7,256.10</span>
                  </div>
                  <div style={{ padding:"8px 10px 12px" }}>
                    {WINS.slice(0,4).map((w,i)=>(
                      <div key={i} style={{ background:"#fff", borderRadius:10, padding:"10px 12px", marginBottom:8, border:"1px solid #eee", animation:`fadeUp 0.5s ${0.4+i*0.15}s both` }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:3 }}>
                          <span style={{ background:"#0B9635", color:"#fff", padding:"2px 8px", borderRadius:4, fontSize:9, fontWeight:800 }}>🏆 Won</span>
                          <span style={{ color:"#0B9635", fontWeight:800, fontSize:16, fontFamily:"'Bebas Neue',sans-serif", letterSpacing:0.5 }}>+{w.won}</span>
                        </div>
                        <div style={{ color:"#999", fontSize:9 }}>Stake: GHS {w.stake}</div>
                        <div style={{ color:"#333", fontSize:10, fontWeight:600 }}>{w.teams}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <p style={{ textAlign:"center", marginTop:12, fontSize:11, color:"#444", fontWeight:500 }}>Verified winning history</p>
            </div>
          </div>
        </section>

        {/* ═══ HOW IT WORKS ═══ */}
        <section id="how-it-works" className="vb-section">
          <div className="vb-section-inner">
            <p className="vb-section-label" style={{ color:"#D4AF37" }}>HOW IT WORKS</p>
            <h2 className="vb-section-title">4 Steps. That's It.</h2>
            <div className="vb-steps">
              {[
                {n:"01",icon:"📱",title:"Open SportyBet",desc:"Go to Instant Football virtual game"},
                {n:"02",icon:"📸",title:"Take Screenshot",desc:"Capture the match from your phone"},
                {n:"03",icon:"🤖",title:"AI Hacks It",desc:"Our system cracks the prediction instantly"},
                {n:"04",icon:"💰",title:"Collect Winnings",desc:"Place the bet and watch the money roll in"},
              ].map(s=>(
                <div key={s.n} className="vb-step">
                  <div style={{ fontSize:36, marginBottom:10 }}>{s.icon}</div>
                  <div style={{ fontSize:10, color:"#D4AF37", fontWeight:700, letterSpacing:3, marginBottom:6 }}>STEP {s.n}</div>
                  <div style={{ fontWeight:700, fontSize:15, marginBottom:6 }}>{s.title}</div>
                  <div style={{ color:"#555", fontSize:13, lineHeight:1.5 }}>{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ RESULTS ═══ */}
        <section id="results" className="vb-section">
          <div className="vb-section-inner">
            <p className="vb-section-label" style={{ color:"#0B9635" }}>REAL RESULTS</p>
            <h2 className="vb-section-title" style={{ marginBottom:12 }}>Verified Winning History</h2>
            <p style={{ textAlign:"center", color:"#555", fontSize:14, marginBottom:32, maxWidth:420, marginLeft:"auto", marginRight:"auto" }}>
              Every ticket below is real. Screenshotted from SportyBet. No edits. No fakes.
            </p>
            <div className="vb-wins">
              {WINS.map((w,i)=>(
                <div key={i} className="vb-win">
                  <div style={{ flex:1, minWidth:0 }}>
                    <div className="vb-win-teams">{w.teams}</div>
                    <div style={{ fontSize:11, color:"#555" }}>Stake: GHS {w.stake}</div>
                  </div>
                  <div style={{ textAlign:"right", flexShrink:0 }}>
                    <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:22, color:"#0B9635", letterSpacing:0.5 }}>+{w.won}</div>
                    <span style={{ background:"#0B963520", color:"#0B9635", padding:"2px 8px", borderRadius:4, fontSize:9, fontWeight:700 }}>WON</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="vb-proof-stats">
              {[{val:"GHS 7,256.10",label:"Single Day Earnings"},{val:"6 / 6",label:"Win Rate"},{val:"2x – 5x",label:"Avg Return"}].map(s=>(
                <div key={s.label} style={{ textAlign:"center" }}>
                  <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:24, color:"#0B9635", letterSpacing:1 }}>{s.val}</div>
                  <div style={{ fontSize:10, color:"#555", fontWeight:500, letterSpacing:0.5 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ CTA ═══ */}
        <section className="vb-cta">
          <div style={{ maxWidth:500, margin:"0 auto" }}>
            <h2>Stop Guessing.<br/><span style={{ color:"#0B9635" }}>Start Winning.</span></h2>
            <p style={{ color:"#555", fontSize:15, lineHeight:1.7, marginBottom:28 }}>
              Our AI doesn't guess — it hacks the system using real match data from your screenshot. Join now and see for yourself.
            </p>
            <a href="/signup"><button className="btn-p">Join VirtualBet Now</button></a>
          </div>
        </section>

        {/* ═══ FOOTER ═══ */}
        <footer id="contact" className="vb-footer">
          <div className="vb-footer-grid">
            {/* Brand */}
            <div>
              <img src="/images/logo.png" alt="VirtualBet" style={{ height:FOOTER_LOGO_HEIGHT, width:"auto", objectFit:"contain", marginBottom:14 }} />
              <p style={{ fontSize:13, color:"#555", lineHeight:1.7, maxWidth:280, marginBottom:16 }}>
                AI-powered predictions for SportyBet Instant Football. Upload your screenshot, get winning picks, collect your money.
              </p>
              <div className="vb-social">
                {[
                  { label:"WhatsApp", path:"M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z", bg:"#25D366" },
                  { label:"Twitter", path:"M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z", bg:"#1D9BF0" },
                  { label:"Instagram", path:"M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z", bg:"#E4405F" },
                ].map(s => (
                  <a key={s.label} href="#" className="vb-social-icon" style={{ background:s.bg+"20" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill={s.bg}><path d={s.path}/></svg>
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4>Quick Links</h4>
              <a href="#how-it-works" className="vb-footer-link">How It Works</a>
              <a href="#results" className="vb-footer-link">Results</a>
              <a href="/signup" className="vb-footer-link">Sign Up</a>
              <a href="/login" className="vb-footer-link">Log In</a>
            </div>

            {/* Legal */}
            <div>
              <h4>Legal</h4>
              {["Terms of Service","Privacy Policy","Refund Policy","Responsible Gaming"].map(l => (
                <button key={l} className="vb-footer-link">{l}</button>
              ))}
            </div>

            {/* Contact */}
            <div>
              <h4>Contact</h4>
              <div style={{ fontSize:13, color:"#555", marginBottom:10, lineHeight:1.7 }}>
                <span style={{ color:"#888" }}>WhatsApp</span><br/>+233 XX XXX XXXX
              </div>
              <div style={{ fontSize:13, color:"#555", marginBottom:10, lineHeight:1.7 }}>
                <span style={{ color:"#888" }}>Email</span><br/>support@virtualbet.com
              </div>
              <div style={{ fontSize:13, color:"#555", lineHeight:1.7 }}>
                <span style={{ color:"#888" }}>Hours</span><br/>24/7 Support
              </div>
            </div>
          </div>

          <div className="vb-footer-bar">
            <div className="vb-footer-bar-inner">
              <span style={{ fontSize:11, color:"#333" }}>© 2026 VirtualBet. All rights reserved.</span>
              <span style={{ fontSize:11, color:"#333" }}>18+ Only • Gamble Responsibly</span>
            </div>
          </div>
        </footer>

        {/* ═══ WHATSAPP ═══ */}
        <a href="https://wa.me/YOUR_NUMBER_HERE" target="_blank" rel="noopener noreferrer" className="vb-whatsapp">
          <svg className="vb-wa-icon" width="28" height="28" viewBox="0 0 24 24" fill="#fff">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        </a>

      </div>
    </div>
  );
}