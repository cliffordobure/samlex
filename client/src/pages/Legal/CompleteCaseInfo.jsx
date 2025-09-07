/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getLegalCase } from "../../store/slices/legalCaseSlice";
import legalCaseApi from "../../store/api/legalCaseApi";
import toast from "react-hot-toast";
import {
  FaArrowLeft,
  FaSave,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaBuilding,
  FaGavel,
  FaCalendar,
  FaMapMarkerAlt,
  FaFileAlt,
  FaExclamationTriangle,
  FaCheckCircle,
} from "react-icons/fa";

const CompleteCaseInfo = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentCase, isLoading, error } = useSelector(
    (state) => state.legalCases
  );
  const { user } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    client: {
      name: "",
      email: "",
      phone: "",
    },
    courtDetails: {
      courtName: "",
      courtLocation: "",
      judgeAssigned: "",
      courtDate: "",
      courtRoom: "",
    },
    opposingParty: {
      name: "",
      lawyer: "",
      contact: {
        email: "",
        phone: "",
      },
    },
    filingFee: {
      amount: "",
      currency: "KES",
      paid: false,
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch case details
  useEffect(() => {
    if (id) {
      dispatch(getLegalCase(id));
    }
  }, [dispatch, id]);

  // Update form data when case is loaded
  useEffect(() => {
    if (currentCase) {
      setFormData({
        client: {
          name:
            currentCase.client?.firstName && currentCase.client?.lastName
              ? `${currentCase.client.firstName} ${currentCase.client.lastName}`
              : "",
          email: currentCase.client?.email || "",
          phone: currentCase.client?.phoneNumber || "",
        },
        courtDetails: {
          courtName: currentCase.courtDetails?.courtName || "",
          courtLocation: currentCase.courtDetails?.courtLocation || "",
          judgeAssigned: currentCase.courtDetails?.judgeAssigned || "",
          courtDate: currentCase.courtDetails?.courtDate
            ? new Date(currentCase.courtDetails.courtDate)
                .toISOString()
                .split("T")[0]
            : "",
          courtRoom: currentCase.courtDetails?.courtRoom || "",
        },
        opposingParty: {
          name: currentCase.opposingParty?.name || "",
          lawyer: currentCase.opposingParty?.lawyer || "",
          contact: {
            email: currentCase.opposingParty?.contact?.email || "",
            phone: currentCase.opposingParty?.contact?.phone || "",
          },
        },
        filingFee: {
          amount: currentCase.filingFee?.amount || "",
          currency: currentCase.filingFee?.currency || "KES",
          paid: currentCase.filingFee?.paid || false,
        },
      });
    }
  }, [currentCase]);

  const handleInputChange = (section, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleNestedInputChange = (section, field, subField, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: {
          ...prev[section][field],
          [subField]: value,
        },
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Prepare data for submission
      const submitData = {};

      // Only include client if name and email are provided
      if (formData.client.name && formData.client.email) {
        submitData.client = {
          name: formData.client.name,
          email: formData.client.email,
          phone: formData.client.phone,
        };
      }

      // Only include court details if at least one field is filled
      const hasCourtDetails = Object.values(formData.courtDetails).some(
        (value) => value
      );
      if (hasCourtDetails) {
        submitData.courtDetails = formData.courtDetails;
      }

      // Only include opposing party if name is provided
      if (formData.opposingParty.name) {
        submitData.opposingParty = formData.opposingParty;
      }

      // Only include filing fee if amount is provided
      if (formData.filingFee.amount) {
        submitData.filingFee = {
          ...formData.filingFee,
          amount: parseFloat(formData.filingFee.amount),
        };
      }

      await legalCaseApi.completeCaseInfo(id, submitData);
      toast.success("Case information completed successfully");
      navigate(`/legal/cases/${id}`);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to complete case information"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="loading loading-spinner loading-lg"></div>
        <span className="ml-2">Loading case details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="alert alert-error">
          <FaExclamationTriangle />
          <span>Error: {error}</span>
        </div>
        <button
          onClick={() => navigate("/legal/cases")}
          className="btn btn-outline"
        >
          <FaArrowLeft />
          Back to Cases
        </button>
      </div>
    );
  }

  if (!currentCase) {
    return (
      <div className="space-y-6">
        <div className="alert alert-warning">
          <FaExclamationTriangle />
          <span>Case not found.</span>
        </div>
        <button
          onClick={() => navigate("/legal/cases")}
          className="btn btn-outline"
        >
          <FaArrowLeft />
          Back to Cases
        </button>
      </div>
    );
  }

  // Check if user has permission to update this case
  const canUpdateCase = 
    currentCase.assignedTo?._id === user._id || // Assigned advocate
    user.role === "legal_head" || // Legal head
    user.role === "law_firm_admin"; // Law firm admin

  if (!canUpdateCase) {
    return (
      <div className="space-y-6">
        <div className="alert alert-error">
          <FaExclamationTriangle />
          <span>
            You don't have permission to update this case information.
          </span>
        </div>
        <button
          onClick={() => navigate("/legal/cases")}
          className="btn btn-outline"
        >
          <FaArrowLeft />
          Back to Cases
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/legal/cases/${id}`)}
            className="btn btn-outline btn-sm"
          >
            <FaArrowLeft />
            Back to Case
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">
              Update Case Details
            </h1>
            <p className="text-dark-400 mt-2">
              Case: {currentCase.caseNumber} - {currentCase.title}
            </p>
          </div>
        </div>
      </div>

      {/* Escalation Info */}
      {currentCase.escalatedFrom && (
        <div className="alert alert-info">
          <FaExclamationTriangle />
          <div>
            <span className="font-bold">Escalated Case</span>
            <br />
            <span className="text-sm">
              This case was escalated from credit collection. Please complete
              the missing information below.
            </span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Client Information */}
        <div className="card">
          <div className="card-body">
            <h2 className="card-title">
              <FaUser />
              Client Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">
                  <span className="label-text">Client Name</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  placeholder="Enter client name"
                  value={formData.client.name}
                  onChange={(e) =>
                    handleInputChange("client", "name", e.target.value)
                  }
                />
              </div>
              <div>
                <label className="label">
                  <span className="label-text">Email</span>
                </label>
                <input
                  type="email"
                  className="input input-bordered w-full"
                  placeholder="Enter client email"
                  value={formData.client.email}
                  onChange={(e) =>
                    handleInputChange("client", "email", e.target.value)
                  }
                />
              </div>
              <div>
                <label className="label">
                  <span className="label-text">Phone Number</span>
                </label>
                <input
                  type="tel"
                  className="input input-bordered w-full"
                  placeholder="Enter phone number"
                  value={formData.client.phone}
                  onChange={(e) =>
                    handleInputChange("client", "phone", e.target.value)
                  }
                />
              </div>
            </div>
          </div>
        </div>

        {/* Court Details */}
        <div className="card">
          <div className="card-body">
            <h2 className="card-title">
              <FaGavel />
              Court Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">
                  <span className="label-text">Court Name</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  placeholder="Enter court name"
                  value={formData.courtDetails.courtName}
                  onChange={(e) =>
                    handleInputChange(
                      "courtDetails",
                      "courtName",
                      e.target.value
                    )
                  }
                />
              </div>
              <div>
                <label className="label">
                  <span className="label-text">Court Location</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  placeholder="Enter court location"
                  value={formData.courtDetails.courtLocation}
                  onChange={(e) =>
                    handleInputChange(
                      "courtDetails",
                      "courtLocation",
                      e.target.value
                    )
                  }
                />
              </div>
              <div>
                <label className="label">
                  <span className="label-text">Judge Assigned</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  placeholder="Enter judge name"
                  value={formData.courtDetails.judgeAssigned}
                  onChange={(e) =>
                    handleInputChange(
                      "courtDetails",
                      "judgeAssigned",
                      e.target.value
                    )
                  }
                />
              </div>
              <div>
                <label className="label">
                  <span className="label-text">Court Date</span>
                </label>
                <input
                  type="date"
                  className="input input-bordered w-full"
                  value={formData.courtDetails.courtDate}
                  onChange={(e) =>
                    handleInputChange(
                      "courtDetails",
                      "courtDate",
                      e.target.value
                    )
                  }
                />
              </div>
              <div>
                <label className="label">
                  <span className="label-text">Court Room</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  placeholder="Enter court room"
                  value={formData.courtDetails.courtRoom}
                  onChange={(e) =>
                    handleInputChange(
                      "courtDetails",
                      "courtRoom",
                      e.target.value
                    )
                  }
                />
              </div>
            </div>
          </div>
        </div>

        {/* Opposing Party */}
        <div className="card">
          <div className="card-body">
            <h2 className="card-title">
              <FaUser />
              Opposing Party
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">
                  <span className="label-text">Opposing Party Name</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  placeholder="Enter opposing party name"
                  value={formData.opposingParty.name}
                  onChange={(e) =>
                    handleInputChange("opposingParty", "name", e.target.value)
                  }
                />
              </div>
              <div>
                <label className="label">
                  <span className="label-text">Opposing Lawyer</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  placeholder="Enter opposing lawyer name"
                  value={formData.opposingParty.lawyer}
                  onChange={(e) =>
                    handleInputChange("opposingParty", "lawyer", e.target.value)
                  }
                />
              </div>
              <div>
                <label className="label">
                  <span className="label-text">Email</span>
                </label>
                <input
                  type="email"
                  className="input input-bordered w-full"
                  placeholder="Enter opposing party email"
                  value={formData.opposingParty.contact.email}
                  onChange={(e) =>
                    handleNestedInputChange(
                      "opposingParty",
                      "contact",
                      "email",
                      e.target.value
                    )
                  }
                />
              </div>
              <div>
                <label className="label">
                  <span className="label-text">Phone</span>
                </label>
                <input
                  type="tel"
                  className="input input-bordered w-full"
                  placeholder="Enter opposing party phone"
                  value={formData.opposingParty.contact.phone}
                  onChange={(e) =>
                    handleNestedInputChange(
                      "opposingParty",
                      "contact",
                      "phone",
                      e.target.value
                    )
                  }
                />
              </div>
            </div>
          </div>
        </div>

        {/* Filing Fee */}
        <div className="card">
          <div className="card-body">
            <h2 className="card-title">
              <FaFileAlt />
              Filing Fee
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="label">
                  <span className="label-text">Amount</span>
                </label>
                <input
                  type="number"
                  className="input input-bordered w-full"
                  placeholder="Enter amount"
                  value={formData.filingFee.amount}
                  onChange={(e) =>
                    handleInputChange("filingFee", "amount", e.target.value)
                  }
                />
              </div>
              <div>
                <label className="label">
                  <span className="label-text">Currency</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={formData.filingFee.currency}
                  onChange={(e) =>
                    handleInputChange("filingFee", "currency", e.target.value)
                  }
                >
                  <option value="KES">KES</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
              <div className="flex items-end">
                <label className="label cursor-pointer">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-primary mr-2"
                    checked={formData.filingFee.paid}
                    onChange={(e) =>
                      handleInputChange("filingFee", "paid", e.target.checked)
                    }
                  />
                  <span className="label-text">Paid</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate(`/legal/cases/${id}`)}
            className="btn btn-outline"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="loading loading-spinner loading-sm"></div>
            ) : (
              <FaSave />
            )}
            Update Case Details
          </button>
        </div>
      </form>
    </div>
  );
};

export default CompleteCaseInfo;
