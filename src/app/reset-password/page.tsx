"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { FaArrowLeft, FaLock, FaEye, FaEyeSlash, FaCheck } from "react-icons/fa";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);
  const [passwordValid, setPasswordValid] = useState(true);
  const [confirmPasswordValid, setConfirmPasswordValid] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);
  const [tokenChecked, setTokenChecked] = useState(false);

  // Password validation criteria
  const minLength = 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  
  const passwordStrength = [
    password.length >= minLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecialChar
  ].filter(Boolean).length;

  // Get token from URL on component mount
  useEffect(() => {
    const tokenFromUrl = searchParams?.get('token');
    setToken(tokenFromUrl);
    
    // Validate token (in a real app, you would verify this with your API)
    const validateToken = async () => {
      if (!tokenFromUrl) {
        setTokenValid(false);
        setTokenChecked(true);
        return;
      }
      
      try {
        // Simulate API call to validate token
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // In a real implementation, you would call your API endpoint here
        // const response = await fetch(`/api/auth/validate-reset-token?token=${tokenFromUrl}`);
        // if (!response.ok) {
        //   throw new Error("Invalid or expired token");
        // }
        
        setTokenValid(true);
      } catch (error) {
        console.error("Error validating token:", error);
        setTokenValid(false);
      } finally {
        setTokenChecked(true);
      }
    };
    
    validateToken();
  }, [searchParams]);

  // Handle password change with validation
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    setPasswordValid(value.length >= minLength);
    
    // Also validate confirm password when password changes
    if (confirmPassword) {
      setConfirmPasswordValid(confirmPassword === value);
    }
  };

  // Handle confirm password change with validation
  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setConfirmPassword(value);
    setConfirmPasswordValid(value === password);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form before submission
    const isPasswordValid = password.length >= minLength;
    const isConfirmPasswordValid = confirmPassword === password;
    
    setPasswordValid(isPasswordValid);
    setConfirmPasswordValid(isConfirmPasswordValid);

    if (!isPasswordValid || !isConfirmPasswordValid) {
      setError("Please correct the errors in the form");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Simulate API call to reset password
      await new Promise(resolve => setTimeout(resolve, 1500));

      // In a real implementation, you would call your API endpoint here
      // const response = await fetch("/api/auth/reset-password", {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify({ token, password }),
      // });
      
      // if (!response.ok) {
      //   const data = await response.json();
      //   throw new Error(data.message || "Failed to reset password");
      // }

      setSuccess(true);
    } catch (error) {
      console.error("Error resetting password:", error);
      setError(`Failed to reset password: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  // Render loading state while checking token
  if (!tokenChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 text-green-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-600">Verifying your reset link...</p>
        </div>
      </div>
    );
  }

  // Render invalid token message
  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">Invalid or Expired Link</h3>
          <p className="text-gray-600 mb-6">
            The password reset link you clicked is invalid or has expired. Please request a new password reset link.
          </p>
          <Link
            href="/forgot-password"
            className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
          >
            Request New Link
          </Link>
        </div>
      </div>
    );
  }

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
            <h2 className="text-4xl font-bold mb-6">Create New Password</h2>
            <p className="text-xl opacity-90 mb-8">
              Choose a strong password to protect your account and keep your business secure.
            </p>
            <div className="bg-white/10 p-6 rounded-lg backdrop-blur-sm">
              <p className="italic text-white/90 mb-4">
                "A strong password is the first line of defense for your account. Make sure to use a unique password that you don't use for other services."
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-white/30 mr-3"></div>
                <div>
                  <p className="font-medium">Security Team</p>
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

      {/* Right Side - Reset Password Form */}
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
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Reset Password</h2>
              <p className="text-gray-600 mb-8">
                Create a new password for your account. Make sure it's strong and secure.
              </p>

              <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaLock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      className={`appearance-none block w-full pl-10 pr-10 py-2 border ${
                        !passwordValid ? 'border-red-300' : passwordFocused ? 'border-green-500' : 'border-gray-300'
                      } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 transition-colors sm:text-sm`}
                      placeholder="••••••••"
                      value={password}
                      onChange={handlePasswordChange}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <FaEyeSlash className="h-5 w-5 text-gray-400" />
                      ) : (
                        <FaEye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  
                  {/* Password strength indicator */}
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">Password strength:</span>
                      <span className="text-xs font-medium">
                        {passwordStrength === 0 && "Very Weak"}
                        {passwordStrength === 1 && "Weak"}
                        {passwordStrength === 2 && "Fair"}
                        {passwordStrength === 3 && "Good"}
                        {passwordStrength === 4 && "Strong"}
                        {passwordStrength === 5 && "Very Strong"}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${
                          passwordStrength === 0 ? 'w-0' :
                          passwordStrength === 1 ? 'w-1/5 bg-red-500' :
                          passwordStrength === 2 ? 'w-2/5 bg-orange-500' :
                          passwordStrength === 3 ? 'w-3/5 bg-yellow-500' :
                          passwordStrength === 4 ? 'w-4/5 bg-blue-500' :
                          'w-full bg-green-500'
                        } transition-all duration-300`}
                      ></div>
                    </div>
                    
                    <ul className="mt-2 space-y-1 text-xs text-gray-500">
                      <li className={`flex items-center ${password.length >= minLength ? 'text-green-600' : ''}`}>
                        <span className={`mr-1 ${password.length >= minLength ? 'text-green-600' : ''}`}>•</span>
                        At least {minLength} characters
                      </li>
                      <li className={`flex items-center ${hasUppercase ? 'text-green-600' : ''}`}>
                        <span className={`mr-1 ${hasUppercase ? 'text-green-600' : ''}`}>•</span>
                        At least one uppercase letter
                      </li>
                      <li className={`flex items-center ${hasLowercase ? 'text-green-600' : ''}`}>
                        <span className={`mr-1 ${hasLowercase ? 'text-green-600' : ''}`}>•</span>
                        At least one lowercase letter
                      </li>
                      <li className={`flex items-center ${hasNumber ? 'text-green-600' : ''}`}>
                        <span className={`mr-1 ${hasNumber ? 'text-green-600' : ''}`}>•</span>
                        At least one number
                      </li>
                      <li className={`flex items-center ${hasSpecialChar ? 'text-green-600' : ''}`}>
                        <span className={`mr-1 ${hasSpecialChar ? 'text-green-600' : ''}`}>•</span>
                        At least one special character
                      </li>
                    </ul>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaLock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="confirm-password"
                      name="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      className={`appearance-none block w-full pl-10 pr-10 py-2 border ${
                        !confirmPasswordValid ? 'border-red-300' : confirmPasswordFocused ? 'border-green-500' : 'border-gray-300'
                      } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 transition-colors sm:text-sm`}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={handleConfirmPasswordChange}
                      onFocus={() => setConfirmPasswordFocused(true)}
                      onBlur={() => setConfirmPasswordFocused(false)}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <FaEyeSlash className="h-5 w-5 text-gray-400" />
                      ) : (
                        <FaEye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {!confirmPasswordValid && confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">Passwords do not match</p>
                  )}
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
                        Resetting...
                      </>
                    ) : (
                      "Reset Password"
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
              <h3 className="text-xl font-medium text-gray-900 mb-2">Password Reset Successful</h3>
              <p className="text-gray-600 mb-6">
                Your password has been successfully reset. You can now log in with your new password.
              </p>
              <Link
                href="/login"
                className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
              >
                Go to Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
