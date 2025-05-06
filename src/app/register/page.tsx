"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { FaUser, FaEnvelope, FaPhone, FaLock, FaUserPlus, FaCheck, FaInfoCircle, FaArrowRight, FaArrowLeft } from "react-icons/fa";

export default function RegisterPage() {
  const router = useRouter();
  // Form steps
  const STEPS = {
    PERSONAL_INFO: 0,
    CONTACT_INFO: 1,
    SECURITY: 2,
    REFERRAL: 3,
    REVIEW: 4
  };

  const [currentStep, setCurrentStep] = useState(STEPS.PERSONAL_INFO);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    uplineId: "",
    address: "",
    city: "",
    region: "",
    postalCode: "",
    birthdate: "",
    agreeToTerms: false,
    receiveUpdates: false
  });

  // Validation states
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isStepValid, setIsStepValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isUplineVerified, setIsUplineVerified] = useState(false);
  const [isUplineVerifying, setIsUplineVerifying] = useState(false);
  const [uplineName, setUplineName] = useState("");

  // Validation functions
  const validateEmail = (email: string) => {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  };

  const validatePhone = (phone: string) => {
    // Basic phone validation - can be enhanced for specific formats
    return phone === "" || phone.length >= 10;
  };

  const validatePassword = (password: string) => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return re.test(password);
  };

  const validateField = (name: string, value: any) => {
    let error = "";

    switch (name) {
      case "name":
        if (!value) error = "Name is required";
        else if (value.length < 2) error = "Name must be at least 2 characters";
        break;
      case "email":
        if (!value) error = "Email is required";
        else if (!validateEmail(value)) error = "Please enter a valid email address";
        break;
      case "phone":
        if (value && !validatePhone(value)) error = "Please enter a valid phone number";
        break;
      case "password":
        if (!value) error = "Password is required";
        else if (!validatePassword(value))
          error = "Password must be at least 8 characters with 1 uppercase letter, 1 lowercase letter, and 1 number";
        break;
      case "confirmPassword":
        if (!value) error = "Please confirm your password";
        else if (value !== formData.password) error = "Passwords do not match";
        break;
      case "agreeToTerms":
        if (!value) error = "You must agree to the terms and conditions";
        break;
      default:
        break;
    }

    return error;
  };

  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;

    // Update form data
    setFormData((prev) => ({ ...prev, [name]: newValue }));

    // Mark field as touched
    setTouched((prev) => ({ ...prev, [name]: true }));

    // Validate field
    const error = validateField(name, newValue);
    setErrors((prev) => ({ ...prev, [name]: error }));

    // Special case for uplineId - reset verification when changed
    if (name === "uplineId") {
      setIsUplineVerified(false);
      setUplineName("");
    }
  };

  // Handle blur events for validation
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === "checkbox" ? checked : value;

    // Mark field as touched
    setTouched((prev) => ({ ...prev, [name]: true }));

    // Validate field
    const error = validateField(name, fieldValue);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  // Validate current step
  const validateStep = () => {
    let isValid = true;
    let newErrors: Record<string, string> = {};

    // Fields to validate for each step
    const fieldsToValidate: Record<number, string[]> = {
      [STEPS.PERSONAL_INFO]: ["name"],
      [STEPS.CONTACT_INFO]: ["email", "phone"],
      [STEPS.SECURITY]: ["password", "confirmPassword"],
      [STEPS.REFERRAL]: ["agreeToTerms"],
      [STEPS.REVIEW]: []
    };

    // Validate required fields for current step
    fieldsToValidate[currentStep].forEach(field => {
      const error = validateField(field, formData[field as keyof typeof formData]);
      if (error) {
        isValid = false;
        newErrors[field] = error;
      }
    });

    setErrors(newErrors);
    setIsStepValid(isValid);
    return isValid;
  };

  // Effect to validate current step when form data changes
  useEffect(() => {
    validateStep();
  }, [formData, currentStep]);

  // Navigate to next step
  const nextStep = () => {
    if (validateStep()) {
      setCurrentStep(prev => prev + 1);
    }
  };

  // Navigate to previous step
  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  // Verify upline ID
  const verifyUplineId = async () => {
    if (!formData.uplineId) return;

    setIsUplineVerifying(true);

    try {
      // Simulate API call to verify upline ID
      await new Promise(resolve => setTimeout(resolve, 1000));

      // For demo purposes, we'll just set a random name
      // In a real app, this would be an API call to verify the upline ID
      const names = ["Maria Santos", "Juan Dela Cruz", "Angelica Reyes", "Roberto Tan"];
      const randomName = names[Math.floor(Math.random() * names.length)];

      setUplineName(randomName);
      setIsUplineVerified(true);
    } catch (error) {
      setErrors(prev => ({ ...prev, uplineId: "Failed to verify upline ID" }));
      setIsUplineVerified(false);
    } finally {
      setIsUplineVerifying(false);
    }
  };

  // Final form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields before submission
    let allErrors: Record<string, string> = {};
    let isValid = true;

    // Fields to validate
    const allFields = ["name", "email", "password", "confirmPassword", "agreeToTerms"];

    allFields.forEach(field => {
      const error = validateField(field, formData[field as keyof typeof formData]);
      if (error) {
        isValid = false;
        allErrors[field] = error;
      }
    });

    if (!isValid) {
      setErrors(allErrors);
      return;
    }

    setLoading(true);

    console.log("Registration form submitted:", { ...formData, password: "***" });

    try {
      console.log("Sending registration request to API");

      const requestBody = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        phone: formData.phone,
        uplineId: formData.uplineId || undefined,
        address: formData.address,
        city: formData.city,
        region: formData.region,
        postalCode: formData.postalCode,
        birthdate: formData.birthdate,
        receiveUpdates: formData.receiveUpdates
      };

      console.log("Request body:", { ...requestBody, password: "***", confirmPassword: "***" });

      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      console.log("Registration response status:", response.status);

      const data = await response.json();
      console.log("Registration response data:", data);

      if (!response.ok) {
        if (data.errors) {
          // Format validation errors
          const errorMessages = Object.values(data.errors).join(", ");
          throw new Error(errorMessages || "Validation failed");
        }
        throw new Error(data.error || "Failed to register");
      }

      console.log("Registration successful, redirecting to login page");
      // Redirect to login page
      router.push("/login?registered=true");
    } catch (error: any) {
      console.error("Registration error:", error);
      setErrors(prev => ({ ...prev, form: error.message || "An error occurred during registration" }));
      setLoading(false);
    }
  };

  // Step titles
  const stepTitles = [
    "Personal Information",
    "Contact Details",
    "Security",
    "Referral",
    "Review & Submit"
  ];

  // Render step indicators
  const renderStepIndicators = () => {
    return (
      <div className="flex justify-between items-center w-full mb-8">
        {stepTitles.map((title, index) => (
          <div key={index} className="flex flex-col items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep === index
                  ? 'bg-green-600 text-white'
                  : currentStep > index
                    ? 'bg-green-100 text-green-600 border-2 border-green-600'
                    : 'bg-gray-100 text-gray-500'
              }`}
            >
              {currentStep > index ? <FaCheck className="h-4 w-4" /> : index + 1}
            </div>
            <span
              className={`mt-2 text-xs ${
                currentStep === index
                  ? 'text-green-600 font-medium'
                  : 'text-gray-500'
              } hidden sm:block`}
            >
              {title}
            </span>
          </div>
        ))}
      </div>
    );
  };

  // Render form based on current step
  const renderFormStep = () => {
    switch (currentStep) {
      case STEPS.PERSONAL_INFO:
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  className={`appearance-none block w-full pl-10 pr-3 py-2 border ${
                    errors.name && touched.name ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm`}
                  placeholder="Juan Dela Cruz"
                  value={formData.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                {errors.name && touched.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="birthdate" className="block text-sm font-medium text-gray-700 mb-1">
                Date of Birth
              </label>
              <input
                id="birthdate"
                name="birthdate"
                type="date"
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                value={formData.birthdate}
                onChange={handleChange}
              />
            </div>
          </div>
        );

      case STEPS.CONTACT_INFO:
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className={`appearance-none block w-full pl-10 pr-3 py-2 border ${
                    errors.email && touched.email ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm`}
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                {errors.email && touched.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaPhone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  className={`appearance-none block w-full pl-10 pr-3 py-2 border ${
                    errors.phone && touched.phone ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm`}
                  placeholder="+63 XXX XXX XXXX"
                  value={formData.phone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                {errors.phone && touched.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <input
                id="address"
                name="address"
                type="text"
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder="Street Address"
                value={formData.address}
                onChange={handleChange}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  placeholder="City"
                  value={formData.city}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-1">
                  Region/Province
                </label>
                <input
                  id="region"
                  name="region"
                  type="text"
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  placeholder="Region/Province"
                  value={formData.region}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">
                Postal Code
              </label>
              <input
                id="postalCode"
                name="postalCode"
                type="text"
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder="Postal Code"
                value={formData.postalCode}
                onChange={handleChange}
              />
            </div>
          </div>
        );

      case STEPS.SECURITY:
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className={`appearance-none block w-full pl-10 pr-3 py-2 border ${
                    errors.password && touched.password ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm`}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                {errors.password && touched.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Password must be at least 8 characters with 1 uppercase letter, 1 lowercase letter, and 1 number
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  className={`appearance-none block w-full pl-10 pr-3 py-2 border ${
                    errors.confirmPassword && touched.confirmPassword ? 'border-red-300' : 'border-gray-300'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm`}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                {errors.confirmPassword && touched.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </div>
            </div>
          </div>
        );

      case STEPS.REFERRAL:
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="uplineId" className="block text-sm font-medium text-gray-700 mb-1">
                Upline ID (Referrer)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUserPlus className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="uplineId"
                  name="uplineId"
                  type="text"
                  className={`appearance-none block w-full pl-10 pr-3 py-2 border ${
                    errors.uplineId ? 'border-red-300' : isUplineVerified ? 'border-green-300' : 'border-gray-300'
                  } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm`}
                  placeholder="Enter upline ID if you were referred"
                  value={formData.uplineId}
                  onChange={handleChange}
                />
                {errors.uplineId && (
                  <p className="mt-1 text-sm text-red-600">{errors.uplineId}</p>
                )}
                {isUplineVerified && (
                  <p className="mt-1 text-sm text-green-600 flex items-center">
                    <FaCheck className="mr-1" /> Verified: {uplineName}
                  </p>
                )}
              </div>
              <div className="mt-2">
                <button
                  type="button"
                  onClick={verifyUplineId}
                  disabled={!formData.uplineId || isUplineVerifying}
                  className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md ${
                    !formData.uplineId || isUplineVerifying
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {isUplineVerifying ? 'Verifying...' : 'Verify ID'}
                </button>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="agreeToTerms"
                    name="agreeToTerms"
                    type="checkbox"
                    className={`h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded ${
                      errors.agreeToTerms && touched.agreeToTerms ? 'border-red-300' : ''
                    }`}
                    checked={formData.agreeToTerms}
                    onChange={handleChange}
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="agreeToTerms" className="font-medium text-gray-700">
                    I agree to the <Link href="/terms" className="text-green-600 hover:text-green-500">Terms and Conditions</Link> and <Link href="/privacy" className="text-green-600 hover:text-green-500">Privacy Policy</Link> <span className="text-red-500">*</span>
                  </label>
                  {errors.agreeToTerms && touched.agreeToTerms && (
                    <p className="mt-1 text-sm text-red-600">{errors.agreeToTerms}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="receiveUpdates"
                    name="receiveUpdates"
                    type="checkbox"
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    checked={formData.receiveUpdates}
                    onChange={handleChange}
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="receiveUpdates" className="font-medium text-gray-700">
                    I want to receive updates about products, promotions, and events
                  </label>
                </div>
              </div>
            </div>
          </div>
        );

      case STEPS.REVIEW:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Review Your Information</h3>

              <div className="bg-gray-50 p-4 rounded-md">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Personal Information</h4>
                    <p className="mt-1 text-sm text-gray-900">{formData.name}</p>
                    {formData.birthdate && (
                      <p className="mt-1 text-sm text-gray-900">Born: {formData.birthdate}</p>
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Contact Information</h4>
                    <p className="mt-1 text-sm text-gray-900">{formData.email}</p>
                    {formData.phone && (
                      <p className="mt-1 text-sm text-gray-900">{formData.phone}</p>
                    )}
                    {formData.address && (
                      <p className="mt-1 text-sm text-gray-900">
                        {formData.address}, {formData.city}, {formData.region} {formData.postalCode}
                      </p>
                    )}
                  </div>

                  {formData.uplineId && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Referral Information</h4>
                      <p className="mt-1 text-sm text-gray-900">
                        Upline ID: {formData.uplineId}
                        {isUplineVerified && ` (${uplineName})`}
                      </p>
                    </div>
                  )}

                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Preferences</h4>
                    <p className="mt-1 text-sm text-gray-900">
                      {formData.receiveUpdates ? 'Will receive updates' : 'Will not receive updates'}
                    </p>
                  </div>
                </div>
              </div>

              <p className="mt-4 text-sm text-gray-500">
                Please review your information carefully. You can go back to previous steps to make changes if needed.
              </p>
            </div>

            {errors.form && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                {errors.form}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // Render navigation buttons
  const renderNavButtons = () => {
    return (
      <div className="flex justify-between mt-8">
        {currentStep > 0 ? (
          <button
            type="button"
            onClick={prevStep}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <FaArrowLeft className="mr-2 h-4 w-4" />
            Back
          </button>
        ) : (
          <div></div> // Empty div to maintain spacing
        )}

        {currentStep < STEPS.REVIEW ? (
          <button
            type="button"
            onClick={nextStep}
            disabled={!isStepValid}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
              isStepValid ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-300 cursor-not-allowed'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
          >
            Next
            <FaArrowRight className="ml-2 h-4 w-4" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating account...
              </>
            ) : (
              <>
                Create Account
                <FaCheck className="ml-2 h-4 w-4" />
              </>
            )}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-lg">
        <div>
          <div className="flex justify-center">
            <div className="relative w-20 h-20">
              <Image
                src="/images/20250503.svg"
                alt="Extreme Life Herbal Products Logo"
                fill
                className="object-contain"
              />
            </div>
          </div>
          <h2 className="mt-2 text-center text-2xl font-bold text-gray-900">
            Extreme Life Herbal
          </h2>
          <h3 className="text-center text-lg text-green-700 font-medium">
            Create Your Account
          </h3>
          <p className="mt-2 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-green-600 hover:text-green-500 transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>

        {/* Step Indicators */}
        {renderStepIndicators()}

        <form onSubmit={handleSubmit}>
          {/* Form Steps */}
          {renderFormStep()}

          {/* Navigation Buttons */}
          {renderNavButtons()}
        </form>
      </div>
    </div>
  );
}
