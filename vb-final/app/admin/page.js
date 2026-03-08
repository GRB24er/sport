"use client";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

const LOGO = 60;
const R = 0.077;
const FEE = 50;
const fG = v => `GH₵${v.toLocaleString()}`;
const fB = v => `GH₵${v.toLocaleString()} ($${(v*R).toFixed(2)})`;
const PKGS = [
  { id:"gold",name:"Gold",price:200,color:"#D4AF37",icon:"🥇",max:1 },
  { id:"platinum",name:"Platinum",price:500,color:"#94A7BD",icon:"🥈",max:2 },
  { id:"diamond",name:"Diamond",price:1000,color:"#7DD3E8",icon:"💎",max:4 },
];
const getPkg = id => PKGS.find(p => p.id === id) || PKGS[0];
const tAgo = d => { const s=Math.floor((Date.now()-new Date(d))/1000); if(s<3600)return Math.floor(s/60)+"m"; if(s<86400)return Math.floor(s/3600)+"h"; return Math.floor(s/86400)+"d"; };

export default function AdminDash() {
  const {data:session,status} = useSession();
  const router = useRouter();
  const [tab,setTab] = useState("overview");
  const [sidebar,setSidebar] = useState(false);
  const [stats,setStats] = useState(null);
  const [users,setUsers] = useState([]);
  const [preds,setPreds] = useState([]);
  const [notifs,setNotifs] = useState([]);
  const [filter,setFilter] = useState("all");
  const [expanded,setExpanded] = useState(null);
  const [modal,setModal] = useState(false);
  const [mf,setMf] = useState({userId:"",home:"",away:"",analysis:"",note:"",sendAll:false,picks:[{market:"Match Result",pick:"",odd:""},{market:"Over/Under 2.5",pick:"",odd:""}]});
  const [sending,setSending] = useState(false);

  useEffect(() => {
    if(status==="unauthenticated") router.push("/login");
    if(session && session.user.role!=="admin") router.push("/dashboard");
  },[status,session,router]);

  const load = () => {
    fetch("/api/admin/stats").then(r=>r.json()).then(setStats).catch(()=>{});
    fetch("/api/users?status=all").then(r=>r.json()).then(d=>setUsers(d.users||[])).catch(()=>{});
    fetch("/api/predictions?limit=50").then(r=>r.json()).then(d=>setPreds(d.predictions||[])).catch(()=>{});
    fetch("/api/notifications").then(r=>r.json()).then(d=>setNotifs(d.notifications||[])).catch(()=>{});
  };

  useEffect(() => { if(session?.user?.role==="admin") load(); },[session]);

  if(status==="loading"||!session) return <div style={{minHeight:"100vh",background:"#0B0D10",display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{width:40,height:40,border:"3px solid #1E2028",borderTopColor:"#E31725",borderRadius:"50%",animation:"spin .8s linear infinite"}} /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style></div>;

  const pending = users.filter(u=>u.status==="pending");
  const approved = users.filter(u=>u.status==="approved");
  const unread = notifs.filter(n=>!n.read).length;
  const filtered = filter==="all"?users:users.filter(u=>u.status===filter);

  const approve = async id => { await fetch("/api/users/approve",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId:id})}); load(); };
  const reject = async id => { await fetch("/api/users/reject",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({userId:id})}); load(); };
  const remove = async id => { if(!confirm("Delete permanently?")) return; await fetch(`/api/users/${id}`,{method:"DELETE"}); load(); };
  const markRead = async () => { await fetch("/api/notifications",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({markAll:true})}); load(); };

  const sendPred = async () => {
    if(!mf.home||!mf.away) return;
    setSending(true);
    await fetch("/api/predictions/manual",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
      homeTeam:mf.home,awayTeam:mf.away,predictions:mf.picks.filter(p=>p.pick),analysis:mf.analysis,adminNote:mf.note,
      ...(mf.sendAll?{sendToAll:true}:{userId:mf.userId}),
    })});
    setSending(false); setModal(false);
    setMf({userId:"",home:"",away:"",analysis:"",note:"",sendAll:false,picks:[{market:"Match Result",pick:"",odd:""},{market:"Over/Under 2.5",pick:"",odd:""}]});
    load();
  };

  const TABS = [
    {id:"overview",icon:"📊",label:"Overview"},
    {id:"pending",icon:"⏳",label:"Pending",cnt:pending.length,cc:"#E31725"},
    {id:"users",icon:"👥",label:"Users",cnt:users.length},
    {id:"predictions",icon:"🤖",label:"Predictions",cnt:preds.length},
    {id:"notifs",icon:"🔔",label:"Notifications",cnt:unread,cc:unread>0?"#E31725":null},
  ];

  const inp = p => ({...p,style:{width:"100%",padding:"12px 14px",background:"#0B0D10",border:"1px solid #1E2028",borderRadius:8,color:"#F0F0F2",fontSize:13,fontFamily:"'DM Sans'",outline:"none",...(p.style||{})}});

  return (
    <div style={{minHeight:"100vh",background:"#0B0D10",color:"#F0F0F2",fontFamily:"'DM Sans',sans-serif"}}>
      <style>{`
        @keyframes slideIn{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes scaleIn{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .as{animation:slideIn .5s cubic-bezier(.16,1,.3,1) both}
        .d1{animation-delay:.1s}.d2{animation-delay:.2s}.d3{animation-delay:.3s}.d4{animation-delay:.4s}.d5{animation-delay:.5s}
        .abg{position:fixed;inset:0;z-index:0;background-image:url(/backdrop.png);background-size:380px auto;background-repeat:repeat;opacity:.02;pointer-events:none}
        @media(max-width:768px){
          .aside{position:fixed!important;left:-260px;top:53px;bottom:0;z-index:85;transition:left .3s!important;width:240px!important}
          .aside.open{left:0!important}
          .aover{display:none;position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:80}
          .aover.show{display:block!important}
          .aham{display:block!important}
          .amain{padding:20px 16px!important}
          .asgrid{grid-template-columns:1fr 1fr!important}
          .ahdr{padding:10px 16px!important}
        }
        @media(max-width:480px){.asgrid{grid-template-columns:1fr!important}.amain{padding:16px 12px!important}}
      `}</style>

      <div className="abg" />

      <header className="ahdr" style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 24px",borderBottom:"1px solid #151820",background:"#0B0D10F0",backdropFilter:"blur(20px)",position:"sticky",top:0,zIndex:90}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <button className="aham" style={{display:"none",background:"none",border:"none",color:"#F0F0F2",fontSize:22,cursor:"pointer"}} onClick={()=>setSidebar(!sidebar)}>☰</button>
          <a href="/"><img src="/images/logo.png" alt="VB" style={{height:LOGO,width:"auto",objectFit:"contain"}} /></a>
          <span style={{fontSize:10,fontWeight:700,letterSpacing:1.5,padding:"4px 12px",borderRadius:8,background:"#E3172518",color:"#E31725"}}>ADMIN</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{position:"relative",cursor:"pointer"}} onClick={()=>setTab("notifs")}><span style={{fontSize:18}}>🔔</span>{unread>0&&<span style={{position:"absolute",top:-4,right:-6,background:"#E31725",color:"#fff",fontSize:8,fontWeight:800,width:16,height:16,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center"}}>{unread}</span>}</div>
          <button onClick={()=>signOut({callbackUrl:"/"})} style={{background:"none",border:"1px solid #1E2028",color:"#555",padding:"6px 14px",borderRadius:8,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans'"}}>Logout</button>
        </div>
      </header>

      <div style={{display:"flex",position:"relative",zIndex:1,minHeight:"calc(100vh - 53px)"}}>
        <div className={`aover ${sidebar?"show":""}`} onClick={()=>setSidebar(false)} />

        <aside className={`aside ${sidebar?"open":""}`} style={{width:220,background:"#0E1015",borderRight:"1px solid #151820",padding:"16px 0",flexShrink:0,display:"flex",flexDirection:"column"}}>
          <nav style={{flex:1}}>{TABS.map(t=>(
            <div key={t.id} onClick={()=>{setTab(t.id);setSidebar(false)}} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 20px",cursor:"pointer",borderLeft:tab===t.id?"3px solid #E31725":"3px solid transparent",background:tab===t.id?"#E3172508":"transparent",color:tab===t.id?"#F0F0F2":"#555",fontSize:13,fontWeight:500,transition:"all .15s"}}>
              <span style={{fontSize:16,width:22,textAlign:"center"}}>{t.icon}</span><span>{t.label}</span>
              {t.cnt!=null&&<span style={{marginLeft:"auto",fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:10,background:(t.cc||"#555")+"18",color:t.cc||"#555"}}>{t.cnt}</span>}
            </div>
          ))}</nav>
          <div style={{padding:"14px 20px",borderTop:"1px solid #151820"}}><button onClick={()=>setModal(true)} style={{width:"100%",padding:"14px",background:"#0B9635",color:"#fff",border:"none",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans'"}}>+ Send Prediction</button></div>
        </aside>

        <main className="amain" style={{flex:1,padding:"28px 32px",overflowY:"auto",maxHeight:"calc(100vh - 53px)"}}>

          {/* OVERVIEW */}
          {tab==="overview"&&(<div className="as">
            <h1 style={{fontFamily:"'Bebas Neue'",fontSize:28,letterSpacing:2,marginBottom:4}}>Admin Dashboard</h1>
            <p style={{fontSize:14,color:"#555",marginBottom:20}}>Platform overview</p>
            <div className="asgrid" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:20}}>
              {[{l:"Users",v:stats?.users?.total||0,icon:"👥"},{l:"Approved",v:stats?.users?.approved||0,icon:"✅",c:"#0B9635"},{l:"Pending",v:stats?.users?.pending||0,icon:"⏳",c:(stats?.users?.pending||0)>0?"#E31725":"#555"},{l:"Revenue",v:fG(stats?.revenue?.totalGHS||0),icon:"💰",c:"#0B9635",s:`≈ $${stats?.revenue?.totalUSD||0}`},{l:"Predictions",v:stats?.predictions?.total||0,icon:"🤖"},{l:"Unread",v:unread,icon:"🔔",c:unread>0?"#E31725":"#555"}].map((s,i)=>(
                <div key={s.l} className={`as d${i+1}`} style={{background:"#12141A",border:"1px solid #151820",borderRadius:14,padding:18}}><div style={{fontSize:10,fontWeight:700,letterSpacing:2,color:"#444",marginBottom:6}}>{s.icon} {s.l}</div><div style={{fontFamily:"'Bebas Neue'",fontSize:s.l==="Revenue"?18:24,color:s.c||"#F0F0F2",letterSpacing:1}}>{s.v}</div>{s.s&&<div style={{fontSize:11,color:"#444",marginTop:2}}>{s.s}</div>}</div>
              ))}
            </div>
            {/* Package breakdown */}
            <div style={{fontSize:10,fontWeight:700,letterSpacing:2,color:"#444",marginBottom:10}}>PACKAGES</div>
            <div className="asgrid" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:20}}>
              {PKGS.map((p,i)=>{const d=stats?.packages?.[p.id];return(
                <div key={p.id} className={`as d${i+1}`} style={{background:"#12141A",border:"1px solid #151820",borderRadius:14,padding:18,textAlign:"center"}}><div style={{fontSize:28}}>{p.icon}</div><div style={{fontFamily:"'Bebas Neue'",fontSize:18,color:p.color,letterSpacing:1}}>{p.name}</div><div style={{fontFamily:"'Bebas Neue'",fontSize:28}}>{d?.count||0}</div><div style={{fontSize:11,color:"#444"}}>{fB(d?.revenueGHS||0)}</div></div>
              );})}
            </div>
            {/* Pending */}
            {pending.length>0&&(<div><div style={{fontSize:10,fontWeight:700,letterSpacing:2,color:"#E31725",marginBottom:10}}>🔴 PENDING</div>
              {pending.map(u=>{const p=getPkg(u.package);return(
                <div key={u._id} className="as" style={{background:"#12141A",border:"1px solid #E3172520",borderRadius:14,padding:22,marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
                  <div><div style={{fontWeight:700,fontSize:15}}>{u.name} <span style={{color:"#444",fontWeight:400,fontSize:12}}>({u.phone})</span></div><div style={{fontSize:12,color:"#444",marginTop:2}}>Ref: <span style={{color:"#0B9635",fontWeight:700,fontFamily:"monospace"}}>{u.referenceNumber}</span> • {p.icon} {p.name} • {fB(FEE)}</div></div>
                  <div style={{display:"flex",gap:6}}><button onClick={()=>approve(u._id)} style={{background:"#0B9635",color:"#fff",border:"none",padding:"8px 16px",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans'"}}>✓ Approve</button><button onClick={()=>reject(u._id)} style={{background:"#AE0C0E",color:"#fff",border:"none",padding:"8px 16px",borderRadius:8,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans'"}}>✗ Reject</button></div>
                </div>
              );})}
            </div>)}
          </div>)}

          {/* PENDING */}
          {tab==="pending"&&(<div className="as">
            <h1 style={{fontFamily:"'Bebas Neue'",fontSize:28,letterSpacing:2,marginBottom:20}}>Pending ({pending.length})</h1>
            {pending.length===0?<div style={{textAlign:"center",padding:48,color:"#444"}}><div style={{fontSize:48,marginBottom:8}}>✅</div><div style={{fontWeight:700}}>All caught up!</div></div>:
            pending.map((u,i)=>{const p=getPkg(u.package);return(
              <div key={u._id} className={`as d${Math.min(i+1,5)}`} style={{background:"#12141A",border:"1px solid #E3172520",borderRadius:14,padding:22,marginBottom:12}}>
                <div style={{display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:14}}>
                  <div><div style={{fontWeight:700,fontSize:17,marginBottom:6}}>{u.name}</div>
                    {[{l:"Phone",v:u.phone},{l:"Email",v:u.email},{l:"Ref",v:u.referenceNumber,c:"#0B9635",m:true},{l:"Package",v:`${p.icon} ${p.name} (${fB(p.price)})`,c:p.color},{l:"Fee",v:fB(FEE),c:"#0B9635"},{l:"SportyBet",v:u.sportyBetId},{l:"Referred By",v:u.referredBy||"—",c:u.referredBy?"#D4AF37":"#333"},{l:"Date",v:new Date(u.createdAt).toLocaleString()}].map(r=>(
                      <div key={r.l} style={{fontSize:13,color:"#555",marginBottom:3}}>{r.l}: <span style={{color:r.c||"#F0F0F2",fontWeight:600,fontFamily:r.m?"monospace":"inherit"}}>{r.v}</span></div>
                    ))}
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    <button onClick={()=>approve(u._id)} style={{background:"#0B9635",color:"#fff",border:"none",padding:"14px 24px",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans'"}}>✓ Approve</button>
                    <button onClick={()=>reject(u._id)} style={{background:"#AE0C0E",color:"#fff",border:"none",padding:"14px 24px",borderRadius:10,fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans'"}}>✗ Reject</button>
                  </div>
                </div>
              </div>
            );})}
          </div>)}

          {/* USERS */}
          {tab==="users"&&(<div className="as">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:10}}>
              <h1 style={{fontFamily:"'Bebas Neue'",fontSize:28,letterSpacing:2}}>Users ({filtered.length})</h1>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{["all","approved","pending","rejected"].map(f=>(
                <button key={f} onClick={()=>setFilter(f)} style={{padding:"6px 14px",borderRadius:8,fontSize:11,fontWeight:700,cursor:"pointer",border:filter===f?"1px solid #E31725":"1px solid #1E2028",background:filter===f?"#E31725":"transparent",color:filter===f?"#fff":"#555",fontFamily:"'DM Sans'",letterSpacing:.5,textTransform:"uppercase"}}>{f}</button>
              ))}</div>
            </div>
            <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
              <thead><tr>{["Name","Phone","Pkg","Ref","Status","Actions"].map(h=><th key={h} style={{textAlign:"left",padding:"10px 10px",color:"#444",fontSize:10,fontWeight:700,letterSpacing:1.5,borderBottom:"1px solid #151820"}}>{h}</th>)}</tr></thead>
              <tbody>{filtered.map(u=>{const p=getPkg(u.package);return(
                <tr key={u._id} style={{borderBottom:"1px solid #15182080"}}><td style={{padding:10,fontWeight:600}}>{u.name}</td><td style={{padding:10,color:"#555"}}>{u.phone}</td><td style={{padding:10}}><span style={{fontSize:10,fontWeight:700,padding:"3px 10px",borderRadius:10,background:p.color+"18",color:p.color}}>{p.icon} {p.name}</span></td><td style={{padding:10,fontFamily:"monospace",fontSize:11,color:"#555"}}>{u.referenceNumber}</td><td style={{padding:10}}><span style={{fontSize:10,fontWeight:700,padding:"3px 10px",borderRadius:10,background:u.status==="approved"?"#0B963518":u.status==="pending"?"#D4AF3718":"#E3172518",color:u.status==="approved"?"#0B9635":u.status==="pending"?"#D4AF37":"#E31725"}}>{u.status}</span></td><td style={{padding:10}}><div style={{display:"flex",gap:4}}>{u.status==="pending"&&<button onClick={()=>approve(u._id)} style={{background:"#0B9635",color:"#fff",border:"none",padding:"6px 12px",borderRadius:6,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans'"}}>Approve</button>}<button onClick={()=>remove(u._id)} style={{background:"#AE0C0E",color:"#fff",border:"none",padding:"6px 12px",borderRadius:6,fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans'"}}>Delete</button></div></td></tr>
              )})}</tbody>
            </table></div>
          </div>)}

          {/* PREDICTIONS */}
          {tab==="predictions"&&(<div className="as">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:10}}>
              <h1 style={{fontFamily:"'Bebas Neue'",fontSize:28,letterSpacing:2}}>Predictions ({preds.length})</h1>
              <button onClick={()=>setModal(true)} style={{background:"#0B9635",color:"#fff",border:"none",padding:"10px 20px",borderRadius:10,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans'"}}>+ Manual</button>
            </div>
            {preds.map((p,i)=>(
              <div key={p._id||i} className={`as d${Math.min(i+1,5)}`} style={{background:"#12141A",border:"1px solid #151820",borderRadius:14,marginBottom:10,overflow:"hidden"}}>
                <div style={{padding:"14px 18px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}} onClick={()=>setExpanded(expanded===(p._id||i)?null:(p._id||i))}>
                  <div><div style={{fontSize:11,color:"#444",marginBottom:2}}>To: <span style={{color:"#F0F0F2",fontWeight:600}}>{p.userId?.name||"User"}</span></div><span style={{fontSize:10,fontWeight:700,padding:"3px 10px",borderRadius:6,background:p.type==="ai"?"#0B963518":"#D4AF3718",color:p.type==="ai"?"#0B9635":"#D4AF37"}}>{p.type==="ai"?"🤖 AI":"👨‍💼 Manual"}</span><span style={{fontWeight:700,fontSize:14,marginLeft:8}}>{p.match}</span></div>
                  <div style={{textAlign:"right"}}><div style={{fontFamily:"'Bebas Neue'",fontSize:20,color:"#0B9635"}}>{p.totalOdd}x</div></div>
                </div>
                {expanded===(p._id||i)&&(<div style={{padding:"0 18px 18px",borderTop:"1px solid #151820",animation:"fadeIn .3s"}}><div style={{background:"#0B0D10",borderRadius:10,padding:12,margin:"12px 0",fontSize:13,color:"#666",lineHeight:1.6}}>{p.analysis}</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8}}>{p.predictions?.map((pk,j)=>(<div key={j} style={{background:"#0B0D10",border:"1px solid #151820",borderRadius:8,padding:12}}><div style={{fontSize:10,color:"#444",fontWeight:700,letterSpacing:1,marginBottom:4}}>{pk.market}</div><div style={{fontSize:15,fontWeight:800,marginBottom:3}}>{pk.pick}</div><div style={{color:"#0B9635",fontWeight:700,fontSize:13}}>{pk.odd}x</div></div>))}</div>
                  {p.adminNote&&<div style={{background:"#D4AF3708",border:"1px solid #D4AF3718",borderRadius:8,padding:"8px 12px",marginTop:10,fontSize:12,color:"#D4AF37"}}>💡 {p.adminNote}</div>}
                </div>)}
              </div>
            ))}
          </div>)}

          {/* NOTIFICATIONS */}
          {tab==="notifs"&&(<div className="as">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <h1 style={{fontFamily:"'Bebas Neue'",fontSize:28,letterSpacing:2}}>Notifications</h1>
              <button onClick={markRead} style={{background:"transparent",color:"#F0F0F2",border:"1px solid #2A2D34",padding:"8px 16px",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'DM Sans'"}}>Mark All Read</button>
            </div>
            {notifs.length===0?<div style={{textAlign:"center",padding:48,color:"#444"}}>No notifications</div>:
            notifs.map((n,i)=>(
              <div key={n._id||i} className={`as d${Math.min(i+1,5)}`} style={{borderRadius:12,padding:"14px 18px",marginBottom:8,border:"1px solid "+(n.read?"#151820":"#E3172518"),background:n.read?"#12141A":"#E3172506"}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                  <span>{n.type==="payment"?"💰":n.type==="manual_prediction"?"🤖":"🔔"}</span>
                  {!n.read&&<span style={{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:10,background:"#E3172518",color:"#E31725"}}>NEW</span>}
                  <span style={{fontSize:11,color:"#333"}}>{tAgo(n.createdAt)} ago</span>
                </div>
                <div style={{fontSize:13,color:"#888",lineHeight:1.5}}>{n.message}</div>
              </div>
            ))}
          </div>)}

        </main>
      </div>

      {/* MANUAL PREDICTION MODAL */}
      {modal&&(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:20,animation:"fadeIn .2s"}} onClick={()=>setModal(false)}>
        <div style={{background:"#12141A",border:"1px solid #1E2028",borderRadius:20,padding:32,maxWidth:520,width:"100%",maxHeight:"85vh",overflowY:"auto",animation:"scaleIn .3s cubic-bezier(.16,1,.3,1)",position:"relative"}} onClick={e=>e.stopPropagation()}>
          <button onClick={()=>setModal(false)} style={{position:"absolute",top:14,right:14,background:"none",border:"none",color:"#555",fontSize:20,cursor:"pointer"}}>✕</button>
          <h2 style={{fontFamily:"'Bebas Neue'",fontSize:24,letterSpacing:2,marginBottom:4}}>Send Prediction</h2>
          <p style={{fontSize:13,color:"#444",marginBottom:18}}>Deliver to users</p>

          <div style={{marginBottom:14}}><label style={{display:"block",fontSize:10,fontWeight:700,letterSpacing:2,color:"#444",marginBottom:5}}>SEND TO</label>
            <div style={{display:"flex",gap:6,marginBottom:8,flexWrap:"wrap"}}>
              <button onClick={()=>setMf(f=>({...f,sendAll:false}))} style={{padding:"6px 14px",borderRadius:8,fontSize:11,fontWeight:700,border:!mf.sendAll?"1px solid #E31725":"1px solid #1E2028",background:!mf.sendAll?"#E31725":"transparent",color:!mf.sendAll?"#fff":"#555",cursor:"pointer",fontFamily:"'DM Sans'"}}>User</button>
              <button onClick={()=>setMf(f=>({...f,sendAll:true,userId:""}))} style={{padding:"6px 14px",borderRadius:8,fontSize:11,fontWeight:700,border:mf.sendAll?"1px solid #E31725":"1px solid #1E2028",background:mf.sendAll?"#E31725":"transparent",color:mf.sendAll?"#fff":"#555",cursor:"pointer",fontFamily:"'DM Sans'"}}>All ({approved.length})</button>
            </div>
            {!mf.sendAll&&<select {...inp({value:mf.userId,onChange:e=>setMf(f=>({...f,userId:e.target.value}))})}><option value="">Select...</option>{approved.map(u=><option key={u._id} value={u._id}>{u.name} ({u.phone})</option>)}</select>}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
            <div><label style={{display:"block",fontSize:10,fontWeight:700,letterSpacing:2,color:"#444",marginBottom:5}}>HOME</label><input {...inp({placeholder:"Bayern VR",value:mf.home,onChange:e=>setMf(f=>({...f,home:e.target.value}))})} /></div>
            <div><label style={{display:"block",fontSize:10,fontWeight:700,letterSpacing:2,color:"#444",marginBottom:5}}>AWAY</label><input {...inp({placeholder:"Chelsea VR",value:mf.away,onChange:e=>setMf(f=>({...f,away:e.target.value}))})} /></div>
          </div>
          <div style={{marginBottom:14}}><label style={{display:"block",fontSize:10,fontWeight:700,letterSpacing:2,color:"#444",marginBottom:5}}>ANALYSIS</label><textarea {...inp({style:{minHeight:70,resize:"vertical",width:"100%",padding:"12px 14px",background:"#0B0D10",border:"1px solid #1E2028",borderRadius:8,color:"#F0F0F2",fontSize:13,fontFamily:"'DM Sans'",outline:"none"},placeholder:"Expert analysis...",value:mf.analysis,onChange:e=>setMf(f=>({...f,analysis:e.target.value}))})} /></div>
          <div style={{marginBottom:14}}><label style={{display:"block",fontSize:10,fontWeight:700,letterSpacing:2,color:"#444",marginBottom:5}}>NOTE</label><input {...inp({placeholder:"e.g. High confidence",value:mf.note,onChange:e=>setMf(f=>({...f,note:e.target.value}))})} /></div>
          <div style={{marginBottom:14}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><label style={{fontSize:10,fontWeight:700,letterSpacing:2,color:"#444"}}>PICKS</label><button onClick={()=>setMf(f=>({...f,picks:[...f.picks,{market:"",pick:"",odd:""}]}))} style={{background:"transparent",color:"#F0F0F2",border:"1px solid #2A2D34",padding:"4px 10px",borderRadius:6,fontSize:10,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans'"}}>+ Add</button></div>
            {mf.picks.map((p,i)=>(<div key={i} style={{display:"grid",gridTemplateColumns:"2fr 2fr 1fr",gap:6,marginBottom:6}}>
              <input {...inp({placeholder:"Market",value:p.market,onChange:e=>{const picks=[...mf.picks];picks[i].market=e.target.value;setMf(f=>({...f,picks}))}})} />
              <input {...inp({placeholder:"Pick",value:p.pick,onChange:e=>{const picks=[...mf.picks];picks[i].pick=e.target.value;setMf(f=>({...f,picks}))}})} />
              <input {...inp({placeholder:"Odd",value:p.odd,onChange:e=>{const picks=[...mf.picks];picks[i].odd=e.target.value;setMf(f=>({...f,picks}))}})} />
            </div>))}
          </div>
          <button onClick={sendPred} disabled={sending||!mf.home||!mf.away||(!mf.sendAll&&!mf.userId)} style={{width:"100%",padding:16,background:"#0B9635",color:"#fff",border:"none",borderRadius:10,fontSize:15,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans'",opacity:(!mf.home||!mf.away)?.5:1}}>{sending?"Sending...":"Send Prediction"}</button>
        </div>
      </div>)}
    </div>
  );
}
