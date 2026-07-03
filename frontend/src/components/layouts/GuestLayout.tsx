import { useState } from "react";
import { Outlet, Link } from "react-router-dom";
import { LogIn, Dna } from "lucide-react";
import { FaFacebook, FaInstagram, FaYoutube } from "react-icons/fa";
import { AuthModal } from "../auth/AuthModal";

export default function GuestLayout() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="sticky top-0 z-40 w-full bg-[#edfcec] backdrop-blur-md border-b border-slate-200 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex cursor-pointer items-center gap-2.5 selection:bg-transparent">
              <Link
                to="/"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#006c49] text-on-primary shadow-md transition-all duration-300 hover:rotate-6"
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

            <div className="flex items-center">
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-primary rounded-full hover:bg-green-700 transition-colors shadow-sm cursor-pointer"
              >
                <LogIn size={18} />
                <span>Đăng nhập</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
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

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}
