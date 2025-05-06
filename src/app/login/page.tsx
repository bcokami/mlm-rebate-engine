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
  const [rememberMe, setRememberMe] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [emailValid, setEmailValid] = useState(true);
  const [passwordValid, setPasswordValid] = useState(true);

  // Validate email format
  const validateEmail = (email: string) => {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  };

  // Handle email change with validation
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    if (value) {
      setEmailValid(validateEmail(value));
    } else {
      setEmailValid(true);
    }
  };

  // Handle password change with validation
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    setPasswordValid(value.length >= 6);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form before submission
    const isEmailValid = validateEmail(email);
    const isPasswordValid = password.length >= 6;

    setEmailValid(isEmailValid);
    setPasswordValid(isPasswordValid);

    if (!isEmailValid || !isPasswordValid) {
      setError("Please correct the errors in the form");
      return;
    }

    setLoading(true);
    setError("");

    try {
      console.log("Attempting to sign in with:", { email, password, rememberMe });

      // Add a delay to ensure the console log is visible
      await new Promise(resolve => setTimeout(resolve, 500));

      let result;
      try {
        result = await signIn("credentials", {
          redirect: false,
          email,
          password,
          callbackUrl: "/dashboard",
          remember: rememberMe,
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

      // If remember me is checked, store email in localStorage
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      console.log("Login successful, redirecting to dashboard");
      router.push("/dashboard");
    } catch (error) {
      console.error("Exception during login:", error);
      setError(`An error occurred: ${error instanceof Error ? error.message : String(error)}`);
      setLoading(false);
    }
  };

  // Load remembered email on component mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left Side - Brand & Image */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-green-500 to-green-700 text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center mb-8">
            <div className="relative w-12 h-12 mr-3">
              <Image
                src="/images/20250503.svg"
                alt="Extreme Life Herbal Products Logo"
                fill
                className="object-contain invert"
              />
            </div>
            <h1 className="text-2xl font-bold">Extreme Life Herbal</h1>
          </div>

          <div className="mt-16 mb-8">
            <h2 className="text-4xl font-bold mb-6">Welcome Back!</h2>
            <p className="text-xl opacity-90 mb-8">
              Sign in to access your dashboard and manage your herbal product business.
            </p>
            <div className="bg-white/10 p-6 rounded-lg backdrop-blur-sm">
              <p className="italic text-white/90 mb-4">
                "Extreme Life Herbal Products changed my life! The business opportunity has provided additional income for my family while promoting health and wellness."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-white/30 mr-3"></div>
                <div>
                  <p className="font-medium">Juan Dela Cruz</p>
                  <p className="text-sm opacity-75">Distributor since 2021</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full -ml-48 -mb-48"></div>

        <div className="relative z-10">
          <p className="text-sm opacity-75">
            &copy; {new Date().getFullYear()} Extreme Life Herbal Products. All rights reserved.
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex flex-col justify-center md:w-1/2 p-6 sm:p-12 bg-white">
        <div className="md:hidden flex justify-center mb-8">
          <div className="flex items-center">
            <div className="relative w-10 h-10 mr-2">
              <Image
                src="/images/20250503.svg"
                alt="Extreme Life Herbal Products Logo"
                fill
                className="object-contain"
              />
            </div>
            <h1 className="text-xl font-bold text-green-700">Extreme Life Herbal</h1>
          </div>
        </div>

        <div className="max-w-md mx-auto w-full">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Sign In</h2>
          <h3 className="text-xl text-green-700 font-medium mb-6">
            Herbal Product Rewards
          </h3>

          <p className="text-gray-600 mb-8">
            Sign in to your account or{" "}
            <Link
              href="/register"
              className="font-medium text-green-600 hover:text-green-500 transition-colors"
            >
              create a new account
            </Link>
          </p>

          {/* Social Login Buttons */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              type="button"
              className="flex items-center justify-center py-2.5 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </button>
            <button
              type="button"
              className="flex items-center justify-center py-2.5 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="#1877F2" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Facebook
            </button>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 mb-1">
                  Email address
                </label>
                <div className="relative">
                  <input
                    id="email-address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className={`appearance-none block w-full px-3 py-2 border ${
                      !emailValid ? 'border-red-300' : emailFocused ? 'border-green-500' : 'border-gray-300'
                    } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 transition-colors sm:text-sm`}
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => handleEmailChange(e)}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                  />
                  {!emailValid && (
                    <p className="mt-1 text-sm text-red-600">Please enter a valid email address</p>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <Link href="/forgot-password" className="text-sm font-medium text-green-600 hover:text-green-500 transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className={`appearance-none block w-full px-3 py-2 border ${
                      !passwordValid ? 'border-red-300' : passwordFocused ? 'border-green-500' : 'border-gray-300'
                    } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 transition-colors sm:text-sm`}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => handlePasswordChange(e)}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                  />
                  {!passwordValid && password.length > 0 && (
                    <p className="mt-1 text-sm text-red-600">Password must be at least 6 characters</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded transition-colors"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    Remember me
                  </label>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors ${
                  loading ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </button>
            </div>
          </form>

          <p className="mt-8 text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <Link href="/register" className="font-medium text-green-600 hover:text-green-500 transition-colors">
              Register now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
