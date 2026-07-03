import { useState } from "react";
import { Loader2, X } from "lucide-react";
import { adminUserService } from "../../services/adminUser.service";
import { parseApiError } from "../../utils/error.util";

type Props = {
  onClose: () => void;
  onCreated: () => void;
};

export default function CreateUserModal({ onClose, onCreated }: Props) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    const trimmedUsername = username.trim();

    if (!trimmedEmail) {
      setError("Vui lòng nhập email.");
      return;
    }
    if (trimmedUsername.length < 2) {
      setError("Username tối thiểu 2 ký tự.");
      return;
    }
    if (password.length < 6) {
      setError("Mật khẩu tối thiểu 6 ký tự.");
      return;
    }

    setSubmitting(true);
    try {
      await adminUserService.createUser({
        email: trimmedEmail,
        username: trimmedUsername,
        password,
      });
      onCreated();
      onClose();
    } catch (err) {
      setError(parseApiError(err, "Không tạo được user."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-5 py-4 border-b border-outline-variant/60">
          <h3 className="font-display font-extrabold text-lg text-on-surface">
            Tạo người dùng
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="text-on-surface-variant hover:text-on-surface cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <p className="text-sm text-tertiary bg-tertiary/10 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-on-surface">
              Username
            </span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="yourname"
              className="w-full px-3 py-2 text-sm rounded-xl border border-outline-variant focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-on-surface">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="abc@gmail.com"
              className="w-full px-3 py-2 text-sm rounded-xl border border-outline-variant focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-on-surface">
              Mật khẩu
            </span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ít nhất 6 ký tự"
              className="w-full px-3 py-2 text-sm rounded-xl border border-outline-variant focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </label>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 py-2.5 text-sm font-bold rounded-xl border border-outline-variant text-on-surface-variant hover:bg-surface-container-low cursor-pointer disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 text-sm font-bold rounded-xl bg-primary text-white hover:bg-primary/90 cursor-pointer disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Tạo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
