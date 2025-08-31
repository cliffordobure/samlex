import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getLawFirms } from "../../store/slices/lawFirmSlice";

const SystemOwnerOverview = () => {
  const dispatch = useDispatch();
  const { lawFirms, isLoading } = useSelector((state) => state.lawFirms);

  // Ensure lawFirms is always an array
  const lawFirmsArray = Array.isArray(lawFirms) ? lawFirms : [];

  useEffect(() => {
    dispatch(getLawFirms({ limit: 5 }));
  }, [dispatch]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">System Overview</h1>
        <p className="text-dark-400 mt-2">
          Monitor and manage the entire Samlex platform.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="p-2 bg-primary-500 bg-opacity-20 rounded-lg">
                <div className="w-6 h-6 bg-primary-500 rounded"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-dark-400">
                  Total Law Firms
                </p>
                <p className="text-2xl font-bold text-white">
                  {lawFirmsArray.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="p-2 bg-green-500 bg-opacity-20 rounded-lg">
                <div className="w-6 h-6 bg-green-500 rounded"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-dark-400">
                  Active Firms
                </p>
                <p className="text-2xl font-bold text-white">
                  {lawFirmsArray.filter((firm) => firm.isActive).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-500 bg-opacity-20 rounded-lg">
                <div className="w-6 h-6 bg-yellow-500 rounded"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-dark-400">Trial Firms</p>
                <p className="text-2xl font-bold text-white">
                  {
                    lawFirmsArray.filter(
                      (firm) => firm.subscription?.status === "trial"
                    ).length
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="p-2 bg-blue-500 bg-opacity-20 rounded-lg">
                <div className="w-6 h-6 bg-blue-500 rounded"></div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-dark-400">Subscribed</p>
                <p className="text-2xl font-bold text-white">
                  {
                    lawFirmsArray.filter(
                      (firm) => firm.subscription?.status === "active"
                    ).length
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Law Firms */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-white">Recent Law Firms</h3>
        </div>
        <div className="card-body">
          {isLoading ? (
            <p className="text-dark-400">Loading...</p>
          ) : lawFirmsArray.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Firm Name</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {lawFirmsArray.slice(0, 5).map((firm) => (
                    <tr key={firm._id}>
                      <td className="font-medium text-white">
                        {firm.firmName}
                      </td>
                      <td className="text-dark-300">{firm.firmEmail}</td>
                      <td>
                        <span
                          className={`badge ${
                            firm.isActive ? "badge-success" : "badge-danger"
                          }`}
                        >
                          {firm.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="text-dark-300">
                        {new Date(firm.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-dark-400">No law firms found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemOwnerOverview;
