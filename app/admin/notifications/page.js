"use client";

import { useState, useEffect } from "react";
import { Button, Badge, EmptyState, Loading } from "@/components/ui";
import { timeAgo } from "@/lib/utils";
import toast from "react-hot-toast";

export default function AdminNotificationsPage() {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((d) => setNotifs(d.notifications || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const markAllRead = async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    });
    toast.success("All marked as read");
    load();
  };

  if (loading) return <Loading />;

  const icons = {
    payment: "💰",
    prediction_request: "📸",
    manual_prediction: "🤖",
    referral: "🔗",
    system: "🔔",
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-2xl font-extrabold font-display">Notifications</h2>
        <Button variant="outline" sm onClick={markAllRead}>Mark All Read</Button>
      </div>

      {notifs.length === 0 ? (
        <EmptyState icon="🔔" title="No notifications" description="You're all caught up!" />
      ) : notifs.map((n) => (
        <div key={n._id} className={`rounded-xl p-4 mb-2 border transition-all ${
          n.read ? "bg-dark-card border-dark-slate/30" : "bg-brand-crimson/8 border-brand-crimson/20"
        }`}>
          <div className="flex items-center gap-2 mb-1">
            <span>{icons[n.type] || "🔔"}</span>
            {!n.read && <Badge color="red">NEW</Badge>}
            <span className="text-steel text-[11px]">{timeAgo(n.createdAt)}</span>
          </div>
          <div className="text-sm text-smoke/85 leading-relaxed">{n.message}</div>
        </div>
      ))}
    </div>
  );
}
