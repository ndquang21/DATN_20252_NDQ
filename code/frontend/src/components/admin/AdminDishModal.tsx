import { useEffect, useMemo, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { nutrientService } from "../../services/nutrient.service";
import { adminDishService } from "../../services/adminDish.service";
import type { NutrientItem } from "../../types/nutrient";
import { isDefaultDishImage } from "../../constants/default-images";
import { isRequiredMacro } from "../../constants/nutrient-names";
import { parseApiError } from "../../utils/error.util";

type Props = {
  dishId?: number;
  onClose: () => void;
  onSaved: () => void;
};

function parseNum(v: string): number | null {
  if (v.trim() === "") return 0;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : NaN;
}

export default function AdminDishModal({
  dishId,
  onClose,
  onSaved,
}: Props) {
  const isEdit = dishId != null;

  const [catalog, setCatalog] = useState<NutrientItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);  const [newPreview, setNewPreview] = useState<string | null>(null);  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);  const [values, setValues] = useState<Record<number, string>>({});

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const catalogRes = await nutrientService.list();
        if (!active) return;

        const items = catalogRes.data.items;
        setCatalog(items);

        const emptyValues: Record<number, string> = {};
        for (const n of items) emptyValues[n.nutrientId] = "";

        if (isEdit && dishId) {
          const detailRes = await adminDishService.getById(dishId);
          if (!active) return;

          const detail = detailRes.data;
          setName(detail.name);
          setExistingImageUrl(detail.imageUrl);

          const byId = new Map(detail.nutrients.map((n) => [n.nutrientId, n]));
          for (const n of items) {
            const row = byId.get(n.nutrientId);
            emptyValues[n.nutrientId] =
              row && row.value > 0 ? String(row.value) : row ? "0" : "";
          }
        }

        setValues(emptyValues);
      } catch {
        if (active) setError("Không tải được dữ liệu form.");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [isEdit, dishId]);

  const sortedCatalog = useMemo(
    () => [...catalog].sort((a, b) => a.nutrientId - b.nutrientId),
    [catalog],
  );

  const customImageSrc = useMemo(() => {
    if (newPreview) return newPreview;
    if (existingImageUrl && !isDefaultDishImage(existingImageUrl)) {
      return existingImageUrl;
    }
    return null;
  }, [newPreview, existingImageUrl]);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () =>
      setNewPreview(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
  }

  function setVal(nutrientId: number, v: string) {
    setValues((s) => ({ ...s, [nutrientId]: v }));
  }

  async function handleSubmit() {
    setError(null);

    if (!name.trim()) {
      setError("Vui lòng nhập tên món.");
      return;
    }

    const nutrients: { nutrientId: number; value: number }[] = [];

    for (const n of sortedCatalog) {
      const raw = values[n.nutrientId] ?? "";
      const num = parseNum(raw);

      if (Number.isNaN(num)) {
        setError(`"${n.name}" phải là số ≥ 0.`);
        return;
      }

      if (isRequiredMacro(n.name) && raw.trim() === "") {
        setError(
          `Vui lòng nhập đủ 4 macro: Calories, Protein, Carbohydrate, Fat.`,
        );
        return;
      }

      nutrients.push({ nutrientId: n.nutrientId, value: num ?? 0 });
    }

    setSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        imageFile,
        nutrients,
      };

      if (isEdit && dishId) {
        await adminDishService.update(dishId, payload);
      } else {
        await adminDishService.create(payload);
      }
      onSaved();
    } catch (err: unknown) {
      setError(
        parseApiError(
          err,
          isEdit ? "Cập nhật món thất bại." : "Tạo món thất bại.",
        ),
      );
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
        className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-5 py-4 border-b border-outline-variant/60 shrink-0">
          <h3 className="font-display font-extrabold text-lg text-on-surface">
            {isEdit ? "Sửa món hệ thống" : "Tạo món hệ thống"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4 space-y-4 flex-1">
          {loading ? (
            <p className="text-sm text-on-surface-variant">Đang tải...</p>
          ) : (
            <>
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-1">
                  Tên món
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: Cơm trắng"
                  className="w-full rounded-xl border border-outline-variant/70 px-3 py-2 text-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-on-surface mb-1">
                  Ảnh
                </label>
                {customImageSrc ? (
                  <div className="space-y-2">
                    <img
                      src={customImageSrc}
                      alt=""
                      className="w-full h-36 object-cover rounded-xl bg-slate-100"
                    />
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold rounded-lg border border-outline-variant text-primary hover:bg-primary/10 cursor-pointer">
                      <ImagePlus className="w-4 h-4" />
                      Đổi ảnh
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFile}
                      />
                    </label>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center gap-1 h-36 rounded-xl border-2 border-dashed border-outline-variant text-on-surface-variant hover:border-primary/50 cursor-pointer">
                    <ImagePlus className="w-7 h-7" />
                    <span className="text-sm font-semibold">Chọn ảnh</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFile}
                    />
                  </label>
                )}
              </div>

              <div>
                <p className="text-sm font-semibold text-on-surface mb-2">
                  Thành phần / 100g
                </p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  {sortedCatalog.map((n) => (
                    <div key={n.nutrientId} className="min-w-0">
                      <label
                        className="block text-xs text-on-surface-variant mb-1 truncate"
                        title={n.name}
                      >
                        {n.name}
                        {isRequiredMacro(n.name) && (
                          <span className="text-tertiary"> *</span>
                        )}
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min={0}
                          step="any"
                          placeholder="0"
                          value={values[n.nutrientId] ?? ""}
                          onChange={(e) =>
                            setVal(n.nutrientId, e.target.value)
                          }
                          className="min-w-0 flex-1 rounded-lg border border-outline-variant/70 px-2 py-1.5 text-sm focus:outline-none focus:border-primary"
                        />
                        <span className="w-10 shrink-0  text-xs text-on-surface-variant tabular-nums">
                          {n.unit}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {error && <p className="text-tertiary text-sm">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t border-outline-variant/60 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded-full text-sm font-bold text-on-surface-variant hover:bg-surface-container-low cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || loading}
            className="px-5 py-2 rounded-full text-sm font-bold bg-primary text-white hover:bg-primary/90 disabled:opacity-60 cursor-pointer inline-flex items-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEdit ? "Lưu" : "Tạo món"}
          </button>
        </div>
      </div>
    </div>
  );
}
