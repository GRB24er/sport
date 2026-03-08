"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { Button, Loading } from "@/components/ui";

export default function AdminLayout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [counts, setCounts] = useState({ pending: 0, users: 0, predictions: 0, uploads: 0, unread: 0 });

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (session && session.user.role !== "admin") router.push("/dashboard");
  }, [status, session, router]);

  useEffect(() => {
    if (session?.user?.role === "admin") {
      fetch("/api/admin/stats")
        .then((r) => r.json())
        .then((d) => {
          setCounts({
            pending: d.users?.pending || 0,
            users: d.users?.total || 0,
            predictions: d.predictions?.total || 0,
            uploads: d.uploads || 0,
            unread: d.unreadNotifications || 0,
          });
        })
        .catch(console.error);
    }
  }, [session]);

  if (status === "loading") return <Loading text="Loading admin..." />;
  if (!session || session.user.role !== "admin") return null;

  const sidebarItems = [
    { href: "/admin", icon: "📊", label: "Overview" },
    { href: "/admin/pending", icon: "⏳", label: "Pending", count: counts.pending, countColor: "red" },
    { href: "/admin/users", icon: "👥", label: "All Users", count: counts.users },
    { href: "/admin/predictions", icon: "🤖", label: "Predictions", count: counts.predictions },
    { href: "/admin/uploads", icon: "🖼️", label: "Uploads", count: counts.uploads },
    { href: "/admin/notifications", icon: "🔔", label: "Alerts", count: counts.unread, countColor: "red" },
  ];

  const footer = (
    <div className="p-3.5 bg-brand-green/8 rounded-xl border border-brand-green/20">
      <div className="text-[10px] text-brand-green font-bold tracking-widest mb-2 font-display">SEND PREDICTION</div>
      <Button variant="green" full sm onClick={() => router.push("/admin/predictions")}>
        + Manual Pick
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-dark-bg">
      <Navbar />
      <div className="flex min-h-[calc(100vh-53px)]">
        <Sidebar items={sidebarItems} footer={footer} />
        <main className="flex-1 p-6 overflow-y-auto max-h-[calc(100vh-53px)]">
          {children}
        </main>
      </div>
    </div>
  );
}
