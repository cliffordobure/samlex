import { useSelector } from "react-redux";

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);

  return (
    <div className="min-h-screen bg-dark-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-dark-400 mt-2">
            Here's what's happening with your cases today.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Dashboard stats cards */}
          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="p-2 bg-primary-500 bg-opacity-20 rounded-lg">
                  <div className="w-6 h-6 bg-primary-500 rounded"></div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-dark-400">
                    Total Cases
                  </p>
                  <p className="text-2xl font-bold text-white">0</p>
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
                    Active Cases
                  </p>
                  <p className="text-2xl font-bold text-white">0</p>
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
                  <p className="text-sm font-medium text-dark-400">Pending</p>
                  <p className="text-2xl font-bold text-white">0</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="p-2 bg-red-500 bg-opacity-20 rounded-lg">
                  <div className="w-6 h-6 bg-red-500 rounded"></div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-dark-400">Overdue</p>
                  <p className="text-2xl font-bold text-white">0</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-white">Recent Cases</h3>
            </div>
            <div className="card-body">
              <p className="text-dark-400">No cases found.</p>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-white">
                Recent Activity
              </h3>
            </div>
            <div className="card-body">
              <p className="text-dark-400">No recent activity.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
