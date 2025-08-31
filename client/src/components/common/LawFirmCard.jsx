import React from "react";

const LawFirmCard = ({ lawFirm, onEdit, onDelete, onViewStats }) => {
  const getStatusBadge = (status) => {
    const statusConfig = {
      active: "badge-success",
      trial: "badge-warning",
      suspended: "badge-danger",
      cancelled: "badge-secondary",
    };
    return `badge ${statusConfig[status] || "badge-secondary"}`;
  };

  const getPlanBadge = (plan) => {
    const planConfig = {
      basic: "badge-info",
      premium: "badge-warning",
      enterprise: "badge-success",
    };
    return `badge ${planConfig[plan] || "badge-secondary"}`;
  };

  return (
    <div className="card bg-dark-800 hover:bg-dark-700 transition-colors">
      <div className="card-body">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white">
              {lawFirm.firmName}
            </h3>
            <p className="text-sm text-dark-300">{lawFirm.firmCode}</p>
          </div>
          <div className="flex space-x-2">
            {onViewStats && (
              <button
                onClick={() => onViewStats(lawFirm)}
                className="btn btn-sm btn-info"
                title="View Stats"
              >
                📊
              </button>
            )}
            {onEdit && (
              <button
                onClick={() => onEdit(lawFirm)}
                className="btn btn-sm btn-warning"
                title="Edit"
              >
                ✏️
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(lawFirm)}
                className="btn btn-sm btn-error"
                title="Delete"
              >
                🗑️
              </button>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <span className="text-dark-400">📧</span>
            <span className="text-dark-300 text-sm">{lawFirm.firmEmail}</span>
          </div>

          {lawFirm.firmPhone && (
            <div className="flex items-center space-x-2">
              <span className="text-dark-400">📞</span>
              <span className="text-dark-300 text-sm">{lawFirm.firmPhone}</span>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <span className="text-dark-400">📍</span>
            <span className="text-dark-300 text-sm">
              {lawFirm.address?.city}, {lawFirm.address?.state}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className={getPlanBadge(lawFirm.subscription?.plan)}>
              {lawFirm.subscription?.plan}
            </span>
            <span className={getStatusBadge(lawFirm.subscription?.status)}>
              {lawFirm.subscription?.status}
            </span>
          </div>

          <div className="text-xs text-dark-400">
            Created: {new Date(lawFirm.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LawFirmCard;
