import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Dna } from "lucide-react";
import { authService } from "../services/auth.service";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (!token) {
      setIsError(true);
      setMessage("Link không hợp lệ. Vui lòng yêu cầu gửi lại email.");
      return;
    }
    if (newPassword.length < 6) {
      setIsError(true);
      setMessage("Mật khẩu tối thiểu 6 ký tự.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setIsError(true);
      setMessage("Mật khẩu xác nhận không khớp.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await authService.resetPassword({
        token,
        newPassword,
        confirmPassword,
      });
      setIsError(false);
      setMessage(res.data.message || "Đặt lại mật khẩu thành công.");
      setTimeout(() => navigate("/"), 2500);
    } catch (err: unknown) {
      setIsError(true);
      const msg = (err as { response?: { data?: { error?: string } } })
        ?.response?.data?.error;
      setMessage(msg || "Không đặt lại được mật khẩu.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary">
            <Dna className="h-5 w-5 stroke-[2.5] text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Đặt mật khẩu mới</h1>
          <p className="text-sm text-slate-500">Foodi</p>
        </div>

        {message && (
          <div
            className={`mb-4 rounded-lg px-3 py-2 text-sm ${
              isError
                ? "border border-red-200 bg-red-50 text-red-700"
                : "border border-green-200 bg-green-50 text-green-700"
            }`}
          >
            {message}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-sm font-medium text-slate-700">
              Mật khẩu mới
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#4f6f52]"
              placeholder="Ít nhất 6 ký tự"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">
              Xác nhận mật khẩu
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#4f6f52]"
              placeholder="Nhập lại mật khẩu"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full px-4 py-2 font-bold rounded-md bg-[#006c49] text-white transition-all hover:opacity-80 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "Đang lưu..." : "Đặt mật khẩu mới"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm">
          <Link to="/" className="text-[#4f6f52] hover:underline">
            Về trang chủ
          </Link>
        </p>
      </div>
    </div>
  );
}
