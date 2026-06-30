import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
} from "lucide-react";
import Select from "../../components/ui/Select";
import { DEFAULT_DISH_IMAGE_URL } from "../../constants/default-images";
import { isDefaultDishImage } from "../../constants/default-images";
import { suggestPlanService } from "../../services/suggestPlan.service";
import type { SuggestPlanPublicListItem } from "../../types/suggestPlan";

const PAGE_SIZE = 12;

const SORT_OPTIONS = [
  { value: "created_desc" as const, label: "Mới nhất" },
  { value: "created_asc" as const, label: "Cũ nhất" },
];

function coverSrc(imageUrl: string | null) {
  if (imageUrl && !isDefaultDishImage(imageUrl)) return imageUrl;
  return DEFAULT_DISH_IMAGE_URL;
}

function SuggestPlanListCard({ plan }: { plan: SuggestPlanPublicListItem }) {
  return (
    <Link
      to={`/suggest-plans/${plan.suggestPlanId}`}
      className="group flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 min-h-[6.5rem] rounded-xl border border-outline-variant/70 bg-white shadow-sm hover:shadow-md hover:border-primary/40 transition-all"
    >
      <div className="w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-slate-100 mx-auto sm:mx-0">
        <img
          src={coverSrc(plan.imageUrl)}
          alt=""
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </div>

      <div className="flex-1 min-w-0 text-left space-y-1">
        <h2 className="font-display font-extrabold text-base sm:text-lg text-on-surface line-clamp-2 group-hover:text-primary transition-colors">
          {plan.name}
        </h2>
        <p className="text-sm font-semibold text-primary">
          {plan.dayCount} ngày
        </p>
        {plan.description && (
          <p className="text-sm text-on-surface-variant line-clamp-2">
            {plan.description}
          </p>
        )}
      </div>
    </Link>
  );
}

export default function UserSuggestPlansPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<"created_desc" | "created_asc">(
    "created_desc",
  );

  const [items, setItems] = useState<SuggestPlanPublicListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, sort]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    suggestPlanService
      .listPublic({ search: debouncedSearch, page, pageSize: PAGE_SIZE, sort })
      .then((res) => {
        if (!active) return;
        setItems(res.data.items);
        setTotal(res.data.total);
      })
      .catch(() => {
        if (active) setError("Không tải được danh sách thực đơn gợi ý.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [debouncedSearch, page, sort]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div>
        <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-on-surface">
          Thực đơn gợi ý
        </h1>
        <p className="text-sm text-on-surface-variant mt-1.5">
          Khám phá thực đơn mẫu và áp dụng vào lịch dinh dưỡng của bạn.
        </p>
      </div>

      <div className="rounded-2xl border border-outline-variant bg-white shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-5 py-4 border-b border-outline-variant/60 bg-surface-container-low/50">
          <div className="flex items-center gap-2 text-sm text-on-surface-variant shrink-0">
            <CalendarRange className="w-4 h-4 text-primary" />
            <span>
              Tổng: <strong className="text-on-surface">{total}</strong> gợi ý
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-3 w-full sm:w-auto sm:ml-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm tên hoặc mô tả..."
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-outline-variant bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <Select
              value={sort}
              onChange={setSort}
              options={SORT_OPTIONS}
              menuAlign="end"
              className="w-full sm:w-auto sm:min-w-[11rem]"
              aria-label="Sắp xếp"
            />
          </div>
        </div>

        {error && (
          <p className="px-4 py-12 text-center text-sm text-tertiary">{error}</p>
        )}

        {!error && loading && (
          <p className="px-4 py-16 text-center text-sm text-on-surface-variant inline-flex items-center justify-center gap-2 w-full">
            <Loader2 className="w-4 h-4 animate-spin" /> Đang tải...
          </p>
        )}

        {!error && !loading && items.length === 0 && (
          <p className="px-4 py-16 text-center text-sm text-on-surface-variant">
            {debouncedSearch
              ? "Không có gợi ý nào khớp tìm kiếm."
              : "Chưa có thực đơn gợi y ý công khai."}
          </p>
        )}

        {!error && !loading && items.length > 0 && (
          <>
            <div className="p-3 sm:p-4 flex flex-col gap-3">
              {items.map((plan) => (
                <SuggestPlanListCard key={plan.suggestPlanId} plan={plan} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-outline-variant/60">
                <p className="text-xs text-on-surface-variant">
                  Trang {page}/{totalPages}
                </p>
                <div className="flex gap-1">
                  <button
                    type="button"
                    disabled={!canPrev}
                    onClick={() => setPage((p) => p - 1)}
                    className="p-2 rounded-lg border border-outline-variant disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={!canNext}
                    onClick={() => setPage((p) => p + 1)}
                    className="p-2 rounded-lg border border-outline-variant disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}