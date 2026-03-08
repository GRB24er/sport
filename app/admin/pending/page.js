"use client";

import { useState, useEffect } from "react";
import { Card, Button, Badge, EmptyState, Loading } from "@/components/ui";
import { PACKAGES, SIGNUP_FEE_GHS, fmtBoth } from "@/lib/constants";
import toast from "react-hot-toast";

export default function PendingPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    fetch("/api/users?status=pending")
      .then((r) => r.json())
      .then((d) => setUsers(d.users || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const approve = async (id) => {
    const res = await fetch("/api/users/approve", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: id }) });
    if (res.ok) { toast.success("User approved!"); load(); }
  };

  const reject = async (id) => {
    const res = await fetch("/api/users/reject", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: id }) });
    if (res.ok) { toast.success("User rejected"); load(); }
  };

  if (loading) return <Loading />;

  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-extrabold font-display mb-5">Pending Payments ({users.length})</h2>

      {users.length === 0 ? (
        <EmptyState icon="✅" title="All caught up!" description="No pending payments to verify." />
      ) : users.map((u) => {
        const pkg = PACKAGES.find((p) => p.id === u.package);
        const total = SIGNUP_FEE_GHS + (pkg?.priceGHS || 0);
        return (
          <Card key={u._id} glow="red" className="mb-4">
            <div className="flex justify-between flex-wrap gap-4">
              <div>
                <div className="font-bold text-lg font-display mb-1">{u.name}</div>
                <div className="text-steel text-sm mb-0.5">Phone: <span className="text-smoke">{u.phone}</span></div>
                <div className="text-steel text-sm mb-0.5">Reference: <span className="text-brand-green font-bold font-mono">{u.referenceNumber}</span></div>
                <div className="text-steel text-sm mb-0.5">Package: <span className="font-bold" style={{ color: pkg?.color }}>{pkg?.icon} {pkg?.name} ({fmtBoth(pkg?.priceGHS || 0)})</span></div>
                <div className="text-steel text-sm mb-0.5">Total Expected: <span className="text-brand-green font-black">{fmtBoth(total)}</span></div>
                <div className="text-steel text-sm">SportyBet: <span className="text-smoke">{u.sportyBetId}</span></div>
                {u.referredBy && <div className="text-steel text-sm">Referred by: <span className="text-brand-gold">{u.referredBy}</span></div>}
                <div className="text-steel text-[11px] mt-2">Submitted: {new Date(u.createdAt).toLocaleString()}</div>
              </div>
              <div className="flex flex-col gap-2">
                <Button variant="green" onClick={() => approve(u._id)}>✓ Verify & Approve</Button>
                <Button variant="danger" onClick={() => reject(u._id)}>✗ Reject</Button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
