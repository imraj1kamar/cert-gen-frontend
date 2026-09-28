// components/ui/Breadcrumb.jsx
import React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Breadcrumb({ items = [], className }) {
  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center text-sm text-slate-500", className)}>
      <ol className="inline-flex items-center space-x-1 md:space-x-2">
        <li className="inline-flex items-center">
          <Link href="/" className="inline-flex items-center gap-1.5 hover:text-blue-600 font-medium">
            <Home className="w-4 h-4" />
            <span>Home</span>
          </Link>
        </li>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={index} className="inline-flex items-center">
              <ChevronRight className="w-4 h-4 text-slate-400 mx-1" />
              {isLast || !item.href ? (
                <span className="font-semibold text-slate-900">{item.label}</span>
              ) : (
                <Link href={item.href} className="hover:text-blue-600 font-medium">
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}