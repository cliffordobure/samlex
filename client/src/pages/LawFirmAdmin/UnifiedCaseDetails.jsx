import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getCreditCaseById } from "../../store/slices/creditCaseSlice";
import { getLegalCase } from "../../store/slices/legalCaseSlice";
import Loading from "../../components/common/Loading";

const UnifiedCaseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { cases: creditCases } = useSelector((state) => state.creditCases);
  const { cases: legalCases } = useSelector((state) => state.legalCases);
  const [caseType, setCaseType] = useState(null);

  useEffect(() => {
    const determineCaseType = async () => {
      console.log("🔍 Determining case type for ID:", id);

      // First, check if the case exists in credit cases
      const creditCase = creditCases?.find((c) => c._id === id);
      if (creditCase) {
        console.log("✅ Found credit case:", creditCase.caseNumber);
        setCaseType("credit");
        navigate(`/admin/credit-case/${id}`, { replace: true });
        return;
      }

      // Then, check if the case exists in legal cases
      const legalCase = legalCases?.find((c) => c._id === id);
      if (legalCase) {
        console.log("✅ Found legal case:", legalCase.caseNumber);
        setCaseType("legal");
        navigate(`/admin/legal-case/${id}`, { replace: true });
        return;
      }

      // If not found in either, try to fetch both to see which one exists
      console.log("🔍 Case not found in loaded cases, fetching...");

      try {
        // Try to fetch as credit case first
        await dispatch(getCreditCaseById(id));
        setCaseType("credit");
        navigate(`/admin/credit-case/${id}`, { replace: true });
      } catch {
        console.log("❌ Not a credit case, trying legal case...");
        try {
          // Try to fetch as legal case
          await dispatch(getLegalCase(id));
          setCaseType("legal");
          navigate(`/admin/legal-case/${id}`, { replace: true });
        } catch {
          console.log("❌ Case not found in either system");
          setCaseType("not_found");
        }
      }
    };

    determineCaseType();
  }, [id, creditCases, legalCases, dispatch, navigate]);

  if (caseType === "not_found") {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Case Not Found</h2>
          <p className="text-dark-400 mb-4">
            The case with ID "{id}" could not be found in either the credit
            collection or legal systems.
          </p>
          <p className="text-dark-400 mb-4 text-sm">This could mean:</p>
          <ul className="text-dark-400 mb-6 text-sm text-left max-w-md mx-auto">
            <li>• The case ID is incorrect</li>
            <li>• The case belongs to a different law firm</li>
            <li>• The case has been deleted</li>
            <li>• There's a data synchronization issue</li>
          </ul>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => navigate("/admin/cases")}
              className="btn btn-primary"
            >
              Back to Case Management
            </button>
            <button
              onClick={() => window.location.reload()}
              className="btn btn-outline"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <Loading />;
};

export default UnifiedCaseDetails;
