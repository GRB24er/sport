"use client";

import { useState, useEffect } from "react";
import { Button, Badge, Loading } from "@/components/ui";
import { PACKAGES, SIGNUP_FEE_GHS, fmtBoth } from "@/lib/constants";
import toast from "react-hot-toast";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const load = () => {
    fetch(`/api/users?status=${filter}`)
      .then((r) => r.json())
      .then((d) => setUsers(d.users || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { setLoading(true); load(); }, [filter]);

  const approve = async (id) => {
    await fetch("/api/users/approve", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: id }) });
    toast.success("Approved!"); load();
  };

  const deleteUser = async (id) => {
    if (!confirm("Delete this user permanently?")) return;
    await fetch(`/api/users/${id}`, { method: "DELETE" });
    toast.success("Deleted"); load();
  };

  if (loading) return <Loading />;

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-5 flex-wrap gap-3">
        <h2 className="text-2xl font-extrabold font-display">All Users ({users.length})</h2>
        <div className="flex gap-2">
          {["all", "approved", "pending", "rejected"].map((f) => (
            <Button key={f} variant={filter === f ? "primary" : "outline"} sm onClick={() => setFilter(f)}>{f}</Button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-dark-slate/30">
              {["Name", "Phone", "Package", "Ref #", "SportyBet", "Revenue", "Status", "Actions"].map((h) => (
                <th key={h} className="text-left px-3 py-2.5 text-steel text-[10px] font-bold tracking-widest uppercase font-display">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const pkg = PACKAGES.find((p) => p.id === u.package);
              const rev = SIGNUP_FEE_GHS + (pkg?.priceGHS || 0);
              const statusColor = u.status === "approved" ? "green" : u.status === "pending" ? "orange" : "red";
              return (
                <tr key={u._id} className="border-b border-dark-slate/15 hover:bg-dark-slate/10 transition-colors">
                  <td className="px-3 py-3 font-semibold">{u.name}</td>
                  <td className="px-3 py-3 text-steel">{u.phone}</td>
                  <td className="px-3 py-3"><Badge color={pkg?.id === "diamond" ? "diamond" : pkg?.id === "platinum" ? "platinum" : "gold"}>{pkg?.name}</Badge></td>
                  <td className="px-3 py-3 font-mono text-[11px] text-steel">{u.referenceNumber}</td>
                  <td className="px-3 py-3 text-brand-green text-xs">{u.sportyBetId}</td>
                  <td className="px-3 py-3 text-brand-green font-bold">{fmtBoth(rev)}</td>
                  <td className="px-3 py-3"><Badge color={statusColor}>{u.status}</Badge></td>
                  <td className="px-3 py-3">
                    <div className="flex gap-1.5">
                      {u.status === "pending" && <Button variant="green" sm onClick={() => approve(u._id)}>Approve</Button>}
                      <Button variant="danger" sm onClick={() => deleteUser(u._id)}>Delete</Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
