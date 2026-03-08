"use client";

import { useSession } from "next-auth/react";
import { Card } from "@/components/ui";
import { PACKAGES, SIGNUP_FEE_GHS, fmtBoth } from "@/lib/constants";

export default function SportyBetPage() {
  const { data: session } = useSession();
  const user = session?.user;
  const pkg = PACKAGES.find((p) => p.id === user?.package);

  const fields = [
    { label: "ACCOUNT ID", value: user?.sportyBetId || "—" },
    { label: "PHONE", value: user?.phone || "—" },
    { label: "PACKAGE", value: `${pkg?.icon} ${pkg?.name} — ${pkg?.odds}`, color: pkg?.color },
    { label: "PACKAGE PRICE", value: fmtBoth(pkg?.priceGHS || 0), color: "#0B9635" },
    { label: "TOTAL PAID", value: fmtBoth(SIGNUP_FEE_GHS + (pkg?.priceGHS || 0)), color: "#0B9635" },
  ];

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-extrabold font-display mb-5">SportyBet Integration</h2>

      <Card glow="green" className="max-w-md">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 bg-brand-green/15 rounded-xl flex items-center justify-center text-2xl">⚽</div>
          <div>
            <div className="font-extrabold text-lg font-display">SportyBet Account</div>
            <div className="text-brand-green text-sm font-semibold">Connected & Active</div>
          </div>
        </div>
        {fields.map((f) => (
          <div key={f.label} className="mb-4">
            <div className="text-steel text-[11px] font-bold tracking-widest mb-0.5 font-display">{f.label}</div>
            <div className="text-lg font-bold font-display" style={{ color: f.color || "#EEEFF1" }}>{f.value}</div>
          </div>
        ))}
      </Card>
    </div>
  );
}
