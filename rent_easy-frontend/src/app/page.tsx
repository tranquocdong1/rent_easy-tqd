"use client";

import Link from "next/link";
import { useAuthStore } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import {
  Home,
  Building2,
  Users,
  FileText,
  Receipt,
  CreditCard,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  LayoutDashboard,
} from "lucide-react";

export default function LandingPage() {
  const { isAuthenticated } = useAuthStore();

  const features = [
    {
      icon: Building2,
      title: "Quản lý Bất động sản & Phòng",
      description: "Theo dõi danh sách tòa nhà, dãy phòng, trạng thái trống/đã thuê và thông số kỹ thuật chi tiết.",
      color: "bg-emerald-50 text-emerald-600 border-emerald-200/80",
    },
    {
      icon: Users,
      title: "Quản lý Hồ sơ Khách thuê",
      description: "Lưu trữ thông tin cá nhân, số CCCD, thông tin liên lạc và lịch sử thuê của từng cư dân.",
      color: "bg-sky-50 text-sky-600 border-sky-200/80",
    },
    {
      icon: FileText,
      title: "Hợp đồng Cho thuê Điện tử",
      description: "Tạo hợp đồng chuẩn pháp lý, theo dõi thời hạn hiệu lực, tiền cọc và kích hoạt/chấm dứt linh hoạt.",
      color: "bg-indigo-50 text-indigo-600 border-indigo-200/80",
    },
    {
      icon: Receipt,
      title: "Hóa đơn & Phụ phí Tự động",
      description: "Tính toán tiền nhà, điện, nước, dịch vụ và phát hành hóa đơn thu phí hàng tháng chính xác.",
      color: "bg-amber-50 text-amber-600 border-amber-200/80",
    },
    {
      icon: CreditCard,
      title: "Theo dõi Thanh toán & Nợ",
      description: "Ghi nhận biên lai tiền mặt, chuyển khoản, tự động gạch nợ và theo dõi số tiền nợ còn lại.",
      color: "bg-purple-50 text-purple-600 border-purple-200/80",
    },
  ];

  const benefits = [
    {
      icon: Zap,
      title: "Tìm kiếm & Lọc tức thì",
      description: "Hệ thống tìm kiếm theo thời gian thực trên từng ký tự gõ, giúp tra cứu dữ liệu cực nhanh.",
    },
    {
      icon: ShieldCheck,
      title: "Vận hành Ổn định 24/7",
      description: "Thiết kế khóa kích thước thẻ chuẩn hóa, không gây giật lag hay nhảy UI khi dữ liệu cập nhật.",
    },
    {
      icon: BarChart3,
      title: "Báo cáo Tài chính Đột phá",
      description: "Thống kê tổng quan doanh thu, hóa đơn nợ và lịch sử nộp tiền minh bạch từng khu trọ.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      {/* 1. Header Navigation */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-9 w-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-2xs group-hover:bg-black transition-colors">
              <Home className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-lg text-slate-900 tracking-tight block leading-none">
                Rent Easy
              </span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">
                Property Manager
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Button
                  asChild
                  className="rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-sm h-10 px-4 gap-2 shadow-2xs"
                >
                  <Link href="/dashboard">
                    <LayoutDashboard className="h-4 w-4" />
                    Vào Dashboard
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  asChild
                  variant="outline"
                  className="rounded-xl border-slate-300 font-bold text-sm h-10 px-4 text-slate-800 hover:bg-slate-100"
                >
                  <Link href="/login">Đăng nhập</Link>
                </Button>
                <Button
                  asChild
                  className="rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-sm h-10 px-4 gap-1.5 shadow-2xs"
                >
                  <Link href="/register">
                    Đăng ký ngay
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-12 pb-16 md:pt-20 md:pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6 max-w-3xl mx-auto">
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-200/80 text-xs font-bold text-slate-700 shadow-2xs">
              <Sparkles className="h-4 w-4 text-amber-500" />
              Nền tảng Quản lý Bất động sản & Nhà trọ Thế hệ mới
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight">
              Quản lý Nhà trọ & Cho thuê <br className="hidden sm:inline" />
              <span className="text-slate-600">Thông minh, Dễ dàng & Minh bạch</span>
            </h1>

            {/* Sub-headline */}
            <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed max-w-2xl mx-auto">
              Giải pháp toàn diện giúp chủ nhà trọ & nhà quản lý tự động hóa hóa đơn hàng tháng, theo dõi hợp đồng, quản lý khách thuê và kiểm soát dòng tiền chính xác 24/7.
            </p>

            {/* CTA Buttons */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                asChild
                className="w-full sm:w-auto rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-base h-12 px-8 gap-2 shadow-md"
              >
                <Link href={isAuthenticated ? "/dashboard" : "/register"}>
                  {isAuthenticated ? "Truy cập Dashboard" : "Bắt đầu Sử dụng Miễn phí"}
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              {!isAuthenticated && (
                <Button
                  asChild
                  variant="outline"
                  className="w-full sm:w-auto rounded-xl border-slate-300 font-bold text-base h-12 px-8 text-slate-800 hover:bg-slate-100"
                >
                  <Link href="/login">Đăng nhập Tài khoản</Link>
                </Button>
              )}
            </div>

            {/* Trust Badges */}
            <div className="pt-6 flex items-center justify-center gap-6 text-xs font-semibold text-slate-500">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Miễn phí trải nghiệm
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Không cần cài đặt
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Bảo mật dữ liệu
              </span>
            </div>
          </div>

          {/* Hero Visual Card / Dashboard Mockup Preview */}
          <div className="mt-12 max-w-5xl mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-red-400" />
                <div className="h-3 w-3 rounded-full bg-amber-400" />
                <div className="h-3 w-3 rounded-full bg-emerald-400" />
                <span className="text-xs font-bold text-slate-400 ml-2">
                  Rent Easy Control Center Overview
                </span>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Hệ thống sẵn sàng
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Tỷ lệ lấp đầy phòng
                </span>
                <p className="text-2xl font-black text-slate-900">96.5%</p>
                <span className="text-xs font-semibold text-emerald-600 block">
                  ↑ 12 phòng đang thuê active
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Tổng thu tháng hiện tại
                </span>
                <p className="text-2xl font-black text-emerald-700">
                  48.500.000 ₫
                </p>
                <span className="text-xs font-semibold text-slate-500 block">
                  Đã thu 85% hóa đơn
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Hóa đơn cần xử lý
                </span>
                <p className="text-2xl font-black text-amber-700">2 Hóa đơn</p>
                <span className="text-xs font-semibold text-amber-600 block">
                  Chờ gạch nợ thanh toán
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Core Modules Grid */}
      <section className="py-16 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
              5 Module Vận hành Chuyên nghiệp
            </h2>
            <p className="text-sm sm:text-base text-slate-500 font-medium">
              Được thiết kế chuẩn hóa đồng bộ với quy trình quản lý thực tế của các chuỗi nhà trọ & căn hộ dịch vụ.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="bg-slate-50/80 rounded-2xl p-6 border border-slate-200/80 space-y-4 hover:border-slate-300 transition-all shadow-2xs"
                >
                  <div
                    className={`h-12 w-12 rounded-xl flex items-center justify-center border shadow-2xs ${item.color}`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-lg font-bold text-slate-900">
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. System Key Benefits */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
              Tại sao chọn Rent Easy?
            </h2>
            <p className="text-sm sm:text-base text-slate-500 font-medium">
              Tối ưu hóa trải nghiệm người dùng với tốc độ xử lý vượt trội và giao diện chuẩn mực.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {benefits.map((benefit, idx) => {
              const Icon = benefit.icon;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl p-8 border border-slate-200/90 shadow-2xs text-center space-y-4"
                >
                  <div className="h-14 w-14 rounded-2xl bg-slate-100 text-slate-900 flex items-center justify-center mx-auto border border-slate-200/80">
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {benefit.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
              RE
            </div>
            <span className="text-sm font-bold text-slate-900">
              Rent Easy &copy; {new Date().getFullYear()} - Nền tảng Quản lý Bất động sản
            </span>
          </div>

          <div className="flex items-center gap-6 text-xs font-semibold text-slate-500">
            <Link href="/dashboard" className="hover:text-slate-900 transition-colors">
              Dashboard
            </Link>
            <Link href="/dashboard/properties" className="hover:text-slate-900 transition-colors">
              Properties
            </Link>
            <Link href="/login" className="hover:text-slate-900 transition-colors">
              Đăng nhập
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
