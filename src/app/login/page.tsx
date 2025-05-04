"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { generateCsrfToken } from "@/lib/csrf";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      console.log("Attempting to sign in with:", { email, password });

      // Add a delay to ensure the console log is visible
      await new Promise(resolve => setTimeout(resolve, 500));

      let result;
      try {
        result = await signIn("credentials", {
          redirect: false,
          email,
          password,
          callbackUrl: "/dashboard",
        });

        console.log("Sign in result:", result);

        if (result?.error) {
          console.error("Login error:", result.error);

          // Map error codes to user-friendly messages
          let errorMessage = "Login failed";
          switch (result.error) {
            case "CredentialsSignin":
              errorMessage = "Invalid email or password";
              break;
            default:
              errorMessage = `Login failed: ${result.error}`;
          }

          setError(errorMessage);
          setLoading(false);
          return;
        }
      } catch (signInError) {
        console.error("Exception during signIn:", signInError);
        setError(`Login failed: ${signInError instanceof Error ? signInError.message : "Unknown error"}`);
        setLoading(false);
        return;
      }

      if (!result?.ok) {
        console.error("Login not OK but no error provided");
        setError("Login failed for unknown reason");
        setLoading(false);
        return;
      }

      console.log("Login successful, redirecting to dashboard");
      router.push("/dashboard");
    } catch (error) {
      console.error("Exception during login:", error);
      setError(`An error occurred: ${error instanceof Error ? error.message : String(error)}`);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <div className="relative w-32 h-32">
              <Image
                src="/images/20250503.svg"
                alt="Extreme Life Herbal Products Logo"
                fill
                className="object-contain"
              />
            </div>
          </div>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900">
            Extreme Life Herbal
          </h2>
          <h3 className="text-center text-xl text-green-700 font-medium">
            Herbal Product Rewards
          </h3>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to your account or{" "}
            <Link
              href="/register"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              create a new account
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
