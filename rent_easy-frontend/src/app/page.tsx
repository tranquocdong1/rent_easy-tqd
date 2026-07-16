import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
      <div className="max-w-3xl w-full space-y-8 text-center">
        <h1 className="text-4xl font-bold text-slate-900">Rent Easy</h1>
        <p className="text-lg text-slate-600">Nền tảng quản lý nhà trọ thông minh</p>
        
        <div className="flex flex-wrap justify-center gap-4 pt-8">
          <Button asChild variant="default">
            <Link href="/login">Đăng nhập</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard">Dashboard</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/properties">Quản lý Properties & Rooms</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
