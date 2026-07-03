import { useEffect, useState } from "react";
import {
  Camera,
  Loader2,
  Lock,
  Mail,
  Save,
  Shield,
  User,
  X,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { DEFAULT_AVATAR_URL } from "../../constants/default-images";
import {
  userService,
  type UpdatePasswordPayload,
} from "../../services/user.service";

type Props = {
  onClose: () => void;
};

export default function AdminAccountModal({ onClose }: Props) {
  const { user, setUser } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);

  const [passwordForm, setPasswordForm] = useState<UpdatePasswordPayload>({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      try {
        const response = await userService.getProfile();
        if (!cancelled) {
          setAvatarUrl(response.data.user.avatar_url);
        }
      } catch {
        if (!cancelled) {
          setAvatarUrl(user?.avatar_url ?? null);
        }
      }
    };

    void loadProfile();
    return () => {
      cancelled = true;
    };
  }, [user?.avatar_url]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setAvatarMessage({
        type: "error",
        text: "Vui lòng chọn file hình ảnh hợp lệ.",
      });
      return;
    }

    setAvatarMessage(null);
    setUploadingAvatar(true);

    try {
      const response = await userService.updateAvatar(file);
      const newUrl = response.data.avatar_url;
      setAvatarUrl(newUrl);

      if (user) {
        const updatedUser = { ...user, avatar_url: newUrl };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }

      setAvatarMessage({
        type: "success",
        text: "Cập nhật ảnh đại diện thành công!",
      });
      setTimeout(() => setAvatarMessage(null), 3000);
    } catch (error: unknown) {
      const msg =
        (
          error as {
            response?: { data?: { error?: string; message?: string } };
          }
        )?.response?.data?.error ??
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message ??
        "Không thể tải ảnh lên. Vui lòng thử lại.";
      setAvatarMessage({ type: "error", text: msg });
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  };

  const handleSavePassword = async () => {
    if (
      !passwordForm.current_password ||
      !passwordForm.new_password ||
      !passwordForm.confirm_password
    ) {
      setPasswordError("Vui lòng điền đầy đủ các trường mật khẩu.");
      return;
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setPasswordError(null);
    setPasswordSuccess(null);
    setSavingPassword(true);

    try {
      await userService.updatePassword(passwordForm);
      setPasswordSuccess("Đổi mật khẩu thành công!");
      setPasswordForm({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
      setTimeout(() => setPasswordSuccess(null), 3000);
    } catch (error: unknown) {
      const msg =
        (error as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? "Có lỗi xảy ra khi đổi mật khẩu.";
      setPasswordError(msg);
    } finally {
      setSavingPassword(false);
    }
  };

  const displayAvatar = (avatarUrl ?? user?.avatar_url) || DEFAULT_AVATAR_URL;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant sticky top-0 bg-white rounded-t-2xl z-10">
          <h3 className="font-display font-extrabold text-lg text-on-surface">
            Tài khoản quản trị
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          <div className="flex flex-col items-center gap-3">
            <div className="relative w-20 h-20 group">
              <img
                src={displayAvatar}
                alt="Avatar"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = DEFAULT_AVATAR_URL;
                }}
                className="w-20 h-20 rounded-full object-cover border-2 border-outline-variant group-hover:opacity-80 transition-all"
              />
              {uploadingAvatar ? (
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              ) : (
                <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera className="w-6 h-6" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => void handleAvatarChange(e)}
                  />
                </label>
              )}
            </div>
            <p className="font-bold text-on-surface">{user?.username}</p>
            {avatarMessage && (
              <p
                className={`text-xs font-medium text-center ${
                  avatarMessage.type === "error"
                    ? "text-red-600"
                    : "text-green-600"
                }`}
              >
                {avatarMessage.text}
              </p>
            )}
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
                Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="w-full p-2.5 pl-9 bg-surface-container-low border border-outline-variant rounded-xl text-on-surface-variant text-sm outline-none cursor-not-allowed"
                />
                <Mail className="w-4 h-4 text-on-surface-variant/60 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
                Tên người dùng
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={user?.username || ""}
                  disabled
                  className="w-full p-2.5 pl-9 bg-surface-container-low border border-outline-variant rounded-xl text-on-surface-variant text-sm outline-none cursor-not-allowed"
                />
                <User className="w-4 h-4 text-on-surface-variant/60 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
                Vai trò
              </label>
              <div className="relative">
                <input
                  type="text"
                  value="Quản trị viên"
                  disabled
                  className="w-full p-2.5 pl-9 bg-surface-container-low border border-outline-variant rounded-xl text-on-surface-variant text-sm outline-none cursor-not-allowed"
                />
                <Shield className="w-4 h-4 text-on-surface-variant/60 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-2 border-t border-outline-variant">
            <h4 className="font-bold text-primary flex items-center gap-2 text-sm">
              <Lock className="w-4 h-4" /> Đổi mật khẩu
            </h4>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-on-surface-variant">
                  Mật khẩu hiện tại
                </label>
                <input
                  type="password"
                  value={passwordForm.current_password}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      current_password: e.target.value,
                    })
                  }
                  className="w-full p-2.5 bg-white border border-outline-variant rounded-xl text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                  placeholder="Nhập mật khẩu hiện tại"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-on-surface-variant">
                  Mật khẩu mới
                </label>
                <input
                  type="password"
                  value={passwordForm.new_password}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      new_password: e.target.value,
                    })
                  }
                  className="w-full p-2.5 bg-white border border-outline-variant rounded-xl text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                  placeholder="Nhập mật khẩu mới"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-on-surface-variant">
                  Xác nhận mật khẩu mới
                </label>
                <input
                  type="password"
                  value={passwordForm.confirm_password}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      confirm_password: e.target.value,
                    })
                  }
                  className="w-full p-2.5 bg-white border border-outline-variant rounded-xl text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                  placeholder="Nhập lại mật khẩu mới"
                />
              </div>
            </div>

            {passwordError && (
              <p className="text-sm text-red-600 font-medium">
                {passwordError}
              </p>
            )}
            {passwordSuccess && (
              <p className="text-sm text-green-600 font-medium">
                {passwordSuccess}
              </p>
            )}

            <button
              type="button"
              onClick={() => void handleSavePassword()}
              disabled={savingPassword}
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-2.5 px-4 rounded-xl text-sm disabled:opacity-70 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {savingPassword ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Đang cập nhật...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Cập nhật mật khẩu
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
