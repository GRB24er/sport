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
      let clientIP = "";
      try { const ipRes = await fetch("/api/auth/ip"); const ipData = await ipRes.json(); clientIP = ipData.ip || ""; } catch(e) {}
      const res = await signIn("credentials", { phone, password, clientIP, redirect: false });
      if (res?.error) { setError(res.error); setLoading(false); return; }
      const sess = await fetch("/api/auth/session").then(r => r.json());
      if (sess?.user?.role === "admin") { router.push("/admin"); } else { router.push("/dashboard"); }
    } catch (err) { setError("Login failed. Try again."); setLoading(false); }
  };
  return (
    <div style={{minHeight:"100vh",background:"#0B0D10",color:"#F0F0F2",fontFamily:"'DM Sans',sans-serif",display:"flex",flexDirection:"column"}}>
      <style>{'@import url("https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Bebas+Neue&display=swap");*{margin:0;padding:0;box-sizing:border-box}body{background:#0B0D10}@media(max-width:480px){.lcard{padding:28px 22px!important}.ltitle{font-size:28px!important}.lcontent{padding:24px 16px!important}}'}</style>
      <div style={{position:"fixed",inset:0,zIndex:0,backgroundImage:"url(/backdrop.png)",backgroundSize:"380px auto",backgroundRepeat:"repeat",opacity:0.03,pointerEvents:"none"}} />
      <div style={{position:"fixed",inset:0,zIndex:0,background:"linear-gradient(180deg,#0B0D10 0%,transparent 30%,transparent 70%,#0B0D10 100%)",pointerEvents:"none"}} />
      <div className="lcontent" style={{position:"relative",zIndex:1,flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:"40px 20px"}}>
        <div className="lcard" style={{width:"100%",maxWidth:420,background:"#12141A",border:"1px solid #1E2028",borderRadius:20,padding:"40px 36px",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:-80,right:-80,width:200,height:200,background:"radial-gradient(circle,#E3172515 0%,transparent 70%)",borderRadius:"50%",pointerEvents:"none"}} />
          <div style={{display:"flex",justifyContent:"center",marginBottom:32}}><a href="/"><img src="/images/logo.png" alt="VirtualBet" style={{height:LOGO_HEIGHT,width:"auto",objectFit:"contain"}} /></a></div>
          <h1 className="ltitle" style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:32,letterSpacing:2,textAlign:"center",marginBottom:4}}>Welcome Back</h1>
          <p style={{fontSize:14,color:"#555",textAlign:"center",marginBottom:28}}>Log in to access your predictions</p>
          <form onSubmit={handleLogin}>
            <div style={{marginBottom:18}}><label style={{display:"block",fontSize:11,fontWeight:700,letterSpacing:2,textTransform:"uppercase",color:"#555",marginBottom:6}}>Phone Number</label><input type="tel" placeholder="e.g. 0241234567" value={phone} onChange={e=>setPhone(e.target.value)} style={{width:"100%",padding:"14px 16px",background:"#0B0D10",border:"1px solid #1E2028",borderRadius:10,color:"#F0F0F2",fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:"none"}} /></div>
            <div style={{marginBottom:18}}><label style={{display:"block",fontSize:11,fontWeight:700,letterSpacing:2,textTransform:"uppercase",color:"#555",marginBottom:6}}>Password</label><div style={{position:"relative"}}><input type={showPw?"text":"password"} placeholder="Enter your password" value={password} onChange={e=>setPassword(e.target.value)} style={{width:"100%",padding:"14px 16px",paddingRight:52,background:"#0B0D10",border:"1px solid #1E2028",borderRadius:10,color:"#F0F0F2",fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:"none"}} /><button type="button" onClick={()=>setShowPw(!showPw)} style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"#555",cursor:"pointer",fontSize:13,fontFamily:"'DM Sans',sans-serif"}}>{showPw?"Hide":"Show"}</button></div></div>
            {error && <div style={{background:"#E3172510",border:"1px solid #E3172525",borderRadius:10,padding:"12px 16px",marginBottom:18,fontSize:13,color:"#E31725",fontWeight:600}}>{"⚠ "+error}</div>}
            <button type="submit" disabled={loading} style={{width:"100%",padding:16,background:"#E31725",color:"#fff",border:"none",borderRadius:10,fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",opacity:loading?0.6:1}}>{loading?"Logging in...":"Log In"}</button>
          </form>
          <div style={{textAlign:"center",marginTop:24,fontSize:13,color:"#555"}}>{"Don't have an account? "}<a href="/signup" style={{color:"#E31725",fontWeight:700,textDecoration:"none"}}>Sign Up</a></div>
        </div>
      </div>
      <div style={{position:"relative",zIndex:1,textAlign:"center",padding:20,fontSize:11,color:"#333",borderTop:"1px solid #1E2028"}}><img src="/images/logo.png" alt="VB" style={{height:32,width:"auto",objectFit:"contain",marginBottom:8,opacity:0.4}} /><div>{"© 2026 VirtualBet. 18+ Only."}</div></div>
    </div>
  );
}
