/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getLegalCases } from "../../store/slices/legalCaseSlice";
import { getAccessibleDocumentUrl } from "../../utils/documentUrl.js";
import { getDocumentViewerUrl, isImage, canPreviewInBrowser } from "../../utils/documentViewer.js";
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
  FaUpload,
  FaPlus,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaFolderOpen,
  FaClock,
  FaFileArchive,
  FaFileCode,
  FaFileAudio,
  FaFileVideo,
} from "react-icons/fa";
import { getDocumentViewerUrl, isImage, canPreviewInBrowser } from "../../utils/documentViewer.js";

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
  const [sortBy, setSortBy] = useState("uploadedAt");
  const [sortOrder, setSortOrder] = useState("desc");

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
          case "archive":
            return ["zip", "rar", "7z"].includes(extension);
          case "code":
            return ["js", "ts", "jsx", "tsx", "html", "css", "json"].includes(extension);
          case "audio":
            return ["mp3", "wav", "ogg", "m4a"].includes(extension);
          case "video":
            return ["mp4", "avi", "mov", "mkv"].includes(extension);
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

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === "uploadedAt") {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else if (sortBy === "originalName") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredDocuments(filtered);
  }, [cases, filters, sortBy, sortOrder]);

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
      case "zip":
      case "rar":
      case "7z":
        return <FaFileArchive className="text-purple-500" />;
      case "js":
      case "ts":
      case "jsx":
      case "tsx":
      case "html":
      case "css":
      case "json":
        return <FaFileCode className="text-yellow-500" />;
      case "mp3":
      case "wav":
      case "ogg":
      case "m4a":
        return <FaFileAudio className="text-pink-500" />;
      case "mp4":
      case "avi":
      case "mov":
      case "mkv":
        return <FaFileVideo className="text-indigo-500" />;
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

  const handleDocumentClick = async (doc) => {
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
    
    // For S3 URLs, get signed URL
    if (documentUrl.includes('.s3.') || documentUrl.includes('s3.amazonaws.com')) {
      try {
        documentUrl = await getAccessibleDocumentUrl(documentUrl);
      } catch (error) {
        console.error("Error getting signed URL:", error);
        toast.error("Failed to load document");
        return;
      }
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

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) {
      return <FaSort className="w-4 h-4 text-slate-400" />;
    }
    return sortOrder === "asc" ? (
      <FaSortUp className="w-4 h-4 text-blue-400" />
    ) : (
      <FaSortDown className="w-4 h-4 text-blue-400" />
    );
  };

  const clearFilters = () => {
    setFilters({
      search: "",
      caseType: "",
      documentType: "",
      dateRange: "",
      uploadedBy: "",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 bg-gradient-to-br from-slate-900 via-blue-900/20 to-indigo-900/20">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-300 mt-4 text-lg">Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900/20 to-indigo-900/20 p-3 sm:p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 md:mb-8 gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            Legal Documents
          </h1>
          <p className="text-slate-300 text-lg">
            Manage and view all legal case documents and files
          </p>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 rounded-xl border border-slate-600/50">
            <FaFolderOpen className="w-5 h-5 text-blue-400" />
            <span className="text-slate-300 font-medium">
              {filteredDocuments.length} documents
            </span>
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded-xl transition-colors flex items-center gap-2"
          >
            <FaFilter className="w-4 h-4" />
            Filters
          </button>
          
          <button
            onClick={() => toast.success("Upload feature coming soon!")}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all duration-300 flex items-center gap-2"
          >
            <FaUpload className="w-4 h-4" />
            Upload
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-600/50 shadow-2xl mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search documents by name, case number, or title..."
                className="w-full pl-10 pr-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded-xl transition-colors border border-slate-600/50 focus:outline-none focus:border-blue-500/50"
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
              />
            </div>
          </div>

          {showFilters && (
            <div className="w-full mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <select
                className="px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded-xl transition-colors border border-slate-600/50 focus:outline-none focus:border-blue-500/50"
                value={filters.caseType}
                onChange={(e) =>
                  setFilters({ ...filters, caseType: e.target.value })
                }
              >
                <option value="">All Case Types</option>
                {getUniqueCaseTypes().map((type) => (
                  <option key={type} value={type} className="bg-slate-700 text-slate-300">
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>

              <select
                className="px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded-xl transition-colors border border-slate-600/50 focus:outline-none focus:border-blue-500/50"
                value={filters.documentType}
                onChange={(e) =>
                  setFilters({ ...filters, documentType: e.target.value })
                }
              >
                <option value="">All Document Types</option>
                <option value="pdf" className="bg-slate-700 text-slate-300">PDF Files</option>
                <option value="word" className="bg-slate-700 text-slate-300">Word Documents</option>
                <option value="image" className="bg-slate-700 text-slate-300">Images</option>
                <option value="archive" className="bg-slate-700 text-slate-300">Archives</option>
                <option value="code" className="bg-slate-700 text-slate-300">Code Files</option>
                <option value="audio" className="bg-slate-700 text-slate-300">Audio Files</option>
                <option value="video" className="bg-slate-700 text-slate-300">Video Files</option>
              </select>

              <select
                className="px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded-xl transition-colors border border-slate-600/50 focus:outline-none focus:border-blue-500/50"
                value={filters.dateRange}
                onChange={(e) =>
                  setFilters({ ...filters, dateRange: e.target.value })
                }
              >
                <option value="">All Time</option>
                <option value="1" className="bg-slate-700 text-slate-300">Last 24 hours</option>
                <option value="7" className="bg-slate-700 text-slate-300">Last 7 days</option>
                <option value="30" className="bg-slate-700 text-slate-300">Last 30 days</option>
                <option value="90" className="bg-slate-700 text-slate-300">Last 3 months</option>
              </select>

              {user.role === "legal_head" && (
                <select
                  className="px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded-xl transition-colors border border-slate-600/50 focus:outline-none focus:border-blue-500/50"
                  value={filters.uploadedBy}
                  onChange={(e) =>
                    setFilters({ ...filters, uploadedBy: e.target.value })
                  }
                >
                  <option value="">All Users</option>
                  {getUniqueUsers().map((user) => (
                    <option key={user._id} value={user._id} className="bg-slate-700 text-slate-300">
                      {user.firstName} {user.lastName}
                    </option>
                  ))}
                </select>
              )}

              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-slate-600/50 hover:bg-slate-500/50 text-slate-300 rounded-xl transition-colors flex items-center gap-2"
              >
                <FaTimes className="w-4 h-4" />
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Documents List */}
      <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-600/50 shadow-2xl">
        {filteredDocuments.length === 0 ? (
          <div className="text-center py-12">
            <FaFileAlt className="w-16 h-16 text-slate-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              No documents found
            </h3>
            <p className="text-slate-400 mb-4">
              {filters.search || Object.values(filters).some((f) => f)
                ? "Try adjusting your filters or search terms"
                : "No documents have been uploaded to cases yet."}
            </p>
            <button
              onClick={() => toast.success("Upload feature coming soon!")}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all duration-300 flex items-center gap-2 mx-auto"
            >
              <FaPlus className="w-4 h-4" />
              Upload First Document
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-600/50">
                  <th className="text-left py-4 px-4">
                    <button
                      onClick={() => handleSort("originalName")}
                      className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
                    >
                      Document
                      {getSortIcon("originalName")}
                    </button>
                  </th>
                  <th className="text-left py-4 px-4">
                    <button
                      onClick={() => handleSort("caseNumber")}
                      className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
                    >
                      Case
                      {getSortIcon("caseNumber")}
                    </button>
                  </th>
                  <th className="text-left py-4 px-4">
                    <button
                      onClick={() => handleSort("caseType")}
                      className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
                    >
                      Type
                      {getSortIcon("caseType")}
                    </button>
                  </th>
                  <th className="text-left py-4 px-4">
                    <button
                      onClick={() => handleSort("size")}
                      className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
                    >
                      Size
                      {getSortIcon("size")}
                    </button>
                  </th>
                  <th className="text-left py-4 px-4">
                    <button
                      onClick={() => handleSort("uploadedBy")}
                      className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
                    >
                      Uploaded By
                      {getSortIcon("uploadedBy")}
                    </button>
                  </th>
                  <th className="text-left py-4 px-4">
                    <button
                      onClick={() => handleSort("uploadedAt")}
                      className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
                    >
                      Date
                      {getSortIcon("uploadedAt")}
                    </button>
                  </th>
                  <th className="text-left py-4 px-4 text-slate-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.map((doc, index) => (
                  <tr key={index} className="border-b border-slate-600/30 hover:bg-slate-700/30 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-700/50 rounded-lg flex items-center justify-center">
                          {getDocumentIcon(doc.originalName)}
                        </div>
                        <div>
                          <div className="font-medium text-white">
                            {doc.originalName}
                          </div>
                          <div className="text-sm text-slate-400">
                            {doc.caseType}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        <div className="font-mono text-sm text-blue-400">
                          {doc.caseNumber}
                        </div>
                        <div className="text-sm text-slate-400 truncate max-w-xs">
                          {doc.caseTitle}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-700/50 text-slate-300 border border-slate-600/50">
                        {doc.originalName.split(".").pop().toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-slate-300">
                        {formatFileSize(doc.size || 0)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      {doc.uploadedBy ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-slate-700/50 rounded-full flex items-center justify-center">
                            <FaUser className="w-3 h-3 text-slate-400" />
                          </div>
                          <span className="text-slate-300">
                            {doc.uploadedBy.firstName} {doc.uploadedBy.lastName}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400">Unknown</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <FaClock className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-300">
                          {new Date(doc.uploadedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDocumentClick(doc)}
                          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                          title="View Document"
                        >
                          <FaEye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDocumentClick(doc)}
                          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                          title="Download Document"
                        >
                          <FaDownload className="w-4 h-4" />
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

      {/* Document Modal */}
      {showDocumentModal && selectedDocument && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/90 backdrop-blur-sm" 
            onClick={closeDocumentModal}
          ></div>
          
          {/* Modal Content */}
          <div className="relative z-10 bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl border border-slate-600/50 shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-slate-600/50 bg-slate-800/95">
              <h3 className="font-bold text-xl text-white truncate pr-4">{selectedDocument.filename}</h3>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={handleDownloadDocument}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors flex items-center gap-2 font-medium"
                >
                  <FaDownload className="w-4 h-4" />
                  Download
                </button>
                <button
                  onClick={closeDocumentModal}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-600/50 rounded-lg transition-colors"
                >
                  <FaTimes className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Document Viewer */}
            <div className="h-96 bg-slate-900">
              {canPreviewInBrowser(selectedDocument.filename) ? (
                isImage(selectedDocument.filename) ? (
                  // Image viewer
                  <div className="flex items-center justify-center h-full p-4">
                    <img
                      src={selectedDocument.url}
                      alt={selectedDocument.filename}
                      className="max-w-full max-h-full object-contain rounded-lg"
                    />
                  </div>
                ) : (
                  // PDF, Word, Excel, PowerPoint viewer
                  <iframe
                    src={getDocumentViewerUrl(selectedDocument.url, selectedDocument.filename)}
                    className="w-full h-full border-0"
                    title={selectedDocument.filename}
                    style={{ backgroundColor: '#0f172a' }}
                  />
                )
              ) : (
                // Unsupported file type
                <div className="h-full flex flex-col items-center justify-center p-8">
                  <FaFileAlt className="w-16 h-16 text-slate-500 mb-4" />
                  <p className="text-slate-300 mb-2">Preview not available</p>
                  <p className="text-slate-400 text-sm mb-4">Please download to view</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;
