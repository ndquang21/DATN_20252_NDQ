import { useState, useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  LogOut,
  Home,
  Utensils,
  Dna,
  User as UserIcon,
  Menu,
  X,
} from "lucide-react";
import { FaFacebook, FaInstagram, FaYoutube } from "react-icons/fa";
import { DEFAULT_AVATAR_URL } from "../../constants/default-images";

const NAV_LINKS = [
  {
    to: "/home",
    label: "Trang chủ",
    icon: Home,
    isActive: (path: string) => path === "/home",
  },
  {
    to: "/suggest-plans",
    label: "Thực đơn",
    icon: Utensils,
    isActive: (path: string) =>
      path === "/suggest-plans" || path.startsWith("/suggest-plans/"),
  },
  {
    to: "/basic-info",
    label: "Hồ sơ",
    icon: UserIcon,
    isActive: (path: string) => path === "/basic-info",
  },
] as const;

function navLinkClass(active: boolean) {
  return `px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
    active
      ? "bg-green-50 text-green-700"
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
  }`;
}

export default function UserLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3 md:gap-8">
              <button
                type="button"
                onClick={() => setMobileNavOpen((open) => !open)}
                className="md:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                aria-label={mobileNavOpen ? "Đóng menu" : "Mở menu"}
                aria-expanded={mobileNavOpen}
              >
                {mobileNavOpen ? <X size={22} /> : <Menu size={22} />}
              </button>

              <div className="flex cursor-pointer items-center gap-2.5 selection:bg-transparent">
                <Link
                  to="/home"
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-on-primary shadow-md transition-all duration-300 hover:rotate-6"
                >
                  <Dna className="h-5 w-5 stroke-[2.5] text-white" />
                </Link>
                <div>
                  <span className="font-display block text-2xl font-black tracking-tight leading-none text-primary">
                    Foodi
                  </span>
                  <span className="mt-0.5 block font-display text-[9px] font-medium tracking-widest text-neutral-400 capitalize">
                    Academic Dinh Dưỡng
                  </span>
                </div>
              </div>

              <nav className="hidden md:flex items-center gap-1">
                {NAV_LINKS.map(({ to, label, icon: Icon, isActive }) => {
                  const active = isActive(location.pathname);
                  return (
                    <Link key={to} to={to} className={navLinkClass(active)}>
                      <Icon size={18} />
                      {label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-semibold text-slate-800">
                  {user?.username}
                </span>
              </div>
              <img
                src={user?.avatar_url || DEFAULT_AVATAR_URL}
                alt="User Avatar"
                className="h-9 w-9 rounded-full object-cover border border-slate-200 shadow-sm"
              />
              <div className="w-px h-6 bg-slate-200 mx-1"></div>
              <button
                onClick={logout}
                className="p-2 text-slate-500 cursor-pointer hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                title="Đăng xuất"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>

        {mobileNavOpen && (
          <nav className="md:hidden border-t border-slate-100 bg-white px-4 py-2 shadow-sm">
            {NAV_LINKS.map(({ to, label, icon: Icon, isActive }) => {
              const active = isActive(location.pathname);
              return (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMobileNavOpen(false)}
                  className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-green-50 text-green-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Icon size={18} />
                    {label}
                  </span>
                </Link>
              );
            })}
          </nav>
        )}
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 h-fit mb-12 p-6">
          <Outlet />
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 mt-auto py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#4f6f52] text-sm tracking-tight">
                Foodi
              </span>
              <span className="text-slate-300">|</span>
              <span>Giải pháp dinh dưỡng và sức khỏe cá nhân hóa</span>
            </div>

            <div className="flex items-center gap-5">
              <div className="flex items-center gap-3.5 text-slate-400">
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#4f6f52] transition-colors"
                >
                  <FaFacebook size={16} />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#4f6f52] transition-colors"
                >
                  <FaInstagram size={16} />
                </a>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#4f6f52] transition-colors"
                >
                  <FaYoutube size={16} />
                </a>
              </div>

              <span className="text-slate-200 text-[10px]">|</span>

              <div>
                &copy; {new Date().getFullYear()} Foodi Inc. All rights
                reserved.
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
