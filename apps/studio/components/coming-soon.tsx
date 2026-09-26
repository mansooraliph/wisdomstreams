import type { LucideIcon } from "lucide-react";
import Link from "next/link";

export function ComingSoon({
  icon: Icon,
  title,
  description,
  cta,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  cta?: { label: string; href: string };
}) {
  return (
    <main className="p-8">
      <h1 className="mb-6 text-2xl font-bold">{title}</h1>
      <div className="flex flex-col items-center rounded-xl border bg-white px-6 py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-400">
          <Icon size={28} />
        </div>
        <p className="max-w-sm text-sm text-gray-500">{description}</p>
        {cta && (
          <Link
            href={cta.href}
            className="mt-4 rounded-full border px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            {cta.label}
          </Link>
        )}
      </div>
    </main>
  );
}
