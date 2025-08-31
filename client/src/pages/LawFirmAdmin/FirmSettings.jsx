/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateProfile } from "../../store/slices/authSlice";
import toast from "react-hot-toast";
import lawFirmApi from "../../store/api/lawFirmApi";
import { 
  FaCog, 
  FaBuilding, 
  FaCreditCard, 
  FaBell, 
  FaGlobe, 
  FaMoneyBillWave, 
  FaUpload, 
  FaTrash, 
  FaSave, 
  FaCheckCircle, 
  FaExclamationTriangle,
  FaSpinner,
  FaImage,
  FaTimes
} from "react-icons/fa";

const FirmSettings = () => {
  const { user } = useSelector((state) => state.auth);
  const [settings, setSettings] = useState({
    allowedDepartments: ["credit_collection", "legal"],
    paymentMethods: ["stripe", "bank_transfer"],
    emailNotifications: true,
    timezone: "Africa/Nairobi",
    escalationFees: {
      caseFilingFee: 5000,
      autoEscalation: false,
      requireConfirmation: true,
    },
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Logo upload state
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [currentLogo, setCurrentLogo] = useState(null);

  useEffect(() => {
    loadSettings();
    loadCurrentLogo();
  }, []);

  const loadSettings = async () => {
    if (!user?.lawFirm?._id) return;

    setIsLoading(true);
    try {
      const response = await lawFirmApi.getLawFirmSettings(user.lawFirm._id);
      setSettings(response.data.data);
    } catch (error) {
      console.error("Failed to load settings:", error);
      setMessage("Failed to load settings");
    } finally {
      setIsLoading(false);
    }
  };

  const loadCurrentLogo = async () => {
    if (!user?.lawFirm?._id) return;

    try {
      const response = await lawFirmApi.getLawFirmById(user.lawFirm._id);
      if (response.data.success && response.data.data.logo) {
        setCurrentLogo(response.data.data.logo);
      }
    } catch (error) {
      console.error("Failed to load logo:", error);
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setMessage("Please select an image file");
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage("File size must be less than 5MB");
        return;
      }

      setLogoFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = async () => {
    if (!logoFile || !user?.lawFirm?._id) return;

    setIsUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("logo", logoFile);

      const response = await lawFirmApi.uploadLogo(user.lawFirm._id, formData);

      if (response.data.success) {
        setCurrentLogo(response.data.data.logoUrl);
        setLogoFile(null);
        setLogoPreview(null);
        setMessage("Logo uploaded successfully!");
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (error) {
      console.error("Failed to upload logo:", error);
      setMessage("Failed to upload logo");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleLogoRemove = async () => {
    if (!user?.lawFirm?._id) return;

    setIsUploadingLogo(true);
    try {
      const response = await lawFirmApi.removeLogo(user.lawFirm._id);

      if (response.data.success) {
        setCurrentLogo(null);
        setMessage("Logo removed successfully!");
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (error) {
      console.error("Failed to remove logo:", error);
      setMessage("Failed to remove logo");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!user?.lawFirm?._id) return;

    setIsSaving(true);
    try {
      await lawFirmApi.updateSettings(user.lawFirm._id, settings);
      setMessage("Settings updated successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Failed to update settings:", error);
      setMessage("Failed to update settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDepartmentToggle = (department) => {
    setSettings((prev) => ({
      ...prev,
      allowedDepartments: prev.allowedDepartments.includes(department)
        ? prev.allowedDepartments.filter((d) => d !== department)
        : [...prev.allowedDepartments, department],
    }));
  };

  const handlePaymentMethodToggle = (method) => {
    setSettings((prev) => ({
      ...prev,
      paymentMethods: prev.paymentMethods.includes(method)
        ? prev.paymentMethods.filter((m) => m !== method)
        : [...prev.paymentMethods, method],
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-indigo-900/20 flex justify-center items-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mb-4">
            <FaSpinner className="w-8 h-8 text-white animate-spin" />
          </div>
          <p className="text-xl font-semibold text-white">Loading Firm Settings...</p>
          <p className="text-slate-400 mt-2">Please wait while we fetch your configuration</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-indigo-900/20 p-4 sm:p-6 space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/50 shadow-2xl">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl">
            <FaCog className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">Firm Settings</h1>
            <p className="text-slate-300 mt-2 text-sm sm:text-base">
              Manage your law firm's configuration, preferences, and branding
            </p>
          </div>
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`p-4 rounded-xl border ${
          message.includes("successfully")
            ? "bg-green-500/20 text-green-400 border-green-500/30"
            : "bg-red-500/20 text-red-400 border-red-500/30"
        } backdrop-blur-xl`}>
          <div className="flex items-center space-x-3">
            {message.includes("successfully") ? (
              <FaCheckCircle className="w-5 h-5 text-green-400" />
            ) : (
              <FaExclamationTriangle className="w-5 h-5 text-red-400" />
            )}
            <span className="font-medium">{message}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Department Settings */}
        <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/50 shadow-2xl">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-lg">
              <FaBuilding className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">Department Settings</h3>
              <p className="text-slate-300 text-sm">
                Select which departments are available in your law firm
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                key: "credit_collection",
                label: "Credit Collection",
                description: "Debt collection and recovery services",
                icon: "💰"
              },
              {
                key: "legal",
                label: "Legal Services",
                description: "Legal representation and litigation",
                icon: "⚖️"
              },
            ].map((dept) => (
              <div key={dept.key} className="flex items-start space-x-4 p-4 bg-slate-700/50 rounded-xl border border-slate-600/50 hover:bg-slate-700/70 transition-all duration-200">
                <input
                  type="checkbox"
                  className="w-5 h-5 text-blue-500 bg-slate-700 border-slate-600 rounded focus:ring-blue-500/50 focus:ring-2 mt-1"
                  checked={settings.allowedDepartments.includes(dept.key)}
                  onChange={() => handleDepartmentToggle(dept.key)}
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-2xl">{dept.icon}</span>
                    <label className="font-semibold text-white text-lg">{dept.label}</label>
                  </div>
                  <p className="text-slate-300 text-sm">{dept.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Settings */}
        <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/50 shadow-2xl">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg">
              <FaCreditCard className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">Payment Settings</h3>
              <p className="text-slate-300 text-sm">
                Choose which payment methods are accepted by your firm
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                key: "stripe",
                label: "Stripe",
                description: "Online credit card payments",
                icon: "💳"
              },
              {
                key: "bank_transfer",
                label: "Bank Transfer",
                description: "Direct bank transfers",
                icon: "🏦"
              },
              { 
                key: "cash", 
                label: "Cash", 
                description: "Cash payments",
                icon: "💵"
              },
              { 
                key: "check", 
                label: "Check", 
                description: "Check payments",
                icon: "📄"
              },
            ].map((method) => (
              <div key={method.key} className="flex items-start space-x-3 p-4 bg-slate-700/50 rounded-xl border border-slate-600/50 hover:bg-slate-700/70 transition-all duration-200">
                <input
                  type="checkbox"
                  className="w-5 h-5 text-green-500 bg-slate-700 border-slate-600 rounded focus:ring-green-500/50 focus:ring-2 mt-1"
                  checked={settings.paymentMethods.includes(method.key)}
                  onChange={() => handlePaymentMethodToggle(method.key)}
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-2xl">{method.icon}</span>
                    <label className="font-semibold text-white">{method.label}</label>
                  </div>
                  <p className="text-slate-300 text-xs">{method.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/50 shadow-2xl">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg">
              <FaBell className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">Notification Settings</h3>
              <p className="text-slate-300 text-sm">
                Configure how you receive important updates and alerts
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-4 p-4 bg-slate-700/50 rounded-xl border border-slate-600/50">
            <input
              type="checkbox"
              className="w-6 h-6 text-yellow-500 bg-slate-700 border-slate-600 rounded focus:ring-yellow-500/50 focus:ring-2 mt-1"
              checked={settings.emailNotifications}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  emailNotifications: e.target.checked,
                }))
              }
            />
            <div className="flex-1">
              <label className="font-semibold text-white text-lg">Email Notifications</label>
              <p className="text-slate-300 text-sm mt-1">
                Receive email notifications for important updates, case status changes, and system alerts
              </p>
            </div>
          </div>
        </div>

        {/* Timezone Settings */}
        <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/50 shadow-2xl">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg">
              <FaGlobe className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">Timezone Settings</h3>
              <p className="text-slate-300 text-sm">
                Set your firm's timezone for accurate scheduling and reporting
              </p>
            </div>
          </div>
          
          <div className="p-4 bg-slate-700/50 rounded-xl border border-slate-600/50">
            <label className="block text-sm font-semibold text-white mb-3">
              Select Timezone
            </label>
            <select
              className="w-full px-4 py-3 bg-slate-800/80 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-200"
              value={settings.timezone}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  timezone: e.target.value,
                }))
              }
            >
              <option value="Africa/Nairobi">Africa/Nairobi (EAT) - East Africa Time</option>
              <option value="Africa/Lagos">Africa/Lagos (WAT) - West Africa Time</option>
              <option value="Africa/Cairo">Africa/Cairo (EET) - East European Time</option>
              <option value="Europe/London">Europe/London (GMT) - Greenwich Mean Time</option>
              <option value="America/New_York">America/New_York (EST) - Eastern Standard Time</option>
              <option value="America/Los_Angeles">America/Los_Angeles (PST) - Pacific Standard Time</option>
            </select>
            <p className="text-slate-400 text-sm mt-2">
              This timezone will be used for all case deadlines, appointments, and reports
            </p>
          </div>
        </div>

        {/* Escalation Fee Settings */}
        <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/50 shadow-2xl">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-gradient-to-r from-red-500/20 to-pink-500/20 rounded-lg">
              <FaMoneyBillWave className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">Escalation Fee Settings</h3>
              <p className="text-slate-300 text-sm">
                Configure fees and settings for case escalation to legal department
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-4 bg-slate-700/50 rounded-xl border border-slate-600/50">
              <label className="block text-sm font-semibold text-white mb-3">
                Case Filing Fee (KES)
              </label>
              <input
                type="number"
                className="w-full px-4 py-3 bg-slate-800/80 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all duration-200"
                value={settings.escalationFees.caseFilingFee}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    escalationFees: {
                      ...prev.escalationFees,
                      caseFilingFee: parseInt(e.target.value) || 0,
                    },
                  }))
                }
                min="0"
                step="100"
              />
              <p className="text-slate-400 text-sm mt-2">
                Fee charged for escalating a case to the legal department
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start space-x-4 p-4 bg-slate-700/50 rounded-xl border border-slate-600/50">
                <input
                  type="checkbox"
                  className="w-5 h-5 text-red-500 bg-slate-700 border-slate-600 rounded focus:ring-red-500/50 focus:ring-2 mt-1"
                  checked={settings.escalationFees.autoEscalation}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      escalationFees: {
                        ...prev.escalationFees,
                        autoEscalation: e.target.checked,
                      },
                    }))
                  }
                />
                <div className="flex-1">
                  <label className="font-semibold text-white">Auto-escalation after payment</label>
                  <p className="text-slate-300 text-sm mt-1">
                    Automatically escalate case to legal department once payment is confirmed
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-4 bg-slate-700/50 rounded-xl border border-slate-600/50">
                <input
                  type="checkbox"
                  className="w-5 h-5 text-red-500 bg-slate-700 border-slate-600 rounded focus:ring-red-500/50 focus:ring-2 mt-1"
                  checked={settings.escalationFees.requireConfirmation}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      escalationFees: {
                        ...prev.escalationFees,
                        requireConfirmation: e.target.checked,
                      },
                    }))
                  }
                />
                <div className="flex-1">
                  <label className="font-semibold text-white">Require debt collector confirmation</label>
                  <p className="text-slate-300 text-sm mt-1">
                    Debt collector must manually confirm payment before escalation
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Firm Logo */}
        <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/50 shadow-2xl">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-gradient-to-r from-indigo-500/20 to-blue-500/20 rounded-lg">
              <FaImage className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white">Firm Logo</h3>
              <p className="text-slate-300 text-sm">
                Upload or remove your law firm's logo for branding and identification
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upload Section */}
            <div className="p-4 bg-slate-700/50 rounded-xl border border-slate-600/50">
              <label className="block text-sm font-semibold text-white mb-3">
                Upload New Logo
              </label>
              <div className="space-y-4">
                <input
                  type="file"
                  id="logo-upload"
                  accept="image/*"
                  className="block w-full text-sm text-slate-300 border border-slate-600/50 rounded-xl cursor-pointer bg-slate-800/80 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-blue-500 file:to-indigo-600 file:text-white hover:file:from-blue-600 hover:file:to-indigo-700 transition-all duration-200"
                  onChange={handleLogoChange}
                  disabled={isUploadingLogo}
                />
                
                {logoFile && (
                  <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-600/50">
                    <p className="text-sm text-slate-300">
                      Selected file: <span className="font-medium text-white">{logoFile.name}</span>
                    </p>
                  </div>
                )}
                
                {logoPreview && (
                  <div className="flex justify-center">
                    <img
                      src={logoPreview}
                      alt="Logo Preview"
                      className="max-w-full h-auto rounded-xl border border-slate-600/50"
                    />
                  </div>
                )}
                
                <button
                  type="button"
                  onClick={handleLogoUpload}
                  className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  disabled={!logoFile || isUploadingLogo}
                >
                  {isUploadingLogo ? (
                    <div className="flex items-center justify-center space-x-2">
                      <FaSpinner className="w-4 h-4 animate-spin" />
                      <span>Uploading...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <FaUpload className="w-4 h-4" />
                      <span>Upload Logo</span>
                    </div>
                  )}
                </button>
              </div>
            </div>

            {/* Current Logo Section */}
            <div className="p-4 bg-slate-700/50 rounded-xl border border-slate-600/50">
              <label className="block text-sm font-semibold text-white mb-3">
                Current Logo
              </label>
              
              {currentLogo ? (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <img
                      src={currentLogo}
                      alt="Current Firm Logo"
                      className="w-24 h-24 object-cover rounded-xl border border-slate-600/50"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleLogoRemove}
                    className="w-full px-4 py-3 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    disabled={isUploadingLogo}
                  >
                    {isUploadingLogo ? (
                      <div className="flex items-center justify-center space-x-2">
                        <FaSpinner className="w-4 h-4 animate-spin" />
                        <span>Removing...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <FaTrash className="w-4 h-4" />
                        <span>Remove Logo</span>
                      </div>
                    )}
                  </button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-24 h-24 mx-auto bg-slate-800/80 rounded-xl border border-slate-600/50 flex items-center justify-center mb-4">
                    <FaImage className="w-12 h-12 text-slate-500" />
                  </div>
                  <p className="text-slate-400 text-sm">No logo uploaded yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105"
            disabled={isSaving}
          >
            {isSaving ? (
              <div className="flex items-center space-x-3">
                <FaSpinner className="w-5 h-5 animate-spin" />
                <span>Saving Settings...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <FaSave className="w-5 h-5" />
                <span>Save All Settings</span>
              </div>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default FirmSettings;
