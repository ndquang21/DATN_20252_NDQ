import { useEffect, useMemo, useState } from "react";
import { X, ImagePlus, Plus, Trash2 } from "lucide-react";
import { nutrientService } from "../../services/nutrient.service";
import { dishService } from "../../services/dish.service";
import type { MyDishItem } from "../../types/dish";
import type { NutrientItem } from "../../types/nutrient";
import { isDefaultDishImage } from "../../constants/default-images";
import Select from "../ui/Select";

type Props = {
  onClose: () => void;
  dishId?: number;
  onSaved: (dish: MyDishItem) => void;
};

const MACRO_FIELDS = [
  { key: "calories", label: "Calories", unit: "kcal" },
  { key: "protein", label: "Protein", unit: "g" },
  { key: "carb", label: "Carbohydrate", unit: "g" },
  { key: "fat", label: "Fat", unit: "g" },
] as const;

type MacroKey = (typeof MACRO_FIELDS)[number]["key"];

const MACRO_NAME_BY_KEY: Record<MacroKey, string> = {
  calories: "Calories",
  protein: "Protein",
  carb: "Carbohydrate",
  fat: "Fat",
};

type ExtraNutrientRow = {
  nutrientId: number;
  name: string;
  unit: string;
  value: string;
};

function parseApiError(err: unknown, fallback: string): string {
  if (
    err &&
    typeof err === "object" &&
    "response" in err &&
    err.response &&
    typeof err.response === "object" &&
    "data" in err.response &&
    err.response.data &&
    typeof err.response.data === "object" &&
    "error" in err.response.data &&
    typeof err.response.data.error === "string"
  ) {
    return err.response.data.error;
  }
  return fallback;
}

export default function CreateDishModal({ onClose, dishId, onSaved }: Props) {
  const isEdit = dishId != null;

  const [catalog, setCatalog] = useState<NutrientItem[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(isEdit);

  const [name, setName] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);  const [newPreview, setNewPreview] = useState<string | null>(null);  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);

  const [values, setValues] = useState<Record<MacroKey, string>>({
    calories: "",
    protein: "",
    carb: "",
    fat: "",
  });
  const [extras, setExtras] = useState<ExtraNutrientRow[]>([]);
  const [pickId, setPickId] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const catalogRes = await nutrientService.list();
        if (!active) return;
        setCatalog(catalogRes.data.items);

        if (isEdit && dishId) {
          const detailRes = await dishService.getMyDish(dishId);
          if (!active) return;

          const detail = detailRes.data;
          setName(detail.name);
          setExistingImageUrl(detail.imageUrl);

          const byId = new Map(
            catalogRes.data.items.map((n) => [n.nutrientId, n]),
          );
          const macroValues: Record<MacroKey, string> = {
            calories: "",
            protein: "",
            carb: "",
            fat: "",
          };
          const extraRows: ExtraNutrientRow[] = [];

          for (const n of detail.nutrients) {
            const meta = byId.get(n.nutrientId);
            if (!meta) continue;

            const macroKey = (
              Object.keys(MACRO_NAME_BY_KEY) as MacroKey[]
            ).find((k) => MACRO_NAME_BY_KEY[k] === meta.name);

            if (macroKey) {
              macroValues[macroKey] = String(n.value);
            } else {
              extraRows.push({
                nutrientId: n.nutrientId,
                name: n.name,
                unit: n.unit,
                value: String(n.value),
              });
            }
          }

          setValues(macroValues);
          setExtras(extraRows);
        }
      } catch {
        if (active) setError("Không tải được dữ liệu món.");
      } finally {
        if (active) {
          setCatalogLoading(false);
          setDetailLoading(false);
        }
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [isEdit, dishId]);

  const nutrientByName = useMemo(() => {
    const map = new Map<string, NutrientItem>();
    for (const n of catalog) map.set(n.name, n);
    return map;
  }, [catalog]);

  const usedNutrientIds = useMemo(() => {
    const ids = new Set<number>();
    for (const f of MACRO_FIELDS) {
      const item = nutrientByName.get(MACRO_NAME_BY_KEY[f.key]);
      if (item) ids.add(item.nutrientId);
    }
    for (const e of extras) ids.add(e.nutrientId);
    return ids;
  }, [nutrientByName, extras]);

  const availableExtras = useMemo(
    () => catalog.filter((n) => !usedNutrientIds.has(n.nutrientId)),
    [catalog, usedNutrientIds],
  );

  const formLoading = catalogLoading || detailLoading;

  const customImageSrc = useMemo(() => {
    if (newPreview) return newPreview;
    if (existingImageUrl && !isDefaultDishImage(existingImageUrl)) {
      return existingImageUrl;
    }
    return null;
  }, [newPreview, existingImageUrl]);

  function setVal(key: MacroKey, v: string) {
    setValues((s) => ({ ...s, [key]: v }));
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () =>
      setNewPreview(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
  }

  function parseNum(v: string): number | null {
    if (v.trim() === "") return null;
    const n = Number(v);
    return Number.isFinite(n) && n >= 0 ? n : NaN;
  }

  function addExtra() {
    const id = Number(pickId);
    if (!id) return;
    const picked = catalog.find((n) => n.nutrientId === id);
    if (!picked) return;
    setExtras((prev) => [
      ...prev,
      {
        nutrientId: picked.nutrientId,
        name: picked.name,
        unit: picked.unit,
        value: "",
      },
    ]);
    setPickId("");
  }

  function removeExtra(nutrientId: number) {
    setExtras((prev) => prev.filter((e) => e.nutrientId !== nutrientId));
  }

  async function handleSubmit() {
    setError(null);

    if (!name.trim()) {
      setError("Vui lòng nhập tên món.");
      return;
    }

    const required: MacroKey[] = ["calories", "protein", "carb", "fat"];
    const nutrients: { nutrientId: number; value: number }[] = [];

    for (const k of required) {
      const n = parseNum(values[k]);
      if (n === null || Number.isNaN(n)) {
        setError("Vui lòng nhập đủ 4 chỉ số macro (số ≥ 0).");
        return;
      }
      const meta = nutrientByName.get(MACRO_NAME_BY_KEY[k]);
      if (!meta) {
        setError("Danh mục chất dinh dưỡng chưa sẵn sàng.");
        return;
      }
      nutrients.push({ nutrientId: meta.nutrientId, value: n });
    }

    for (const row of extras) {
      const n = parseNum(row.value);
      if (n === null || Number.isNaN(n)) {
        setError(`Vui lòng nhập giá trị hợp lệ cho "${row.name}".`);
        return;
      }
      nutrients.push({ nutrientId: row.nutrientId, value: n });
    }

    const payload = {
      name: name.trim(),
      imageFile,
      nutrients,
    };

    setSubmitting(true);
    try {
      const res =
        isEdit && dishId
          ? await dishService.updateDish(dishId, payload)
          : await dishService.createDish(payload);
      onSaved(res.data);
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
        className="bg-white rounded-3xl w-full max-w-lg max-h-[85vh] overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 shrink-0">
          <h3 className="font-display font-extrabold text-xl text-on-surface">
            {isEdit ? "Sửa món" : "Tạo món mới"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-4 space-y-4">
          {formLoading ? (
            <p className="text-sm text-on-surface-variant">Đang tải...</p>
          ) : null}

          <div>
            <label className="block text-sm font-semibold text-on-surface mb-1">
              Tên món
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Salad ức gà"
              disabled={formLoading}
              className="w-full rounded-xl border border-outline-variant/70 px-3 py-2 text-sm focus:outline-none focus:border-primary disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-on-surface mb-1">
              Ảnh món
            </label>
            {customImageSrc ? (
              <div className="space-y-2">
                <img
                  src={customImageSrc}
                  alt=""
                  className="w-full h-40 object-cover rounded-xl bg-slate-100"
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
              <label className="flex flex-col items-center justify-center gap-1.5 h-40 rounded-xl border-2 border-dashed border-outline-variant text-on-surface-variant hover:border-primary/50 hover:text-primary cursor-pointer transition-colors">
                <ImagePlus className="w-7 h-7" />
                <span className="text-sm font-semibold">Chọn ảnh</span>
                <span className="text-xs">
                  PNG, JPG, WEBP...
                </span>
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
            <div className="grid grid-cols-2 gap-3">
              {MACRO_FIELDS.map((f) => (
                <div key={f.key}>
                  <label className="block text-xs text-on-surface-variant mb-1">
                    {f.label}
                    <span className="text-tertiary"> *</span>
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      value={values[f.key]}
                      onChange={(e) => setVal(f.key, e.target.value)}
                      disabled={formLoading}
                      className="w-full rounded-lg border border-outline-variant/70 px-2 py-1.5 text-sm focus:outline-none focus:border-primary disabled:opacity-60"
                    />
                    <span className="text-xs text-on-surface-variant">
                      {f.unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {extras.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-on-surface">
                Chất bổ sung
              </p>
              {extras.map((row) => (
                <div key={row.nutrientId} className="flex items-center gap-2">
                  <span className="flex-1 text-xs text-on-surface truncate">
                    {row.name}
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={row.value}
                    onChange={(e) =>
                      setExtras((prev) =>
                        prev.map((x) =>
                          x.nutrientId === row.nutrientId
                            ? { ...x, value: e.target.value }
                            : x,
                        ),
                      )
                    }
                    className="w-24 rounded-lg border border-outline-variant/70 px-2 py-1.5 text-sm focus:outline-none focus:border-primary"
                  />
                  <span className="text-xs text-on-surface-variant w-8">
                    {row.unit}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeExtra(row.nutrientId)}
                    className="text-on-surface-variant hover:text-tertiary cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {availableExtras.length > 0 && !formLoading && (
            <div className="flex items-center gap-2">
              <Select
                value={pickId}
                onChange={setPickId}
                placeholder="Chọn chất dinh dưỡng..."
                options={availableExtras.map((n) => ({
                  value: String(n.nutrientId),
                  label: n.name,
                }))}
                className="flex-1"
              />
              <button
                type="button"
                onClick={addExtra}
                disabled={!pickId}
                className="flex items-center gap-1 px-3 py-2 rounded-full text-xs font-bold bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-40 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Thêm chất
              </button>
            </div>
          )}

          {error && <p className="text-tertiary text-sm">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-slate-100 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded-full text-sm font-bold text-on-surface-variant hover:bg-slate-100 cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || formLoading}
            className="px-5 py-2 rounded-full text-sm font-bold bg-primary text-white hover:bg-primary/90 disabled:opacity-60 cursor-pointer"
          >
            {submitting ? "Đang lưu..." : isEdit ? "Lưu thay đổi" : "Tạo món"}
          </button>
        </div>
      </div>
    </div>
  );
}
