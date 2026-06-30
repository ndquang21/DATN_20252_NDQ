import { Outlet, Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import AdminAccountModal from "../admin/AdminAccountModal";
import { DEFAULT_AVATAR_URL } from "../../constants/default-images";
import {
  LayoutDashboard,
  Users,
  UtensilsCrossed,
  CalendarRange,
  FlaskConical,
  LogOut,
  Menu,
  Dna,
  ChevronRight,
} from "lucide-react";

type NavItem = {
  name: string;
  path: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Tổng quan",
    items: [
      { name: "Dashboard", path: "/admin", icon: LayoutDashboard, end: true },
    ],
  },
  {
    label: "Quản lý",
    items: [
      { name: "Người dùng", path: "/admin/users", icon: Users },
      { name: "Món ăn hệ thống", path: "/admin/dishes", icon: UtensilsCrossed },
      {
        name: "Thực đơn gợi ý",
        path: "/admin/suggest-plans",
        icon: CalendarRange,
      },
      { name: "Chất dinh dưỡng", path: "/admin/nutrients", icon: FlaskConical },
    ],
  },
];

const ALL_LINKS = NAV_GROUPS.flatMap((g) => g.items);

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [accountOpen, setAccountOpen] = useState(false);

  const isActive = (path: string, end?: boolean) => {
    if (end || path === "/admin") {
      return location.pathname === path;
    }
    return (
      location.pathname === path || location.pathname.startsWith(`${path}/`)
    );
  };

  const pageTitle =
    ALL_LINKS.find((l) => isActive(l.path, l.end))?.name ?? "Admin";

  return (
    <div className="flex h-screen bg-[#f6f7f4] overflow-hidden">
      <aside className="w-64 bg-[#0f1a16] flex-shrink-0 flex flex-col">
        <div className="h-16 flex items-center px-5 border-b border-white/10">
          <Link to="/admin" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-on-primary shadow-md">
              <Dna className="h-4 w-4 stroke-[2.5] text-white" />
            </div>
            <div>
              <span className="font-display block text-lg font-black text-white leading-none">
                Foodi
              </span>
              <span className="block text-[10px] font-semibold tracking-wider text-primary-container/80 uppercase">
                Admin
              </span>
            </div>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-white/35">
                {group.label}
              </p>
              <nav className="space-y-1">
                {group.items.map((link) => {
                  const Icon = link.icon;
                  const active = isActive(link.path, link.end);
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        active
                          ? "bg-primary text-white shadow-md shadow-primary/20"
                          : "text-white/55 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <Icon size={18} />
                      {link.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-white/10">
          <button
            type="button"
            onClick={() => setAccountOpen(true)}
            className="w-full mb-3 flex items-center gap-2 px-3 py-2.5 rounded-xl text-left hover:bg-white/5 transition-colors cursor-pointer group"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">
                {user?.username}
              </p>
              <p className="text-xs text-white/45">Quản trị viên</p>
            </div>
            <ChevronRight
              size={16}
              className="text-white/30 group-hover:text-white/60 shrink-0 transition-colors"
            />
          </button>
          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-white/55 hover:text-tertiary-container hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut size={18} />
            Đăng xuất
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-outline-variant shadow-sm">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="md:hidden p-2 -ml-2 text-on-surface-variant hover:bg-surface-container-low rounded-lg"
            >
              <Menu size={22} />
            </button>
            <h2 className="font-display font-extrabold text-xl text-on-surface">
              {pageTitle}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <img
              src={user?.avatar_url || DEFAULT_AVATAR_URL}
              alt=""
              className="h-9 w-9 rounded-full object-cover border border-outline-variant"
            />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>

      {accountOpen && (
        <AdminAccountModal onClose={() => setAccountOpen(false)} />
      )}
    </div>
  );
}
