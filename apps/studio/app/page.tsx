import Link from "next/link";

export default function StudioRootPage() {
  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold">WisdomStream Studio</h1>
      <p className="text-sm text-gray-500">
        <Link href="/dashboard">Go to dashboard</Link>
      </p>
    </main>
  );
}
