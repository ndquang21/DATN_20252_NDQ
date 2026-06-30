import { useEffect, useMemo, useState } from "react";
import { Loader2, Save, X } from "lucide-react";
import { nutrientService } from "../../services/nutrient.service";
import { trackedNutrientService } from "../../services/trackedNutrient.service";
import type { NutrientItem } from "../../types/nutrient";

type Props = {
  onClose: () => void;
  onSaved: () => void;
};

const SLOT_LABELS = ["Chất 1", "Chất 2", "Chất 3"];

type SlotSelection = number | "";

export default function TrackNutrientsModal({ onClose, onSaved }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [options, setOptions] = useState<NutrientItem[]>([]);
  const [selections, setSelections] = useState<SlotSelection[]>(["", "", ""]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [nutrientsRes, trackedRes] = await Promise.all([
          nutrientService.list(),
          trackedNutrientService.getMine(),
        ]);
        if (cancelled) return;

        const micros = nutrientsRes.data.items.filter((n) => !n.isMacro);
        setOptions(micros);

        const next: SlotSelection[] = ["", "", ""];
        for (const slot of trackedRes.data.slots) {
          if (slot.sortOrder >= 0 && slot.sortOrder <= 2) {
            next[slot.sortOrder] = slot.nutrientId;
          }
        }
        setSelections(next);
      } catch {
        if (!cancelled) {
          setError("Không tải được dữ liệu chất dinh dưỡng.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const usedIds = useMemo(
    () => new Set(selections.filter((s): s is number => s !== "")),
    [selections],
  );

  const handleSave = async () => {
    if (selections.some((s) => s === "")) {
      setError("Vui lòng chọn đủ 3 chất dinh dưỡng.");
      return;
    }
    const ids = selections as number[];
    if (new Set(ids).size !== 3) {
      setError("Không được chọn trùng chất.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await trackedNutrientService.updateMine({
        slots: ids.map((nutrientId, sortOrder) => ({ sortOrder, nutrientId })),
      });
      onSaved();
      onClose();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? "Không lưu được cấu hình.";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant">
          <h3 className="font-display font-extrabold text-lg text-on-surface">
            Theo dõi chất dinh dưỡng
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : (
            <div className="space-y-3">
              {SLOT_LABELS.map((label, index) => (
                <div key={label} className="space-y-1.5">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
                    {label}
                  </label>
                  <select
                    value={selections[index]}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelections((prev) => {
                        const next = [...prev];
                        next[index] = val === "" ? "" : Number(val);
                        return next;
                      });
                    }}
                    className="w-full p-2.5 bg-white border border-outline-variant rounded-xl text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                  >
                    <option value="">-- Chọn chất --</option>
                    {options.map((n) => (
                      <option
                        key={n.nutrientId}
                        value={n.nutrientId}
                        disabled={
                          usedIds.has(n.nutrientId) &&
                          selections[index] !== n.nutrientId
                        }
                      >
                        {n.name} ({n.unit})
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}

          {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={loading || saving}
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-2.5 px-4 rounded-xl text-sm disabled:opacity-70 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Lưu
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
