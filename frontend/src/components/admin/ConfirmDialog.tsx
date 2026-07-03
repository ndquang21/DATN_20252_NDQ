import type { ReactNode } from "react";
import { Loader2, X } from "lucide-react";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Xác nhận",
  cancelLabel = "Hủy",
  loading = false,
  danger = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={loading ? undefined : onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        <div className="flex justify-between items-start gap-3 px-5 py-4 border-b border-outline-variant/60">
          <h3
            id="confirm-dialog-title"
            className="font-display font-extrabold text-lg text-on-surface"
          >
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="text-on-surface-variant hover:text-on-surface cursor-pointer disabled:opacity-50 shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-4 text-sm text-on-surface-variant leading-relaxed">
          {description}
        </div>

        <div className="flex gap-2 px-5 pb-5">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 text-sm font-bold rounded-xl border border-outline-variant text-on-surface-variant hover:bg-surface-container-low cursor-pointer disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl text-white cursor-pointer disabled:opacity-50 inline-flex items-center justify-center gap-2 ${
              danger
                ? "bg-tertiary hover:bg-tertiary/90"
                : "bg-primary hover:bg-primary/90"
            }`}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}