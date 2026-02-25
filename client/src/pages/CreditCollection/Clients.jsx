import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { fetchClients } from "../../store/slices/clientSlice";
import { 
  FaUsers, 
  FaSearch, 
  FaUser, 
  FaPhone, 
  FaEnvelope, 
  FaBuilding,
  FaSpinner,
  FaArrowRight,
  FaEye,
  FaFileAlt
} from "react-icons/fa";

const Clients = () => {
  const dispatch = useDispatch();
  const { clients, loading, pagination } = useSelector((state) => state.clients);
  const { user } = useSelector((state) => state.auth);

  const [searchQuery, setSearchQuery] = useState("");
  const [filteredClients, setFilteredClients] = useState([]);

  useEffect(() => {
    dispatch(fetchClients({ limit: 100, status: "active" }));
  }, [dispatch]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredClients(clients);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = clients.filter(
        (client) =>
          client.firstName?.toLowerCase().includes(query) ||
          client.lastName?.toLowerCase().includes(query) ||
          client.email?.toLowerCase().includes(query) ||
          client.phoneNumber?.includes(query) ||
          `${client.firstName} ${client.lastName}`.toLowerCase().includes(query)
      );
      setFilteredClients(filtered);
    }
  }, [searchQuery, clients]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-indigo-900/20 flex justify-center items-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mb-4">
            <FaSpinner className="w-8 h-8 text-white animate-spin" />
          </div>
          <p className="text-xs font-semibold text-white">Loading Clients...</p>
          <p className="text-xs text-slate-400 mt-2">Please wait while we fetch your data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-indigo-900/20 p-4 sm:p-6 space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/50 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl">
              <FaUsers className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-xs font-bold text-white">Clients</h1>
              <p className="text-xs text-slate-300 mt-2">
                Manage and view all your clients
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/50 shadow-2xl">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <FaSearch className="w-4 h-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search clients by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200"
          />
        </div>
      </div>

      {/* Clients List */}
      <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 shadow-2xl">
        <div className="p-6">
          {filteredClients.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredClients.map((client) => (
                <Link
                  key={client._id}
                  to={`/credit-collection/clients/${client._id}`}
                  className="block p-6 bg-slate-700/50 rounded-xl border border-slate-600/50 hover:bg-slate-700/70 hover:border-blue-500/50 transition-all duration-200 group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-full flex items-center justify-center group-hover:bg-blue-500/30 transition-all duration-200">
                        {client.clientType === "corporate" ? (
                          <FaBuilding className="w-6 h-6 text-blue-400" />
                        ) : (
                          <FaUser className="w-6 h-6 text-blue-400" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-white text-xs group-hover:text-blue-400 transition-colors">
                          {client.clientType === "corporate" && client.companyName
                            ? client.companyName
                            : `${client.firstName} ${client.lastName}`}
                        </h3>
                        {client.clientType === "corporate" && (
                          <p className="text-xs text-slate-400">
                            {client.firstName} {client.lastName}
                          </p>
                        )}
                      </div>
                    </div>
                    <FaArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-400 transition-colors" />
                  </div>

                  <div className="space-y-2">
                    {client.phoneNumber && (
                      <div className="flex items-center space-x-2 text-xs text-slate-300">
                        <FaPhone className="w-3 h-3 text-slate-400" />
                        <span>{client.phoneNumber}</span>
                      </div>
                    )}
                    {client.email && (
                      <div className="flex items-center space-x-2 text-xs text-slate-300">
                        <FaEnvelope className="w-3 h-3 text-slate-400" />
                        <span className="truncate">{client.email}</span>
                      </div>
                    )}
                    {client.address && (
                      <div className="flex items-center space-x-2 text-xs text-slate-300">
                        <FaBuilding className="w-3 h-3 text-slate-400" />
                        <span className="truncate">
                          {client.address.city || client.address.street || "No address"}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-600/50 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FaFileAlt className="w-3 h-3 text-slate-400" />
                      <span className="text-xs text-slate-400">
                        {client.totalCases || 0} {client.totalCases === 1 ? "case" : "cases"}
                      </span>
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        client.status === "active"
                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                          : client.status === "inactive"
                          ? "bg-slate-500/20 text-slate-400 border border-slate-500/30"
                          : "bg-red-500/20 text-red-400 border border-red-500/30"
                      }`}
                    >
                      {client.status?.toUpperCase()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto bg-slate-700/50 rounded-full flex items-center justify-center mb-4">
                <FaUsers className="w-8 h-8 text-slate-500" />
              </div>
              <h3 className="text-xs font-medium text-slate-300 mb-2">
                {searchQuery ? "No clients found" : "No clients yet"}
              </h3>
              <p className="text-xs text-slate-400">
                {searchQuery
                  ? "Try adjusting your search criteria"
                  : "Clients will appear here once they are added to the system"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Clients;
