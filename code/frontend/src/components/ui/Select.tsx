import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";

export type SelectOption<T extends string = string> = {
  value: T;
  label: string;
  disabled?: boolean;
};

type SelectProps<T extends string = string> = {
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  menuAlign?: "start" | "end";
  "aria-label"?: string;
  id?: string;
};

type MenuRect = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
};

const MENU_GAP = 4;
const MENU_MAX_HEIGHT = 240;

export default function Select<T extends string = string>({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  className = "",
  menuAlign = "start",
  "aria-label": ariaLabel,
  id,
}: SelectProps<T>) {
  const autoId = useId();
  const selectId = id ?? autoId;

  const [open, setOpen] = useState(false);
  const [menuRect, setMenuRect] = useState<MenuRect | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);

  const selected = options.find((o) => o.value === value);
  const displayLabel = selected?.label ?? placeholder ?? "";
  const isPlaceholder = !selected && !!placeholder;

  function measureMenu() {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom - MENU_GAP;
    const spaceAbove = rect.top - MENU_GAP;
    const openUpward = spaceBelow < 120 && spaceAbove > spaceBelow;
    const available = openUpward ? spaceAbove : spaceBelow;
    const maxHeight = Math.min(
      MENU_MAX_HEIGHT,
      Math.max(available, 80),
    );

    const top = openUpward
      ? rect.top - maxHeight - MENU_GAP
      : rect.bottom + MENU_GAP;

    const left =
      menuAlign === "end" ? rect.right - rect.width : rect.left;

    setMenuRect({
      top,
      left,
      width: rect.width,
      maxHeight,
    });
  }

  useLayoutEffect(() => {
    if (!open) {
      setMenuRect(null);
      return;
    }
    measureMenu();
  }, [open, menuAlign, options.length]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (
        rootRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    function handleReposition() {
      measureMenu();
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [open, menuAlign, options.length]);

  const menu =
    open && menuRect
      ? createPortal(
          <ul
            ref={menuRef}
            role="listbox"
            aria-labelledby={selectId}
            style={{
              position: "fixed",
              top: menuRect.top,
              left: menuRect.left,
              width: menuRect.width,
              maxHeight: menuRect.maxHeight,
              zIndex: 9999,
            }}
            className="overflow-y-auto rounded-xl border border-outline-variant bg-white py-1 shadow-lg"
          >
            {options.map((opt) => {
              const isSelected = opt.value === value;
              const isDisabled = !!opt.disabled;

              return (
                <li
                  key={opt.value}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={isDisabled}
                >
                  <button
                    type="button"
                    disabled={isDisabled}
                    onClick={() => {
                      if (isDisabled) return;
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${
                      isDisabled
                        ? "text-on-surface-variant/50 cursor-not-allowed"
                        : isSelected
                          ? "bg-primary/10 text-primary font-semibold cursor-pointer"
                          : "text-on-surface hover:bg-surface-container-low cursor-pointer"
                    }`}
                  >
                    {opt.label}
                  </button>
                </li>
              );
            })}
          </ul>,
          document.body,
        )
      : null;

  return (
    <div ref={rootRef} className={className}>
      <button
        ref={triggerRef}
        id={selectId}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        className="w-full inline-flex items-center justify-between gap-2 px-3 py-2 text-sm rounded-xl border border-outline-variant bg-white hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-outline-variant"
      >
        <span
          className={`truncate text-left ${
            isPlaceholder ? "text-on-surface-variant" : "text-on-surface"
          }`}
        >
          {displayLabel}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-on-surface-variant shrink-0 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {menu}
    </div>
  );
}