import type { ReactNode } from "react";
import { Construction } from "lucide-react";

type AdminPageShellProps = {
  title: string;
  description: string;
  action?: ReactNode;
  children?: ReactNode;
};

export default function AdminPageShell({
  title,
  description,
  action,
  children,
}: AdminPageShellProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-on-surface">
            {title}
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">{description}</p>
        </div>
        {action}
      </div>

      {children ?? (
        <div className="rounded-2xl border-2 border-dashed border-outline-variant bg-white p-12 text-center">
          <Construction className="w-10 h-10 text-primary mx-auto mb-4" />
          <p className="font-semibold text-on-surface">Đang phát triển</p>
          <p className="text-sm text-on-surface-variant mt-2 max-w-md mx-auto">
            Trang này sẽ được triển khai trong các bước tiếp theo.
          </p>
        </div>
      )}
    </div>
  );
}