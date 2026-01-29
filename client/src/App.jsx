import React, { useEffect } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getCurrentUser, clearInvalidToken } from "./store/slices/authSlice";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import PublicRoute from "./components/auth/PublicRoute";
import Loading from "./components/common/Loading";
import NetworkStatus from "./components/common/NetworkStatus";
import NetworkDebugger from "./components/common/NetworkDebugger";
import CreditCollectionLayout from "./components/layouts/CreditCollectionLayout";

// Pages
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import LawFirmRegistration from "./pages/LawFirmRegistration";
import Unauthorized from "./pages/Unauthorized";
import Dashboard from "./pages/Dashboard";
import SystemOwnerDashboard from "./pages/SystemOwner/Dashboard";
import LawFirmAdminDashboard from "./pages/LawFirmAdmin/Dashboard";
import AdminOverview from "./pages/LawFirmAdmin/Overview";
import AdminCaseManagement from "./pages/LawFirmAdmin/CaseManagement";
import AdminCalendar from "./pages/LawFirmAdmin/AdminCalendar";
import DepartmentManagement from "./pages/LawFirmAdmin/DepartmentManagement";
import UserManagement from "./pages/LawFirmAdmin/UserManagement";
import ClientManagement from "./pages/LawFirmAdmin/ClientManagement";
import FirmSettings from "./pages/LawFirmAdmin/FirmSettings";
import Reports from "./pages/LawFirmAdmin/Reports";
import Profile from "./pages/LawFirmAdmin/Profile";
import RevenueTargets from "./pages/LawFirmAdmin/RevenueTargets";
import CreditCollectionDashboard from "./pages/CreditCollection/Dashboard";
import LegalDashboard from "./pages/Legal/Dashboard";
import ReceptionistDashboard from "./pages/Receptionist/Dashboard";
import NotFound from "./pages/NotFound";
import CaseManagement from "./pages/CreditCollection/CaseManagement";
import CaseDetails from "./pages/CreditCollection/CaseDetails";
import LegalCaseDetails from "./pages/Legal/CaseDetails";
import CompleteCaseInfo from "./pages/Legal/CompleteCaseInfo";
import CreateLegalCase from "./pages/Legal/CreateLegalCase";
import UnifiedCaseDetails from "./pages/LawFirmAdmin/UnifiedCaseDetails";
import CreateCase from "./pages/CreditCollection/CreateCase";
import CreditCollectionReports from "./pages/CreditCollection/Reports";
import CreditCollectionCalendar from "./pages/CreditCollection/Calendar";
import BulkImport from "./pages/CreditCollection/BulkImport";
import BulkSMS from "./pages/CreditCollection/BulkSMS";
import SingleSMS from "./pages/CreditCollection/SingleSMS";
import Newsletter from "./pages/LawFirmAdmin/Newsletter";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Notifications from "./pages/Notifications";

function App() {
  console.log("🚀 App component rendering...");
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoading, isAuthenticated, error } = useSelector(
    (state) => state.auth
  );
  
  console.log("📊 App state:", {
    hasUser: !!user,
    isLoading,
    isAuthenticated,
    error,
    pathname: location.pathname,
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userType = localStorage.getItem("userType");
    console.log("🔑 App useEffect - Token check:", {
      hasToken: !!token,
      hasUser: !!user,
      userType: userType,
      userRole: user?.role,
      currentPath: location.pathname,
      isLoading: isLoading,
    });

    // Only dispatch getCurrentUser if we have a token but no user data
    if (token && !user && !isLoading) {
      console.log("📡 Dispatching getCurrentUser");
      dispatch(getCurrentUser());
    }
    
    // Timeout fallback: if loading takes too long, stop loading
    if (isLoading) {
      const timeout = setTimeout(() => {
        console.warn("⚠️ Loading timeout - stopping loading state");
        // Don't force stop, let the thunk handle it
      }, 10000); // 10 second timeout
      
      return () => clearTimeout(timeout);
    }
  }, [dispatch, user, isLoading]);

  // Handle invalid tokens
  useEffect(() => {
    const token = localStorage.getItem("token");

    // If there's a token but we got an error from getCurrentUser, clear the invalid token
    if (token && error && error.includes("Failed to get user data")) {
      console.log("🗑️ Clearing invalid token");
      dispatch(clearInvalidToken());
    }
  }, [dispatch, error]);

  // NEW: Redirect user to correct dashboard when user data changes
  useEffect(() => {
    if (user && isAuthenticated && !isLoading) {
      const currentPath = location.pathname;
      const correctRoute = getDashboardRoute();

      // Determine role for logging
      const userType = localStorage.getItem("userType");
      const userRole = user?.role;
      const actualRole = userRole || userType;

      console.log("🔄 Checking if redirect needed:", {
        userRole: actualRole,
        currentPath,
        correctRoute,
        shouldRedirect: !isCorrectRouteForRole(currentPath, actualRole),
      });

      // If user is on a protected route that doesn't match their role, redirect
      // But don't redirect if they're already navigating (e.g., bulk-sms redirecting to add batchId)
      const isNavigatingWithinRoute = 
        (currentPath.startsWith("/admin") && correctRoute === "/admin") ||
        (currentPath.startsWith("/credit-collection") && correctRoute === "/credit-collection");
      
      if (!isCorrectRouteForRole(currentPath, actualRole) && !isNavigatingWithinRoute) {
        console.log("🚀 Redirecting user to correct dashboard:", correctRoute);
        navigate(correctRoute, { replace: true });
      }
    }
  }, [user, isAuthenticated, isLoading, location.pathname, navigate]);
//this line is for testing the application 
  const getDashboardRoute = () => {
    // Determine role - check userType first, then user.role
    const userType = localStorage.getItem("userType");
    const userRole = user?.role;
    const role = userRole || userType;

    if (!role) return "/login";

    switch (role) {
      case "system_owner":
        return "/system-owner";
      case "law_firm":
        return "/admin"; // Law firms go to admin dashboard
      case "law_firm_admin":
        return "/admin";
      case "credit_head":
      case "debt_collector":
        return "/credit-collection";
      case "legal_head":
      case "advocate":
        return "/legal";
      case "receptionist":
        return "/receptionist";
      case "client":
        return "/dashboard";
      default:
        return "/dashboard";
    }
  };

  // Helper function to check if current path matches user role
  const isCorrectRouteForRole = (path, role) => {
    // Determine role - check userType first, then user.role
    const userType = localStorage.getItem("userType");
    const userRole = user?.role;
    const actualRole = role || userRole || userType;

    if (!actualRole) return false;

    // Allow public routes
    if (path === "/" || path === "/login") return true;

    // Check role-specific routes
    switch (actualRole) {
      case "system_owner":
        return path.startsWith("/system-owner");
      case "law_firm":
        return path.startsWith("/admin"); // Law firms can access admin routes
      case "law_firm_admin":
        return path.startsWith("/admin");
      case "credit_head":
      case "debt_collector":
        return path.startsWith("/credit-collection");
      case "legal_head":
      case "advocate":
        return path.startsWith("/legal");
      case "receptionist":
        return path.startsWith("/receptionist");
      case "client":
        return path.startsWith("/dashboard");
      default:
        return false;
    }
  };

  // Prevent infinite loading - if loading for more than 10 seconds, show app anyway
  const [loadingTimeout, setLoadingTimeout] = React.useState(false);
  
  React.useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        console.warn("⚠️ Loading timeout exceeded - rendering app anyway");
        setLoadingTimeout(true);
      }, 10000); // 10 second timeout
      return () => clearTimeout(timer);
    } else {
      setLoadingTimeout(false);
    }
  }, [isLoading]);

  // Don't show loading if timeout exceeded or if there's no token (should show login)
  if (isLoading && !loadingTimeout && localStorage.getItem("token")) {
    console.log("⏳ Showing loading screen...");
    return <Loading />;
  }

  console.log("✅ Rendering main app content...");
  console.log("📍 Current pathname:", location.pathname);
  console.log("🔐 Auth state:", { user: !!user, isLoading, isAuthenticated });

  return (
    <div 
      className="min-h-screen bg-dark-900"
      style={{ 
        minHeight: '100vh',
        backgroundColor: '#0f172a',
        color: '#f8fafc',
        width: '100%',
        position: 'relative',
        zIndex: 1
      }}
    >
      {/* Debug info - remove in production */}
      {import.meta.env.DEV && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '10px',
          fontSize: '12px',
          zIndex: 9999
        }}>
          Path: {location.pathname} | Loading: {isLoading ? 'Yes' : 'No'} | Auth: {isAuthenticated ? 'Yes' : 'No'} | User: {user ? 'Yes' : 'No'}
        </div>
      )}
      <NetworkStatus />
      <NetworkDebugger />
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/" 
          element={
            <div style={{ 
              padding: '20px', 
              color: 'white',
              backgroundColor: '#0f172a',
              minHeight: '100vh'
            }}>
              <LandingPage />
            </div>
          } 
        />

        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        <Route path="/register" element={<LawFirmRegistration />} />

        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* Protected Routes */}
        <Route
          path="/system-owner/*"
          element={
            <ProtectedRoute allowedRoles={["system_owner"]}>
              <SystemOwnerDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["law_firm_admin", "law_firm"]}>
              <LawFirmAdminDashboard />
            </ProtectedRoute>
          }
        >
          {/* Nested routes */}
          <Route index element={<AdminOverview />} />
          <Route path="cases" element={<AdminCaseManagement />} />
          <Route path="calendar" element={<AdminCalendar />} />
          <Route path="case/:id" element={<UnifiedCaseDetails />} />
          <Route path="legal-case/:id" element={<LegalCaseDetails />} />
          <Route path="legal-case/:id/complete" element={<CompleteCaseInfo />} />
          <Route path="credit-case/:id" element={<CaseDetails />} />
          <Route path="create-credit-case" element={<CreateCase />} />
          <Route path="create-legal-case" element={<CreateLegalCase />} />
          <Route path="departments/*" element={<DepartmentManagement />} />
          <Route path="users/*" element={<UserManagement />} />
          <Route path="clients/*" element={<ClientManagement />} />
          <Route path="settings" element={<FirmSettings />} />
          <Route path="reports" element={<Reports />} />
          <Route path="revenue-targets" element={<RevenueTargets />} />
          <Route path="profile" element={<Profile />} />
          <Route path="bulk-import" element={<BulkImport />} />
          <Route path="bulk-sms" element={<BulkSMS />} />
          <Route path="send-sms" element={<SingleSMS />} />
          <Route path="newsletter" element={<Newsletter />} />
          <Route path="newsletter/auth/callback" element={<Newsletter />} />
        </Route>

        <Route
          path="/credit-collection/*"
          element={
            <ProtectedRoute allowedRoles={["credit_head", "debt_collector"]}>
              <CreditCollectionDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/credit-collection/cases"
          element={
            <CreditCollectionLayout>
              <CaseManagement />
            </CreditCollectionLayout>
          }
        />
        <Route
          path="/credit-collection/cases/:id"
          element={
            <CreditCollectionLayout>
              <CaseDetails />
            </CreditCollectionLayout>
          }
        />
        <Route
          path="/credit-collection/cases/create"
          element={
            <CreditCollectionLayout>
              <CreateCase />
            </CreditCollectionLayout>
          }
        />

        <Route
          path="/credit-collection/calendar"
          element={
            <CreditCollectionLayout>
              <CreditCollectionCalendar />
            </CreditCollectionLayout>
          }
        />

        <Route
          path="/credit-collection/reports"
          element={
            <ProtectedRoute allowedRoles={["credit_head", "debt_collector"]}>
              <CreditCollectionReports />
            </ProtectedRoute>
          }
        />


        <Route
          path="/legal/*"
          element={
            <ProtectedRoute
              allowedRoles={["legal_head", "advocate", "law_firm_admin"]}
            >
              <LegalDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/receptionist/*"
          element={
            <ProtectedRoute allowedRoles={["receptionist"]}>
              <ReceptionistDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["client"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/notifications"
          element={
            <ProtectedRoute
              allowedRoles={[
                "legal_head",
                "advocate",
                "credit_head",
                "debt_collector",
                "law_firm_admin",
                "law_firm",
                "receptionist",
                "system_owner",
              ]}
            >
              <Notifications />
            </ProtectedRoute>
          }
        />

        {/* Redirect /app to appropriate dashboard for authenticated users */}
        <Route
          path="/app"
          element={
            isAuthenticated ? (
              <Navigate to={getDashboardRoute()} replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Unauthorized Route */}
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App;
