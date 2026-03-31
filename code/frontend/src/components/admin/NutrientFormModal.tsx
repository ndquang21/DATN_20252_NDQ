import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import type { NutrientItem, NutrientUnit } from "../../types/nutrient";
import { ADMIN_NUTRIENT_UNITS } from "../../types/nutrient";
import Select from "../ui/Select";

type Props = {
  nutrient?: NutrientItem | null;
  onClose: () => void;
  onSaved: () => void;
  onSubmit: (payload: { name: string; unit: NutrientUnit }) => Promise<void>;
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

export default function NutrientFormModal({
  nutrient,
  onClose,
  onSaved,
  onSubmit,
}: Props) {
  const isEdit = nutrient != null;

  const [name, setName] = useState(nutrient?.name ?? "");
  const [unit, setUnit] = useState<NutrientUnit>(nutrient?.unit ?? "mg");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (nutrient) {
      setName(nutrient.name);
      setUnit(nutrient.unit);
    }
  }, [nutrient]);

  async function handleSubmit() {
    setError(null);

    if (!name.trim()) {
      setError("Vui lòng nhập tên chất.");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({ name: name.trim(), unit });
      onSaved();
    } catch (err: unknown) {
      setError(
        parseApiError(
          err,
          isEdit ? "Cập nhật thất bại." : "Tạo chất thất bại.",
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
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-5 py-4 border-b border-outline-variant/60">
          <h3 className="font-display font-extrabold text-lg text-on-surface">
            {isEdit ? "Sửa chất dinh dưỡng" : "Thêm chất dinh dưỡng"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-on-surface mb-1">
              Tên chất
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Vitamin D"
              className="w-full rounded-xl border border-outline-variant/70 px-3 py-2 text-sm focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-on-surface mb-1">
              Đơn vị
            </label>
            <div>
            <Select
              value={unit}
              onChange={setUnit}
              options={ADMIN_NUTRIENT_UNITS}
              className="w-full"
              aria-label="Đơn vị"
            />
          </div>
          </div>

          {error && <p className="text-tertiary text-sm">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t border-outline-variant/60">
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
            disabled={submitting}
            className="px-5 py-2 rounded-full text-sm font-bold bg-primary text-white hover:bg-primary/90 disabled:opacity-60 cursor-pointer inline-flex items-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEdit ? "Lưu" : "Tạo"}
          </button>
        </div>
      </div>
    </div>
  );
}
