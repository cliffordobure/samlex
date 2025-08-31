/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { registerLawFirm } from "../store/slices/lawFirmSlice";
import {
  FaBuilding,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaLock,
  FaCreditCard,
  FaShieldAlt,
  FaCheckCircle,
  FaArrowLeft,
  FaSpinner,
  FaMapMarkerAlt,
  FaGlobe,
  FaIdCard,
  FaUsers,
  FaChartLine,
  FaRocket,
} from "react-icons/fa";
import toast from "react-hot-toast";

const LawFirmRegistration = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    // Law Firm Information
    firmName: "",
    firmType: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "Kenya",
    phoneNumber: "",
    email: "",
    website: "",
    licenseNumber: "",

    // Admin Information
    firstName: "",
    lastName: "",
    adminEmail: "",
    adminPhone: "",
    password: "",
    confirmPassword: "",

    // Plan Information
    plan: searchParams.get("plan") || "testing",

    // Payment Information
    paymentMethod: "mpesa",
  });

  const plans = {
    testing: {
      name: "Testing Package",
      price: 0,
      duration: "1 month free",
      features: [
        "Up to 3 users",
        "50 cases/month",
        "Basic reporting",
        "Email support",
        "Full platform access"
      ],
      color: "from-green-500 to-emerald-600",
      icon: "🧪",
      requiresPayment: false
    },
    basic: {
      name: "Basic",
      price: 99,
      duration: "per month",
      features: [
        "Up to 5 users",
        "100 cases/month",
        "Basic reporting",
        "Email support",
        "Standard integrations"
      ],
      color: "from-blue-500 to-cyan-600",
      icon: "📋",
      requiresPayment: true
    },
    premium: {
      name: "Premium",
      price: 199,
      duration: "per month",
      features: [
        "Up to 25 users",
        "Unlimited cases",
        "Advanced analytics",
        "Priority support",
        "Custom integrations",
        "API access"
      ],
      color: "from-blue-500 to-indigo-600",
      icon: "⚡",
      requiresPayment: true
    },
    enterprise: {
      name: "Enterprise",
      price: "Custom",
      duration: "contact us",
      features: [
        "Unlimited users",
        "Unlimited cases",
        "Custom features",
        "Dedicated support",
        "On-premise option",
        "White-label solution"
      ],
      color: "from-orange-500 to-red-600",
      icon: "🚀",
      requiresPayment: true
    },
  };

  const [selectedPlan, setSelectedPlan] = useState(searchParams.get("plan") || "testing");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("pending");
  const [paymentDetails, setPaymentDetails] = useState({
    transactionId: "",
    phoneNumber: "",
    referenceNumber: ""
  });
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Update formData when plan changes
  const handlePlanChange = (newPlan) => {
    setSelectedPlan(newPlan);
    setFormData(prev => ({ ...prev, plan: newPlan }));
    
    // If switching to a paid plan, show payment modal
    if (plans[newPlan].requiresPayment) {
      setShowPaymentModal(true);
    } else {
      setPaymentStatus("completed");
    }
  };

  const handlePaymentSuccess = async () => {
    if (selectedPlanData.requiresPayment) {
      // Verify payment with backend
      setIsVerifyingPayment(true);
      try {
        const response = await fetch('/api/law-firms/verify-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentMethod: formData.paymentMethod,
            amount: typeof selectedPlanData.price === "number" ? selectedPlanData.price : 0,
            transactionId: paymentDetails.transactionId,
            phoneNumber: paymentDetails.phoneNumber,
            referenceNumber: paymentDetails.referenceNumber
          }),
        });

        const result = await response.json();
        
        if (result.success && result.data.paymentStatus === "completed") {
          setPaymentStatus("completed");
          setShowPaymentModal(false);
          toast.success("Payment verified successfully! You can now proceed with registration.");
        } else {
          toast.error(result.message || "Payment verification failed. Please try again.");
        }
      } catch (error) {
        console.error("Payment verification error:", error);
        toast.error("Payment verification failed. Please try again.");
      } finally {
        setIsVerifyingPayment(false);
      }
    } else {
      setPaymentStatus("completed");
      setShowPaymentModal(false);
      toast.success("Free plan selected! You can now proceed with registration.");
    }
  };

  const handlePaymentCancel = () => {
    setSelectedPlan("testing"); // Reset to free plan
    setFormData(prev => ({ ...prev, plan: "testing" }));
    setPaymentStatus("pending");
    setShowPaymentModal(false);
    setPaymentDetails({ transactionId: "", phoneNumber: "", referenceNumber: "" });
    toast.info("Switched to free testing package");
  };

  const handlePaymentDetailsChange = (field, value) => {
    setPaymentDetails(prev => ({ ...prev, [field]: value }));
  };

  const selectedPlanData = plans[selectedPlan];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear validation errors when user types
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: "" }));
    }
    
    // Real-time email validation
    if (name === "email" || name === "adminEmail") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (value && !emailRegex.test(value)) {
        setValidationErrors(prev => ({ 
          ...prev, 
          [name]: "Please enter a valid email address (e.g., example@gmail.com)" 
        }));
      } else if (value && emailRegex.test(value)) {
        setValidationErrors(prev => ({ ...prev, [name]: "" }));
      }
    }
  };

  const validateStep1 = () => {
    const required = [
      "firmName",
      "firmType",
      "address",
      "city",
      "state",
      "zipCode",
      "phoneNumber",
      "email",
    ];

    for (const field of required) {
      if (!formData[field].trim()) {
        toast.error(
          `Please fill in ${field.replace(/([A-Z])/g, " $1").toLowerCase()}`
        );
        return false;
      }
    }

    // Better email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address (e.g., example@gmail.com)");
      setValidationErrors(prev => ({ ...prev, email: "Please enter a valid email address" }));
      return false;
    }

    // Check if there are any validation errors
    if (Object.values(validationErrors).some(error => error)) {
      toast.error("Please fix the validation errors before proceeding");
      return false;
    }

    return true;
  };

  const validateStep2 = () => {
    const required = [
      "firstName",
      "lastName",
      "adminEmail",
      "adminPhone",
      "password",
      "confirmPassword",
    ];

    for (const field of required) {
      if (!formData[field].trim()) {
        toast.error(
          `Please fill in ${field.replace(/([A-Z])/g, " $1").toLowerCase()}`
        );
        return false;
      }
    }

    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return false;
    }

    // Better admin email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.adminEmail)) {
      toast.error("Please enter a valid admin email address (e.g., admin@gmail.com)");
      setValidationErrors(prev => ({ ...prev, adminEmail: "Please enter a valid admin email address" }));
      return false;
    }

    // Check if there are any validation errors
    if (Object.values(validationErrors).some(error => error)) {
      toast.error("Please fix the validation errors before proceeding");
      return false;
    }

    return true;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;

    if (step < 3) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handlePaymentConfirmation = async () => {
    // Check if payment is required and completed
    if (selectedPlanData.requiresPayment && paymentStatus !== "completed") {
      toast.error("Please complete payment before proceeding with registration.");
      return;
    }

    setIsLoading(true);
    try {
      // Send all data in a single request to registerLawFirm
      const response = await dispatch(
        registerLawFirm({
          // Law Firm Information
          firmName: formData.firmName,
          firmType: formData.firmType,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country,
          phoneNumber: formData.phoneNumber,
          email: formData.email,
          website: formData.website,
          licenseNumber: formData.licenseNumber,
          plan: selectedPlan,
          paymentStatus: selectedPlanData.requiresPayment ? "completed" : "free",
          paymentMethod: formData.paymentMethod,

          // Admin User Information
          firstName: formData.firstName,
          lastName: formData.lastName,
          adminEmail: formData.adminEmail,
          adminPhone: formData.adminPhone,
          password: formData.password,
        })
      ).unwrap();

      toast.success(
        "Registration successful! Your account is now active and ready to use."
      );
      navigate("/login");
    } catch (error) {
      console.error("Registration error:", error);
      toast.error(error.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Check if user can proceed to registration
  const canProceedToRegistration = () => {
    if (selectedPlanData.requiresPayment) {
      return paymentStatus === "completed";
    }
    return true; // Free plans can proceed immediately
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-12">
      {[1, 2, 3].map((stepNumber) => (
        <div key={stepNumber} className="flex items-center">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center text-lg font-bold shadow-2xl transition-all duration-500 transform hover:scale-110 ${
              step >= stepNumber
                ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-blue-500/25"
                : "bg-slate-700/50 text-slate-400 border border-slate-600/50"
            }`}
          >
            {stepNumber}
          </div>
          {stepNumber < 3 && (
            <div
              className={`w-24 h-1 mx-4 rounded-full transition-all duration-500 ${
                step > stepNumber
                  ? "bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg"
                  : "bg-slate-700/50"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-10">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl shadow-2xl mb-6">
          <FaBuilding className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-4xl font-bold text-white mb-4 tracking-tight">
          Law Firm Information
        </h2>
        <p className="text-slate-300 text-xl">Tell us about your law firm</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="group">
          <label className="block text-sm font-semibold text-slate-300 mb-3 group-focus-within:text-blue-400 transition-colors duration-300">
            Firm Name <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <FaBuilding className="w-5 h-5 text-slate-500" />
            </div>
          <input
            type="text"
            name="firmName"
            value={formData.firmName}
            onChange={handleInputChange}
              className="w-full pl-12 pr-4 py-4 bg-slate-700/50 border border-slate-600/50 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 backdrop-blur-sm"
            placeholder="Enter firm name"
          />
          </div>
        </div>

        <div className="group">
          <label className="block text-sm font-semibold text-slate-300 mb-3 group-focus-within:text-blue-400 transition-colors duration-300">
            Firm Type <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <FaUsers className="w-5 h-5 text-slate-500" />
            </div>
          <select
            name="firmType"
            value={formData.firmType}
            onChange={handleInputChange}
              className="w-full pl-12 pr-4 py-4 bg-slate-700/50 border border-slate-600/50 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 backdrop-blur-sm appearance-none cursor-pointer"
          >
            <option value="">Select firm type</option>
            <option value="corporate">Corporate Law</option>
            <option value="criminal">Criminal Law</option>
            <option value="civil">Civil Law</option>
            <option value="family">Family Law</option>
            <option value="property">Property Law</option>
            <option value="general">General Practice</option>
            <option value="specialized">Specialized Practice</option>
          </select>
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
              <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 group">
          <label className="block text-sm font-semibold text-slate-300 mb-3 group-focus-within:text-blue-400 transition-colors duration-300">
            Address <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <FaMapMarkerAlt className="w-5 h-5 text-slate-500" />
            </div>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
              className="w-full pl-12 pr-4 py-4 bg-slate-700/50 border border-slate-600/50 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 backdrop-blur-sm"
            placeholder="Enter street address"
          />
          </div>
        </div>

        <div className="group">
          <label className="block text-sm font-semibold text-slate-300 mb-3 group-focus-within:text-blue-400 transition-colors duration-300">
            City <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleInputChange}
            className="w-full px-4 py-4 bg-slate-700/50 border border-slate-600/50 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 backdrop-blur-sm"
            placeholder="Enter city"
          />
        </div>

        <div className="group">
          <label className="block text-sm font-semibold text-slate-300 mb-3 group-focus-within:text-blue-400 transition-colors duration-300">
            State/Province <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            name="state"
            value={formData.state}
            onChange={handleInputChange}
            className="w-full px-4 py-4 bg-slate-700/50 border border-slate-600/50 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 backdrop-blur-sm"
            placeholder="Enter state/province"
          />
        </div>

        <div className="group">
          <label className="block text-sm font-semibold text-slate-300 mb-3 group-focus-within:text-blue-400 transition-colors duration-300">
            ZIP/Postal Code <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            name="zipCode"
            value={formData.zipCode}
            onChange={handleInputChange}
            className="w-full px-4 py-4 bg-slate-700/50 border border-slate-600/50 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 backdrop-blur-sm"
            placeholder="Enter ZIP code"
          />
        </div>

        <div className="group">
          <label className="block text-sm font-semibold text-slate-300 mb-3 group-focus-within:text-blue-400 transition-colors duration-300">
            Country
          </label>
          <input
            type="text"
            name="country"
            value={formData.country}
            onChange={handleInputChange}
            className="w-full px-4 py-4 bg-slate-700/50 border border-slate-600/50 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 backdrop-blur-sm"
            placeholder="Enter country"
          />
        </div>

        <div className="group">
          <label className="block text-sm font-semibold text-slate-300 mb-3 group-focus-within:text-blue-400 transition-colors duration-300">
            Phone Number <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <FaPhone className="w-5 h-5 text-slate-500" />
            </div>
          <input
            type="tel"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleInputChange}
              className="w-full pl-12 pr-4 py-4 bg-slate-700/50 border border-slate-600/50 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 backdrop-blur-sm"
            placeholder="Enter phone number"
          />
          </div>
        </div>

        <div className="group">
          <label className="block text-sm font-semibold text-slate-300 mb-3 group-focus-within:text-blue-400 transition-colors duration-300">
            Email <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <FaEnvelope className="w-5 h-5 text-slate-500" />
            </div>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
              className={`w-full pl-12 pr-4 py-4 bg-slate-700/50 border rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-300 backdrop-blur-sm ${
                validationErrors.email 
                  ? "border-red-500/50 focus:ring-red-500/50" 
                  : "border-slate-600/50 focus:border-blue-500/50"
              }`}
            placeholder="Enter firm email"
          />
          </div>
          {validationErrors.email && (
            <p className="text-red-400 text-sm mt-2 flex items-center gap-2">
              <span>⚠️</span>
              {validationErrors.email}
            </p>
          )}
          {!validationErrors.email && formData.email && (
            <p className="text-slate-400 text-sm mt-2">
              💡 Example: example@gmail.com
            </p>
          )}
        </div>

        <div className="group">
          <label className="block text-sm font-semibold text-slate-300 mb-3 group-focus-within:text-blue-400 transition-colors duration-300">
            Website
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <FaGlobe className="w-5 h-5 text-slate-500" />
            </div>
          <input
            type="url"
            name="website"
            value={formData.website}
            onChange={handleInputChange}
              className="w-full pl-12 pr-4 py-4 bg-slate-700/50 border border-slate-600/50 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 backdrop-blur-sm"
            placeholder="Enter website URL"
          />
          </div>
        </div>

        <div className="group">
          <label className="block text-sm font-semibold text-slate-300 mb-3 group-focus-within:text-blue-400 transition-colors duration-300">
            License Number
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <FaIdCard className="w-5 h-5 text-slate-500" />
            </div>
            <input
              type="text"
              name="licenseNumber"
              value={formData.licenseNumber}
              onChange={handleInputChange}
              className="w-full pl-12 pr-4 py-4 bg-slate-700/50 border border-slate-600/50 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 backdrop-blur-sm"
              placeholder="Enter license number"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-10">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl shadow-2xl mb-6">
          <FaUser className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-4xl font-bold text-white mb-4 tracking-tight">
          Admin Account
        </h2>
        <p className="text-slate-300 text-xl">
          Create your administrator account
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="group">
          <label className="block text-sm font-semibold text-slate-300 mb-3 group-focus-within:text-blue-400 transition-colors duration-300">
            First Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
            className="w-full px-4 py-4 bg-slate-700/50 border border-slate-600/50 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 backdrop-blur-sm"
            placeholder="Enter first name"
          />
        </div>

        <div className="group">
          <label className="block text-sm font-semibold text-slate-300 mb-3 group-focus-within:text-blue-400 transition-colors duration-300">
            Last Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
            className="w-full px-4 py-4 bg-slate-700/50 border border-slate-600/50 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 backdrop-blur-sm"
            placeholder="Enter last name"
          />
        </div>

        <div className="group">
          <label className="block text-sm font-semibold text-slate-300 mb-3 group-focus-within:text-blue-400 transition-colors duration-300">
            Email <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <FaEnvelope className="w-5 h-5 text-slate-500" />
            </div>
          <input
            type="email"
            name="adminEmail"
            value={formData.adminEmail}
            onChange={handleInputChange}
              className={`w-full pl-12 pr-4 py-4 bg-slate-700/50 border rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-300 backdrop-blur-sm ${
                validationErrors.adminEmail 
                  ? "border-red-500/50 focus:ring-red-500/50" 
                  : "border-slate-600/50 focus:border-blue-500/50"
              }`}
            placeholder="Enter admin email"
          />
          </div>
          {validationErrors.adminEmail && (
            <p className="text-red-400 text-sm mt-2 flex items-center gap-2">
              <span>⚠️</span>
              {validationErrors.adminEmail}
            </p>
          )}
          {!validationErrors.adminEmail && formData.adminEmail && (
            <p className="text-sm mt-2 text-slate-400">
              💡 Example: admin@gmail.com
            </p>
          )}
        </div>

        <div className="group">
          <label className="block text-sm font-semibold text-slate-300 mb-3 group-focus-within:text-blue-400 transition-colors duration-300">
            Phone Number <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <FaPhone className="w-5 h-5 text-slate-500" />
            </div>
          <input
            type="tel"
            name="adminPhone"
            value={formData.adminPhone}
            onChange={handleInputChange}
              className="w-full pl-12 pr-4 py-4 bg-slate-700/50 border border-slate-600/50 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 backdrop-blur-sm"
            placeholder="Enter admin phone"
          />
          </div>
        </div>

        <div className="group">
          <label className="block text-sm font-semibold text-slate-300 mb-3 group-focus-within:text-blue-400 transition-colors duration-300">
            Password <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <FaLock className="w-5 h-5 text-slate-500" />
            </div>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
              className="w-full pl-12 pr-4 py-4 bg-slate-700/50 border border-slate-600/50 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 backdrop-blur-sm"
            placeholder="Enter password"
          />
          </div>
        </div>

        <div className="group">
          <label className="block text-sm font-semibold text-slate-300 mb-3 group-focus-within:text-blue-400 transition-colors duration-300">
            Confirm Password <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <FaLock className="w-5 h-5 text-slate-500" />
            </div>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
              className="w-full pl-12 pr-4 py-4 bg-slate-700/50 border border-slate-600/50 rounded-2xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 backdrop-blur-sm"
            placeholder="Confirm password"
          />
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-3xl p-8 border border-slate-600/50 shadow-2xl">
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
            <FaShieldAlt className="w-5 h-5 text-white" />
          </div>
          Password Requirements
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            "At least 8 characters long",
            "Contains uppercase and lowercase letters",
            "Contains at least one number",
            "Contains at least one special character"
          ].map((requirement, index) => (
            <div key={index} className="flex items-center gap-3 text-slate-300">
              <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                <FaCheckCircle className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg">{requirement}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-8">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl shadow-2xl mb-6">
          <FaCreditCard className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-4xl font-bold text-white mb-4">
          Payment & Confirmation
        </h2>
        <p className="text-slate-300 text-xl">Review your plan and confirm payment</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Plan Selection */}
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-3xl p-8 border border-slate-600/50 shadow-2xl relative overflow-hidden">
          <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${selectedPlanData.color} rounded-full blur-2xl opacity-20`}></div>
          <div className="relative z-10">
            <h3 className="text-2xl font-bold text-white mb-6">Select Your Plan</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {Object.entries(plans).map(([key, plan]) => (
                <button
                  key={key}
                  onClick={() => handlePlanChange(key)}
                  className={`px-6 py-4 rounded-2xl text-lg font-semibold transition-all duration-300 flex items-center justify-between gap-4 ${
                    selectedPlan === key
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-2xl"
                      : "bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl ${
                      selectedPlan === key 
                        ? "bg-white/20 backdrop-blur-sm" 
                        : "bg-slate-600/50"
                    }`}>
                      {plan.icon}
            </div>
                    <div className="text-left">
                      <h4 className="text-xl font-bold">{plan.name}</h4>
                      <p className="text-base opacity-80">
                        {plan.duration}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      {typeof plan.price === "number"
                        ? `$${plan.price}`
                        : plan.price}
                    </div>
                    {plan.requiresPayment && (
                      <div className="text-sm opacity-70">per month</div>
                    )}
                  </div>
                </button>
              ))}
          </div>

            <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-3xl p-6 border border-slate-600/50 shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center">
                  <FaShieldAlt className="w-5 h-5 text-white" />
                </div>
                Plan Details
              </h3>
              
              {/* Plan Icon and Summary */}
              <div className="flex items-center gap-4 mb-6 p-4 bg-gradient-to-br from-slate-700/50 to-slate-600/50 rounded-2xl border border-slate-500/30">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30">
                  {selectedPlanData.icon}
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white">{selectedPlanData.name}</h4>
                  <p className="text-slate-300">
                    {selectedPlanData.duration} • {typeof selectedPlanData.price === "number" ? `$${selectedPlanData.price}` : selectedPlanData.price}
                  </p>
                </div>
              </div>
              
              <ul className="space-y-3 text-slate-300 text-base">
            {selectedPlanData.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <FaCheckCircle className="w-4 h-4 text-white" />
                    </div>
                {feature}
              </li>
            ))}
          </ul>
            </div>
          </div>
        </div>

        {/* Payment Information */}
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-3xl p-8 border border-slate-600/50 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-2xl"></div>
          <div className="relative z-10">
            <h3 className="text-2xl font-bold text-white mb-6">
            Payment Information
          </h3>

            {selectedPlanData.requiresPayment ? (
              <div className="space-y-6">
                {paymentStatus === "pending" ? (
                  <div className="text-center py-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FaCreditCard className="w-10 h-10 text-white" />
                    </div>
                    <h4 className="text-xl font-bold text-white mb-2">
                      Payment Required
                    </h4>
                    <p className="text-slate-300 mb-6">
                      Please complete payment to proceed with {selectedPlanData.name}
                    </p>
                    <button
                      onClick={() => setShowPaymentModal(true)}
                      className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-105 shadow-2xl hover:shadow-blue-500/25 transform"
                    >
                      Proceed to Payment
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FaCheckCircle className="w-10 h-10 text-white" />
                    </div>
                    <h4 className="text-xl font-bold text-white mb-2">
                      Payment Completed
                    </h4>
                    <p className="text-slate-300">
                      You can now proceed with registration
                    </p>
                  </div>
                )}

                <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/50">
                  <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <FaShieldAlt className="text-blue-400" />
                    Payment Methods Available
                  </h4>
                  <div className="space-y-3 text-slate-300">
                    <div className="flex items-center gap-3">
                      <FaPhone className="text-blue-400" />
                      <span>M-Pesa</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <FaCreditCard className="text-green-400" />
                      <span>Credit/Debit Card</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <FaBuilding className="text-purple-400" />
                      <span>Bank Transfer</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaCheckCircle className="w-10 h-10 text-white" />
                </div>
                <h4 className="text-xl font-bold text-white mb-2">
                  No Payment Required
                </h4>
                <p className="text-slate-300 mb-4">
                  {selectedPlanData.name} is free for {selectedPlanData.duration}
                </p>
                <div className="bg-gradient-to-br from-green-900/20 to-green-800/20 p-4 rounded-2xl border border-green-500/30">
                  <p className="text-green-300 text-sm">
                    You can upgrade to a paid plan anytime from your dashboard
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-3xl p-8 border border-slate-600/50 shadow-2xl">
        <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center">
            <FaChartLine className="w-5 h-5 text-white" />
          </div>
          Registration Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-lg">
          <div className="space-y-3">
            <div>
              <p className="text-slate-400">Firm Name:</p>
              <p className="text-white font-semibold">{formData.firmName}</p>
            </div>
            <div>
              <p className="text-slate-400">Admin Name:</p>
              <p className="text-white font-semibold">
                {formData.firstName} {formData.lastName}
              </p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-slate-400">Firm Email:</p>
              <p className="text-white font-semibold">{formData.email}</p>
            </div>
            <div>
              <p className="text-slate-400">Admin Email:</p>
              <p className="text-white font-semibold">{formData.adminEmail}</p>
            </div>
            <div>
              <p className="text-slate-400">Selected Plan:</p>
              <p className="text-white font-semibold">{selectedPlanData.name}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Payment Modal Component
  const PaymentModal = () => {
    if (!showPaymentModal) return null;

    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-3xl p-8 max-w-2xl w-full shadow-2xl border border-slate-600/50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-full blur-2xl"></div>
          
          <div className="relative z-10">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center">
                  <FaCreditCard className="w-10 h-10 text-white" />
                </div>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl bg-gradient-to-br from-slate-600/50 to-slate-500/50 border border-slate-500/30">
                  {selectedPlanData.icon}
                </div>
              </div>
              <h3 className="text-3xl font-bold text-white mb-2">
                Complete Payment
              </h3>
              <p className="text-slate-300 text-lg">
                {selectedPlanData.name} - ${typeof selectedPlanData.price === "number" ? selectedPlanData.price : "Custom"}
              </p>
            </div>

            <div className="space-y-6">
              <div className="group">
                <label className="block text-sm font-semibold text-slate-300 mb-3">
                  Payment Method
              </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: "mpesa", label: "M-Pesa", icon: "📱", color: "from-blue-500 to-blue-600" },
                    { value: "card", label: "Card", icon: "💳", color: "from-green-500 to-green-600" },
                    { value: "bank", label: "Bank", icon: "🏦", color: "from-purple-500 to-purple-600" }
                  ].map((method) => (
                    <button
                      key={method.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, paymentMethod: method.value }))}
                      className={`p-4 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center gap-2 ${
                        formData.paymentMethod === method.value
                          ? `bg-gradient-to-r ${method.color} text-white border-transparent shadow-lg`
                          : "bg-slate-700/50 text-slate-300 border-slate-600/50 hover:border-slate-500/50 hover:bg-slate-600/50"
                      }`}
                    >
                      <span className="text-2xl">{method.icon}</span>
                      <span className="text-sm font-semibold">{method.label}</span>
                    </button>
                  ))}
                </div>
            </div>

            {formData.paymentMethod === "mpesa" && (
                <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/20 p-6 rounded-2xl border border-blue-500/30">
                  <h4 className="text-blue-300 font-bold text-lg mb-4 flex items-center gap-2">
                    <FaPhone className="w-5 h-5" />
                  M-Pesa Payment Instructions:
                </h4>
                  <ol className="text-blue-200 text-base space-y-2">
                  <li>1. Dial *150*00# on your phone</li>
                  <li>2. Select "Send Money"</li>
                  <li>3. Enter our business number: 123456</li>
                    <li>4. Enter amount: ${typeof selectedPlanData.price === "number" ? selectedPlanData.price : "Contact us"}</li>
                  <li>5. Enter your M-Pesa PIN</li>
                  <li>6. Confirm the transaction</li>
                </ol>
              </div>
            )}

            {formData.paymentMethod === "card" && (
                <div className="bg-gradient-to-br from-green-900/20 to-green-800/20 p-6 rounded-2xl border border-green-500/30">
                  <h4 className="text-green-300 font-bold text-lg mb-4 flex items-center gap-2">
                    <FaCreditCard className="w-5 h-5" />
                  Card Payment:
                </h4>
                  <p className="text-green-200 text-base">
                  You will be redirected to our secure payment gateway after
                  registration.
                </p>
              </div>
            )}

            {formData.paymentMethod === "bank" && (
                <div className="bg-gradient-to-br from-purple-900/20 to-purple-800/20 p-6 rounded-2xl border border-purple-500/30">
                  <h4 className="text-purple-300 font-bold text-lg mb-4 flex items-center gap-2">
                    <FaBuilding className="w-5 h-5" />
                  Bank Transfer Details:
                </h4>
                  <div className="text-purple-200 text-base space-y-2">
                    <p><strong>Bank:</strong> Equity Bank</p>
                    <p><strong>Account:</strong> 1234567890</p>
                    <p><strong>Name:</strong> Samlex Ltd</p>
                    <p><strong>Reference:</strong> Your firm name</p>
                </div>
              </div>
            )}

              <div className="flex gap-4 pt-4">
                <button
                  onClick={handlePaymentCancel}
                  className="flex-1 px-6 py-4 border-2 border-slate-600/50 text-slate-300 hover:text-white hover:border-red-500/50 rounded-2xl transition-all duration-300 hover:scale-105 backdrop-blur-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePaymentSuccess}
                  className="flex-1 px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-2xl font-bold text-lg transition-all duration-300 hover:scale-105 shadow-2xl hover:shadow-green-500/25 transform"
                >
                  Confirm Payment
                </button>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
  };

  return (
    <div className="min-h-screen bg-slate-900 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900/20 to-indigo-900/20"></div>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
        
        {/* Floating background elements */}
        <div className="absolute top-20 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-8 lg:p-12">
          <Link
            to="/"
            className="flex items-center gap-3 text-slate-300 hover:text-blue-400 transition-all duration-300 px-6 py-3 rounded-2xl hover:bg-slate-800/50 hover:scale-105 group"
          >
            <FaArrowLeft className="group-hover:-translate-x-1 transition-transform duration-300" />
            <span className="font-semibold text-lg">Back to Home</span>
          </Link>
          <div className="text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 bg-clip-text text-transparent tracking-tight">
              Samlex
            </h1>
            <p className="text-slate-400 text-sm mt-1">Law Firm Registration</p>
          </div>
          <div className="w-32"></div> {/* Spacer for centering */}
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-6 py-8 lg:py-12">
          {renderStepIndicator()}

          <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-3xl border border-slate-600/50 p-10 lg:p-16 shadow-2xl relative overflow-hidden">
            {/* Form background decoration */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl"></div>
            
            <div className="relative z-10">
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}

            {/* Navigation Buttons */}
              <div className="flex justify-between items-center mt-12 pt-8 border-t border-slate-600/50">
              <button
                onClick={handleBack}
                disabled={step === 1}
                  className="px-8 py-4 border-2 border-slate-600/50 text-slate-300 hover:text-white hover:border-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl transition-all duration-300 flex items-center gap-3 hover:scale-105 backdrop-blur-sm"
              >
                <FaArrowLeft />
                Back
              </button>

              <div className="flex gap-4">
                {step < 3 ? (
                  <button
                    onClick={handleNext}
                      className="px-10 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-bold text-lg transition-all duration-300 flex items-center gap-3 shadow-2xl hover:shadow-blue-500/25 hover:scale-105 transform"
                  >
                    Next
                    <FaArrowLeft className="rotate-180" />
                  </button>
                ) : (
                  <button
                    onClick={handlePaymentConfirmation}
                      disabled={isLoading || !canProceedToRegistration()}
                      className={`px-10 py-4 rounded-2xl font-bold text-lg transition-all duration-300 flex items-center gap-3 shadow-2xl hover:scale-105 transform ${
                        canProceedToRegistration()
                          ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white hover:shadow-green-500/25"
                          : "bg-slate-600 text-slate-400 cursor-not-allowed"
                      }`}
                  >
                    {isLoading ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <FaShieldAlt />
                          {selectedPlanData.requiresPayment ? "Complete Registration" : "Confirm Registration"}
                      </>
                    )}
                  </button>
                )}
                </div>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="text-center mt-8 text-slate-400 text-base bg-gradient-to-br from-slate-800/60 to-slate-700/60 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/30">
            <div className="flex items-center justify-center gap-3 mb-2">
              <FaShieldAlt className="text-blue-400 text-xl" />
              <span className="font-semibold text-white">Security & Privacy</span>
          </div>
            <p className="text-slate-300">
              Your information is secure and encrypted. We never share your data with third parties.
            </p>
        </div>
      </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal />

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
          opacity: 0;
        }
        
        /* Enhanced focus states */
        input:focus, select:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        
        /* Smooth transitions */
        * {
          transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          transition-duration: 300ms;
        }
      `}</style>
    </div>
  );
};

export default LawFirmRegistration;
