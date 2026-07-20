"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, user, clearAuth } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  const handleLogout = async () => {
    try {
      await api.post("/v1/auth/logout");
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      clearAuth();
      router.push("/login");
    }
  };

  if (!isAuthenticated) {
    return null; // Avoid flashing the dashboard content while redirecting
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b bg-white px-6 shadow-sm">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-xl font-bold text-slate-900">
            Rent Easy
          </Link>
          <nav className="ml-6 hidden md:flex gap-4">
            <Link 
              href="/dashboard" 
              className={`text-sm font-medium ${pathname === "/dashboard" ? "text-blue-600" : "text-slate-600 hover:text-slate-900"}`}
            >
              Dashboard
            </Link>
            <Link 
              href="/dashboard/properties" 
              className={`text-sm font-medium ${pathname.startsWith("/dashboard/properties") ? "text-blue-600" : "text-slate-600 hover:text-slate-900"}`}
            >
              Properties
            </Link>
            <Link 
              href="/dashboard/tenants" 
              className={`text-sm font-medium ${pathname.startsWith("/dashboard/tenants") ? "text-blue-600" : "text-slate-600 hover:text-slate-900"}`}
            >
              Tenants
            </Link>
            <Link 
              href="/dashboard/contracts" 
              className={`text-sm font-medium ${pathname.startsWith("/dashboard/contracts") ? "text-blue-600" : "text-slate-600 hover:text-slate-900"}`}
            >
              Contracts
            </Link>
            <Link 
              href="/dashboard/profile" 
              className={`text-sm font-medium ${pathname === "/dashboard/profile" ? "text-blue-600" : "text-slate-600 hover:text-slate-900"}`}
            >
              Profile
            </Link>
          </nav>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-600 font-medium">
            {user?.fullName}
          </span>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Đăng xuất
          </Button>
        </div>
      </header>
      
      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
