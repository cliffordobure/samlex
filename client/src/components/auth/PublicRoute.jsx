import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import Loading from "../common/Loading";

const PublicRoute = ({ children }) => {
  const { isAuthenticated, user, isLoading } = useSelector(
    (state) => state.auth
  );

  // Check if there's a token but user data is still loading
  const hasToken = localStorage.getItem("token");
  const isTokenLoading = hasToken && !user && isLoading;

  // Show loading if there's a token but user data hasn't been fetched yet
  if (isTokenLoading) {
    return <Loading />;
  }

  if (isAuthenticated && user) {
    // Check both user.role and localStorage userType
    const userRole = user?.role;
    const userType = localStorage.getItem("userType");
    const actualRole = userRole || userType;

    console.log("🔍 PublicRoute Role Check:", {
      userRole,
      userType,
      actualRole,
      userExists: !!user,
    });

    switch (actualRole) {
      case "system_owner":
        return <Navigate to="/system-owner" replace />;
      case "law_firm_admin":
      case "law_firm":
        return <Navigate to="/admin" replace />;
      case "credit_head":
      case "debt_collector":
        return <Navigate to="/credit-collection" replace />;
      case "legal_head":
      case "advocate":
        return <Navigate to="/legal" replace />;
      case "receptionist":
        return <Navigate to="/receptionist" replace />;
      case "client":
        return <Navigate to="/dashboard" replace />;
      default:
        return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

export default PublicRoute;
