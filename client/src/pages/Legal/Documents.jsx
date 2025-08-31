/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getLegalCases } from "../../store/slices/legalCaseSlice";
import {
  FaFileAlt,
  FaDownload,
  FaEye,
  FaSearch,
  FaFilter,
  FaCalendar,
  FaUser,
  FaFolder,
  FaFilePdf,
  FaFileWord,
  FaFileImage,
  FaFile,
  FaTimes,
} from "react-icons/fa";
import toast from "react-hot-toast";

const Documents = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { cases, isLoading } = useSelector((state) => state.legalCases);

  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    caseType: "",
    documentType: "",
    dateRange: "",
    uploadedBy: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);

  const API_BASE =
    import.meta.env.VITE_API_URL || "https://lawfirm-saas.onrender.com/api";
  const FILE_BASE = API_BASE.replace(/\/api$/, "");

  useEffect(() => {
    if (!user) return;

    // Load cases based on user role
    if (user.role === "legal_head") {
      dispatch(getLegalCases({ lawFirm: user.lawFirm._id }));
    } else if (user.role === "advocate") {
      dispatch(getLegalCases({ assignedTo: user._id }));
    }
  }, [dispatch, user]);

  useEffect(() => {
    if (!cases || !Array.isArray(cases)) return;

    // Extract all documents from cases
    let allDocuments = [];
    cases.forEach((legalCase) => {
      if (legalCase.documents && Array.isArray(legalCase.documents)) {
        legalCase.documents.forEach((doc) => {
          allDocuments.push({
            ...doc,
            caseNumber: legalCase.caseNumber,
            caseTitle: legalCase.title,
            caseType: legalCase.caseType,
            caseId: legalCase._id,
            uploadedBy: doc.uploadedBy || legalCase.createdBy,
            uploadedAt: doc.uploadedAt || legalCase.createdAt,
          });
        });
      }
    });

    // Apply filters
    let filtered = allDocuments;

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(
        (doc) =>
          doc.originalName.toLowerCase().includes(searchTerm) ||
          doc.caseNumber.toLowerCase().includes(searchTerm) ||
          doc.caseTitle.toLowerCase().includes(searchTerm)
      );
    }

    if (filters.caseType) {
      filtered = filtered.filter((doc) => doc.caseType === filters.caseType);
    }

    if (filters.documentType) {
      filtered = filtered.filter((doc) => {
        const extension = doc.originalName.split(".").pop().toLowerCase();
        switch (filters.documentType) {
          case "pdf":
            return extension === "pdf";
          case "word":
            return ["doc", "docx"].includes(extension);
          case "image":
            return ["jpg", "jpeg", "png", "gif"].includes(extension);
          default:
            return true;
        }
      });
    }

    if (filters.dateRange) {
      const now = new Date();
      const daysAgo = parseInt(filters.dateRange);
      const cutoffDate = new Date(
        now.getTime() - daysAgo * 24 * 60 * 60 * 1000
      );
      filtered = filtered.filter(
        (doc) => new Date(doc.uploadedAt) >= cutoffDate
      );
    }

    if (filters.uploadedBy) {
      filtered = filtered.filter(
        (doc) => doc.uploadedBy?._id === filters.uploadedBy
      );
    }

    setFilteredDocuments(filtered);
  }, [cases, filters]);

  const getDocumentIcon = (filename) => {
    const extension = filename.split(".").pop().toLowerCase();
    switch (extension) {
      case "pdf":
        return <FaFilePdf className="text-red-500" />;
      case "doc":
      case "docx":
        return <FaFileWord className="text-blue-500" />;
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
        return <FaFileImage className="text-green-500" />;
      default:
        return <FaFile className="text-gray-500" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleDocumentClick = (doc) => {
    let documentUrl = doc.path;
    if (doc.path.startsWith("http")) {
      documentUrl = doc.path;
    } else if (doc.path.startsWith("/uploads/")) {
      documentUrl = `${FILE_BASE}${doc.path}`;
    } else if (doc.path.startsWith("uploads/")) {
      documentUrl = `${FILE_BASE}/${doc.path}`;
    } else {
      documentUrl = `${FILE_BASE}/uploads/general/${doc.path}`;
    }
    setSelectedDocument({ url: documentUrl, filename: doc.originalName });
    setShowDocumentModal(true);
  };

  const handleDownloadDocument = () => {
    if (selectedDocument) {
      const link = document.createElement("a");
      link.href = selectedDocument.url;
      link.download = selectedDocument.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const closeDocumentModal = () => {
    setShowDocumentModal(false);
    setSelectedDocument(null);
  };

  const getUniqueCaseTypes = () => {
    if (!cases) return [];
    return [...new Set(cases.map((c) => c.caseType))];
  };

  const getUniqueUsers = () => {
    if (!cases) return [];
    const users = new Map();
    cases.forEach((c) => {
      if (c.createdBy) {
        users.set(c.createdBy._id, c.createdBy);
      }
    });
    return Array.from(users.values());
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="loading loading-spinner loading-lg"></div>
        <span className="ml-2">Loading documents...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Documents</h1>
          <p className="text-dark-400 mt-2">
            Manage and view all legal case documents.
          </p>
        </div>
        <div className="flex gap-2">
          <span className="badge badge-primary">
            {filteredDocuments.length} documents
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dark-400" />
                <input
                  type="text"
                  placeholder="Search documents..."
                  className="input input-bordered w-full pl-10"
                  value={filters.search}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value })
                  }
                />
              </div>
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn btn-outline flex items-center gap-2"
            >
              <FaFilter />
              Filters
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <select
                className="select select-bordered w-full"
                value={filters.caseType}
                onChange={(e) =>
                  setFilters({ ...filters, caseType: e.target.value })
                }
              >
                <option value="">All Case Types</option>
                {getUniqueCaseTypes().map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>

              <select
                className="select select-bordered w-full"
                value={filters.documentType}
                onChange={(e) =>
                  setFilters({ ...filters, documentType: e.target.value })
                }
              >
                <option value="">All Document Types</option>
                <option value="pdf">PDF Files</option>
                <option value="word">Word Documents</option>
                <option value="image">Images</option>
              </select>

              <select
                className="select select-bordered w-full"
                value={filters.dateRange}
                onChange={(e) =>
                  setFilters({ ...filters, dateRange: e.target.value })
                }
              >
                <option value="">All Time</option>
                <option value="1">Last 24 hours</option>
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 3 months</option>
              </select>

              {user.role === "legal_head" && (
                <select
                  className="select select-bordered w-full"
                  value={filters.uploadedBy}
                  onChange={(e) =>
                    setFilters({ ...filters, uploadedBy: e.target.value })
                  }
                >
                  <option value="">All Users</option>
                  {getUniqueUsers().map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.firstName} {user.lastName}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Documents List */}
      <div className="card">
        <div className="card-body">
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-8">
              <FaFileAlt className="mx-auto text-4xl text-dark-400 mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                No documents found
              </h3>
              <p className="text-dark-400">
                {filters.search || Object.values(filters).some((f) => f)
                  ? "Try adjusting your filters"
                  : "No documents have been uploaded yet."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>Document</th>
                    <th>Case</th>
                    <th>Type</th>
                    <th>Size</th>
                    <th>Uploaded By</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDocuments.map((doc, index) => (
                    <tr key={index}>
                      <td>
                        <div className="flex items-center gap-3">
                          {getDocumentIcon(doc.originalName)}
                          <div>
                            <div className="font-medium">
                              {doc.originalName}
                            </div>
                            <div className="text-sm text-dark-400">
                              {doc.caseType}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div>
                          <div className="font-mono text-sm">
                            {doc.caseNumber}
                          </div>
                          <div className="text-sm text-dark-400 truncate max-w-xs">
                            {doc.caseTitle}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-outline">
                          {doc.originalName.split(".").pop().toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <span className="text-sm">
                          {formatFileSize(doc.size || 0)}
                        </span>
                      </td>
                      <td>
                        {doc.uploadedBy ? (
                          <div className="flex items-center gap-2">
                            <FaUser className="text-dark-400" />
                            <span>
                              {doc.uploadedBy.firstName}{" "}
                              {doc.uploadedBy.lastName}
                            </span>
                          </div>
                        ) : (
                          <span className="text-dark-400">Unknown</span>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <FaCalendar className="text-dark-400" />
                          <span className="text-sm">
                            {new Date(doc.uploadedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDocumentClick(doc)}
                            className="btn btn-sm btn-outline"
                            title="View Document"
                          >
                            <FaEye />
                          </button>
                          <button
                            onClick={() => handleDocumentClick(doc)}
                            className="btn btn-sm btn-outline"
                            title="Download Document"
                          >
                            <FaDownload />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Document Modal */}
      {showDocumentModal && selectedDocument && (
        <div className="modal modal-open">
          <div className="modal-box max-w-4xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">{selectedDocument.filename}</h3>
              <div className="flex gap-2">
                <button
                  onClick={handleDownloadDocument}
                  className="btn btn-sm btn-outline"
                >
                  <FaDownload />
                  Download
                </button>
                <button
                  onClick={closeDocumentModal}
                  className="btn btn-sm btn-outline"
                >
                  <FaTimes />
                </button>
              </div>
            </div>
            <div className="h-96">
              <iframe
                src={selectedDocument.url}
                className="w-full h-full border rounded"
                title={selectedDocument.filename}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;
