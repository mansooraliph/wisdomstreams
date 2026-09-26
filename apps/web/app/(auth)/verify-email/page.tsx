"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
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
    <div className="space-y-4 text-center">
      <div className="flex justify-center">
        {status === "pending" && <Loader2 size={32} className="animate-spin text-gray-400" />}
        {status === "success" && <CheckCircle2 size={32} className="text-green-600" />}
        {status === "error" && <XCircle size={32} className="text-red-600" />}
      </div>
      {status === "pending" && <p className="text-sm text-gray-500">Verifying your email...</p>}
      {status === "success" && <p className="text-sm font-medium">Your email is verified.</p>}
      {status === "error" && (
        <p className="text-sm text-red-600">This verification link is invalid or has expired.</p>
      )}
      <Link href="/" className="inline-block text-sm font-medium text-blue-600 hover:underline">
        Go to home
      </Link>
    </div>
  );
}
