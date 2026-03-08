"use client";

import { useSession, signOut } from "next-auth/react";
import { Logo, Button, Badge } from "@/components/ui";
import Link from "next/link";

export default function Navbar() {
  const { data: session } = useSession();

  const handleLogout = () => signOut({ callbackUrl: "/" });

  return (
    <nav className="flex justify-between items-center px-6 py-3 bg-dark-card border-b border-dark-slate/30 sticky top-0 z-50 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <Link href={session?.user?.role === "admin" ? "/admin" : session ? "/dashboard" : "/"}>
          <Logo size="sm" />
        </Link>
        {session?.user?.role === "admin" && <Badge color="red" big>ADMIN</Badge>}
      </div>

      <div className="flex items-center gap-3">
        {session ? (
          <>
            {session.user.role !== "admin" && session.user.package && (
              <Badge color={session.user.package === "diamond" ? "diamond" : session.user.package === "platinum" ? "platinum" : "gold"}>
                {session.user.package === "gold" ? "🥇" : session.user.package === "platinum" ? "🥈" : "💎"} {session.user.package}
              </Badge>
            )}
            <span className="text-steel text-sm font-display">
              Hi, <strong className="text-smoke">{session.user.name}</strong>
            </span>
            <Button variant="ghost" sm onClick={handleLogout}>Logout</Button>
          </>
        ) : (
          <>
            <Link href="/login"><Button variant="outline" sm>Login</Button></Link>
            <Link href="/signup"><Button sm>Join Now</Button></Link>
          </>
        )}
      </div>
    </nav>
  );
}
