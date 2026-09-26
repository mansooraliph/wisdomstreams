import Link from "next/link";
import { Video } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12">
      <Link href="/" className="mb-6 flex items-center gap-1.5">
        <span className="flex h-8 w-11 items-center justify-center rounded-md bg-red-600 text-white">
          <Video size={18} fill="white" />
        </span>
        <span className="text-xl font-semibold tracking-tight">WisdomStream</span>
      </Link>
      <div className="w-full max-w-sm rounded-2xl border bg-white p-8 shadow-sm">{children}</div>
    </div>
  );
}
