import Link from "next/link";
import { ReactNode } from "react";

export function Shell({
  title,
  back,
  actions,
  children,
}: {
  title: string;
  back?: { href: string; label: string };
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      {back && (
        <Link href={back.href} className="text-sm text-indigo-600 hover:underline">
          ← {back.label}
        </Link>
      )}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{title}</h1>
        {actions}
      </div>
      <div className="mt-6">{children}</div>
    </main>
  );
}

export function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-slate-500">Memuat...</p>
    </main>
  );
}