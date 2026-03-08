"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui";

export default function Sidebar({ items = [], footer }) {
  const pathname = usePathname();

  return (
    <aside className="w-[210px] bg-dark-card border-r border-dark-slate/30 py-4 flex-shrink-0 flex flex-col min-h-[calc(100vh-53px)]">
      <div className="flex-1">
        {items.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-5 py-3 text-sm font-semibold font-display transition-all duration-200 border-l-[3px] ${
                isActive
                  ? "bg-brand-red/10 border-brand-red text-smoke"
                  : "border-transparent text-steel hover:text-smoke hover:bg-dark-slate/20"
              }`}
            >
              <span className="text-[15px]">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.count > 0 && (
                <Badge color={item.countColor || "steel"}>{item.count}</Badge>
              )}
            </Link>
          );
        })}
      </div>
      {footer && <div className="px-4 pb-2">{footer}</div>}
    </aside>
  );
}
