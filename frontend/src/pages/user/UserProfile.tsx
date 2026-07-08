import { useState, useEffect } from "react";
import {
  User,
  Calendar,
  Activity,
  Loader2,
  Save,
  Lock,
  Mail,
  Camera, 
} from "lucide-react";

import { useAuth } from "../../contexts/AuthContext";

import {
  userService,
  type ActivityLevel,
  type Gender,
  type Goal,
  type UpdateBasicInfoPayload,
} from "../../services/user.service";

import { DEFAULT_AVATAR_URL } from "../../constants/default-images";
import { parseApiError } from "../../utils/error.util";

type UserHealthInfo = UpdateBasicInfoPayload;

export default function UserProfile() {
  const { user, setUser } = useAuth();

  const [profile, setProfile] = useState<UserHealthInfo>({
    gender: "",
    dob: "",
    height: 0,
    weight: 0,
    activity_level: "",
    goal: "",
    avatar_url: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [initialLoading, setInitialLoading] = useState(true);
  const [savingMetrics, setSavingMetrics] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false); // State Loading khi up ảnh

  const [metricsError, setMetricsError] = useState<string | null>(null);
  const [metricsSuccess, setMetricsSuccess] = useState<string | null>(null);

  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const response = await userService.getProfile();
        const data = response.data;

        if (data.user) {
          setProfile({
            gender: (data.user.gender as Gender) || "male",
            dob: data.user.dob
              ? new Date(data.user.dob).toISOString().split("T")[0]
              : "",
            height: data.user.height || 0,
            weight: data.user.weight || 0,
            activity_level:
              (data.user.activity_level as ActivityLevel) || "moderate",
            goal: (data.user.goal as Goal) || "maintain",
            avatar_url: data.user.avatar_url || "",
          });
        }
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu người dùng", error);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchInitialData();
  }, []);


  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMetricsError("Vui lòng chọn file hình ảnh hợp lệ.");
      return;
    }

    setMetricsError(null);
    setMetricsSuccess(null);
    setUploadingAvatar(true);

    try {
      const response = await userService.updateAvatar(file);
      setProfile((prev) => ({
        ...prev,
        avatar_url: response.data.avatar_url,
      }));

      if (user) {
        const updatedUser = { ...user, avatar_url: response.data.avatar_url };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }

      setMetricsSuccess("Cập nhật ảnh đại diện thành công!");
      setTimeout(() => setMetricsSuccess(null), 3000);
    } catch (error) {
      console.error("Lỗi upload avatar:", error);
      setMetricsError(
        parseApiError(error, "Không thể tải ảnh lên. Vui lòng thử lại."),
      );
    } finally {
      setUploadingAvatar(false);
    }
  };


  const handleSaveMetrics = async () => {
    if (
      !profile.dob ||
      !profile.height ||
      !profile.weight ||
      !profile.gender ||
      !profile.activity_level ||
      !profile.goal
    ) {
      setMetricsError("Vui lòng điền đầy đủ tất cả thông tin cơ bản.");
      return;
    }
    setMetricsError(null);
    setMetricsSuccess(null);
    setSavingMetrics(true);

    try {
      await userService.updateBasicInfo(profile);
      setMetricsSuccess("Lưu thông tin chỉ số thành công!");
      setTimeout(() => setMetricsSuccess(null), 3000);
    } catch (error) {
      console.error("Lỗi lưu thông tin", error);
      setMetricsError("Có lỗi xảy ra khi lưu thông tin. Vui lòng thử lại.");
    } finally {
      setSavingMetrics(false);
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
    } catch (error) {
      console.error("Lỗi đổi mật khẩu", error);
      setPasswordError(
        parseApiError(error, "Có lỗi xảy ra khi đổi mật khẩu."),
      );
    } finally {
      setSavingPassword(false);
    }
  };


  if (initialLoading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      </div>
    );
  }


  return (
    <div className="max-w-5xl mx-auto px-4 md:px-2 py-8 lg:py-12 mb-12 space-y-8">
      <div className="mb-6">
        <h1 className="font-extrabold text-3xl md:text-4xl text-slate-900 mb-2">
          Hồ sơ của tôi
        </h1>
        <p className="text-slate-600 text-base">
          Quản lý thông tin tài khoản và cập nhật các chỉ số cơ thể của bạn.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-8">
        <section className="space-y-5">
          <h2 className="font-bold text-xl text-[#006c49] flex items-center gap-2 border-b border-slate-100 pb-3">
            <User className="w-5 h-5" /> Thông tin tài khoản
          </h2>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-6 pb-4">
            <div className="relative w-24 h-24 group">
              <img
                src={
                  profile.avatar_url ||
                  user?.avatar_url ||
                  DEFAULT_AVATAR_URL
                }
                alt="Avatar"
                className="w-24 h-24 rounded-full object-cover border-2 border-slate-200 group-hover:opacity-80 transition-all shadow-sm"
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
                    onChange={handleAvatarChange}
                  />
                </label>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="w-full p-3 pl-10 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 outline-none cursor-not-allowed"
                />
                <Mail className="w-5 h-5 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                Tên người dùng
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={user?.username || ""}
                  disabled
                  className="w-full p-3 pl-10 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 outline-none cursor-not-allowed"
                />
                <User className="w-5 h-5 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-5">
          <h2 className="font-bold text-xl text-[#006c49] flex items-center gap-2 border-b border-slate-100 pb-3">
            <Lock className="w-5 h-5" /> Đổi mật khẩu
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
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
                className="w-full p-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="Nhập mật khẩu hiện tại"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
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
                className="w-full p-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="Nhập mật khẩu mới"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
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
                className="w-full p-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="Nhập lại mật khẩu mới"
              />
            </div>
          </div>

          {passwordError && (
            <p className="text-sm text-red-500 font-semibold">
              {passwordError}
            </p>
          )}
          {passwordSuccess && (
            <p className="text-sm text-green-600 font-semibold">
              {passwordSuccess}
            </p>
          )}

          <div className="flex justify-end">
            <button
              onClick={handleSavePassword}
              disabled={savingPassword}
              className="bg-[#006c49] hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl shadow-sm disabled:opacity-70 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {savingPassword ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Đang cập nhật...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" /> Cập nhật mật khẩu
                </>
              )}
            </button>
          </div>
        </section>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm space-y-8">
        <section className="space-y-5">
          <h2 className="font-bold text-xl text-[#006c49] flex items-center gap-2 border-b border-slate-100 pb-3">
            <Activity className="w-5 h-5" /> Chỉ số cơ thể & Mục tiêu
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                Giới tính
              </label>
              <div className="flex gap-4">
                <button
                  onClick={() => setProfile({ ...profile, gender: "male" })}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 font-bold transition-all cursor-pointer ${
                    profile.gender === "male"
                      ? "border-blue-500 bg-blue-50 text-blue-600"
                      : "border-slate-200 hover:bg-slate-50 text-slate-500"
                  }`}
                >
                  <User className="w-4 h-4" /> Nam
                </button>
                <button
                  onClick={() => setProfile({ ...profile, gender: "female" })}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 font-bold transition-all cursor-pointer ${
                    profile.gender === "female"
                      ? "border-pink-500 bg-pink-50 text-pink-600"
                      : "border-slate-200 hover:bg-slate-50 text-slate-500"
                  }`}
                >
                  <User className="w-4 h-4 text-pink-500" /> Nữ
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                Ngày sinh
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={profile.dob}
                  onChange={(e) =>
                    setProfile({ ...profile, dob: e.target.value })
                  }
                  className="w-full p-3 pl-10 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
                <Calendar className="w-5 h-5 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                Chiều cao (cm)
              </label>
              <input
                type="number"
                value={profile.height || ""}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    height: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full p-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                Cân nặng (kg)
              </label>
              <input
                type="number"
                value={profile.weight || ""}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    weight: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full p-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                Mức độ vận động
              </label>
              <select
                value={profile.activity_level}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    activity_level: e.target.value as ActivityLevel,
                  })
                }
                className="w-full p-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none cursor-pointer"
              >
                <option value="" disabled hidden>
                  Chọn mức độ vận động
                </option>
                <option value="sedentary">Ít vận động (Dân văn phòng)</option>
                <option value="light">Vận động nhẹ (1-3 ngày/tuần)</option>
                <option value="moderate">Vận động vừa (3-5 ngày/tuần)</option>
                <option value="active">Năng động (6-7 ngày/tuần)</option>
                <option value="very_active">Rất năng động (VĐV, LĐ nặng)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">
                Mục tiêu của bạn
              </label>
              <select
                value={profile.goal}
                onChange={(e) =>
                  setProfile({ ...profile, goal: e.target.value as Goal })
                }
                className="w-full p-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none cursor-pointer"
              >
                <option value="" disabled hidden>
                  Chọn mục tiêu
                </option>
                <option value="lose_weight">Giảm cân</option>
                <option value="maintain">Duy trì cân nặng</option>
                <option value="gain_weight">Tăng cân</option>
              </select>
            </div>
          </div>
        </section>

        <div className="flex flex-col md:flex-row items-center justify-between border-t border-slate-100 pt-6 gap-4">
          <div className="flex-1">
            {metricsError && (
              <p className="text-sm text-red-500 font-semibold">
                {metricsError}
              </p>
            )}
            {metricsSuccess && (
              <p className="text-sm text-green-600 font-semibold">
                {metricsSuccess}
              </p>
            )}
          </div>
          <button
            onClick={handleSaveMetrics}
            disabled={savingMetrics}
            className="bg-[#006c49] hover:bg-green-700 text-white font-bold py-3 px-8 rounded-xl shadow-sm disabled:opacity-70 transition-all flex items-center justify-center gap-2 cursor-pointer w-full md:w-auto"
          >
            {savingMetrics ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Đang lưu...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" /> Lưu chỉ số
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
