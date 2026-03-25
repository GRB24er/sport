"use client";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

const PKGS_DEF = { gold:{name:"Gold",max:1,icon:"\u{1F947}",color:"#D4AF37"}, platinum:{name:"Platinum",max:2,icon:"\u{1F948}",color:"#94A7BD"}, diamond:{name:"Diamond",max:4,icon:"\u{1F48E}",color:"#7DD3E8"} };
const GMETA = { "instant-virtual":{name:"Instant Virtual",icon:"\u26BD",color:"#0B9635"}, "egames":{name:"eGames",icon:"\u{1F3AE}",color:"#8B5CF6"} };

export default function PredictPage() {
  const {data:session,status}=useSession();
  const router=useRouter();
  const sp=useSearchParams();
  const gameId=sp.get("game")||"instant-virtual";
  const gm=GMETA[gameId]||GMETA["instant-virtual"];
  const isIV = gameId === "instant-virtual";

  const fileRef=useRef(null);
  const [userData,setUserData]=useState(null);
  const [siteSettings,setSiteSettings]=useState(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");

  // Instant Virtual state
  const [uploads,setUploads]=useState([]);
  const [preview,setPreview]=useState(null);
  const [uploading,setUploading]=useState(false);
  const [uploadSuccess,setUploadSuccess]=useState(false);

  // eGames state
  const [rounds,setRounds]=useState([]);
  const [claiming,setClaiming]=useState(null);
  const [expanded,setExpanded]=useState(null);

  useEffect(()=>{if(status==="unauthenticated")router.push("/login");},[status]);

  const isFirstLoad=useRef(true);
  const loadAll=async()=>{
    if(!session?.user?.id||session.user.id==="admin") return;
    if(isFirstLoad.current) setLoading(true);
    try{
      const res=await fetch(`/api/predict?gameId=${gameId}`);
      if(res.ok){
        const d=await res.json();
        if(d.user) setUserData(d.user);
        if(d.settings) setSiteSettings(d.settings);
        if(isIV) setUploads(d.uploads||[]);
        else setRounds(d.rounds||[]);
      } else if(isFirstLoad.current){
        setError("Failed to load your data. Please refresh.");
      }
    }catch(e){
      if(isFirstLoad.current) setError("Network error. Check your connection.");
    }
    setLoading(false);
    isFirstLoad.current=false;
  };

  useEffect(()=>{isFirstLoad.current=true;loadAll();},[session,gameId]);
  // Poll every 90s — single API call instead of 4
  useEffect(()=>{if(!session?.user?.id)return;const i=setInterval(loadAll,90000);return()=>clearInterval(i);},[session,gameId]);

  // Instant Virtual — upload screenshot
  const handleFile=(e)=>{
    const f=e.target.files?.[0];
    if(!f) return;
    setError("");
    const r=new FileReader();
    r.onload=(ev)=>setPreview(ev.target.result);
    r.readAsDataURL(f);
  };

  const submitUpload=async()=>{
    if(!preview) return;
    setUploading(true);setError("");
    try{
      const res=await fetch("/api/uploads",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({imageBase64:preview,gameId:"instant-virtual"})});
      const data=await res.json();
      if(res.status===403){setError(data.message);setUploading(false);return;}
      if(res.status===429){setError(data.message);loadAll();setUploading(false);return;}
      if(!res.ok){setError(data.error||"Failed");setUploading(false);return;}
      setUploadSuccess(true);setPreview(null);
      loadAll();
    }catch(e){setError("Network error");}
    setUploading(false);
  };

  // eGames — claim round
  const claimRound=async(roundId)=>{
    setClaiming(roundId);setError("");
    try{
      const res=await fetch("/api/rounds",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({roundId})});
      const data=await res.json();
      if(res.status===429){setError(data.message);loadAll();setClaiming(null);return;}
      if(!res.ok){setError(data.error||"Failed");setClaiming(null);return;}
      setExpanded(roundId);loadAll();
    }catch(e){setError("Network error");}
    setClaiming(null);
  };

  if(status==="loading"||!session) return(
    <div style={{minHeight:"100vh",background:"#0B0D10",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{width:44,height:44,border:"3px solid #1E2028",borderTopColor:"#E31725",borderRadius:"50%",animation:"sp .8s linear infinite"}}/>
      <style>{`@keyframes sp{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const pss = siteSettings || {};
  const PKGS = {
    gold:{...PKGS_DEF.gold, max:pss.goldMaxPreds||1},
    platinum:{...PKGS_DEF.platinum, max:pss.platinumMaxPreds||2},
    diamond:{...PKGS_DEF.diamond, max:pss.diamondMaxPreds||4},
  };

  const gp=userData?.gamePackages||{};
  const gamePkg=gp[gameId];
  const hasPkg=!!gamePkg;
  const pkg=hasPkg?PKGS[gamePkg.package]:null;
  const used=gamePkg?.predictionsUsed||0;
  const max=pkg?.max||0;
  const left=max-used;

  // Instant Virtual helpers
  const pendingUploads = uploads.filter(u=>u.status==="pending");
  const respondedUploads = uploads.filter(u=>u.status==="responded" && new Date(u.respondedAt||u.updatedAt).getTime() > Date.now() - 30*60*1000);

  // User stays on page if they have active uploads even without package
  const hasActiveUploads = isIV && (pendingUploads.length > 0 || respondedUploads.length > 0);
  const canAccess = hasPkg || hasActiveUploads;

  return(
    <div className="pg">
      <style>{`
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Bebas+Neue&display=swap');
*{margin:0;padding:0;box-sizing:border-box}body{background:#0B0D10;overflow-x:hidden}
.pg{min-height:100vh;background:#0B0D10;color:#F0F0F2;font-family:'DM Sans',sans-serif}
@keyframes sp{to{transform:rotate(360deg)}}@keyframes su{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}@keyframes fi{from{opacity:0}to{opacity:1}}@keyframes pu{0%,100%{opacity:1}50%{opacity:.4}}
.asu{animation:su .5s cubic-bezier(.16,1,.3,1) both}.ad1{animation-delay:.05s}.ad2{animation-delay:.1s}.ad3{animation-delay:.15s}
.vbg{position:fixed;inset:0;z-index:0;opacity:.02;pointer-events:none}
.hdr{display:flex;justify-content:space-between;align-items:center;padding:12px 20px;border-bottom:1px solid #151820;background:#0B0D10F0;backdrop-filter:blur(20px);position:sticky;top:0;z-index:90}
.mn{max-width:540px;margin:0 auto;padding:24px 20px;position:relative;z-index:1}
.cd{background:#12141A;border:1px solid #1E2028;border-radius:16px;overflow:hidden;margin-bottom:14px}
.lbl{font-size:10px;font-weight:700;letter-spacing:2px;color:#444;text-transform:uppercase;margin-bottom:4px}
.bv{font-family:'Bebas Neue',sans-serif;letter-spacing:1px}
.btn{padding:12px 20px;border-radius:10px;border:none;font-weight:700;font-size:13px;cursor:pointer;font-family:'DM Sans';transition:all .15s;width:100%}.btn:active{transform:scale(.97)}.btn:disabled{opacity:.4;cursor:not-allowed}
.err{background:#E3172510;border:1px solid #E3172520;border-radius:10px;padding:12px 14px;margin-bottom:14px;font-size:13px;color:#E31725;font-weight:600}
.succ{background:#0B963510;border:1px solid #0B963520;border-radius:10px;padding:12px 14px;margin-bottom:14px;font-size:13px;color:#0B9635;font-weight:600}
.empty{text-align:center;padding:48px 20px;color:#444}
.match{background:#0B0D10;border:1px solid #151820;border-radius:12px;padding:14px;margin-bottom:8px}
.pick{display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid #15182050}.pick:last-child{border-bottom:none}
@media(max-width:420px){.hdr{padding:8px 12px!important}.mn{padding:16px 12px!important}}
      `}</style>

      <div className="vbg"/>
      <header className="hdr">
        <div style={{display:"flex",alignItems:"center",gap:10,cursor:"pointer"}} onClick={()=>router.push("/dashboard")}>
          <span style={{fontSize:18,color:"#888"}}>{"\u2190"}</span>
          <img src="/images/logo.png" alt="VB" style={{height:40,width:"auto"}}/>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:18}}>{gm.icon}</span>
          <span className="bv" style={{fontSize:18,letterSpacing:2}}>{gm.name}</span>
          {pkg&&<span style={{fontSize:10,fontWeight:700,padding:"3px 10px",borderRadius:6,background:pkg.color+"18",color:pkg.color}}>{pkg.icon} {left} left</span>}
        </div>
      </header>

      <main className="mn">

        {/* ═══ NO PACKAGE ═══ */}
        {!canAccess&&!loading&&(
          <div className="asu empty">
            <div style={{fontSize:56,marginBottom:12}}>{"\u{1F512}"}</div>
            <div className="bv" style={{fontSize:28,color:"#F0F0F2",marginBottom:8}}>No Active Package</div>
            <p style={{fontSize:14,marginBottom:24}}>Subscribe to {gm.name} to start.</p>
            <button className="btn" onClick={()=>router.push("/dashboard")} style={{background:"#E31725",color:"#fff",maxWidth:260,margin:"0 auto"}}>{"\u2190"} Back to Games</button>
          </div>
        )}

        {/* ═══ HAS PACKAGE ═══ */}
        {canAccess&&(
          <div className="asu">
            {/* Stats bar */}
            {hasPkg?(
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:20}}>
                <div className="cd" style={{padding:14,textAlign:"center"}}><div className="lbl">CREDITS</div><div className="bv" style={{fontSize:24,color:"#0B9635"}}>{left}</div></div>
                <div className="cd" style={{padding:14,textAlign:"center"}}><div className="lbl">PACKAGE</div><div className="bv" style={{fontSize:16,color:pkg.color}}>{pkg.icon} {pkg.name}</div></div>
                <div className="cd" style={{padding:14,textAlign:"center"}}><div className="lbl">USED</div><div className="bv" style={{fontSize:24}}>{used}/{max}</div></div>
              </div>
            ):(
              <div className="cd" style={{padding:14,textAlign:"center",marginBottom:20,borderColor:"#D4AF3730"}}>
                <div style={{fontSize:11,fontWeight:700,color:"#D4AF37",letterSpacing:1}}>{pendingUploads.length>0?"\u23F3 ANALYSIS IN PROGRESS":"\u2705 PREDICTIONS DELIVERED"}</div>
                <div style={{fontSize:12,color:"#555",marginTop:4}}>Credits used. {respondedUploads.length>0?"Viewing expires in 30 min.":"Your prediction is being prepared."}</div>
              </div>
            )}

            {error&&<div className="err">{"\u26A0"} {error}</div>}

            {loading?(
              <div className="empty"><div style={{width:36,height:36,border:"3px solid #1E2028",borderTopColor:gm.color,borderRadius:"50%",animation:"sp .8s linear infinite",margin:"0 auto 12px"}}/><div>Loading...</div></div>
            ):(
              <>
                {/* ════════════════════════════════════════════ */}
                {/* INSTANT VIRTUAL — Upload Screenshot System  */}
                {/* ════════════════════════════════════════════ */}
                {isIV&&(
                  <div>
                    {/* Upload area */}
                    {left > 0 && !uploadSuccess && (
                      <div className="cd" style={{padding:18}}>
                        <div className="lbl">UPLOAD SPORTYBET SCREENSHOT</div>
                        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{display:"none"}}/>

                        {!preview?(
                          <div onClick={()=>fileRef.current?.click()} style={{border:"2px dashed #1E2028",borderRadius:14,padding:"36px 16px",textAlign:"center",cursor:"pointer",marginTop:8,transition:"all .2s"}}>
                            <div style={{fontSize:36,marginBottom:8}}>{"\u{1F4F8}"}</div>
                            <div style={{fontWeight:700,fontSize:14}}>Tap to Upload</div>
                            <div style={{color:"#444",fontSize:12,marginTop:4}}>Take a clear screenshot of the match</div>
                          </div>
                        ):(
                          <div style={{marginTop:8}}>
                            <div style={{borderRadius:12,overflow:"hidden",border:"1px solid #151820",marginBottom:12}}>
                              <img src={preview} style={{width:"100%",maxHeight:240,objectFit:"contain",display:"block",background:"#0B0D10"}}/>
                            </div>
                            <div style={{display:"flex",gap:8}}>
                              <button className="btn" onClick={()=>setPreview(null)} style={{background:"transparent",color:"#888",border:"1px solid #1E2028",flex:1}}>Cancel</button>
                              <button className="btn" disabled={uploading} onClick={submitUpload} style={{background:"#0B9635",color:"#fff",flex:2}}>{uploading?"Uploading...":"\u{1F4E4} Submit for Analysis"}</button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {uploadSuccess&&(
                      <div className="succ" style={{textAlign:"center",padding:20}}>
                        {"\u2705"} Screenshot submitted! Our system is analyzing your match. Stay on this page — your prediction will appear here automatically.
                      </div>
                    )}

                    {left <= 0 && pendingUploads.length === 0 && respondedUploads.length === 0 && (
                      <div className="cd" style={{padding:20,textAlign:"center"}}>
                        <div style={{fontSize:11,color:"#E31725",fontWeight:700}}>Credits exhausted. Subscribe again to upload more.</div>
                      </div>
                    )}

                    {/* Pending uploads */}
                    {pendingUploads.length > 0 && (
                      <div>
                        <div className="lbl" style={{marginBottom:8,marginTop:16}}>PENDING ({pendingUploads.length})</div>
                        {pendingUploads.map((u,i)=>(
                          <div key={u._id} className="cd asu ad1" style={{padding:16,borderColor:"#D4AF3720"}}>
                            <div style={{display:"flex",alignItems:"center",gap:10}}>
                              <div style={{width:50,height:50,borderRadius:10,overflow:"hidden",border:"1px solid #1E2028",flexShrink:0}}>
                                <img src={u.imageData} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                              </div>
                              <div style={{flex:1}}>
                                <div style={{fontWeight:700,fontSize:13}}>Screenshot #{i+1}</div>
                                <div style={{fontSize:11,color:"#444",marginTop:2}}>{new Date(u.createdAt).toLocaleString()}</div>
                              </div>
                              <div style={{display:"flex",alignItems:"center",gap:6}}>
                                <div style={{width:6,height:6,borderRadius:"50%",background:"#D4AF37",animation:"pu 1.5s infinite"}}/>
                                <span style={{fontSize:10,fontWeight:700,color:"#D4AF37"}}>ANALYZING</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}


                    {/* Responded — show predictions (multiple matches) */}
                    {respondedUploads.length > 0 && (
                      <div>
                        <div className="lbl" style={{marginBottom:8,marginTop:16}}>YOUR PREDICTIONS ({respondedUploads.length})</div>
                        {respondedUploads.map(u=>(
                          <div key={u._id} className="cd asu ad2" style={{borderColor:"#0B963520"}}>
                            <div style={{padding:16}}>
                              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                                <span style={{fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:4,background:"#0B963518",color:"#0B9635"}}>{"\u2705"} READY — {u.matches?.length||0} MATCHES</span>
                                <div className="bv" style={{fontSize:24,color:"#0B9635"}}>{u.totalOdd}x</div>
                              </div>

                              {u.matches?.map((m,mi)=>(
                                <div key={mi} className="match">
                                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                                    <div style={{fontWeight:700,fontSize:14}}>{m.homeTeam} vs {m.awayTeam}</div>
                                    <span style={{fontSize:10,fontWeight:700,padding:"3px 8px",borderRadius:4,background:gm.color+"12",color:gm.color}}>MATCH {mi+1}</span>
                                  </div>
                                  {m.picks?.map((pk,pi)=>(
                                    <div key={pi} className="pick">
                                      <div>
                                        <div style={{fontSize:10,color:"#444",fontWeight:700}}>{pk.market}</div>
                                        <div style={{fontSize:15,fontWeight:800,marginTop:2}}>{pk.pick}</div>
                                      </div>
                                      <span style={{color:"#0B9635",fontWeight:700,fontSize:14}}>{pk.odd}x</span>
                                    </div>
                                  ))}
                                </div>
                              ))}

                              {u.adminNote&&<div style={{marginTop:8,padding:"8px 12px",background:"#D4AF3708",border:"1px solid #D4AF3718",borderRadius:8,fontSize:11,color:"#D4AF37"}}>{"\u{1F4A1}"} {u.adminNote}</div>}

                              {u.sportyBetLink&&<a href={u.sportyBetLink} target="_blank" rel="noopener noreferrer" style={{display:"block",marginTop:10,padding:12,background:"#E3172510",border:"1px solid #E3172520",borderRadius:10,textAlign:"center",textDecoration:"none",fontSize:13,fontWeight:700,color:"#E31725"}}>Place Bet on SportyBet {"\u2192"}</a>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* No uploads yet and has credits */}
                    {uploads.length===0&&left>0&&!uploadSuccess&&(
                      <div style={{textAlign:"center",color:"#444",fontSize:13,marginTop:16}}>Upload your first SportyBet screenshot above to get a prediction!</div>
                    )}
                  </div>
                )}

                {/* ════════════════════════════════════ */}
                {/* eGAMES — Rounds System               */}
                {/* ════════════════════════════════════ */}
                {!isIV&&(
                  <div>
                    {rounds.length===0?(
                      <div className="empty">
                        <div style={{width:64,height:64,borderRadius:16,background:"#E3172508",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>
                          <div style={{width:28,height:28,border:"3px solid #1E2028",borderTopColor:"#E31725",borderRadius:"50%",animation:"sp 1.5s linear infinite"}}/>
                        </div>
                        <div style={{fontWeight:700,fontSize:16,color:"#F0F0F2",marginBottom:6}}>System Update in Progress</div>
                        <div style={{fontSize:13,lineHeight:1.6,maxWidth:300,margin:"0 auto",marginBottom:16}}>We're running a quick security patch. Predictions will be available shortly.</div>
                        <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"#E3172508",padding:"8px 16px",borderRadius:8}}>
                          <div style={{width:6,height:6,borderRadius:"50%",background:"#E31725",animation:"pu 1.5s infinite"}}/>
                          <span style={{fontSize:11,color:"#E31725",fontWeight:700,letterSpacing:1}}>BACK IN 3-5 MINUTES</span>
                        </div>
                      </div>
                    ):(
                      <>
                        <div style={{fontSize:10,fontWeight:700,letterSpacing:2,color:"#333",marginBottom:10}}>{gm.icon} LIVE ROUNDS ({rounds.length})</div>
                        {rounds.map((r,i)=>{
                          const isClaimed=r.claimed;
                          const isLocked=!isClaimed&&left<=0;
                          const isOpen=expanded===r._id;
                          return(
                            <div key={r._id} className={`cd asu ad${Math.min(i+1,3)}`} style={{borderColor:isClaimed?gm.color+"30":"#1E2028"}}>
                              <div style={{padding:"16px 18px",cursor:"pointer"}} onClick={()=>setExpanded(isOpen?null:r._id)}>
                                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                                    {isClaimed&&<span style={{fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:4,background:"#0B963518",color:"#0B9635"}}>{"\u2705"} UNLOCKED</span>}
                                    {!isClaimed&&!isLocked&&<span style={{fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:4,background:gm.color+"15",color:gm.color}}>{"\u{1F525}"} NEW</span>}
                                    {isLocked&&<span style={{fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:4,background:"#E3172515",color:"#E31725"}}>{"\u{1F512}"} LOCKED</span>}
                                  </div>
                                  {isClaimed?<span className="bv" style={{fontSize:22,color:"#0B9635"}}>{r.totalOdd}x</span>:<span className="bv" style={{fontSize:20,color:"#444"}}>???</span>}
                                </div>
                                <div style={{fontWeight:700,fontSize:14}}>{r.matches.length} Matches</div>
                                <div style={{fontSize:12,color:"#555",marginTop:2}}>{r.matches.map(m=>`${m.homeTeam} vs ${m.awayTeam}`).join(" \u2022 ")}</div>
                              </div>

                              {isClaimed&&isOpen&&(
                                <div style={{padding:"0 18px 18px",animation:"fi .3s"}}>
                                  {r.matches.map((m,mi)=>(
                                    <div key={mi} className="match">
                                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                                        <div>
                                          <div style={{fontWeight:700,fontSize:14}}>{m.homeTeam} vs {m.awayTeam}</div>
                                          {m.matchTime&&<div style={{fontSize:11,color:"#444",marginTop:2}}>{m.matchTime}</div>}
                                        </div>
                                        <span style={{fontSize:10,fontWeight:700,padding:"3px 8px",borderRadius:4,background:gm.color+"12",color:gm.color}}>MATCH {mi+1}</span>
                                      </div>
                                      {m.picks?.map((pk,pi)=>(
                                        <div key={pi} className="pick">
                                          <div>
                                            <div style={{fontSize:10,color:"#444",fontWeight:700}}>{pk.market}</div>
                                            <div style={{fontSize:15,fontWeight:800,marginTop:2}}>{pk.pick}</div>
                                          </div>
                                          <span style={{color:"#0B9635",fontWeight:700,fontSize:14}}>{pk.odd}x</span>
                                        </div>
                                      ))}
                                    </div>
                                  ))}
                                  {r.adminNote&&<div style={{marginTop:8,padding:"8px 12px",background:"#D4AF3708",border:"1px solid #D4AF3718",borderRadius:8,fontSize:11,color:"#D4AF37"}}>{"\u{1F4A1}"} {r.adminNote}</div>}
                                  {r.sportyBetLink&&<a href={r.sportyBetLink} target="_blank" rel="noopener noreferrer" style={{display:"block",marginTop:8,padding:12,background:"#E3172510",border:"1px solid #E3172520",borderRadius:10,textAlign:"center",textDecoration:"none",fontSize:13,fontWeight:700,color:"#E31725"}}>Place Bet on SportyBet {"\u2192"}</a>}
                                </div>
                              )}

                              {!isClaimed&&(
                                <div style={{padding:"0 18px 18px"}}>
                                  <div style={{background:"#0B0D10",borderRadius:10,padding:16,textAlign:"center",marginBottom:10}}>
                                    <div style={{fontSize:24,marginBottom:6,filter:"blur(3px)",color:"#333"}}>{"\u{1F512}"} {"\u{1F512}"} {"\u{1F512}"}</div>
                                    <div style={{fontSize:12,color:"#555"}}>{isLocked?"No credits left.":"Unlock to see all predictions"}</div>
                                  </div>
                                  <button className="btn" disabled={isLocked||claiming===r._id} onClick={()=>claimRound(r._id)} style={{background:isLocked?"#151820":gm.color,color:isLocked?"#444":"#fff",padding:14,fontSize:14}}>
                                    {claiming===r._id?"Unlocking...":isLocked?"\u{1F512} No Credits":`Unlock Round \u2014 ${left} credit${left!==1?"s":""} left`}
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
