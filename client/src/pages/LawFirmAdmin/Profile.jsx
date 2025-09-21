import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateProfile, changePassword } from "../../store/slices/authSlice";
import toast from "react-hot-toast";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaBuilding,
  FaMapMarkerAlt,
  FaEdit,
  FaSave,
  FaTimes,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaUserCircle,
  FaCog,
  FaShieldAlt,
  FaCalendarAlt,
  FaIdCard,
  FaGraduationCap,
  FaBriefcase,
  FaGlobe,
  FaLinkedin,
  FaTwitter,
  FaGithub,
} from "react-icons/fa";

const Profile = () => {
  const dispatch = useDispatch();
  const { user, isLoading } = useSelector((state) => state.auth);
  
  // Profile form state
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    department: "",
    role: "",
    bio: "",
    location: "",
    website: "",
    linkedin: "",
    twitter: "",
    github: "",
  });

  // Password form state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Initialize profile data
  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
        department: user.department?.name || "",
        role: user.role || "",
        bio: user.bio || "",
        location: user.location || "",
        website: user.website || "",
        linkedin: user.linkedin || "",
        twitter: user.twitter || "",
        github: user.github || "",
      });
    }
  }, [user]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    
    try {
      await dispatch(updateProfile(profileData)).unwrap();
      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } catch (error) {
      toast.error(error || "Failed to update profile");
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    try {
      await dispatch(changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      })).unwrap();
      
      toast.success("Password changed successfully!");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setShowPasswordForm(false);
    } catch (error) {
      toast.error(error || "Failed to change password");
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "law_firm_admin":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "law_firm":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "credit_head":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "debt_collector":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "legal_head":
        return "bg-indigo-500/20 text-indigo-400 border-indigo-500/30";
      case "advocate":
        return "bg-pink-500/20 text-pink-400 border-pink-500/30";
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    }
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case "law_firm_admin":
        return "Law Firm Administrator";
      case "law_firm":
        return "Law Firm Owner";
      case "credit_head":
        return "Credit Collection Head";
      case "debt_collector":
        return "Debt Collector";
      case "legal_head":
        return "Legal Head";
      case "advocate":
        return "Advocate";
      default:
        return role;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-indigo-900/20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-indigo-900/20 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-6 border border-slate-600/50 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xl sm:text-2xl">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                  {user?.firstName} {user?.lastName}
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getRoleBadgeColor(user?.role)}`}>
                    {getRoleDisplayName(user?.role)}
                  </span>
                  {user?.department && (
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-slate-500/20 text-slate-400 border border-slate-500/30">
                      {user.department.name}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 rounded-xl transition-all duration-300"
              >
                <FaEdit className="w-4 h-4" />
                {isEditing ? "Cancel" : "Edit Profile"}
              </button>
              <button
                onClick={() => setShowPasswordForm(!showPasswordForm)}
                className="flex items-center gap-2 px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/30 rounded-xl transition-all duration-300"
              >
                <FaLock className="w-4 h-4" />
                Change Password
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 shadow-xl">
              <div className="p-6 border-b border-slate-600/50">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <FaUser className="text-blue-400" />
                  Basic Information
                </h2>
              </div>
              <div className="p-6">
                {isEditing ? (
                  <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          First Name
                        </label>
                        <input
                          type="text"
                          value={profileData.firstName}
                          onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                          placeholder="Enter first name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={profileData.lastName}
                          onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                          placeholder="Enter last name"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                        placeholder="Enter email address"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Bio
                      </label>
                      <textarea
                        value={profileData.bio}
                        onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                        rows={4}
                        className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                        placeholder="Tell us about yourself..."
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="submit"
                        className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all duration-300"
                      >
                        <FaSave className="w-4 h-4" />
                        Save Changes
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="flex items-center gap-2 px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-xl transition-all duration-300"
                      >
                        <FaTimes className="w-4 h-4" />
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="flex items-center gap-3">
                        <FaUser className="w-5 h-5 text-blue-400" />
                        <div>
                          <p className="text-sm text-slate-400">Full Name</p>
                          <p className="text-white font-medium">{user?.firstName} {user?.lastName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <FaEnvelope className="w-5 h-5 text-blue-400" />
                        <div>
                          <p className="text-sm text-slate-400">Email</p>
                          <p className="text-white font-medium">{user?.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <FaPhone className="w-5 h-5 text-blue-400" />
                        <div>
                          <p className="text-sm text-slate-400">Phone</p>
                          <p className="text-white font-medium">{user?.phone || "Not provided"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <FaBuilding className="w-5 h-5 text-blue-400" />
                        <div>
                          <p className="text-sm text-slate-400">Department</p>
                          <p className="text-white font-medium">{user?.department?.name || "Not assigned"}</p>
                        </div>
                      </div>
                    </div>
                    {user?.bio && (
                      <div className="mt-6">
                        <p className="text-sm text-slate-400 mb-2">Bio</p>
                        <p className="text-white">{user.bio}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Professional Information */}
            <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 shadow-xl">
              <div className="p-6 border-b border-slate-600/50">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <FaBriefcase className="text-green-400" />
                  Professional Information
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="flex items-center gap-3">
                    <FaIdCard className="w-5 h-5 text-green-400" />
                    <div>
                      <p className="text-sm text-slate-400">Role</p>
                      <p className="text-white font-medium">{getRoleDisplayName(user?.role)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FaCalendarAlt className="w-5 h-5 text-green-400" />
                    <div>
                      <p className="text-sm text-slate-400">Member Since</p>
                      <p className="text-white font-medium">
                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Unknown"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FaShieldAlt className="w-5 h-5 text-green-400" />
                    <div>
                      <p className="text-sm text-slate-400">Status</p>
                      <p className="text-white font-medium">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          user?.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {user?.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <FaGlobe className="w-5 h-5 text-green-400" />
                    <div>
                      <p className="text-sm text-slate-400">Location</p>
                      <p className="text-white font-medium">{user?.location || "Not specified"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Account Security */}
            <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 shadow-xl">
              <div className="p-6 border-b border-slate-600/50">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <FaLock className="text-orange-400" />
                  Account Security
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Password</p>
                      <p className="text-sm text-slate-400">Last changed: Never</p>
                    </div>
                    <button
                      onClick={() => setShowPasswordForm(!showPasswordForm)}
                      className="px-3 py-1 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/30 rounded-lg text-sm transition-all duration-300"
                    >
                      Change
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Two-Factor Auth</p>
                      <p className="text-sm text-slate-400">Not enabled</p>
                    </div>
                    <button className="px-3 py-1 bg-slate-500/20 hover:bg-slate-500/30 text-slate-400 border border-slate-500/30 rounded-lg text-sm transition-all duration-300">
                      Enable
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 shadow-xl">
              <div className="p-6 border-b border-slate-600/50">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <FaCog className="text-purple-400" />
                  Quick Stats
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">0</p>
                    <p className="text-sm text-slate-400">Cases Assigned</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">0</p>
                    <p className="text-sm text-slate-400">Cases Resolved</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">0%</p>
                    <p className="text-sm text-slate-400">Success Rate</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Password Change Modal */}
        {showPasswordForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gradient-to-br from-slate-800/90 to-slate-700/90 backdrop-blur-xl rounded-2xl border border-slate-600/50 shadow-2xl w-full max-w-md">
              <div className="p-6 border-b border-slate-600/50">
                <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                  <FaLock className="text-orange-400" />
                  Change Password
                </h3>
              </div>
              <form onSubmit={handlePasswordChange} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className="w-full px-4 py-3 pr-12 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50"
                      placeholder="Enter current password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('current')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showPasswords.current ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="w-full px-4 py-3 pr-12 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50"
                      placeholder="Enter new password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('new')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showPasswords.new ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="w-full px-4 py-3 pr-12 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50"
                      placeholder="Confirm new password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('confirm')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showPasswords.confirm ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl transition-all duration-300"
                  >
                    Update Password
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPasswordForm(false)}
                    className="flex-1 px-4 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-xl transition-all duration-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;

