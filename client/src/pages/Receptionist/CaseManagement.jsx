import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getCreditCases } from "../../store/slices/creditCaseSlice";
import { getLegalCases } from "../../store/slices/legalCaseSlice";
import {
  FaSearch,
  FaFilter,
  FaFolderOpen,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
} from "react-icons/fa";

const CaseManagement = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { cases: creditCases } = useSelector((state) => state.creditCases);
  const { cases: legalCases } = useSelector((state) => state.legalCases);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.lawFirm?._id) {
      setIsLoading(true);
      Promise.all([
        dispatch(getCreditCases({ lawFirm: user.lawFirm._id, limit: 100 })),
        dispatch(getLegalCases({ lawFirm: user.lawFirm._id, limit: 100 })),
      ]).finally(() => setIsLoading(false));
    }
  }, [dispatch, user?.lawFirm?._id]);

  const allCases = [...creditCases, ...legalCases];
  
  const filteredCases = allCases.filter((caseItem) => {
    const matchesSearch = 
      !searchQuery ||
      caseItem.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      caseItem.caseNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      caseItem.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = !filterStatus || caseItem.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    const colors = {
      new: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      assigned: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      in_progress: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      under_review: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      resolved: "bg-green-500/20 text-green-400 border-green-500/30",
      closed: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    };
    return colors[status] || "bg-slate-500/20 text-slate-400 border-slate-500/30";
  };

  const getStatusIcon = (status) => {
    if (["resolved", "closed"].includes(status)) return <FaCheckCircle className="w-4 h-4" />;
    if (["new", "pending_assignment"].includes(status)) return <FaClock className="w-4 h-4" />;
    return <FaExclamationTriangle className="w-4 h-4" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Case Management</h1>
          <p className="text-slate-400">View and search all cases (Read-only access)</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 shadow-2xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search cases..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500/50"
            />
          </div>
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50"
            >
              <option value="">All Status</option>
              <option value="new">New</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Cases List */}
      <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 shadow-2xl p-6">
        <div className="space-y-4">
          {filteredCases.length > 0 ? (
            filteredCases.map((caseItem) => (
              <div
                key={caseItem._id}
                className="block p-4 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-all duration-200 border border-slate-600/50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <FaFolderOpen className="text-blue-400 w-5 h-5" />
                      <h3 className="text-white font-semibold">
                        {caseItem.title || caseItem.caseNumber || "Untitled Case"}
                      </h3>
                    </div>
                    {caseItem.caseNumber && (
                      <p className="text-slate-400 text-sm mb-2">Case #: {caseItem.caseNumber}</p>
                    )}
                    {caseItem.description && (
                      <p className="text-slate-300 text-sm line-clamp-2">{caseItem.description}</p>
                    )}
                  </div>
                  <div className="ml-4">
                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(caseItem.status)}`}>
                      {getStatusIcon(caseItem.status)}
                      {caseItem.status?.replace("_", " ").toUpperCase() || "UNKNOWN"}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-slate-400">
              <FaFolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No cases found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CaseManagement;

