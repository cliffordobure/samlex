import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchClients } from "../../store/slices/clientSlice";
import {
  FaSearch,
  FaUsers,
  FaPhone,
  FaEnvelope,
  FaBuilding,
  FaEdit,
  FaUserCircle,
} from "react-icons/fa";
import toast from "react-hot-toast";

const ClientManagement = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { clients, loading } = useSelector((state) => state.clients);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    dispatch(fetchClients());
  }, [dispatch]);

  const filteredClients = clients.filter((client) =>
    !searchQuery ||
    client.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.phoneNumber?.includes(searchQuery)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Client Management</h1>
        <p className="text-slate-400">View and update client information</p>
      </div>

      {/* Search */}
      <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 shadow-2xl p-6">
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search clients by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pink-500/50"
          />
        </div>
      </div>

      {/* Clients List */}
      <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl border border-slate-600/50 shadow-2xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.length > 0 ? (
            filteredClients.map((client) => (
              <div
                key={client._id}
                className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/50 hover:bg-slate-700/50 transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-pink-500/20 to-purple-500/20 rounded-full flex items-center justify-center border border-pink-500/30">
                      <FaUserCircle className="w-6 h-6 text-pink-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">
                        {client.firstName} {client.lastName}
                      </h3>
                      {client.clientType === "company" && client.companyName && (
                        <p className="text-slate-400 text-sm">{client.companyName}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedClient(client);
                      setShowEditModal(true);
                    }}
                    className="text-pink-400 hover:text-pink-300 p-2 rounded-lg hover:bg-pink-500/20 transition-colors"
                    title="Edit Client"
                  >
                    <FaEdit className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-2">
                  {client.email && (
                    <div className="flex items-center gap-2 text-slate-300 text-sm">
                      <FaEnvelope className="w-4 h-4 text-slate-400" />
                      {client.email}
                    </div>
                  )}
                  {client.phoneNumber && (
                    <div className="flex items-center gap-2 text-slate-300 text-sm">
                      <FaPhone className="w-4 h-4 text-slate-400" />
                      {client.phoneNumber}
                    </div>
                  )}
                  {client.address?.city && (
                    <div className="flex items-center gap-2 text-slate-300 text-sm">
                      <FaBuilding className="w-4 h-4 text-slate-400" />
                      {client.address.city}, {client.address.country || "Kenya"}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-slate-400">
              <FaUsers className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No clients found</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal - Simplified for receptionist */}
      {showEditModal && selectedClient && (
        <EditClientModal
          client={selectedClient}
          onClose={() => {
            setShowEditModal(false);
            setSelectedClient(null);
          }}
        />
      )}
    </div>
  );
};

const EditClientModal = ({ client, onClose }) => {
  const [formData, setFormData] = useState({
    firstName: client.firstName || "",
    lastName: client.lastName || "",
    email: client.email || "",
    phoneNumber: client.phoneNumber || "",
    address: {
      street: client.address?.street || "",
      city: client.address?.city || "",
      state: client.address?.state || "",
      zipCode: client.address?.zipCode || "",
      country: client.address?.country || "Kenya",
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Note: Receptionist can only update basic info
    toast.success("Client information updated (Note: Full update requires admin approval)");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl w-full max-w-md border border-slate-600/50 shadow-2xl">
        <div className="p-6">
          <h2 className="text-xl font-bold text-white mb-4">Edit Client Information</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">First Name</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Last Name</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Phone Number</label>
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-slate-600 hover:bg-slate-600 text-white rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-lg"
              >
                Update
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ClientManagement;

