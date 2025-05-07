"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FaArrowLeft, FaEnvelope, FaCheck } from "react-icons/fa";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [emailFocused, setEmailFocused] = useState(false);
  const [emailValid, setEmailValid] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form before submission
    const isEmailValid = validateEmail(email);
    setEmailValid(isEmailValid);

    if (!isEmailValid) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Simulate API call to request password reset
      await new Promise(resolve => setTimeout(resolve, 1500));

      // In a real implementation, you would call your API endpoint here
      // const response = await fetch("/api/auth/forgot-password", {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify({ email }),
      // });
      
      // if (!response.ok) {
      //   const data = await response.json();
      //   throw new Error(data.message || "Failed to send reset email");
      // }

      setSuccess(true);
    } catch (error) {
      console.error("Error requesting password reset:", error);
      setError(`Failed to send reset email: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

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
            <h2 className="text-4xl font-bold mb-6">Reset Your Password</h2>
            <p className="text-xl opacity-90 mb-8">
              We'll send you instructions to reset your password and get you back to your account.
            </p>
            <div className="bg-white/10 p-6 rounded-lg backdrop-blur-sm">
              <p className="italic text-white/90 mb-4">
                "Our support team is always ready to help you with any account issues. We're committed to providing excellent service to all our distributors."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-white/30 mr-3"></div>
                <div>
                  <p className="font-medium">Customer Support</p>
                  <p className="text-sm opacity-75">Extreme Life Herbal</p>
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

      {/* Right Side - Password Reset Form */}
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
          <Link 
            href="/login" 
            className="inline-flex items-center text-sm font-medium text-green-600 hover:text-green-500 mb-6 transition-colors"
          >
            <FaArrowLeft className="mr-2" /> Back to login
          </Link>

          {!success ? (
            <>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Forgot Password</h2>
              <p className="text-gray-600 mb-8">
                Enter your email address and we'll send you instructions to reset your password.
              </p>

              <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 mb-1">
                    Email address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaEnvelope className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email-address"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      className={`appearance-none block w-full pl-10 pr-3 py-2 border ${
                        !emailValid ? 'border-red-300' : emailFocused ? 'border-green-500' : 'border-gray-300'
                      } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 transition-colors sm:text-sm`}
                      placeholder="you@example.com"
                      value={email}
                      onChange={handleEmailChange}
                      onFocus={() => setEmailFocused(true)}
                      onBlur={() => setEmailFocused(false)}
                    />
                    {!emailValid && (
                      <p className="mt-1 text-sm text-red-600">Please enter a valid email address</p>
                    )}
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
                        Sending...
                      </>
                    ) : (
                      "Send Reset Instructions"
                    )}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <FaCheck className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">Check your email</h3>
              <p className="text-gray-600 mb-6">
                We've sent password reset instructions to:
                <br />
                <span className="font-medium">{email}</span>
              </p>
              <p className="text-sm text-gray-500 mb-6">
                If you don't see the email, check your spam folder or make sure you entered the correct email address.
              </p>
              <div className="flex flex-col space-y-3">
                <Link
                  href="/login"
                  className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
                >
                  Return to Login
                </Link>
                <button
                  onClick={() => setSuccess(false)}
                  className="inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  Try a different email
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
