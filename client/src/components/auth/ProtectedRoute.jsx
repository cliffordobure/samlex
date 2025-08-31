import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";
import Loading from "../common/Loading";

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user, isLoading } = useSelector(
    (state) => state.auth
  );
  const location = useLocation();
  const renderCount = useRef(0);
  const prevAllowedRoles = useRef(allowedRoles);

  // Increment render count
  renderCount.current += 1;

  // Check if allowedRoles changed
  const rolesChanged =
    JSON.stringify(prevAllowedRoles.current) !== JSON.stringify(allowedRoles);
  if (rolesChanged) {
    console.log("🔄 AllowedRoles CHANGED:", {
      previous: prevAllowedRoles.current,
      current: allowedRoles,
      path: location.pathname,
    });
    prevAllowedRoles.current = allowedRoles;
  }

  useEffect(() => {
    console.log("🚀 ProtectedRoute Effect Triggered:", {
      renderCount: renderCount.current,
      path: location.pathname,
      allowedRoles: [...allowedRoles],
      userRole: user?.role,
      userId: user?.id,
      isAuthenticated,
      timestamp: new Date().toISOString(),
    });
  }, [location.pathname, allowedRoles, user?.role, user?.id, isAuthenticated]);

  // Detailed logging
  console.log("🛡️ ProtectedRoute Render:", {
    renderCount: renderCount.current,
    path: location.pathname,
    allowedRoles: {
      value: allowedRoles,
      type: typeof allowedRoles,
      isArray: Array.isArray(allowedRoles),
      length: allowedRoles.length,
      stringified: JSON.stringify(allowedRoles),
    },
    user: {
      exists: !!user,
      role: user?.role,
      id: user?.id,
      email: user?.email || user?.firmEmail,
    },
    auth: {
      isAuthenticated,
      isLoading,
    },
  });

  // Check if there's a token but user data is still loading
  const hasToken = localStorage.getItem("token");
  const isTokenLoading = hasToken && !user && isLoading;

  // Show loading if:
  // 1. App is loading user data
  // 2. There's a token but user data hasn't been fetched yet
  if (isLoading || isTokenLoading) {
    console.log("⏳ Loading...", {
      isLoading,
      isTokenLoading,
      hasToken,
      hasUser: !!user,
    });
    return <Loading />;
  }

  if (!isAuthenticated) {
    console.log("🚫 Not authenticated, redirecting to login");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role check with detailed logging
  // Check both user.role and localStorage userType
  const userRole = user?.role;
  const userType = localStorage.getItem("userType");
  const actualRole = userRole || userType;

  const hasRequiredRole =
    allowedRoles.length === 0 || allowedRoles.includes(actualRole);

  console.log("🔍 Role Check:", {
    allowedRoles,
    userRole,
    userType,
    actualRole,
    hasRequiredRole,
    rolesLength: allowedRoles.length,
    includesCheck: allowedRoles.includes(actualRole),
    userExists: !!user,
    userData: user
      ? {
          id: user.id,
          email: user.email || user.firmEmail,
          role: user.role,
        }
      : null,
    path: location.pathname,
  });

  if (!hasRequiredRole) {
    console.log("❌ Access denied - role mismatch");
    return <Navigate to="/unauthorized" replace />;
  }

  console.log("✅ Access granted");
  return children;
};

export default ProtectedRoute;
