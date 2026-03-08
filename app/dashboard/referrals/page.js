"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Card, Badge, Button, EmptyState, Loading } from "@/components/ui";
import { PACKAGES, REFERRAL_BONUS_GHS, fmtBoth } from "@/lib/constants";

export default function ReferralsPage() {
  const { data: session } = useSession();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/referrals")
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;

  const stats = data?.stats || { total: 0, approved: 0, pending: 0, bonusGHS: 0, bonusUSD: 0 };
  const referrals = data?.referrals || [];

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-extrabold font-display mb-1">My Referrals</h2>
      <p className="text-steel text-sm mb-5">
        Earn <span className="text-brand-green font-bold">{fmtBoth(REFERRAL_BONUS_GHS)}</span> for every approved signup!
      </p>

      {/* Stats */}
      <div className="bg-gradient-to-r from-brand-green/8 to-dark-card rounded-2xl p-6 border border-brand-green/20 mb-5">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-3xl font-black font-display">{stats.total}</div>
            <div className="text-steel text-xs">Total</div>
          </div>
          <div>
            <div className="text-3xl font-black font-display text-brand-green">{stats.approved}</div>
            <div className="text-steel text-xs">Approved</div>
          </div>
          <div>
            <div className="text-3xl font-black font-display text-brand-green">{fmtBoth(stats.bonusGHS)}</div>
            <div className="text-steel text-xs">Bonus</div>
          </div>
        </div>
      </div>

      {/* Referral Code */}
      <Card className="mb-5">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-[11px] text-steel font-bold tracking-widest mb-1 font-display">YOUR REFERRAL CODE</div>
            <code className="text-2xl font-black tracking-[0.15em] font-display">{session?.user?.referralCode}</code>
          </div>
          <Button onClick={() => navigator.clipboard?.writeText(session?.user?.referralCode || "")}>📋 Copy</Button>
        </div>
      </Card>

      {/* Referral List */}
      {referrals.length === 0 ? (
        <EmptyState icon="🔗" title="No referrals yet" description="Share your code to start earning!" />
      ) : (
        <div>
          <h3 className="text-sm font-bold text-steel tracking-widest mb-3 font-display">REFERRED USERS</h3>
          {referrals.map((r) => {
            const rPkg = PACKAGES.find((p) => p.id === r.package);
            return (
              <Card key={r._id} className="mb-2 flex justify-between items-center flex-wrap gap-2">
                <div>
                  <div className="font-bold text-sm font-display">{r.name}</div>
                  <div className="text-steel text-xs">{r.phone} • {rPkg?.icon} {rPkg?.name} • {fmtBoth(rPkg?.priceGHS || 0)}</div>
                </div>
                <Badge color={r.status === "approved" ? "green" : "orange"}>{r.status}</Badge>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
