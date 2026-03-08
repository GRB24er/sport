"use client";

import { useSession } from "next-auth/react";
import { Card, Button } from "@/components/ui";
import { PACKAGES, fmtGHS, fmtUSD, fmtBoth } from "@/lib/constants";

export default function PackagePage() {
  const { data: session } = useSession();
  const pkg = PACKAGES.find((p) => p.id === session?.user?.package);
  const upgrades = PACKAGES.filter((p) => p.priceGHS > (pkg?.priceGHS || 0));

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-extrabold font-display mb-5">My Package</h2>

      <Card glow={pkg?.id === "diamond" ? "gold" : "green"} className="max-w-sm mb-8">
        <div className="text-5xl mb-2">{pkg?.icon}</div>
        <h3 className="text-3xl font-extrabold font-display mb-0.5" style={{ color: pkg?.color }}>{pkg?.name}</h3>
        <div className="text-steel text-sm mb-4">{pkg?.tag} • {pkg?.odds}</div>
        <div className="text-3xl font-black mb-0.5">{fmtGHS(pkg?.priceGHS || 0)}</div>
        <div className="text-xs text-steel mb-5">≈ {fmtUSD(pkg?.priceGHS || 0)}</div>
        {pkg?.features.map((f) => (
          <div key={f} className="flex items-center gap-2 mb-2 text-sm text-smoke/80">
            <span className="text-brand-green">✓</span> {f}
          </div>
        ))}
      </Card>

      {upgrades.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-steel tracking-widest mb-3 font-display">UPGRADE OPTIONS</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {upgrades.map((p) => (
              <Card key={p.id} className="text-center">
                <div className="text-3xl">{p.icon}</div>
                <div className="font-bold font-display" style={{ color: p.color }}>{p.name}</div>
                <div className="text-2xl font-black my-1">{fmtGHS(p.priceGHS)}</div>
                <div className="text-steel text-xs mb-3">≈ {fmtUSD(p.priceGHS)} • {p.odds}</div>
                <Button variant="outline" full sm>Contact Admin to Upgrade</Button>
              </Card>
            ))}
          </div>
        </div>
      )}
      {upgrades.length === 0 && (
        <div className="text-brand-green font-bold p-5 font-display">🎉 You're on the highest tier!</div>
      )}
    </div>
  );
}
