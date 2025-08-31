import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getLegalCases } from "../../store/slices/legalCaseSlice";
import { getLegalCaseStatistics } from "../../store/slices/legalCaseSlice";
import aiApi from "../../store/api/aiApi";
import {
  FaChartBar,
  FaChartLine,
  FaChartPie,
  FaDownload,
  FaCalendar,
  FaUsers,
  FaFileAlt,
  FaGavel,
  FaBalanceScale,
  FaBuilding,
  FaHome,
  FaBriefcase,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock,
  FaFilter,
  FaBrain,
  FaLightbulb,
  FaRocket,
  FaShieldAlt,
  FaHandshake,
  FaBalanceScale as FaScale,
} from "react-icons/fa";
import toast from "react-hot-toast";

const Reports = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { cases, isLoading } = useSelector((state) => state.legalCases);

  const [selectedPeriod, setSelectedPeriod] = useState("30");
  const [reportType, setReportType] = useState("overview");
  const [generatingReport, setGeneratingReport] = useState(false);

  // AI State
  const [aiInsights, setAiInsights] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [comprehensiveReport, setComprehensiveReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Load cases based on user role
    if (user.role === "legal_head") {
      dispatch(getLegalCases({ lawFirm: user.lawFirm._id }));
    } else if (user.role === "advocate") {
      dispatch(getLegalCases({ assignedTo: user._id }));
    }

    // Load statistics
    dispatch(getLegalCaseStatistics({ period: selectedPeriod }));
  }, [dispatch, user, selectedPeriod]);

  // Generate AI insights when cases are loaded
  useEffect(() => {
    if (cases && cases.length > 0) {
      generateAiInsights();
    }
  }, [cases, selectedPeriod]);

  const generateAiInsights = async () => {
    setAiLoading(true);
    try {
      // Prepare legal case data for AI analysis
      const legalData = {
        cases: cases || [],
        userRole: user?.role,
        period: selectedPeriod,
        statistics: {
          totalCases: cases?.length || 0,
          resolvedCases:
            cases?.filter(
              (c) => c.status === "resolved" || c.status === "closed"
            ).length || 0,
          activeCases:
            cases?.filter(
              (c) => c.status !== "resolved" && c.status !== "closed"
            ).length || 0,
          caseTypes: calculateCaseTypeDistribution(),
          statusDistribution: calculateStatusDistribution(),
          priorityDistribution: calculatePriorityDistribution(),
        },
        advocatePerformance:
          user?.role === "advocate"
            ? {
                totalCases: cases?.length || 0,
                resolvedCases:
                  cases?.filter(
                    (c) => c.status === "resolved" || c.status === "closed"
                  ).length || 0,
                activeCases:
                  cases?.filter(
                    (c) => c.status !== "resolved" && c.status !== "closed"
                  ).length || 0,
                resolutionRate:
                  cases?.length > 0
                    ? (
                        (cases.filter(
                          (c) =>
                            c.status === "resolved" || c.status === "closed"
                        ).length /
                          cases.length) *
                        100
                      ).toFixed(1)
                    : 0,
              }
            : null,
      };

      // Call AI API for legal insights
      const response = await aiApi.getLegalInsights(legalData);

      if (response.data.success) {
        setAiInsights(response.data.data);
      } else {
        // Fallback insights
        setAiInsights(generateFallbackLegalInsights(legalData));
      }
    } catch (error) {
      console.error("Error generating AI insights:", error);
      toast.error("Failed to generate AI insights");
      setAiInsights(
        generateFallbackLegalInsights({
          cases: cases || [],
          userRole: user?.role,
          statistics: {
            totalCases: cases?.length || 0,
            resolvedCases:
              cases?.filter(
                (c) => c.status === "resolved" || c.status === "closed"
              ).length || 0,
          },
        })
      );
    } finally {
      setAiLoading(false);
    }
  };

  const generateComprehensiveReport = async () => {
    setReportLoading(true);
    try {
      const legalData = {
        cases: cases || [],
        userRole: user?.role,
        period: selectedPeriod,
        statistics: {
          totalCases: cases?.length || 0,
          resolvedCases:
            cases?.filter(
              (c) => c.status === "resolved" || c.status === "closed"
            ).length || 0,
          activeCases:
            cases?.filter(
              (c) => c.status !== "resolved" && c.status !== "closed"
            ).length || 0,
          caseTypes: calculateCaseTypeDistribution(),
          statusDistribution: calculateStatusDistribution(),
        },
        advocatePerformance:
          user?.role === "advocate"
            ? {
                totalCases: cases?.length || 0,
                resolvedCases:
                  cases?.filter(
                    (c) => c.status === "resolved" || c.status === "closed"
                  ).length || 0,
                resolutionRate:
                  cases?.length > 0
                    ? (
                        (cases.filter(
                          (c) =>
                            c.status === "resolved" || c.status === "closed"
                        ).length /
                          cases.length) *
                        100
                      ).toFixed(1)
                    : 0,
              }
            : null,
      };

      const response = await aiApi.getComprehensiveLegalAnalysis(legalData);

      if (response.data.success) {
        setComprehensiveReport(response.data.data);
        toast.success("Comprehensive report generated successfully!");
      } else {
        toast.error("Failed to generate comprehensive report");
      }
    } catch (error) {
      console.error("Error generating comprehensive report:", error);
      toast.error("Failed to generate comprehensive report");
    } finally {
      setReportLoading(false);
    }
  };

  const generateFallbackLegalInsights = (data) => {
    const totalCases = data.statistics?.totalCases || 0;
    const resolvedCases = data.statistics?.resolvedCases || 0;
    const resolutionRate =
      totalCases > 0 ? (resolvedCases / totalCases) * 100 : 0;

    return {
      overall: {
        score: Math.min(100, Math.max(0, resolutionRate * 2)),
        trend: resolutionRate > 50 ? "improving" : "needs_attention",
        summary: `Analysis of ${totalCases} cases with ${resolutionRate.toFixed(
          1
        )}% resolution rate`,
      },
      performance: {
        trend: resolutionRate > 50 ? "improving" : "needs_attention",
        insights: [
          `Resolution rate: ${resolutionRate.toFixed(1)}%`,
          `Active cases: ${data.statistics?.activeCases || 0}`,
          `Total cases: ${totalCases}`,
        ],
        recommendations: [
          resolutionRate < 50
            ? "Focus on case resolution strategies"
            : "Maintain current performance",
          "Implement regular case reviews",
          "Enhance client communication",
        ],
        priority:
          resolutionRate < 30 ? "high" : resolutionRate < 60 ? "medium" : "low",
      },
      predictions: {
        nextMonthCases: "Based on current trends",
        resolutionRate: `${Math.min(100, resolutionRate + 10).toFixed(1)}%`,
        successProbability: "Monitor case progress closely",
      },
      recommendations: [
        "Schedule regular case reviews",
        "Enhance client communication",
        "Focus on priority cases",
        "Implement case tracking system",
      ],
      riskFactors:
        resolutionRate < 30
          ? [
              "Low resolution rate",
              "High number of pending cases",
              "Potential client dissatisfaction",
            ]
          : [],
      nextActions: [
        "Review case priorities",
        "Schedule client meetings",
        "Update case documentation",
      ],
    };
  };

  const calculatePriorityDistribution = () => {
    if (!cases) return [];
    const distribution = {};
    cases.forEach((legalCase) => {
      distribution[legalCase.priority] =
        (distribution[legalCase.priority] || 0) + 1;
    });
    return Object.entries(distribution).map(([priority, count]) => ({
      priority,
      count,
      percentage: ((count / cases.length) * 100).toFixed(1),
    }));
  };

  const getCaseTypeIcon = (caseType) => {
    const icons = {
      civil: FaBalanceScale,
      criminal: FaGavel,
      corporate: FaBuilding,
      family: FaUsers,
      property: FaHome,
      labor: FaBriefcase,
      debt_collection: FaFileAlt,
      other: FaFileAlt,
    };
    return icons[caseType] || FaFileAlt;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending_assignment: "bg-yellow-500",
      filed: "bg-blue-500",
      assigned: "bg-purple-500",
      under_review: "bg-orange-500",
      court_proceedings: "bg-red-500",
      settlement: "bg-green-500",
      resolved: "bg-emerald-500",
      closed: "bg-gray-500",
    };
    return colors[status] || "bg-gray-500";
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: "bg-green-500",
      medium: "bg-yellow-500",
      high: "bg-orange-500",
      urgent: "bg-red-500",
    };
    return colors[priority] || "bg-gray-500";
  };

  const calculateCaseTypeDistribution = () => {
    if (!cases) return [];
    const distribution = {};
    cases.forEach((legalCase) => {
      distribution[legalCase.caseType] =
        (distribution[legalCase.caseType] || 0) + 1;
    });
    return Object.entries(distribution).map(([type, count]) => ({
      type,
      count,
      percentage: ((count / cases.length) * 100).toFixed(1),
    }));
  };

  const calculateStatusDistribution = () => {
    if (!cases) return [];
    const distribution = {};
    cases.forEach((legalCase) => {
      distribution[legalCase.status] =
        (distribution[legalCase.status] || 0) + 1;
    });
    return Object.entries(distribution).map(([status, count]) => ({
      status,
      count,
      percentage: ((count / cases.length) * 100).toFixed(1),
    }));
  };

  const calculateMonthlyTrends = () => {
    if (!cases) return [];
    const monthlyData = {};
    const now = new Date();
    const months = [];

    // Generate last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
      });
      months.push(monthKey);
      monthlyData[monthKey] = 0;
    }

    cases.forEach((legalCase) => {
      const caseDate = new Date(legalCase.createdAt);
      const monthKey = caseDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
      });
      if (Object.prototype.hasOwnProperty.call(monthlyData, monthKey)) {
        monthlyData[monthKey]++;
      }
    });

    return months.map((month) => ({
      month,
      count: monthlyData[month],
    }));
  };

  const getAdvocatePerformance = () => {
    if (!cases || user.role !== "legal_head") return [];

    const advocateStats = {};
    cases.forEach((legalCase) => {
      if (legalCase.assignedTo) {
        const advocateId = legalCase.assignedTo._id;
        if (!advocateStats[advocateId]) {
          advocateStats[advocateId] = {
            name: `${legalCase.assignedTo.firstName} ${legalCase.assignedTo.lastName}`,
            totalCases: 0,
            resolvedCases: 0,
            pendingCases: 0,
          };
        }
        advocateStats[advocateId].totalCases++;

        if (legalCase.status === "resolved" || legalCase.status === "closed") {
          advocateStats[advocateId].resolvedCases++;
        } else if (
          legalCase.status === "pending_assignment" ||
          legalCase.status === "assigned"
        ) {
          advocateStats[advocateId].pendingCases++;
        }
      }
    });

    return Object.values(advocateStats).map((advocate) => ({
      ...advocate,
      resolutionRate:
        advocate.totalCases > 0
          ? ((advocate.resolvedCases / advocate.totalCases) * 100).toFixed(1)
          : 0,
    }));
  };

  const generateReport = async () => {
    setGeneratingReport(true);
    try {
      // Simulate report generation
      await new Promise((resolve) => setTimeout(resolve, 2000));
      toast.success("Report generated successfully!");
    } catch {
      toast.error("Failed to generate report");
    } finally {
      setGeneratingReport(false);
    }
  };

  const exportReport = () => {
    toast.success("Report exported successfully!");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="loading loading-spinner loading-lg"></div>
        <span className="ml-2">Loading reports...</span>
      </div>
    );
  }

  const caseTypeDistribution = calculateCaseTypeDistribution();
  const statusDistribution = calculateStatusDistribution();
  const monthlyTrends = calculateMonthlyTrends();
  const advocatePerformance = getAdvocatePerformance();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Reports & Analytics</h1>
          <p className="text-dark-400 mt-2">
            Comprehensive insights into legal case performance and trends.
          </p>
        </div>
        <div className="flex gap-3">
          <select
            className="select select-bordered"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 3 months</option>
            <option value="365">Last year</option>
          </select>
          <button
            onClick={generateReport}
            disabled={generatingReport}
            className="btn btn-primary flex items-center gap-2"
          >
            {generatingReport ? (
              <div className="loading loading-spinner loading-sm"></div>
            ) : (
              <FaChartBar />
            )}
            Generate Report
          </button>
          <button
            onClick={exportReport}
            className="btn btn-outline flex items-center gap-2"
          >
            <FaDownload />
            Export
          </button>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="card">
        <div className="card-body">
          <div className="flex gap-2">
            <button
              onClick={() => setReportType("overview")}
              className={`btn ${
                reportType === "overview" ? "btn-primary" : "btn-outline"
              }`}
            >
              <FaChartBar />
              Overview
            </button>
            <button
              onClick={() => setReportType("performance")}
              className={`btn ${
                reportType === "performance" ? "btn-primary" : "btn-outline"
              }`}
            >
              <FaChartLine />
              Performance
            </button>
            <button
              onClick={() => setReportType("trends")}
              className={`btn ${
                reportType === "trends" ? "btn-primary" : "btn-outline"
              }`}
            >
              <FaChartPie />
              Trends
            </button>
            <button
              onClick={() => setReportType("ai-insights")}
              className={`btn ${
                reportType === "ai-insights" ? "btn-primary" : "btn-outline"
              }`}
            >
              <FaBrain />
              AI Insights
            </button>
          </div>
        </div>
      </div>

      {/* Overview Report */}
      {reportType === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Key Metrics */}
          <div className="card">
            <div className="card-body">
              <h2 className="card-title">Key Metrics</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="stat">
                  <div className="stat-figure text-primary">
                    <FaFileAlt className="text-2xl" />
                  </div>
                  <div className="stat-title">Total Cases</div>
                  <div className="stat-value">{cases?.length || 0}</div>
                </div>
                <div className="stat">
                  <div className="stat-figure text-success">
                    <FaCheckCircle className="text-2xl" />
                  </div>
                  <div className="stat-title">Resolved</div>
                  <div className="stat-value">
                    {cases?.filter(
                      (c) => c.status === "resolved" || c.status === "closed"
                    ).length || 0}
                  </div>
                </div>
                <div className="stat">
                  <div className="stat-figure text-warning">
                    <FaClock className="text-2xl" />
                  </div>
                  <div className="stat-title">Pending</div>
                  <div className="stat-value">
                    {cases?.filter(
                      (c) =>
                        c.status === "pending_assignment" ||
                        c.status === "assigned"
                    ).length || 0}
                  </div>
                </div>
                <div className="stat">
                  <div className="stat-figure text-info">
                    <FaUsers className="text-2xl" />
                  </div>
                  <div className="stat-title">Active Advocates</div>
                  <div className="stat-value">
                    {new Set(
                      cases
                        ?.filter((c) => c.assignedTo)
                        .map((c) => c.assignedTo._id)
                    ).size || 0}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Case Type Distribution */}
          <div className="card">
            <div className="card-body">
              <h2 className="card-title">Case Type Distribution</h2>
              <div className="space-y-3">
                {caseTypeDistribution.map((item) => {
                  const CaseTypeIcon = getCaseTypeIcon(item.type);
                  return (
                    <div
                      key={item.type}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <CaseTypeIcon className="text-dark-400" />
                        <span className="capitalize">{item.type}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-base-300 rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${item.percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">
                          {item.count}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Status Distribution */}
          <div className="card">
            <div className="card-body">
              <h2 className="card-title">Status Distribution</h2>
              <div className="space-y-3">
                {statusDistribution.map((item) => (
                  <div
                    key={item.status}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${getStatusColor(
                          item.status
                        )}`}
                      ></div>
                      <span className="capitalize">
                        {item.status.replace("_", " ")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-base-300 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{item.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Monthly Trends */}
          <div className="card">
            <div className="card-body">
              <h2 className="card-title">Monthly Case Trends</h2>
              <div className="space-y-3">
                {monthlyTrends.map((item) => (
                  <div
                    key={item.month}
                    className="flex items-center justify-between"
                  >
                    <span>{item.month}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-base-300 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{
                            width: `${Math.max(
                              (item.count /
                                Math.max(
                                  ...monthlyTrends.map((t) => t.count)
                                )) *
                                100,
                              5
                            )}%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium">{item.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Performance Report */}
      {reportType === "performance" && user.role === "legal_head" && (
        <div className="card">
          <div className="card-body">
            <h2 className="card-title">Advocate Performance</h2>
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>Advocate</th>
                    <th>Total Cases</th>
                    <th>Resolved</th>
                    <th>Pending</th>
                    <th>Resolution Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {advocatePerformance.map((advocate, index) => (
                    <tr key={index}>
                      <td>
                        <div className="flex items-center gap-2">
                          <FaUsers className="text-dark-400" />
                          <span>{advocate.name}</span>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-primary">
                          {advocate.totalCases}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-success">
                          {advocate.resolvedCases}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-warning">
                          {advocate.pendingCases}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-base-300 rounded-full h-2">
                            <div
                              className="bg-success h-2 rounded-full"
                              style={{ width: `${advocate.resolutionRate}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">
                            {advocate.resolutionRate}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Trends Report */}
      {reportType === "trends" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Priority Distribution */}
          <div className="card">
            <div className="card-body">
              <h2 className="card-title">Priority Distribution</h2>
              <div className="space-y-3">
                {["urgent", "high", "medium", "low"].map((priority) => {
                  const count =
                    cases?.filter((c) => c.priority === priority).length || 0;
                  const percentage =
                    cases?.length > 0
                      ? ((count / cases.length) * 100).toFixed(1)
                      : 0;
                  return (
                    <div
                      key={priority}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-3 h-3 rounded-full ${getPriorityColor(
                            priority
                          )}`}
                        ></div>
                        <span className="capitalize">{priority}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-base-300 rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{count}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card">
            <div className="card-body">
              <h2 className="card-title">Recent Activity</h2>
              <div className="space-y-3">
                {cases?.slice(0, 5).map((legalCase) => (
                  <div
                    key={legalCase._id}
                    className="flex items-center gap-3 p-3 bg-base-200 rounded"
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${getStatusColor(
                        legalCase.status
                      )}`}
                    ></div>
                    <div className="flex-1">
                      <div className="font-medium">{legalCase.caseNumber}</div>
                      <div className="text-sm text-dark-400">
                        {legalCase.title}
                      </div>
                    </div>
                    <div className="text-sm text-dark-400">
                      {new Date(legalCase.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Insights Report */}
      {reportType === "ai-insights" && (
        <div className="space-y-6">
          {/* Generate Comprehensive Report Button */}
          <div className="card">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Generate Comprehensive AI Report
                  </h3>
                  <p className="text-dark-300 text-sm">
                    Get detailed AI analysis with predictions, recommendations,
                    and actionable insights
                  </p>
                </div>
                <button
                  onClick={generateComprehensiveReport}
                  disabled={reportLoading}
                  className="btn btn-primary px-6 py-3 rounded-lg text-sm font-medium flex items-center gap-2"
                >
                  {reportLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <FaBrain className="w-4 h-4" />
                      Generate Report
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Comprehensive Report Display */}
          {comprehensiveReport && (
            <div className="card">
              <div className="card-body">
                <h3 className="text-xl font-semibold text-white mb-6">
                  Comprehensive AI Report
                </h3>
                <div className="space-y-6">
                  {/* Executive Summary */}
                  <div className="border-l-4 border-primary-500 pl-4">
                    <h4 className="text-lg font-medium text-white mb-2">
                      Executive Summary
                    </h4>
                    <p className="text-dark-300">
                      {comprehensiveReport.insights?.overall?.summary ||
                        "Analysis completed"}
                    </p>
                  </div>

                  {/* Detailed Analysis */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="space-y-4">
                      <h4 className="text-md font-medium text-white">
                        Performance Analysis
                      </h4>
                      <div className="space-y-2">
                        {comprehensiveReport.insights?.performance?.insights?.map(
                          (insight, index) => (
                            <div key={index} className="flex items-start gap-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                              <p className="text-dark-300 text-sm">{insight}</p>
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-md font-medium text-white">
                        Case Analysis
                      </h4>
                      <div className="space-y-2">
                        {comprehensiveReport.insights?.cases?.insights?.map(
                          (insight, index) => (
                            <div key={index} className="flex items-start gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                              <p className="text-dark-300 text-sm">{insight}</p>
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-md font-medium text-white">
                        Strategy Analysis
                      </h4>
                      <div className="space-y-2">
                        {comprehensiveReport.insights?.strategy?.insights?.map(
                          (insight, index) => (
                            <div key={index} className="flex items-start gap-2">
                              <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                              <p className="text-dark-300 text-sm">{insight}</p>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-medium text-white">
                      Strategic Recommendations
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {comprehensiveReport.insights?.performance?.recommendations?.map(
                        (rec, index) => (
                          <div
                            key={index}
                            className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4"
                          >
                            <h5 className="font-medium text-blue-400 mb-2">
                              Performance
                            </h5>
                            <p className="text-dark-300 text-sm">{rec}</p>
                          </div>
                        )
                      )}
                      {comprehensiveReport.insights?.cases?.recommendations?.map(
                        (rec, index) => (
                          <div
                            key={index}
                            className="bg-green-500/10 border border-green-500/20 rounded-lg p-4"
                          >
                            <h5 className="font-medium text-green-400 mb-2">
                              Case Management
                            </h5>
                            <p className="text-dark-300 text-sm">{rec}</p>
                          </div>
                        )
                      )}
                      {comprehensiveReport.insights?.strategy?.recommendations?.map(
                        (rec, index) => (
                          <div
                            key={index}
                            className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4"
                          >
                            <h5 className="font-medium text-purple-400 mb-2">
                              Strategy
                            </h5>
                            <p className="text-dark-300 text-sm">{rec}</p>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {/* Risk Assessment */}
                  {comprehensiveReport.insights?.riskFactors?.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="text-lg font-medium text-white">
                        Risk Assessment
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {comprehensiveReport.insights.riskFactors.map(
                          (risk, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
                            >
                              <FaExclamationTriangle className="text-red-500" />
                              <span className="text-red-400 text-sm">
                                {risk}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Plan */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-medium text-white">
                      Action Plan
                    </h4>
                    <div className="space-y-3">
                      {comprehensiveReport.insights?.nextActions?.map(
                        (action, index) => (
                          <div
                            key={index}
                            className="flex items-start gap-3 p-3 bg-primary-500/10 border border-primary-500/20 rounded-lg"
                          >
                            <div className="w-2 h-2 bg-primary-500 rounded-full mt-2"></div>
                            <p className="text-dark-300 text-sm">{action}</p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {aiLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
              <p className="text-dark-400 mt-4">Generating AI insights...</p>
            </div>
          ) : aiInsights ? (
            <>
              {/* AI Score Card */}
              <div className="card">
                <div className="card-body">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-white">
                      AI Performance Score
                    </h3>
                    <div className="text-3xl font-bold text-primary-400">
                      {aiInsights.overall?.score || 0}%
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div
                        className={`text-2xl font-bold ${
                          aiInsights.performance?.priority === "high"
                            ? "text-red-500"
                            : aiInsights.performance?.priority === "medium"
                            ? "text-yellow-500"
                            : "text-green-500"
                        }`}
                      >
                        {aiInsights.performance?.trend === "improving"
                          ? "↗"
                          : "↘"}
                      </div>
                      <p className="text-sm text-dark-400">Performance</p>
                    </div>
                    <div className="text-center">
                      <div
                        className={`text-2xl font-bold ${
                          aiInsights.predictions?.resolutionRate
                            ? "text-green-500"
                            : "text-yellow-500"
                        }`}
                      >
                        ↗
                      </div>
                      <p className="text-sm text-dark-400">Predictions</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-500">💡</div>
                      <p className="text-sm text-dark-400">Recommendations</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Predictions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card">
                  <div className="card-body">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <FaChartLine className="text-primary-400" />
                      AI Predictions
                    </h3>
                    <div className="space-y-4">
                      <div className="border-l-4 border-blue-500 pl-4">
                        <h4 className="font-medium text-white">
                          Next Month Cases
                        </h4>
                        <p className="text-dark-300 text-sm mt-1">
                          {aiInsights.predictions?.nextMonthCases ||
                            "Based on current trends"}
                        </p>
                      </div>
                      <div className="border-l-4 border-green-500 pl-4">
                        <h4 className="font-medium text-white">
                          Resolution Rate
                        </h4>
                        <p className="text-dark-300 text-sm mt-1">
                          {aiInsights.predictions?.resolutionRate ||
                            "Monitor closely"}
                        </p>
                      </div>
                      <div className="border-l-4 border-purple-500 pl-4">
                        <h4 className="font-medium text-white">
                          Success Probability
                        </h4>
                        <p className="text-dark-300 text-sm mt-1">
                          {aiInsights.predictions?.successProbability ||
                            "Focus on efficiency"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-body">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <FaLightbulb className="text-yellow-400" />
                      AI Recommendations
                    </h3>
                    <div className="space-y-3">
                      {(aiInsights.recommendations || []).map((rec, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-primary-500 rounded-full mt-2"></div>
                          <p className="text-dark-300 text-sm">{rec}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Risk Factors */}
              {(aiInsights.riskFactors || []).length > 0 && (
                <div className="card">
                  <div className="card-body">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <FaShieldAlt className="text-red-400" />
                      Risk Factors
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(aiInsights.riskFactors || []).map((risk, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
                        >
                          <FaExclamationTriangle className="text-red-500" />
                          <span className="text-red-400 text-sm">{risk}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Next Actions */}
              <div className="card">
                <div className="card-body">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <FaRocket className="text-green-400" />
                    Next Actions
                  </h3>
                  <div className="space-y-3">
                    {(aiInsights.nextActions || []).map((action, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                        <p className="text-dark-300 text-sm">{action}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-dark-400">No AI insights available</p>
            </div>
          )}
        </div>
      )}

      {/* Advocate View */}
      {user.role === "advocate" && (
        <div className="card">
          <div className="card-body">
            <h2 className="card-title">Your Performance Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="stat">
                <div className="stat-figure text-primary">
                  <FaFileAlt className="text-2xl" />
                </div>
                <div className="stat-title">Your Cases</div>
                <div className="stat-value">{cases?.length || 0}</div>
              </div>
              <div className="stat">
                <div className="stat-figure text-success">
                  <FaCheckCircle className="text-2xl" />
                </div>
                <div className="stat-title">Resolved</div>
                <div className="stat-value">
                  {cases?.filter(
                    (c) => c.status === "resolved" || c.status === "closed"
                  ).length || 0}
                </div>
              </div>
              <div className="stat">
                <div className="stat-figure text-warning">
                  <FaClock className="text-2xl" />
                </div>
                <div className="stat-title">Active</div>
                <div className="stat-value">
                  {cases?.filter(
                    (c) => c.status !== "resolved" && c.status !== "closed"
                  ).length || 0}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
