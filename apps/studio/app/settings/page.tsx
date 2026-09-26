import Link from "next/link";

export default function StudioSettingsPage() {
  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold">Settings</h1>
      <p className="mt-2 text-sm text-gray-500">
        Channel branding, description, category, and links have moved to{" "}
        <Link href="/customization" className="text-blue-600 hover:underline">
          Customization
        </Link>
        . Notification preferences and team permissions aren&apos;t built yet.
      </p>
    </main>
  );
}
