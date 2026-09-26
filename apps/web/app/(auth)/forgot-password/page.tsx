"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@wisdomstream/shared";
import { apiFetch } from "../../../lib/api";

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = async (data: ForgotPasswordInput) => {
    await apiFetch("/auth/forgot-password", { method: "POST", body: JSON.stringify(data) });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="w-full max-w-sm space-y-4">
        <h1 className="text-xl font-semibold">Check your email</h1>
        <p className="text-sm text-gray-500">
          If an account exists for that email, we&apos;ve sent a link to reset your password.
        </p>
        <Link href="/login" className="text-sm text-blue-600 hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm space-y-4">
      <h1 className="text-xl font-semibold">Reset your password</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div>
          <input
            type="email"
            placeholder="Email"
            className="w-full rounded border px-3 py-2 text-sm"
            {...register("email")}
          />
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded bg-blue-600 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {isSubmitting ? "Sending..." : "Send reset link"}
        </button>
      </form>
      <Link href="/login" className="text-sm text-blue-600 hover:underline">
        Back to sign in
      </Link>
    </div>
  );
}
