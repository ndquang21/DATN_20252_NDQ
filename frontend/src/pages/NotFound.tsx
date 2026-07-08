import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#edfcec] px-6 text-center">
      <div>
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-[#4f6f52]">
          404
        </p>
        <h1 className="text-3xl font-black text-slate-800 md:text-4xl">
          Không tìm thấy trang
        </h1>
        <p className="mt-3 text-slate-600">
          Trang bạn truy cập không tồn tại.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-full bg-[#4f6f52] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Về trang chủ
        </Link>
      </div>
    </div>
  );
}
