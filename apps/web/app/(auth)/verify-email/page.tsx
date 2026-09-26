"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "../../../lib/api";

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailStatus />
    </Suspense>
  );
}

function VerifyEmailStatus() {
  const token = useSearchParams().get("token") ?? "";
  const [status, setStatus] = useState<"pending" | "success" | "error">("pending");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }
    apiFetch(`/auth/verify-email?token=${encodeURIComponent(token)}`).then((res) => {
      setStatus(res.error ? "error" : "success");
    });
  }, [token]);

  return (
    <div className="w-full max-w-sm space-y-4 text-center">
      {status === "pending" && <p className="text-sm text-gray-500">Verifying your email...</p>}
      {status === "success" && <p className="text-sm text-green-600">Your email is verified.</p>}
      {status === "error" && (
        <p className="text-sm text-red-600">This verification link is invalid or has expired.</p>
      )}
      <Link href="/" className="text-sm text-blue-600 hover:underline">
        Go to home
      </Link>
    </div>
  );
}
