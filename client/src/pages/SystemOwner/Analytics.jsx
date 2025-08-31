import { useEffect, useState } from "react";
import axios from "axios";
import {
  FaUsers,
  FaBuilding,
  FaMoneyBill,
  FaChartPie,
  FaGavel,
} from "react-icons/fa";
import { Bar, Pie } from "react-chartjs-2";
import Loading from "../../components/common/Loading";

// Chart.js registration (if not already globally registered)
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `${
            import.meta.env.VITE_API_URL || "/api"
          }/system-owner/analytics`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setData(response.data);
      } catch {
        setError("Failed to load analytics data");
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) return <Loading />;
  if (error) return <div className="text-red-500 p-6">{error}</div>;

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-3xl font-bold text-white mb-4">System Analytics</h1>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        <KpiCard
          icon={<FaBuilding size={28} />}
          label="Law Firms"
          value={data.totalLawFirms}
        />
        <KpiCard
          icon={<FaUsers size={28} />}
          label="Users"
          value={data.totalUsers}
        />
        <KpiCard
          icon={<FaGavel size={28} />}
          label="Credit Cases"
          value={data.totalCreditCases}
        />
        <KpiCard
          icon={<FaGavel size={28} />}
          label="Legal Cases"
          value={data.totalLegalCases}
        />
        <KpiCard
          icon={<FaMoneyBill size={28} />}
          label="Revenue"
          value={`$${data.revenue.toLocaleString()}`}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-dark-800 rounded-lg p-6 shadow">
          <h2 className="text-lg font-semibold text-white mb-4">
            Law Firm Signups Over Time
          </h2>
          <Bar
            data={{
              labels: data.signupsOverTime.labels,
              datasets: [
                {
                  label: "Signups",
                  data: data.signupsOverTime.data,
                  backgroundColor: "#2563eb",
                  borderRadius: 6,
                },
              ],
            }}
            options={{
              responsive: true,
              plugins: {
                legend: { display: false },
                title: { display: false },
              },
              scales: {
                x: { grid: { color: "#22223b" }, ticks: { color: "#cbd5e1" } },
                y: { grid: { color: "#22223b" }, ticks: { color: "#cbd5e1" } },
              },
            }}
          />
        </div>
        <div className="bg-dark-800 rounded-lg p-6 shadow flex flex-col items-center justify-center">
          <h2 className="text-lg font-semibold text-white mb-4">
            Subscription Plan Distribution
          </h2>
          <Pie
            data={{
              labels: data.subscriptionPlans.labels,
              datasets: [
                {
                  data: data.subscriptionPlans.data,
                  backgroundColor: ["#6366f1", "#10b981", "#f59e42"],
                  borderColor: "#18181b",
                },
              ],
            }}
            options={{
              plugins: {
                legend: {
                  labels: { color: "#cbd5e1", font: { size: 14 } },
                },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}

function KpiCard({ icon, label, value }) {
  return (
    <div className="bg-dark-800 rounded-lg p-6 flex flex-col items-center shadow hover:shadow-lg transition-shadow">
      <div className="mb-2 text-primary-400">{icon}</div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-dark-300 text-sm font-medium">{label}</div>
    </div>
  );
}
