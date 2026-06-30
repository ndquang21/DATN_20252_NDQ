import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Dna } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { authService, type AuthResponse } from "../../services/auth.service";

type AuthView = "login" | "register" | "forgot";

export const AuthModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const [view, setView] = useState<AuthView>("login");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerUsername, setRegisterUsername] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isOpen) {
      setView("login");
      setMessage("");
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const closeModal = () => {
    onClose();
    setView("login");
    setMessage("");
    setIsSubmitting(false);
  };

  const handleAuthSuccess = (data: AuthResponse) => {
    login(
      {
        user_id: data.user.user_id,
        email: data.user.email,
        username: data.user.username,
        role: data.user.role,
        avatar_url: data.user.avatar_url,
      },
      data.token,
      data.refreshToken,
    );

    closeModal();

    if (data.user.role === "admin") {
      navigate("/admin");
    } else {
      navigate("/home");
    }
  };

  const handleLoginSubmit = async (
    event: React.SyntheticEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setMessage("");

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setMessage("Vui lòng nhập đầy đủ email và mật khẩu.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await authService.login({
        email: loginEmail.trim(),
        password: loginPassword,
      });

      handleAuthSuccess(response.data);
    } catch (error: unknown) {
      const messageFromServer = (
        error as { response?: { data?: { error?: string } } }
      )?.response?.data?.error;

      setMessage(
        messageFromServer ||
          "Không thể đăng nhập. Vui lòng kiểm tra lại backend.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (
    event: React.SyntheticEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setMessage("");

    if (
      !registerEmail.trim() ||
      !registerUsername.trim() ||
      !registerPassword.trim()
    ) {
      setMessage("Vui lòng nhập đầy đủ thông tin đăng ký.");
      return;
    }

    if (registerPassword.length < 6) {
      setMessage("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    if (registerPassword !== registerConfirmPassword) {
      setMessage("Mật khẩu xác nhận không khớp.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await authService.register({
        email: registerEmail.trim(),
        password: registerPassword,
        username: registerUsername.trim(),
      });

      handleAuthSuccess(response.data);
    } catch (error: unknown) {
      const messageFromServer = (
        error as { response?: { data?: { error?: string } } }
      )?.response?.data?.error;

      setMessage(
        messageFromServer ||
          "Không thể đăng ký. Vui lòng kiểm tra lại backend.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotSubmit = async (
    event: React.SyntheticEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setMessage("");

    if (!forgotEmail.trim()) {
      setMessage("Vui lòng nhập email để khôi phục mật khẩu.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await authService.forgotPassword(forgotEmail.trim());
      setMessage(
        res.data.message ||
          "Nếu email tồn tại, chúng tôi đã gửi link đặt lại mật khẩu.",
      );
    } catch (error: unknown) {
      const messageFromServer = (
        error as { response?: { data?: { error?: string } } }
      )?.response?.data?.error;
      setMessage(messageFromServer || "Không gửi được yêu cầu. Thử lại sau.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={closeModal}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white p-5 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={closeModal}
          className="absolute right-4 top-3 rounded-full p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          aria-label="Close modal"
        >
          <X className="h-5 w-5 cursor-pointer" />
        </button>

        <div className="mb-5 text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary">
            <Dna className="h-5 w-5 stroke-[2.5] text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Foodi</h2>
          <p className="text-sm text-slate-500">
            Đăng nhập hoặc tạo tài khoản để tiếp tục
          </p>
        </div>

        {message ? (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
            {message}
          </div>
        ) : null}

        {view === "login" && (
          <form className="space-y-4" onSubmit={handleLoginSubmit}>
            <div className="space-y-1">
              <label
                htmlFor="login_email"
                className="text-sm font-medium text-slate-700"
              >
                Email
              </label>
              <input
                id="login_email"
                type="email"
                placeholder="abc@gmail.com"
                value={loginEmail}
                onChange={(event) => setLoginEmail(event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#4f6f52]"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="login_password"
                className="text-sm font-medium text-slate-700"
              >
                Password
              </label>
              <input
                id="login_password"
                type="password"
                placeholder="Nhập mật khẩu"
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#4f6f52]"
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => setView("forgot")}
                className="text-[#4f6f52] hover:underline cursor-pointer"
              >
                Quên mật khẩu?
              </button>
              <button
                type="button"
                onClick={() => {
                  setView("register");
                  setMessage("");
                }}
                className="text-[#4f6f52] hover:underline cursor-pointer"
              >
                Chưa có tài khoản?
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-4 py-2 font-bold rounded-md bg-[#006c49] text-white transition-all hover:opacity-80 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
          </form>
        )}

        {view === "register" && (
          <form className="space-y-4" onSubmit={handleRegisterSubmit}>
            <div className="space-y-1">
              <label
                htmlFor="register_email"
                className="text-sm font-medium text-slate-700"
              >
                Email
              </label>
              <input
                id="register_email"
                type="email"
                placeholder="abc@gmail.com"
                value={registerEmail}
                onChange={(event) => setRegisterEmail(event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#4f6f52]"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="register_username"
                className="text-sm font-medium text-slate-700"
              >
                Username
              </label>
              <input
                id="register_username"
                type="text"
                placeholder="yourname"
                value={registerUsername}
                onChange={(event) => setRegisterUsername(event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#4f6f52]"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="register_password"
                className="text-sm font-medium text-slate-700"
              >
                Password
              </label>
              <input
                id="register_password"
                type="password"
                placeholder="Ít nhất 6 ký tự"
                value={registerPassword}
                onChange={(event) => setRegisterPassword(event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#4f6f52]"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="register_confirm_password"
                className="text-sm font-medium text-slate-700"
              >
                Confirm Password
              </label>
              <input
                id="register_confirm_password"
                type="password"
                placeholder="Nhập lại mật khẩu"
                value={registerConfirmPassword}
                onChange={(event) =>
                  setRegisterConfirmPassword(event.target.value)
                }
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#4f6f52]"
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={() => {
                  setView("login");
                  setMessage("");
                }}
                className="text-[#4f6f52] hover:underline cursor-pointer"
              >
                Đã có tài khoản?
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-4 py-2 font-bold rounded-md bg-[#006c49] text-white transition-all hover:opacity-80 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Đang đăng ký..." : "Đăng ký"}
            </button>
          </form>
        )}

        {view === "forgot" && (
          <form className="space-y-4" onSubmit={handleForgotSubmit}>
            <div className="space-y-1">
              <label
                htmlFor="forgot_email"
                className="text-sm font-medium text-slate-700"
              >
                Email
              </label>
              <input
                id="forgot_email"
                type="email"
                placeholder="abc@gmail.com"
                value={forgotEmail}
                onChange={(event) => setForgotEmail(event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#4f6f52]"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setView("login")}
                className="flex-1 px-4 py-2 font-bold rounded-md border border-[#4f6f52] bg-white text-[#006c49] transition-all hover:opacity-80 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Quay lại
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 font-bold rounded-md bg-[#006c49] text-white transition-all hover:opacity-80 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Đang gửi..." : "Gửi yêu cầu"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
