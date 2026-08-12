import Link from "next/link";

type Props = {
  page: number;
  pageSize: number;
  total: number;
  searchParams: Record<string, string | undefined>;
};

function hrefForPage(searchParams: Record<string, string | undefined>, page: number) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (value && key !== "page") params.set(key, value);
  }
  if (page > 0) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `/tareas?${qs}` : "/tareas";
}

export function Pagination({ page, pageSize, total, searchParams }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : page * pageSize + 1;
  const to = Math.min(total, (page + 1) * pageSize);

  return (
    <nav
      aria-label="Paginación de tareas"
      className="mt-4 flex items-center justify-between text-sm"
    >
      <p className="text-neutral-500 dark:text-neutral-400">
        {total === 0 ? "Sin resultados" : `Mostrando ${from}–${to} de ${total}`}
      </p>
      <div className="flex gap-2">
        {page > 0 ? (
          <Link
            href={hrefForPage(searchParams, page - 1)}
            className="rounded-md border border-neutral-300 px-3 py-1.5 font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            Anterior
          </Link>
        ) : (
          <span className="rounded-md border border-neutral-200 px-3 py-1.5 font-medium text-neutral-400 dark:border-neutral-800">
            Anterior
          </span>
        )}
        {page + 1 < totalPages ? (
          <Link
            href={hrefForPage(searchParams, page + 1)}
            className="rounded-md border border-neutral-300 px-3 py-1.5 font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            Siguiente
          </Link>
        ) : (
          <span className="rounded-md border border-neutral-200 px-3 py-1.5 font-medium text-neutral-400 dark:border-neutral-800">
            Siguiente
          </span>
        )}
      </div>
    </nav>
  );
}
