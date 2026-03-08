"use client";
import { Suspense } from "react";
import dynamic from "next/dynamic";
const PredictPage = dynamic(() => import("./PredictContent"), { ssr: false });
export default function Page() {
  return <Suspense fallback={<div style={{minHeight:"100vh",background:"#0B0D10",display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{width:44,height:44,border:"3px solid #1E2028",borderTopColor:"#E31725",borderRadius:"50%",animation:"sp .8s linear infinite"}}/><style>{"@keyframes sp{to{transform:rotate(360deg)}}"}</style></div>}><PredictPage/></Suspense>;
}
