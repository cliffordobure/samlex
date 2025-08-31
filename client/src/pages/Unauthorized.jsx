import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

const Unauthorized = () => {
  const { user } = useSelector((state) => state.auth);
  const userType = localStorage.getItem("userType");
  const actualRole = user?.role || userType;

  const getDashboardRoute = () => {
    if (!actualRole) return "/login";

    switch (actualRole) {
      case "system_owner":
        return "/system-owner";
      case "law_firm":
        return "/admin";
      case "law_firm_admin":
        return "/admin";
      case "credit_head":
      case "debt_collector":
        return "/credit-collection";
      case "legal_head":
      case "advocate":
        return "/legal";
      case "client":
        return "/dashboard";
      default:
        return "/dashboard";
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="mb-8">
          <svg
            className="mx-auto h-16 w-16 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-white mb-4">Access Denied</h1>

        <p className="text-dark-400 mb-6">
          You don't have permission to access this page.
          {actualRole && (
            <span className="block mt-2">
              Your current role:{" "}
              <span className="font-semibold text-primary-500">
                {actualRole}
              </span>
            </span>
          )}
        </p>

        <div className="space-y-3">
          <Link to={getDashboardRoute()} className="btn-primary w-full block">
            Go to Dashboard
          </Link>

          <Link to="/" className="btn-secondary w-full block">
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
