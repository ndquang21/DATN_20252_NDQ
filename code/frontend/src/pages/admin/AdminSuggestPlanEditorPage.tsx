import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  ImagePlus,
  Plus,
  UtensilsCrossed,
  X,
} from "lucide-react";
import ConfirmDialog from "../../components/admin/ConfirmDialog";
import AdminDayNutrientsModal from "../../components/admin/AdminDayNutrientsModal";
import { isDefaultDishImage } from "../../constants/default-images";
import { MEAL_META } from "../../components/home/mealMeta";
import MealCard from "../../components/home/MealCard";
import { suggestPlanService } from "../../services/suggestPlan.service";
import type { MealType } from "../../types/dailyPlan";
import type {
  SuggestPlanDetail,
  SuggestPlanDay,
} from "../../types/suggestPlan";

import CreateMealModal from "../../components/home/CreateMealModal";
import MealEditModal from "../../components/home/MealEditModal";

const FIXED_MEAL_ORDER: MealType[] = ["breakfast", "lunch", "dinner"];
const MAX_DAYS = 14;

type SaveStatus = "idle" | "saving" | "saved" | "error";

export default function AdminSuggestPlanEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isLegacyNewRoute = location.pathname.endsWith("/new");

  const [plan, setPlan] = useState<SuggestPlanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [metaDirty, setMetaDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  const [activeDay, setActiveDay] = useState(1);
  const [dayBusy, setDayBusy] = useState(false);
  const [dayError, setDayError] = useState<string | null>(null);
  const [deleteDayTarget, setDeleteDayTarget] = useState<number | null>(null);
  const [dayNutrientsOpen, setDayNutrientsOpen] = useState(false);

  const [publishing, setPublishing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [addMealType, setAddMealType] = useState<MealType | null>(null);
  const [detailMealId, setDetailMealId] = useState<number | null>(null);

  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverUploading, setCoverUploading] = useState(false);

  const skipMetaSave = useRef(true);

  const suggestPlanId = id ? Number(id) : NaN;
  const validId = Number.isFinite(suggestPlanId) && suggestPlanId > 0;

  const loadPlan = useCallback(async () => {
    if (!validId) return;
    setLoading(true);
    setLoadError(null);
    try {
      const res = await suggestPlanService.getById(suggestPlanId);
      setPlan(res.data);
      setName(res.data.name);
      setDescription(res.data.description ?? "");
      skipMetaSave.current = true;
      setMetaDirty(false);
      setSaveStatus("idle");
      setActiveDay((prev) =>
        res.data.days.some((d) => d.dayIndex === prev)
          ? prev
          : (res.data.days[0]?.dayIndex ?? 1),
      );
    } catch {
      setLoadError("Không tải được thực đơn gợi ý.");
    } finally {
      setLoading(false);
    }
  }, [suggestPlanId, validId]);  useEffect(() => {
    if (isLegacyNewRoute) {
      suggestPlanService
        .create({})
        .then((res) =>
          navigate(`/admin/suggest-plans/${res.data.suggestPlanId}/edit`, {
            replace: true,
          }),
        )
        .catch(() => setLoadError("Không tạo được thực đơn gợi ý."));
      return;
    }
    if (!validId) {
      setLoadError("Id không hợp lệ.");
      setLoading(false);
      return;
    }
    loadPlan();
  }, [isLegacyNewRoute, validId, loadPlan, navigate]);  useEffect(() => {
    if (!plan || !metaDirty) return;

    if (skipMetaSave.current) {
      skipMetaSave.current = false;
      return;
    }

    const timer = setTimeout(async () => {
      setSaveStatus("saving");
      try {
        const res = await suggestPlanService.update(plan.suggestPlanId, {
          name: name.trim() || plan.name,
          description: description.trim() ? description.trim() : null,
        });
        setPlan(res.data);
        setName(res.data.name);
        setDescription(res.data.description ?? "");
        skipMetaSave.current = true;
        setSaveStatus("saved");
      } catch {
        setSaveStatus("error");
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [name, description, metaDirty, plan]);

  const activeDayData: SuggestPlanDay | undefined = plan?.days.find(
    (d) => d.dayIndex === activeDay,
  );

  const detailMeal =
    activeDayData?.meals.find((m) => m.mealId === detailMealId) ?? null;

  const coverDisplaySrc = useMemo(() => {
    if (coverPreview) return coverPreview;
    const url = plan?.imageUrl;
    if (url && !isDefaultDishImage(url)) return url;
    return null;
  }, [coverPreview, plan?.imageUrl]);

  async function handleCoverFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !plan) return;
    e.target.value = "";

    const reader = new FileReader();
    reader.onload = () =>
      setCoverPreview(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);

    setCoverUploading(true);
    setActionError(null);
    try {
      const res = await suggestPlanService.uploadCover(
        plan.suggestPlanId,
        file,
      );
      setPlan(res.data);
      setCoverPreview(null);
    } catch {
      setCoverPreview(null);
      setActionError("Không upload được ảnh cover.");
    } finally {
      setCoverUploading(false);
    }
  }

  async function refreshAfterMealChange() {
    if (!validId) return;
    try {
      const res = await suggestPlanService.getById(suggestPlanId);
      setPlan(res.data);
      setDetailMealId((prev) => {
        if (prev == null) return null;
        const day = res.data.days.find((d) => d.dayIndex === activeDay);
        return day?.meals.some((m) => m.mealId === prev) ? prev : null;
      });
    } catch {
      setActionError("Không cập nhật được sau khi sửa bữa.");
    }
  }

  function handleAddMeal(type: MealType) {
    setAddMealType(type);
  }

  function handleMealCreated(mealId: number) {
    setAddMealType(null);
    setDetailMealId(mealId);
    void refreshAfterMealChange();
  }

  async function handleAddDay() {
    if (!plan || plan.dayCount >= MAX_DAYS) return;
    setDayBusy(true);
    setDayError(null);
    try {
      const res = await suggestPlanService.addDay(plan.suggestPlanId);
      await loadPlan();
      setActiveDay(res.data.dayIndex);
    } catch {
      setDayError("Không thêm được ngày.");
    } finally {
      setDayBusy(false);
    }
  }

  async function confirmDeleteDay() {
    if (!plan || deleteDayTarget == null) return;
    const dayIndex = deleteDayTarget;
    setDayBusy(true);
    setDayError(null);
    try {
      const res = await suggestPlanService.deleteDay(
        plan.suggestPlanId,
        dayIndex,
      );
      setPlan(res.data.plan);
      if (activeDay === dayIndex) {
        setActiveDay(Math.min(dayIndex, res.data.dayCount));
      } else if (activeDay > dayIndex) {
        setActiveDay(activeDay - 1);
      }
      setDeleteDayTarget(null);
    } catch {
      setDayError("Không xóa được ngày.");
    } finally {
      setDayBusy(false);
    }
  }

  async function handleTogglePublish() {
    if (!plan) return;
    if (!plan.isPublic && !plan.canPublish) return;

    setPublishing(true);
    setActionError(null);
    try {
      await suggestPlanService.publish(plan.suggestPlanId, {
        isPublic: !plan.isPublic,
      });
      await loadPlan();
    } catch {
      setActionError("Không cập nhật trạng thái công khai.");
    } finally {
      setPublishing(false);
    }
  }

  if (isLegacyNewRoute && !loadError) {
    return (
      <div className="py-20 text-center text-sm text-on-surface-variant">
        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
        Đang tạo thực đơn...
      </div>
    );
  }

  if (loading) {
    return (
      <div className="py-20 text-center text-sm text-on-surface-variant">
        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
        Đang tải...
      </div>
    );
  }

  if (loadError || !plan) {
    return (
      <div className="space-y-4">
        <Link
          to="/admin/suggest-plans"
          className="inline-flex items-center gap-1 text-sm font-semibold text-on-surface-variant hover:text-primary"
        >
          <ArrowLeft className="w-4 h-4" /> Danh sách
        </Link>
        <p className="text-sm text-tertiary">
          {loadError ?? "Không có dữ liệu."}
        </p>
      </div>
    );
  }

  const saveLabel =
    saveStatus === "saving"
      ? "Đang lưu..."
      : saveStatus === "saved"
        ? "Đã lưu"
        : saveStatus === "error"
          ? "Lỗi lưu"
          : null;

  return (
    <div className="w-full space-y-6">
      <Link
        to="/admin/suggest-plans"
        className="inline-flex items-center gap-1 text-sm font-semibold text-on-surface-variant hover:text-primary"
      >
        <ArrowLeft className="w-4 h-4" /> Danh sách
      </Link>

      {(actionError || dayError) && (
        <p className="text-sm text-tertiary bg-tertiary/10 rounded-xl px-4 py-2">
          {actionError ?? dayError}
        </p>
      )}

      <div className="rounded-2xl border border-outline-variant bg-white shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-on-surface">
              Soạn thực đơn gợi ý
            </h1>
            <p className="text-sm text-on-surface-variant mt-1.5">
              {saveLabel && (
                <span className="text-primary font-semibold">
                  {saveLabel}
                </span>
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              type="button"
              disabled={publishing || (!plan.isPublic && !plan.canPublish)}
              onClick={handleTogglePublish}
              title={
                !plan.isPublic && !plan.canPublish
                  ? "Cần đủ ngày hoàn chỉnh trước khi công khai"
                  : undefined
              }
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold rounded-xl border cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                plan.isPublic
                  ? "border-primary text-primary bg-primary/10"
                  : "border-outline-variant text-on-surface"
              }`}
            >
              {publishing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : plan.isPublic ? (
                <Eye className="w-4 h-4" />
              ) : (
                <EyeOff className="w-4 h-4" />
              )}
              {plan.isPublic ? "Hiển thị" : "Ẩn"}
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5">
                Tên <span className="text-tertiary">*</span>
              </label>
              <input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setMetaDirty(true);
                  setSaveStatus("idle");
                }}
                className="w-full rounded-xl border border-outline-variant/70 px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">
                Mô tả
              </label>
              <textarea
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setMetaDirty(true);
                  setSaveStatus("idle");
                }}
                rows={4}
                className="w-full rounded-xl border border-outline-variant/70 px-3 py-2.5 text-sm resize-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5">
              Ảnh cover
            </label>
            {coverDisplaySrc ? (
              <div className="space-y-2">
                <div className="relative">
                  <img
                    src={coverDisplaySrc}
                    alt=""
                    className="w-full h-44 sm:h-52 object-cover rounded-xl bg-slate-100"
                  />
                  {coverUploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-xl">
                      <Loader2 className="w-8 h-8 animate-spin text-white" />
                    </div>
                  )}
                </div>
                <label
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold rounded-lg border border-outline-variant text-primary hover:bg-primary/10 cursor-pointer ${
                    coverUploading ? "pointer-events-none opacity-50" : ""
                  }`}
                >
                  <ImagePlus className="w-4 h-4" />
                  Đổi ảnh
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCoverFile}
                    disabled={coverUploading}
                  />
                </label>
              </div>
            ) : (
              <label
                className={`flex flex-col items-center justify-center gap-2 h-44 sm:h-52 rounded-xl border-2 border-dashed border-outline-variant text-on-surface-variant hover:border-primary/50 cursor-pointer ${
                  coverUploading ? "pointer-events-none opacity-50" : ""
                }`}
              >
                {coverUploading ? (
                  <Loader2 className="w-7 h-7 animate-spin text-primary" />
                ) : (
                  <ImagePlus className="w-7 h-7" />
                )}
                <span className="text-sm font-semibold">
                  {coverUploading ? "Đang upload..." : "Chọn ảnh cover"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleCoverFile}
                  disabled={coverUploading}
                />
              </label>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-outline-variant bg-white shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 px-4 sm:px-6 py-4 border-b border-outline-variant/60 bg-surface-container-low/50">
          {plan.days.map((d) => (
            <div key={d.dayIndex} className="relative group">
              <button
                type="button"
                onClick={() => setActiveDay(d.dayIndex)}
                className={`px-3.5 py-2 text-sm font-bold rounded-lg cursor-pointer transition-colors ${
                  activeDay === d.dayIndex
                    ? "bg-primary text-white shadow-sm"
                    : d.isComplete
                      ? "bg-primary/10 text-primary"
                      : "bg-white border border-outline-variant text-on-surface-variant hover:bg-surface-container-low"
                }`}
              >
                Ngày {d.dayIndex}
                {d.isComplete ? " ✓" : ""}
              </button>
              {plan.dayCount > 1 && (
                <button
                  type="button"
                  onClick={() => setDeleteDayTarget(d.dayIndex)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white border border-outline-variant text-on-surface-variant hover:text-tertiary hover:border-tertiary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  title={`Xóa ngày ${d.dayIndex}`}
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddDay}
            disabled={dayBusy || plan.dayCount >= MAX_DAYS}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-bold rounded-lg border border-dashed border-outline-variant text-primary hover:bg-primary/5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {dayBusy ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Thêm ngày
          </button>
        </div>

        <div className="p-5 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-primary" />
            <h2 className="font-display font-extrabold text-xl text-on-surface">
              Ngày {activeDay}
            </h2>
            <button
              type="button"
              onClick={() => setDayNutrientsOpen(true)}
              className="ml-1 text-sm font-semibold text-primary hover:text-primary/80 underline-offset-2 hover:underline cursor-pointer"
            >
              Xem chi tiết
            </button>
          </div>

          <DayMealsRow
            day={activeDayData}
            onAddMeal={handleAddMeal}
            onEditMeal={setDetailMealId}
          />
        </div>
      </div>

      {detailMeal && (
        <MealEditModal
          meal={detailMeal}
          onClose={() => setDetailMealId(null)}
          onPlanUpdated={() => void refreshAfterMealChange()}
        />
      )}

      {addMealType && activeDayData && (
        <CreateMealModal
          dailyPlanId={activeDayData.dailyPlanId}
          mealType={addMealType}
          onClose={() => setAddMealType(null)}
          onCreated={handleMealCreated}
        />
      )}

      {dayNutrientsOpen && id && (
        <AdminDayNutrientsModal
          suggestPlanId={Number(id)}
          dayIndex={activeDay}
          onClose={() => setDayNutrientsOpen(false)}
        />
      )}

      <ConfirmDialog
        open={deleteDayTarget != null}
        title="Xóa ngày"
        description={
          <>
            Xóa <strong>Ngày {deleteDayTarget}</strong> và toàn bộ bữa/món trong
            ngày?
          </>
        }
        confirmLabel="Xóa ngày"
        danger
        loading={dayBusy}
        onConfirm={confirmDeleteDay}
        onClose={() => !dayBusy && setDeleteDayTarget(null)}
      />
    </div>
  );
}

function DayMealsRow({
  day,
  onAddMeal,
  onEditMeal,
}: {
  day: SuggestPlanDay | undefined;
  onAddMeal: (type: MealType) => void;
  onEditMeal: (mealId: number) => void;
}) {
  if (!day) return null;

  const meals = day.meals;
  const snacks = meals.filter((m) => m.type === "snack");

  return (
    <div className="flex gap-5 sm:gap-6 overflow-x-auto pb-2 -mx-1 px-1">
      {FIXED_MEAL_ORDER.map((type) => {
        const meal = meals.find((m) => m.type === type);
        return meal ? (
          <MealCard
            key={meal.mealId}
            meal={meal}
            hideFinishToggle
            actionLabel="Sửa"
            onOpenDetail={onEditMeal}
          />
        ) : (
          <AddMealSlotCard
            key={type}
            type={type}
            onAdd={() => onAddMeal(type)}
          />
        );
      })}

      {snacks.map((meal) => (
        <MealCard
          key={meal.mealId}
          meal={meal}
          hideFinishToggle
          actionLabel="Sửa"
          onOpenDetail={onEditMeal}
        />
      ))}

      <AddMealSlotCard type="snack" onAdd={() => onAddMeal("snack")} />
    </div>
  );
}

function AddMealSlotCard({
  type,
  onAdd,
}: {
  type: MealType;
  onAdd: () => void;
}) {
  const meta = MEAL_META[type];
  return (
    <button
      type="button"
      onClick={onAdd}
      className="w-72 shrink-0 min-h-[220px] flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-outline-variant text-on-surface-variant hover:border-primary/50 hover:text-primary transition-all cursor-pointer"
    >
      <Plus className="w-6 h-6" />
      <span className="text-sm font-semibold">
        Thêm {meta.label.toLowerCase()}
      </span>
    </button>
  );
}
