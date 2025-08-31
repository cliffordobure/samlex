import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  getLegalCases,
  getPendingAssignmentCases,
  getLegalCaseStatistics,
} from "../../store/slices/legalCaseSlice";
import {
  FaGavel,
  FaBalanceScale,
  FaBuilding,
  FaHome,
  FaUsers,
  FaBriefcase,
  FaFileAlt,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaArrowRight,
  FaPlus,
  FaUserPlus,
  FaChartBar,
  FaCalendarAlt,
  FaMoneyBillWave,
} from "react-icons/fa";

const LegalOverview = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { cases } = useSelector((state) => state.legalCases);

  const [statistics, setStatistics] = useState({
    totalCases: 0,
    pendingAssignment: 0,
    activeCases: 0,
    resolvedCases: 0,
    escalatedCases: 0,
    totalFilingFees: 0,
  });

  const [pendingCases, setPendingCases] = useState([]);
  const [recentCases, setRecentCases] = useState([]);

  useEffect(() => {
    if (!user) return;

    // Load data based on user role
    if (user.role === "legal_head") {
      dispatch(getLegalCases({ lawFirm: user.lawFirm._id }));
      dispatch(getPendingAssignmentCases());
    } else if (user.role === "advocate") {
      dispatch(getLegalCases({ assignedTo: user._id }));
    }

    // Load statistics
    dispatch(getLegalCaseStatistics({ period: "30" }));
  }, [dispatch, user]);

  useEffect(() => {
    if (!cases) return;

    // Calculate statistics
    const stats = {
      totalCases: cases.length,
      pendingAssignment: cases.filter((c) => c.status === "pending_assignment")
        .length,
      activeCases: cases.filter((c) =>
        ["assigned", "under_review", "court_proceedings"].includes(c.status)
      ).length,
      resolvedCases: cases.filter((c) =>
        ["resolved", "closed"].includes(c.status)
      ).length,
      escalatedCases: cases.filter((c) => c.escalatedFrom?.creditCaseId).length,
      totalFilingFees: cases.reduce(
        (sum, c) => sum + (c.filingFee?.amount || 0),
        0
      ),
    };

    setStatistics(stats);

    // Get recent cases (last 5)
    setRecentCases(cases.slice(0, 5));

    // Get pending cases for legal head
    if (user.role === "legal_head") {
      setPendingCases(cases.filter((c) => c.status === "pending_assignment"));
    }
  }, [cases, user.role]);

  const getStatusColor = (status) => {
    const colors = {
      pending_assignment: "bg-yellow-100 text-yellow-800",
      filed: "bg-blue-100 text-blue-800",
      assigned: "bg-purple-100 text-purple-800",
      under_review: "bg-orange-100 text-orange-800",
      court_proceedings: "bg-red-100 text-red-800",
      settlement: "bg-green-100 text-green-800",
      resolved: "bg-emerald-100 text-emerald-800",
      closed: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
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

  const formatCurrency = (amount, currency = "KES") => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Legal Department Overview
          </h1>
          <p className="text-dark-400 mt-2">
            Welcome back, {user?.firstName}! Here's what's happening in your
            legal department.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/legal/cases/create"
            className="btn btn-primary flex items-center gap-2"
          >
            <FaPlus />
            Create Case
          </Link>
          {user.role === "legal_head" && (
            <Link
              to="/legal/escalated"
              className="btn btn-warning flex items-center gap-2"
            >
              <FaExclamationTriangle />
              Escalated Cases
            </Link>
          )}
          <Link
            to="/legal/cases"
            className="btn btn-outline flex items-center gap-2"
          >
            View All Cases
            <FaArrowRight />
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card bg-gradient-to-r from-blue-500 to-blue-600">
          <div className="card-body text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold">{statistics.totalCases}</h3>
                <p className="text-blue-100">Total Cases</p>
              </div>
              <FaGavel className="text-3xl opacity-80" />
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-r from-yellow-500 to-yellow-600">
          <div className="card-body text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold">
                  {statistics.pendingAssignment}
                </h3>
                <p className="text-yellow-100">Pending Assignment</p>
              </div>
              <FaClock className="text-3xl opacity-80" />
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-r from-green-500 to-green-600">
          <div className="card-body text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold">{statistics.activeCases}</h3>
                <p className="text-green-100">Active Cases</p>
              </div>
              <FaCheckCircle className="text-3xl opacity-80" />
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-r from-purple-500 to-purple-600">
          <div className="card-body text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold">
                  {formatCurrency(statistics.totalFilingFees)}
                </h3>
                <p className="text-purple-100">Total Filing Fees</p>
              </div>
              <FaMoneyBillWave className="text-3xl opacity-80" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Escalated Cases (Legal Head Only) */}
        {user.role === "legal_head" && statistics.escalatedCases > 0 && (
          <div className="card">
            <div className="card-body">
              <div className="flex justify-between items-center mb-4">
                <h2 className="card-title">Escalated Cases</h2>
                <Link to="/legal/escalated" className="btn btn-sm btn-warning">
                  View All
                </Link>
              </div>

              <div className="space-y-3">
                {cases
                  .filter((c) => c.escalatedFrom?.creditCaseId && !c.assignedTo)
                  .slice(0, 5)
                  .map((legalCase) => {
                    const CaseTypeIcon = getCaseTypeIcon(legalCase.caseType);
                    return (
                      <div
                        key={legalCase._id}
                        className="flex items-center justify-between p-3 bg-base-200 rounded border-l-4 border-orange-500"
                      >
                        <div className="flex items-center gap-3">
                          <CaseTypeIcon className="text-dark-400" />
                          <div>
                            <div className="font-medium">{legalCase.title}</div>
                            <div className="text-sm text-dark-400">
                              {legalCase.caseNumber} • {legalCase.caseType}
                            </div>
                            <div className="text-xs text-orange-500">
                              From:{" "}
                              {legalCase.escalatedFrom.creditCaseId.caseNumber}
                            </div>
                          </div>
                        </div>
                        <Link
                          to={`/legal/cases/${legalCase._id}`}
                          className="btn btn-sm btn-warning"
                        >
                          <FaUserPlus />
                          Assign
                        </Link>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* Pending Assignment Cases (Legal Head Only) */}
        {user.role === "legal_head" && pendingCases.length > 0 && (
          <div className="card">
            <div className="card-body">
              <div className="flex justify-between items-center mb-4">
                <h2 className="card-title">Cases Pending Assignment</h2>
                <Link to="/legal/cases" className="btn btn-sm btn-outline">
                  View All
                </Link>
              </div>

              <div className="space-y-3">
                {pendingCases.slice(0, 5).map((legalCase) => {
                  const CaseTypeIcon = getCaseTypeIcon(legalCase.caseType);
                  return (
                    <div
                      key={legalCase._id}
                      className="flex items-center justify-between p-3 bg-base-200 rounded"
                    >
                      <div className="flex items-center gap-3">
                        <CaseTypeIcon className="text-dark-400" />
                        <div>
                          <div className="font-medium">{legalCase.title}</div>
                          <div className="text-sm text-dark-400">
                            {legalCase.caseNumber} • {legalCase.caseType}
                          </div>
                        </div>
                      </div>
                      <Link
                        to={`/legal/cases/${legalCase._id}`}
                        className="btn btn-sm btn-primary"
                      >
                        <FaUserPlus />
                        Assign
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Recent Cases */}
        <div className="card">
          <div className="card-body">
            <div className="flex justify-between items-center mb-4">
              <h2 className="card-title">Recent Cases</h2>
              <Link to="/legal/cases" className="btn btn-sm btn-outline">
                View All
              </Link>
            </div>

            <div className="space-y-3">
              {recentCases.length === 0 ? (
                <div className="text-center py-8">
                  <FaFileAlt className="mx-auto text-4xl text-dark-400 mb-4" />
                  <p className="text-dark-400">No cases found</p>
                </div>
              ) : (
                recentCases.map((legalCase) => {
                  const CaseTypeIcon = getCaseTypeIcon(legalCase.caseType);
                  return (
                    <div
                      key={legalCase._id}
                      className="flex items-center justify-between p-3 bg-base-200 rounded"
                    >
                      <div className="flex items-center gap-3">
                        <CaseTypeIcon className="text-dark-400" />
                        <div>
                          <div className="font-medium">{legalCase.title}</div>
                          <div className="text-sm text-dark-400">
                            {legalCase.caseNumber} • {legalCase.caseType}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span
                              className={`badge badge-sm ${getStatusColor(
                                legalCase.status
                              )}`}
                            >
                              {legalCase.status.replace("_", " ")}
                            </span>
                            {legalCase.escalatedFrom?.creditCaseId && (
                              <span className="badge badge-sm badge-warning">
                                Escalated
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Link
                        to={`/legal/cases/${legalCase._id}`}
                        className="btn btn-sm btn-outline"
                      >
                        View
                      </Link>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Case Type Distribution */}
      <div className="card">
        <div className="card-body">
          <h2 className="card-title mb-4">Case Type Distribution</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {[
              { type: "civil", icon: FaBalanceScale, color: "bg-blue-500" },
              { type: "criminal", icon: FaGavel, color: "bg-red-500" },
              { type: "corporate", icon: FaBuilding, color: "bg-green-500" },
              { type: "family", icon: FaUsers, color: "bg-purple-500" },
              { type: "property", icon: FaHome, color: "bg-yellow-500" },
              { type: "labor", icon: FaBriefcase, color: "bg-orange-500" },
              {
                type: "debt_collection",
                icon: FaFileAlt,
                color: "bg-indigo-500",
              },
              { type: "other", icon: FaFileAlt, color: "bg-gray-500" },
            ].map(({ type, icon, color }) => {
              const count =
                cases?.filter((c) => c.caseType === type).length || 0;
              const IconComponent = icon;
              return (
                <div key={type} className="text-center">
                  <div
                    className={`w-12 h-12 ${color} rounded-full flex items-center justify-center mx-auto mb-2`}
                  >
                    <IconComponent className="text-white text-xl" />
                  </div>
                  <div className="text-lg font-bold">{count}</div>
                  <div className="text-sm text-dark-400 capitalize">
                    {type.replace("_", " ")}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-body">
          <h2 className="card-title mb-4">Quick Actions</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/legal/cases/create"
              className="btn btn-primary btn-lg flex items-center gap-3"
            >
              <FaPlus />
              <div className="text-left">
                <div className="font-bold">Create New Case</div>
                <div className="text-sm opacity-80">Start a new legal case</div>
              </div>
            </Link>

            <Link
              to="/legal/cases"
              className="btn btn-outline btn-lg flex items-center gap-3"
            >
              <FaChartBar />
              <div className="text-left">
                <div className="font-bold">View All Cases</div>
                <div className="text-sm opacity-80">Manage existing cases</div>
              </div>
            </Link>

            {user.role === "legal_head" && (
              <>
                <Link
                  to="/legal/cases"
                  className="btn btn-outline btn-lg flex items-center gap-3"
                >
                  <FaUserPlus />
                  <div className="text-left">
                    <div className="font-bold">Assign Cases</div>
                    <div className="text-sm opacity-80">
                      Assign cases to advocates
                    </div>
                  </div>
                </Link>
                <Link
                  to="/legal/escalated"
                  className="btn btn-warning btn-lg flex items-center gap-3"
                >
                  <FaExclamationTriangle />
                  <div className="text-left">
                    <div className="font-bold">Escalated Cases</div>
                    <div className="text-sm opacity-80">
                      Review escalated cases
                    </div>
                  </div>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalOverview;
