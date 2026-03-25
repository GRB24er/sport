"use client";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

const R = 0.077;
const fG = v => `GH₵${Number(v).toLocaleString()}`;
const fB = v => `GH₵${Number(v).toLocaleString()} ($${(Number(v)*R).toFixed(2)})`;

const DEF_PKGS = [
  { id:"gold", name:"Gold", odds:"3–5 Odds", price:250, color:"#D4AF37", icon:"🥇", max:1, features:["1 Round (3 Matches)","3–5 Odds Range","Basic Support"] },
  { id:"platinum", name:"Platinum", odds:"5–15 Odds", price:500, color:"#94A7BD", icon:"🥈", max:2, features:["2 Rounds (6 Matches)","5–15 Odds Range","Priority Support","Weekly Tips"] },
  { id:"diamond", name:"Diamond", odds:"15–50 Odds", price:1000, color:"#7DD3E8", icon:"💎", max:4, features:["4 Rounds (12 Matches)","15–50 Odds Range","24/7 Support","Daily Accumulators"] },
];

const DEF_PROVS = [
  { id:"telecel", name:"Telecel Cash", color:"#E40521", num:"0503994665", acct:"ABEL AFRIYIE", refLabel:"TRANSACTION ID", refPlaceholder:"e.g. 000012345678" },
];

const GAMES = [
  { id:"instant-virtual", name:"Instant Virtual", sub:"Football Virtual", icon:"⚽", logo:"/images/logoo.png", color:"#0B9635", bg:"linear-gradient(135deg,#0B9635,#054d18)", desc:"Upload your SportyBet screenshot and get winning predictions.", tags:["Live","7 Markets","Up to 50x"], live:true, badge:"🔥 POPULAR" },
  { id:"egames", name:"eGames", sub:"Virtual Casino", icon:"🎮", color:"#8B5CF6", bg:"linear-gradient(135deg,#8B5CF6,#5B21B6)", desc:"AI predictions for virtual casino and electronic games. Beat the odds.", tags:["Casino","Virtual","Smart Picks"], live:true, badge:"🆕 NEW" },
  { id:"sporty-hero", name:"SportyHero", sub:"Hero Predictions", icon:"🦸", color:"#E31725", bg:"", desc:"Hero predictions coming soon.", tags:[], live:false },
  { id:"spin-bottle", name:"Spin & Win", sub:"Spin The Bottle", icon:"🍾", color:"#D4AF37", bg:"", desc:"We're building something special.", tags:[], live:false },
];

export default function Dashboard() {
  const { data:session, status } = useSession();
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const [siteSettings, setSiteSettings] = useState(null);
  const [notifs, setNotifs] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [subModal, setSubModal] = useState(null);
  const [selPkg, setSelPkg] = useState(null);
  const [selProv, setSelProv] = useState(null);
  const [refNum, setRefNum] = useState("");
  const [senderName, setSenderName] = useState("");
  const [payScreenshot, setPayScreenshot] = useState(null);
  const [payPreview, setPayPreview] = useState(null);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [freeGames, setFreeGames] = useState([]);
  const [fgLoading, setFgLoading] = useState(false);
  const [fgOpen, setFgOpen] = useState(false);
  const [refEarnings, setRefEarnings] = useState([]);
  const [refStats, setRefStats] = useState(null);
  const [refReferrals, setRefReferrals] = useState([]);
  const [dashLoading, setDashLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (session?.user?.role === "admin") router.push("/admin");
  }, [status, session, router]);

  const loadUser = async () => {
    if (!session?.user?.id || session.user.id === "admin") return;
    try {
      const res = await fetch("/api/dashboard");
      if (!res.ok) { console.error("Dashboard load failed:", res.status); return; }
      const d = await res.json();
      if (d.user) setUserData(d.user);
      if (d.settings) setSiteSettings(d.settings);
      setNotifs(d.notifications || []);
      setFreeGames(d.freeGames || []);
      setRefEarnings(d.earnings || []);
      setRefStats(d.refStats || null);
      setRefReferrals(d.referrals || []);
    } catch (e) {
      console.error("Dashboard load error:", e);
      setError("Failed to load data. Please refresh the page.");
    } finally {
      setDashLoading(false);
    }
  };

  useEffect(() => { loadUser(); }, [session]);
  useEffect(() => { if (submitted) loadUser(); }, [submitted]);

  // Dynamic prices from settings
  const ss = siteSettings || {};
  const PKGS = [
    { ...DEF_PKGS[0], price: ss.goldPrice || 250, max: ss.goldMaxPreds || 1, odds: ss.goldOdds || "3–5 Odds" },
    { ...DEF_PKGS[1], price: ss.platinumPrice || 500, max: ss.platinumMaxPreds || 2, odds: ss.platinumOdds || "5–15 Odds" },
    { ...DEF_PKGS[2], price: ss.diamondPrice || 1000, max: ss.diamondMaxPreds || 4, odds: ss.diamondOdds || "15–50 Odds" },
  ];
  PKGS[0].features = [`${PKGS[0].max} Round (${PKGS[0].max*3} Matches)`, `${PKGS[0].odds} Range`, "Basic Support"];
  PKGS[1].features = [`${PKGS[1].max} Rounds (${PKGS[1].max*3} Matches)`, `${PKGS[1].odds} Range`, "Priority Support", "Weekly Tips"];
  PKGS[2].features = [`${PKGS[2].max} Rounds (${PKGS[2].max*3} Matches)`, `${PKGS[2].odds} Range`, "24/7 Support", "Daily Accumulators"];

  const PROVS = [
    { ...DEF_PROVS[0], num: ss.telecelNumber || DEF_PROVS[0].num, acct: ss.telecelName || DEF_PROVS[0].acct },
  ];

  if (status === "loading" || !session || dashLoading) return (
    <div style={{minHeight:"100vh",background:"#0B0D10",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{width:44,height:44,border:"3px solid #1E2028",borderTopColor:"#E31725",borderRadius:"50%",animation:"sp .8s linear infinite"}} />
      <style>{`@keyframes sp{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const user = session.user;
  const firstName = user.name?.split(" ")[0] || "Player";
  const initials = user.name?.split(" ").map(w=>w[0]).join("").slice(0,2) || "?";
  const hasCode = !!(userData?.referralCode || user.referralCode);
  const refCode = userData?.referralCode || user.referralCode || null;

  // Per-game state helpers
  const gp = userData?.gamePackages || {};
  const pgp = userData?.pendingGamePackages || {};
  const getGamePkg = (gameId) => gp[gameId] || null;
  const getGamePending = (gameId) => pgp[gameId] || null;
  const gameHasPkg = (gameId) => !!getGamePkg(gameId);
  const gameIsPending = (gameId) => !!getGamePending(gameId);
  const anyPending = Object.keys(pgp).length > 0;
  const anyActive = Object.keys(gp).length > 0;

  const openSub = (game) => {
    if (!game?.live) return;
    if (gameHasPkg(game.id)) { router.push("/dashboard/predict?game=" + game.id); return; }
    if (gameIsPending(game.id)) return;
    setSubModal(game);
    setSelPkg(null); setSelProv(null); setRefNum(""); setSenderName(""); setPayScreenshot(null); setPayPreview(null); setStep(1); setSubmitted(false); setError("");
  };

  const closeSub = () => { setSubModal(null); setSelPkg(null); setSelProv(null); setRefNum(""); setSenderName(""); setPayScreenshot(null); setPayPreview(null); setStep(1); setSubmitted(false); setError(""); };

  const handlePayScreenshot = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please upload an image file."); return; }
    if (file.size > 10 * 1024 * 1024) { setError("Screenshot must be under 10MB."); return; }
    setError("");
    setPayPreview(URL.createObjectURL(file));
    const img = new Image();
    img.onload = () => {
      const MAX = 800;
      let w = img.width, h = img.height;
      if (w > MAX || h > MAX) { const r = Math.min(MAX/w, MAX/h); w = Math.round(w*r); h = Math.round(h*r); }
      const c = document.createElement("canvas"); c.width = w; c.height = h;
      c.getContext("2d").drawImage(img, 0, 0, w, h);
      setPayScreenshot(c.toDataURL("image/jpeg", 0.7));
    };
    img.src = URL.createObjectURL(file);
  };

  const submitRef = async () => {
    if (!refNum.trim()) { setError("Enter your transaction code or reference."); return; }
    if (!payScreenshot) { setError("Upload your payment screenshot for verification."); return; }
    setError(""); setSubmitting(true);
    try {
      const res = await fetch("/api/packages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId: subModal.id, packageId: selPkg, paymentProvider: selProv, referenceNumber: refNum.trim(), senderName: senderName.trim(), paymentScreenshot: payScreenshot }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed"); setSubmitting(false); return; }
      setSubmitted(true);
    } catch (e) { setError("Network error."); }
    setSubmitting(false);
  };

  const getGameButton = (game) => {
    if (!game.live) return { text: "Coming Soon", style: { background: "transparent", color: "#444", border: "1px solid #1E2028", cursor: "default" } };
    if (gameHasPkg(game.id)) {
      const gPkg = getGamePkg(game.id);
      const p = PKGS.find(x => x.id === gPkg.package);
      return { text: `${p?.icon||""} Play Now →`, style: { background: game.bg, color: "#fff", border: "none" } };
    }
    if (gameIsPending(game.id)) {
      const pending = getGamePending(game.id);
      const p = PKGS.find(x => x.id === pending.package);
      return { text: `⏳ ${p?.name||""} Pending`, style: { background: "#D4AF3715", color: "#D4AF37", border: "1.5px solid #D4AF3730", cursor: "default" } };
    }
    return { text: "Subscribe to Play", style: { background: "transparent", color: game.color, border: `1.5px solid ${game.color}35` } };
  };

  return (
    <div className="vd">
      <style>{`
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Bebas+Neue&display=swap');
*{margin:0;padding:0;box-sizing:border-box}body{background:#0B0D10;overflow-x:hidden}
.vd{min-height:100vh;background:#0B0D10;color:#F0F0F2;font-family:'DM Sans',sans-serif}
@keyframes sp{to{transform:rotate(360deg)}}@keyframes su{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}@keyframes fi{from{opacity:0}to{opacity:1}}@keyframes si{from{opacity:0;transform:scale(.93)}to{opacity:1;transform:scale(1)}}@keyframes fl{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}@keyframes pu{0%,100%{opacity:1}50%{opacity:.5}}@keyframes sd{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
.asu{animation:su .5s cubic-bezier(.16,1,.3,1) both}.ad1{animation-delay:.05s}.ad2{animation-delay:.1s}.ad3{animation-delay:.15s}.ad4{animation-delay:.2s}
.vbg{position:fixed;inset:0;z-index:0;background-image:url(/backdrop.png);background-size:380px auto;background-repeat:repeat;opacity:.02;pointer-events:none}
.hdr{display:flex;justify-content:space-between;align-items:center;padding:14px 20px;border-bottom:1px solid #151820;background:#0B0D10F0;backdrop-filter:blur(20px);position:sticky;top:0;z-index:90}
.hav{width:38px;height:38px;border-radius:10px;background:#E31725;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;color:#fff;cursor:pointer;transition:all .15s;border:2px solid transparent;flex-shrink:0}.hav:hover,.hav.on{border-color:#E31725;box-shadow:0 0 0 3px #E3172520}
.hr{display:flex;align-items:center;gap:8px}
.pf{position:absolute;top:62px;right:12px;width:300px;background:#12141A;border:1px solid #1E2028;border-radius:16px;z-index:100;overflow:hidden;animation:sd .2s cubic-bezier(.16,1,.3,1);box-shadow:0 20px 60px rgba(0,0,0,.6)}
.pf-t{padding:18px;display:flex;align-items:center;gap:12px;border-bottom:1px solid #151820;background:#0E101540}
.pf-av{width:44px;height:44px;border-radius:12px;background:#E31725;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:16px;color:#fff;flex-shrink:0}
.pf-nm{font-weight:700;font-size:15px}.pf-em{font-size:11px;color:#555;margin-top:1px;word-break:break-all}
.pf-bd{padding:14px 18px}
.pf-r{display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #15182060}.pf-r:last-child{border-bottom:none}
.pf-rl{font-size:11px;color:#444;font-weight:600}.pf-rv{font-size:13px;font-weight:700;text-align:right}
.cb{margin-top:6px;padding:14px;background:#0B0D10;border:1px solid #1E2028;border-radius:10px}
.cb-no{color:#E31725;font-size:12px;font-weight:600;line-height:1.5}
.cb-v{font-family:'Bebas Neue',sans-serif;font-size:22px;letter-spacing:3px;color:#0B9635}
.cb-btn{margin-top:8px;width:100%;padding:10px;border-radius:8px;border:none;font-size:12px;font-weight:700;cursor:pointer;font-family:'DM Sans';transition:all .15s}.cb-btn:active{transform:scale(.97)}
.pf-out{width:100%;padding:11px;background:#E3172508;border:1px solid #E3172518;border-radius:10px;color:#E31725;font-size:13px;font-weight:700;cursor:pointer;font-family:'DM Sans';margin-top:8px}
.mn{max-width:540px;margin:0 auto;padding:28px 20px;position:relative;z-index:1}
.mt{font-family:'Bebas Neue',sans-serif;font-size:30px;letter-spacing:2px;margin-bottom:4px}
.ms{font-size:14px;color:#555;line-height:1.5;margin-bottom:24px}
.sec{font-size:10px;font-weight:700;letter-spacing:2px;color:#333;margin:24px 0 10px;text-transform:uppercase}
.lb{display:inline-flex;align-items:center;gap:5px;font-size:9px;font-weight:700;letter-spacing:1.5px;color:#0B9635;background:#0B963515;padding:3px 10px;border-radius:5px}
.ld{width:5px;height:5px;border-radius:50%;background:#0B9635;animation:pu 1.5s infinite}
.sb{display:inline-flex;font-size:9px;font-weight:700;letter-spacing:1px;color:#888;background:#88888812;padding:3px 10px;border-radius:5px}
.gc{border-radius:16px;overflow:hidden;cursor:pointer;transition:all .25s cubic-bezier(.16,1,.3,1);border:1px solid #1E2028;background:#12141A;margin-bottom:12px}
.gc:hover{transform:translateY(-3px)}.gc:active{transform:translateY(0);transition:transform .08s}
.gc-b{padding:22px 20px 18px;position:relative;overflow:hidden}
.gc-dc{position:absolute;border-radius:50%;background:rgba(255,255,255,.06)}
.gc-tp{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;position:relative;z-index:1}
.gc-ic{font-size:40px;animation:fl 4s ease-in-out infinite;position:relative;z-index:1}
.gc-nm{font-family:'Bebas Neue',sans-serif;font-size:28px;letter-spacing:2px;line-height:1;position:relative;z-index:1}
.gc-su{font-size:11px;color:rgba(255,255,255,.55);margin-top:3px;position:relative;z-index:1}
.gc-bd{padding:14px 20px 18px;display:flex;justify-content:space-between;align-items:center;gap:14px}
.gc-ds{font-size:13px;color:#666;line-height:1.5;flex:1}
.gc-tg{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}
.gc-t{font-size:9px;font-weight:600;padding:3px 8px;border-radius:5px}
.gc-bt{padding:12px 24px;border-radius:10px;font-weight:700;font-size:13px;font-family:'DM Sans';cursor:pointer;transition:all .15s;border:none;white-space:nowrap;flex-shrink:0}.gc-bt:active{transform:scale(.96)}
.gs{border-radius:12px;border:1px solid #15182080;background:#12141A;padding:16px 18px;display:flex;align-items:center;gap:14px;margin-bottom:10px;opacity:.55}
.gs-ic{font-size:28px;flex-shrink:0;filter:grayscale(40%)}.gs-inf{flex:1}.gs-nm{font-family:'Bebas Neue',sans-serif;font-size:18px;letter-spacing:1px;color:#666}.gs-ds{font-size:11px;color:#333;margin-top:1px}
.pend{background:#D4AF3708;border:1px solid #D4AF3718;border-radius:10px;padding:10px 14px;margin-top:8px;font-size:11px;color:#D4AF37;display:flex;align-items:center;gap:8px}
.pend-dot{width:6px;height:6px;border-radius:50%;background:#D4AF37;animation:pu 1.5s infinite;flex-shrink:0}
.mo{position:fixed;inset:0;background:rgba(0,0,0,.88);backdrop-filter:blur(10px);display:flex;align-items:flex-end;justify-content:center;z-index:200;padding:0;animation:fi .15s}
.mm{background:#12141A;border:1px solid #1E2028;border-radius:22px 22px 0 0;padding:24px 22px 32px;width:100%;max-width:480px;max-height:88vh;overflow-y:auto;animation:su .3s cubic-bezier(.16,1,.3,1);-webkit-overflow-scrolling:touch}
.mm-bar{width:36px;height:4px;border-radius:2px;background:#2A2D34;margin:0 auto 16px}
.mm-ti{font-family:'Bebas Neue',sans-serif;font-size:24px;letter-spacing:2px;text-align:center;margin-bottom:3px}
.mm-su{font-size:13px;color:#555;text-align:center;margin-bottom:18px}
.mm-st{display:flex;gap:4px;margin-bottom:18px}.mm-st div{flex:1;height:3px;border-radius:2px;background:#1E2028;transition:background .3s}.mm-st div.on{background:#E31725}
.pkg{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px}
.pk{border-radius:12px;padding:14px 8px;text-align:center;cursor:pointer;transition:all .2s;border:2px solid #1E2028;background:#0B0D10}.pk:hover{border-color:#2A2D34}.pk.on{border-width:2px}
.pk-i{font-size:22px;margin-bottom:2px}.pk-n{font-family:'Bebas Neue',sans-serif;font-size:16px;letter-spacing:1px}.pk-o{font-size:9px;color:#555;margin-bottom:4px}.pk-p{font-family:'Bebas Neue',sans-serif;font-size:18px}.pk-u{font-size:9px;color:#444}.pk-d{font-size:9px;color:#666;margin-top:2px}.pk-c{margin-top:3px;font-size:9px;font-weight:700}
.pvg{display:flex;flex-direction:column;gap:8px;margin-bottom:16px}
.pv{border-radius:12px;padding:16px;cursor:pointer;transition:all .2s;border:2px solid #1E2028;background:#0B0D10;display:flex;align-items:center;gap:14px}.pv:hover{border-color:#2A2D34}.pv.on{border-width:2px}
.pv-d{width:14px;height:14px;border-radius:50%;flex-shrink:0}.pv-n{font-weight:700;font-size:14px}.pv-nu{font-size:12px;color:#555;margin-top:1px}.pv-c{margin-left:auto;font-size:11px;font-weight:700;flex-shrink:0}
.det{background:#0B0D10;border:1px solid #151820;border-radius:12px;padding:14px;margin-bottom:16px;animation:fi .3s}
.det-l{font-size:10px;font-weight:700;letter-spacing:2px;margin-bottom:8px}.det-f{display:flex;align-items:center;gap:8px;margin-bottom:5px;font-size:12px;color:#666}
.det-t{display:flex;justify-content:space-between;align-items:center;padding-top:10px;margin-top:10px;border-top:1px solid #1E2028}
.inp{width:100%;padding:14px 16px;background:#0B0D10;border:1px solid #1E2028;border-radius:10px;color:#F0F0F2;font-size:14px;font-family:'DM Sans';outline:none}.inp:focus{border-color:#E31725;box-shadow:0 0 0 3px #E3172510}.inp::placeholder{color:#2A2D34}
.err{background:#E3172510;border:1px solid #E3172520;border-radius:10px;padding:10px 14px;margin-bottom:12px;font-size:12px;color:#E31725;font-weight:600}
.ab{width:100%;padding:15px;border-radius:12px;border:none;font-size:15px;font-weight:700;cursor:pointer;font-family:'DM Sans';transition:all .15s}.ab:disabled{cursor:not-allowed;opacity:.4}.ab:not(:disabled):active{transform:scale(.97)}
.bb{width:100%;padding:12px;border-radius:10px;border:1px solid #1E2028;background:transparent;color:#888;font-size:13px;font-weight:600;cursor:pointer;font-family:'DM Sans';margin-top:8px}
.warn{background:#1E202830;border-radius:10px;padding:12px 14px;margin-bottom:14px;font-size:11px;color:#555;line-height:1.6}
.suc-ic{font-size:52px;text-align:center;margin-bottom:12px}
.suc-box{background:#0B963510;border:1px solid #0B963520;border-radius:12px;padding:16px;margin-bottom:16px;text-align:left}
.suc-r{margin-bottom:10px}.suc-r:last-child{margin-bottom:0}.suc-rl{font-size:10px;color:#555;margin-bottom:2px}.suc-rv{font-size:14px;font-weight:700}
@media(min-width:520px){.mo{align-items:center!important;padding:16px!important}.mm{border-radius:22px!important;max-width:440px!important}}
@media(max-width:768px){.hdr{padding:10px 16px!important}.mn{padding:20px 16px!important}.pf{width:calc(100vw - 24px)!important;right:12px!important;max-width:320px!important}}
@media(max-width:420px){.hdr{padding:8px 12px!important}.hav{width:34px!important;height:34px!important;font-size:11px!important;border-radius:8px!important}.mn{padding:16px 12px!important}.mt{font-size:24px!important}.ms{font-size:13px!important;margin-bottom:18px!important}.gc-b{padding:18px 16px 14px!important}.gc-ic{font-size:34px!important}.gc-nm{font-size:24px!important}.gc-bd{padding:12px 16px 14px!important;flex-direction:column!important;align-items:flex-start!important;gap:10px!important}.gc-bt{width:100%!important;text-align:center!important;padding:11px!important;font-size:13px!important}.gc-ds{font-size:12px!important}.gs{padding:12px 14px!important;gap:10px!important}.gs-ic{font-size:24px!important}.gs-nm{font-size:16px!important}.gs-ds{font-size:10px!important}.pf{width:calc(100vw - 24px)!important;right:12px!important;top:52px!important;border-radius:14px!important}.pf-t{padding:14px!important;gap:10px!important}.pf-av{width:38px!important;height:38px!important;font-size:14px!important}.pf-nm{font-size:14px!important}.pf-bd{padding:12px 14px!important}.cb-v{font-size:18px!important;letter-spacing:2px!important}.mm{padding:20px 16px 28px!important}.pkg{gap:6px!important}.pk{padding:12px 6px!important;border-radius:10px!important}.pk-i{font-size:18px!important}.pk-n{font-size:14px!important}.pk-p{font-size:16px!important}.pv{padding:12px!important;gap:10px!important}.pv-n{font-size:13px!important}.ab{padding:13px!important;font-size:14px!important}.sec{font-size:9px!important;margin:18px 0 8px!important}}
      `}</style>

      <div className="vbg" />

      <header className="hdr">
        <a href="/"><img src="/images/logo.png" alt="VB" style={{height:46,width:"auto",objectFit:"contain"}} /></a>
        <div className="hr" style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{position:"relative",cursor:"pointer"}} onClick={()=>{setNotifOpen(!notifOpen);setProfileOpen(false);}}>
            <span style={{fontSize:20}}>🔔</span>
            {notifs.filter(n=>!n.read).length>0&&<div style={{position:"absolute",top:-4,right:-4,width:16,height:16,borderRadius:"50%",background:"#E31725",display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:900,color:"#fff"}}>{notifs.filter(n=>!n.read).length}</div>}
          </div>
          <div className={`hav ${profileOpen?"on":""}`} onClick={()=>{setProfileOpen(!profileOpen);setNotifOpen(false);}}>{initials}</div>
        </div>
      </header>

      {/* NOTIFICATIONS */}
      {notifOpen && (<>
        <div style={{position:"fixed",inset:0,zIndex:95}} onClick={()=>setNotifOpen(false)} />
        <div style={{position:"fixed",top:56,right:12,width:320,maxWidth:"calc(100vw - 24px)",maxHeight:420,overflowY:"auto",background:"#12141A",border:"1px solid #1E2028",borderRadius:16,zIndex:96,padding:0,boxShadow:"0 20px 60px rgba(0,0,0,.5)"}}>
          <div style={{padding:"14px 16px",borderBottom:"1px solid #151820",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontWeight:700,fontSize:14}}>Notifications</span>
            {notifs.filter(n=>!n.read).length>0&&<button onClick={async()=>{await fetch("/api/notifications",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({markAll:true})});loadUser();}} style={{background:"none",border:"none",color:"#0B9635",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans'"}}>Mark all read</button>}
          </div>
          {notifs.length===0?<div style={{padding:32,textAlign:"center",color:"#444",fontSize:13}}>No notifications yet</div>:
          notifs.slice(0,20).map((n,i)=>(
            <div key={n._id||i} style={{padding:"12px 16px",borderBottom:"1px solid #15182050",background:n.read?"transparent":"#E3172504"}}>
              <div style={{fontSize:13,color:n.read?"#666":"#F0F0F2",lineHeight:1.5}}>{n.message}</div>
              <div style={{fontSize:10,color:"#333",marginTop:4}}>{new Date(n.createdAt).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </>)}

      {/* PROFILE */}
      {profileOpen && (<>
        <div style={{position:"fixed",inset:0,zIndex:95}} onClick={()=>setProfileOpen(false)} />
        <div className="pf">
          <div className="pf-t"><div className="pf-av">{initials}</div><div><div className="pf-nm">{user.name}</div><div className="pf-em">{user.email||user.phone}</div></div></div>
          <div className="pf-bd">
            {[{l:"Phone",v:user.phone,c:"#888"},{l:"SportyBet",v:user.sportyBetId||`SB-${user.phone}`,c:"#0B9635"}].map(r=>(
              <div key={r.l} className="pf-r"><span className="pf-rl">{r.l}</span><span className="pf-rv" style={{color:r.c}}>{r.v}</span></div>
            ))}

            {/* Active game packages */}
            {Object.entries(gp).map(([gId,gPkg])=>{
              const g=GAMES.find(x=>x.id===gId);const p=PKGS.find(x=>x.id===gPkg.package);
              return g&&p?(<div key={gId} className="pf-r"><span className="pf-rl">{g.icon} {g.name}</span><span className="pf-rv" style={{color:p.color}}>{p.icon} {p.name}</span></div>):null;
            })}

            {/* Pending packages */}
            {Object.entries(pgp).map(([gId,req])=>{
              const g=GAMES.find(x=>x.id===gId);const p=PKGS.find(x=>x.id===req.package);
              return g&&p?(<div key={gId} style={{margin:"6px 0",padding:10,background:"#D4AF3708",border:"1px solid #D4AF3718",borderRadius:8}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:11,color:"#D4AF37",fontWeight:700}}>{g.icon} {g.name}</span>
                  <span style={{fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:4,background:"#D4AF3715",color:"#D4AF37",animation:"pu 2s infinite"}}>PENDING</span>
                </div>
                <div style={{fontSize:12,color:"#888",marginTop:2}}>{p.icon} {p.name} — {fG(p.price)}</div>
                <div style={{fontSize:10,color:"#444",marginTop:1}}>Ref: {req.referenceNumber}</div>
              </div>):null;
            })}

            <div className="cb">
              {hasCode ? (<><div style={{fontSize:10,color:"#444",fontWeight:700,letterSpacing:1,marginBottom:3}}>YOUR REFERRAL CODE</div><div className="cb-v">{refCode}</div><button className="cb-btn" style={{background:"#0B963512",color:"#0B9635"}} onClick={()=>{const link=`${window.location.origin}/signup?ref=${refCode}`;navigator.clipboard?.writeText(link);}}>📋 Copy Referral Link</button></>) : (<><div className="cb-no">⚠ No valid access code.<br/>{anyPending?"Waiting for package approval.":"Purchase a package to get one."}</div></>)}
            </div>
            <button className="pf-out" onClick={()=>signOut({callbackUrl:"/"})}>Logout</button>
          </div>
        </div>
      </>)}

      {/* MAIN */}
      <main className="mn">
        <div className="asu"><h1 className="mt">Hey, {firstName} 👋</h1><p className="ms">{anyActive?"Choose a game and let AI predict for you.":anyPending?"Your package is being verified. Hang tight!":"Choose a game. Subscribe to unlock predictions."}</p></div>

        <div className="sec asu ad1">🟢 LIVE GAMES</div>

        {GAMES.filter(g=>g.live).map((g,i)=>{
          const btn = getGameButton(g);
          const pending = getGamePending(g.id);
          const pendPkg = pending ? PKGS.find(x=>x.id===pending.package) : null;
          return (
            <div key={g.id} className={`gc asu ad${i+1}`} onClick={()=>openSub(g)} style={{cursor:gameIsPending(g.id)?"default":"pointer"}}>
              <div className="gc-b" style={{background:g.bg}}>
                <div className="gc-dc" style={{top:-25,right:-25,width:100,height:100}} />
                <div className="gc-dc" style={{bottom:-35,left:"15%",width:130,height:130}} />
                <div className="gc-tp">
                  <div className="lb"><div className="ld" /> LIVE</div>
                  <div style={{fontSize:9,color:"rgba(255,255,255,.45)",fontWeight:700,letterSpacing:1}}>{g.badge}</div>
                </div>
                <div className="gc-ic" style={{animationDelay:`${i*.6}s`}}>{g.logo?<img src={g.logo} alt={g.name} style={{width:56,height:56,borderRadius:12,objectFit:"cover"}}/>:g.icon}</div>
                <div className="gc-nm">{g.name}</div><div className="gc-su">{g.sub}</div>
              </div>
              <div className="gc-bd">
                <div>
                  <p className="gc-ds">{g.desc}</p>
                  <div className="gc-tg">{g.tags.map(t=><span key={t} className="gc-t" style={{color:g.color,background:g.color+"12"}}>{t}</span>)}</div>
                </div>
                <div className="gc-bt" style={btn.style}>{btn.text}</div>
              </div>
              {pending && (
                <div className="pend"><div className="pend-dot" /><span>⏳ {pendPkg?.icon} {pendPkg?.name} — Payment being verified • Ref: {pending.referenceNumber}</span></div>
              )}
            </div>
          );
        })}

        {/* FREE GAMES */}
        <div className="sec asu ad2">🎁 FREE GAMES</div>
        <div className={`gc asu ad2`} onClick={()=>setFgOpen(!fgOpen)} style={{cursor:"pointer"}}>
          <div className="gc-b" style={{background:"linear-gradient(135deg,#D4AF37,#8B6914)"}}>
            <div className="gc-dc" style={{top:-25,right:-25,width:100,height:100}} />
            <div className="gc-dc" style={{bottom:-35,left:"15%",width:130,height:130}} />
            <div className="gc-tp">
              {freeGames.length>0?<div className="lb" style={{color:"#0B9635",background:"#0B963515"}}><div className="ld" /> AVAILABLE</div>:<div className="sb">FREE</div>}
              <div style={{fontSize:9,color:"rgba(255,255,255,.45)",fontWeight:700,letterSpacing:1}}>🎁 FREE TIPS</div>
            </div>
            <div className="gc-ic">🎁</div>
            <div className="gc-nm">Free Games</div><div className="gc-su">Free prediction tips for you</div>
          </div>
          <div className="gc-bd">
            <p className="gc-ds">{freeGames.length>0?"Tap to view today's free prediction tips!":"Check back later for free tips."}</p>
            <div className="gc-bt" style={{background:freeGames.length>0?"#D4AF37":"transparent",color:freeGames.length>0?"#000":"#444",border:freeGames.length>0?"none":"1px solid #1E2028"}}>{freeGames.length>0?`View ${freeGames.length} Free Tip${freeGames.length>1?"s":""}`:fgOpen?"Close":"View"}</div>
          </div>
        </div>

        {/* Free Games Content */}
        {fgOpen && (
          <div style={{animation:"fi .2s",marginBottom:16}}>
            {freeGames.length===0?(
              <div style={{background:"#12141A",border:"1px solid #1E2028",borderRadius:14,padding:"32px 20px",textAlign:"center"}}>
                <div style={{fontSize:48,marginBottom:12}}>🎁</div>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:22,letterSpacing:1,marginBottom:6}}>No Free Games Available</div>
                <p style={{fontSize:13,color:"#555",lineHeight:1.6,maxWidth:300,margin:"0 auto"}}>Our team hasn't published any free tips yet. Please check back later — new free games are posted regularly!</p>
              </div>
            ):(
              freeGames.map(fg=>(
                <div key={fg._id} style={{background:"#12141A",border:"1px solid #D4AF3720",borderRadius:14,padding:18,marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                    <div style={{fontWeight:700,fontSize:14,color:"#D4AF37"}}>{fg.title||"Free Game"}</div>
                    <span style={{fontSize:9,fontWeight:700,padding:"3px 10px",borderRadius:10,background:"#0B963518",color:"#0B9635",letterSpacing:.5}}>FREE</span>
                  </div>
                  <pre style={{background:"#0B0D10",border:"1px solid #1E2028",borderRadius:10,padding:14,fontSize:12,color:"#ccc",whiteSpace:"pre-wrap",wordWrap:"break-word",fontFamily:"'DM Sans',sans-serif",lineHeight:1.7}}>{fg.content}</pre>
                  <div style={{fontSize:10,color:"#444",marginTop:8}}>Published {new Date(fg.publishedAt||fg.createdAt).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})}</div>
                </div>
              ))
            )}
          </div>
        )}

        <div className="sec asu ad3">🔧 COMING SOON</div>
        {GAMES.filter(g=>!g.live).map((g,i)=>(
          <div key={g.id} className={`gs asu ad${i+3}`}><div className="gs-ic">{g.icon}</div><div className="gs-inf"><div className="gs-nm">{g.name}</div><div className="gs-ds">{g.desc}</div></div><div className="sb">SOON</div></div>
        ))}

        {/* REFERRAL EARNINGS */}
        {hasCode && (
          <>
            <div className="sec asu ad4">🤝 MY REFERRALS</div>
            <div className="asu ad4" style={{background:"#14161B",border:"1px solid #1E2028",borderRadius:12,padding:16,marginBottom:12}}>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:16}}>
                <div style={{textAlign:"center",padding:10,background:"#0B0D10",borderRadius:8}}><div style={{fontSize:10,color:"#555",fontWeight:700,letterSpacing:1}}>REFERRED</div><div style={{fontSize:22,fontWeight:800,color:"#F0F0F2",fontFamily:"'Bebas Neue'"}}>{refStats?.total||0}</div></div>
                <div style={{textAlign:"center",padding:10,background:"#0B0D10",borderRadius:8}}><div style={{fontSize:10,color:"#555",fontWeight:700,letterSpacing:1}}>EARNED</div><div style={{fontSize:22,fontWeight:800,color:"#0B9635",fontFamily:"'Bebas Neue'"}}>{fG(refStats?.bonusGHS||0)}</div></div>
                <div style={{textAlign:"center",padding:10,background:"#0B0D10",borderRadius:8}}><div style={{fontSize:10,color:"#555",fontWeight:700,letterSpacing:1}}>BALANCE</div><div style={{fontSize:22,fontWeight:800,color:"#D4AF37",fontFamily:"'Bebas Neue'"}}>{fG(refStats?.currentBalance||0)}</div></div>
              </div>

              <div style={{fontSize:10,fontWeight:700,letterSpacing:2,color:"#555",marginBottom:8}}>YOUR REFERRAL LINK</div>
              <div style={{display:"flex",gap:8,marginBottom:16}}>
                <div style={{flex:1,padding:"10px 12px",background:"#0B0D10",border:"1px solid #1E2028",borderRadius:8,fontSize:11,color:"#0B9635",wordBreak:"break-all",fontFamily:"'Space Mono',monospace"}}>/signup?ref={refCode}</div>
                <button onClick={()=>{const link=`${window.location.origin}/signup?ref=${refCode}`;navigator.clipboard?.writeText(link);}} style={{padding:"10px 14px",background:"#0B963520",border:"1px solid #0B963530",borderRadius:8,color:"#0B9635",fontSize:11,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>Copy</button>
              </div>

              {refEarnings.length>0 && (<>
                <div style={{fontSize:10,fontWeight:700,letterSpacing:2,color:"#555",marginBottom:8}}>EARNINGS HISTORY</div>
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  {refEarnings.map((e,i)=>(
                    <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 12px",background:"#0B0D10",border:"1px solid #1E2028",borderRadius:8}}>
                      <div>
                        <div style={{fontSize:12,fontWeight:600,color:"#F0F0F2"}}>{e.referredUserId?.name||"User"}</div>
                        <div style={{fontSize:10,color:"#555"}}>{e.type==="signup"?"Signup fee":e.packageId?`${(e.packageId||"").charAt(0).toUpperCase()+(e.packageId||"").slice(1)} package`:"Package"}{e.gameId?` — ${e.gameId==="instant-virtual"?"Instant Virtual":e.gameId==="egames"?"eGames":e.gameId}`:""}</div>
                      </div>
                      <div style={{textAlign:"right"}}>
                        <div style={{fontSize:13,fontWeight:700,color:"#0B9635"}}>+{fG(e.amountEarned)}</div>
                        <div style={{fontSize:9,color:"#444"}}>{e.amountPaid?`Paid ${fG(e.amountPaid)}`:""}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>)}

              {refReferrals.length>0 && (<>
                <div style={{fontSize:10,fontWeight:700,letterSpacing:2,color:"#555",marginTop:16,marginBottom:8}}>REFERRED USERS</div>
                <div style={{display:"flex",flexDirection:"column",gap:4}}>
                  {refReferrals.map((r,i)=>(
                    <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 12px",background:"#0B0D10",borderRadius:6}}>
                      <span style={{fontSize:12,color:"#ccc"}}>{r.name}</span>
                      <span style={{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:4,background:r.status==="approved"?"#0B963515":"#D4AF3715",color:r.status==="approved"?"#0B9635":"#D4AF37"}}>{r.status}</span>
                    </div>
                  ))}
                </div>
              </>)}
            </div>
          </>
        )}
      </main>

      {/* SUBSCRIBE MODAL */}
      {subModal && (
        <div className="mo" onClick={closeSub}>
          <div className="mm" onClick={e=>e.stopPropagation()}>
            <div className="mm-bar" />
            <div className="mm-st"><div className={step>=1?"on":""}/><div className={step>=2?"on":""}/><div className={step>=3?"on":""}/></div>

            {step===1 && !submitted && (<div style={{animation:"fi .2s"}}>
              <div style={{textAlign:"center",marginBottom:18}}><div style={{fontSize:40,marginBottom:4}}>{subModal.icon}</div><div className="mm-ti">{subModal.name}</div><p className="mm-su">Select a package for this game</p></div>
              <div className="pkg">{PKGS.map(p=>{const s=selPkg===p.id;return(
                <div key={p.id} className={`pk ${s?"on":""}`} onClick={()=>setSelPkg(p.id)} style={{borderColor:s?p.color:"#1E2028",background:s?p.color+"10":"#0B0D10"}}>
                  <div className="pk-i">{p.icon}</div><div className="pk-n" style={{color:p.color}}>{p.name}</div><div className="pk-o">{p.odds}</div><div className="pk-p">{fG(p.price)}</div><div className="pk-u">≈ ${(p.price*R).toFixed(2)}</div><div className="pk-d">{p.max} pred{p.max>1?"s":""}</div>{s&&<div className="pk-c" style={{color:p.color}}>✓</div>}
                </div>);})}</div>
              {selPkg&&(()=>{const p=PKGS.find(x=>x.id===selPkg);if(!p)return null;return(<div className="det"><div className="det-l" style={{color:p.color}}>{p.icon} {p.name.toUpperCase()}</div>{p.features.map(f=><div key={f} className="det-f"><span style={{color:"#0B9635"}}>✓</span>{f}</div>)}<div className="det-t"><span style={{color:"#555",fontWeight:600}}>Total</span><span style={{fontFamily:"'Bebas Neue'",fontSize:22,color:"#0B9635",letterSpacing:1}}>{fB(p.price)}</span></div></div>);})()}
              <button className="ab" disabled={!selPkg} onClick={()=>setStep(2)} style={{background:selPkg?"#E31725":"#151820",color:selPkg?"#fff":"#444"}}>Continue to Payment →</button>
            </div>)}

            {step===2 && !submitted && (()=>{const p=PKGS.find(x=>x.id===selPkg);if(!p)return null;return(<div style={{animation:"fi .2s"}}>
              <div style={{textAlign:"center",marginBottom:16}}><div style={{fontSize:32,marginBottom:4}}>💳</div><div className="mm-ti">Payment</div><p className="mm-su">Send <strong style={{color:"#0B9635"}}>{fB(p.price)}</strong> for {subModal.icon} {subModal.name}</p></div>
              <div style={{background:"#0B0D10",border:"1px solid #151820",borderRadius:10,padding:"10px 14px",marginBottom:14,display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><span style={{fontSize:11,color:"#555"}}>{subModal.icon} {subModal.name}:</span> <span style={{fontWeight:700,color:p.color}}>{p.icon} {p.name}</span></div><span style={{fontFamily:"'Bebas Neue'",fontSize:18,color:"#0B9635"}}>{fG(p.price)}</span></div>
              <div style={{fontSize:10,fontWeight:700,letterSpacing:2,color:"#444",marginBottom:8}}>SELECT PAYMENT METHOD</div>
              <div className="pvg">{PROVS.map(pv=>{const s=selProv===pv.id;return(
                <div key={pv.id} className={`pv ${s?"on":""}`} onClick={()=>setSelProv(pv.id)} style={{borderColor:s?pv.color:"#1E2028",background:s?pv.color+"08":"#0B0D10"}}>
                  <div className="pv-d" style={{background:pv.color}} /><div><div className="pv-n" style={{color:s?pv.color:"#F0F0F2"}}>{pv.name}</div><div className="pv-nu">Number: {pv.num} • {pv.acct||"VirtualBet GH"}</div></div>{s&&<div className="pv-c" style={{color:pv.color}}>✓</div>}
                </div>);})}</div>
              {selProv&&(()=>{const pv=PROVS.find(x=>x.id===selProv);return(<div style={{background:pv.color+"08",border:`1px solid ${pv.color}20`,borderRadius:10,padding:14,marginBottom:14,animation:"fi .2s"}}><div style={{fontSize:10,fontWeight:700,letterSpacing:1.5,color:pv.color,marginBottom:6}}>SEND TO</div><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}><span style={{fontWeight:700,fontSize:16}}>{pv.num}</span><button onClick={()=>navigator.clipboard?.writeText(pv.num.replace(/-/g,""))} style={{background:pv.color+"15",color:pv.color,border:"none",padding:"4px 12px",borderRadius:6,fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans'"}}>Copy</button></div><div style={{fontSize:12,color:"#555"}}>Name: <strong style={{color:"#888"}}>{pv.acct||"VirtualBet GH"}</strong> • Amount: <strong style={{color:"#0B9635"}}>{fG(p.price)}</strong></div></div>);})()}
              <button className="ab" disabled={!selProv} onClick={()=>setStep(3)} style={{background:selProv?"#E31725":"#151820",color:selProv?"#fff":"#444"}}>I've Sent Payment →</button>
              <button className="bb" onClick={()=>setStep(1)}>← Back</button>
            </div>);})()}

            {step===3 && !submitted && (()=>{const p=PKGS.find(x=>x.id===selPkg);const pv=PROVS.find(x=>x.id===selProv);if(!p)return null;return(<div style={{animation:"fi .2s"}}>
              <div style={{textAlign:"center",marginBottom:16}}><div style={{fontSize:32,marginBottom:4}}>📋</div><div className="mm-ti">Submit Payment Proof</div><p className="mm-su">Enter your <strong style={{color:pv?.color}}>{pv?.name}</strong> transaction details & upload screenshot</p></div>
              <div style={{background:pv?.color+"08",border:`1px solid ${pv?.color}20`,borderRadius:10,padding:"10px 14px",marginBottom:14,display:"flex",alignItems:"center",gap:10}}><div className="pv-d" style={{background:pv?.color,flexShrink:0}} /><div><div style={{fontWeight:700,fontSize:13,color:pv?.color}}>{pv?.name}</div><div style={{fontSize:11,color:"#555"}}>{subModal.icon} {subModal.name} — {p.icon} {p.name} — {fG(p.price)}</div></div></div>
              <div style={{marginBottom:14}}><label style={{display:"block",fontSize:10,fontWeight:700,letterSpacing:2,color:"#444",marginBottom:5}}>{pv?.refLabel||"REFERENCE"}</label><input className="inp" placeholder={pv?.refPlaceholder||"e.g. REF-123456"} value={refNum} onChange={e=>setRefNum(e.target.value)} /></div>
              <div style={{marginBottom:14}}><label style={{display:"block",fontSize:10,fontWeight:700,letterSpacing:2,color:"#444",marginBottom:5}}>SENDER / MERCHANT NAME</label><input className="inp" placeholder="Name on the transaction" value={senderName} onChange={e=>setSenderName(e.target.value)} /></div>

              <div style={{marginBottom:14}}>
                <label style={{display:"block",fontSize:10,fontWeight:700,letterSpacing:2,color:"#444",marginBottom:5}}>PAYMENT SCREENSHOT *</label>
                {!payPreview ? (
                  <label style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"24px 16px",border:"2px dashed #E3172540",borderRadius:12,cursor:"pointer",background:"rgba(227,23,37,.03)",transition:"all .2s"}}>
                    <div style={{fontSize:28,marginBottom:4}}>📤</div>
                    <div style={{fontSize:12,fontWeight:600,color:"#888"}}>Tap to upload screenshot</div>
                    <div style={{fontSize:10,color:"#444",marginTop:2}}>PNG, JPG, WEBP — Max 10MB</div>
                    <input type="file" accept="image/*" onChange={handlePayScreenshot} style={{display:"none"}} />
                  </label>
                ) : (
                  <div style={{position:"relative",borderRadius:12,overflow:"hidden",border:"2px solid #0B963530"}}>
                    <img src={payPreview} alt="Payment proof" style={{width:"100%",maxHeight:180,objectFit:"contain",background:"#0B0D10"}} />
                    <button type="button" onClick={()=>{setPayScreenshot(null);setPayPreview(null)}} style={{position:"absolute",top:6,right:6,width:26,height:26,borderRadius:"50%",background:"#E31725",border:"none",color:"#fff",fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
                    <div style={{padding:"6px 10px",background:"#0B963510",fontSize:11,fontWeight:600,color:"#0B9635",textAlign:"center"}}>✓ Screenshot attached</div>
                  </div>
                )}
              </div>

              <div style={{background:"rgba(227,23,37,.04)",border:"1px solid rgba(227,23,37,.12)",borderRadius:10,padding:"10px 14px",marginBottom:14,fontSize:11,lineHeight:1.7}}>
                <div style={{fontWeight:700,color:"#E31725",marginBottom:2}}>⚠ WARNING</div>
                <div style={{color:"#888"}}>Uploading a fake or manipulated payment screenshot will result in an <strong style={{color:"#E31725"}}>immediate and permanent ban</strong>. All screenshots are verified manually.</div>
              </div>

              <div className="warn">🔒 Your payment is being processed. Your {subModal.name} package will be activated once verified.</div>
              {error && <div className="err">⚠ {error}</div>}
              <button className="ab" disabled={submitting||!refNum.trim()||!payScreenshot} onClick={submitRef} style={{background:(refNum.trim()&&payScreenshot)?"#0B9635":"#151820",color:(refNum.trim()&&payScreenshot)?"#fff":"#444"}}>{submitting?"Submitting...":"Submit Payment Proof"}</button>
              <button className="bb" onClick={()=>setStep(2)}>← Back</button>
            </div>);})()}

            {submitted && (()=>{const p=PKGS.find(x=>x.id===selPkg);const pv=PROVS.find(x=>x.id===selProv);return(<div style={{textAlign:"center",animation:"fi .3s"}}>
              <div className="suc-ic">✅</div>
              <div className="mm-ti">Request Submitted</div>
              <p className="mm-su">Your payment for {subModal.icon} {subModal.name} is being verified</p>
              <div className="suc-box">
                {[{l:"Game",v:`${subModal.icon} ${subModal.name}`},{l:"Package",v:`${p.icon} ${p.name}`,c:p.color},{l:"Amount",v:fB(p.price),c:"#0B9635"},{l:"Provider",v:pv.name,c:pv.color},{l:"Reference",v:refNum,mono:true},{l:"Sender",v:senderName||"—"}].map(r=>(
                  <div key={r.l} className="suc-r"><div className="suc-rl">{r.l}</div><div className="suc-rv" style={{color:r.c||"#F0F0F2",fontFamily:r.mono?"monospace":"inherit"}}>{r.v}</div></div>
                ))}
              </div>
              <p style={{fontSize:12,color:"#555",marginBottom:16}}>Your package will be activated once payment is confirmed.</p>
              <button className="ab" onClick={closeSub} style={{background:"#E31725",color:"#fff"}}>Done</button>
            </div>);})()}
          </div>
        </div>
      )}
    </div>
  );
}
