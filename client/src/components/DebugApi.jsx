import React, { useState } from "react";
import axios from "axios";

const DebugApi = () => {
  const [apiResult, setApiResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const testApiCall = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const API_BASE =
        import.meta.env.VITE_API_URL || "/api";

      console.log("🔍 Debug API Call:");
      console.log("API_BASE:", API_BASE);
      console.log("Token:", token ? "Present" : "Missing");

      const response = await axios.get(`${API_BASE}/credit-cases`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("✅ API Response:", response.data);
      setApiResult(response.data);
    } catch (err) {
      console.error("❌ API Error:", err);
      setError({
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-gray-800 rounded-lg m-4">
      <h3 className="text-white text-lg font-bold mb-4">🔍 API Debug Tool</h3>

      <button
        onClick={testApiCall}
        disabled={loading}
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? "Testing..." : "Test Credit Cases API"}
      </button>

      {error && (
        <div className="mt-4 p-3 bg-red-900 text-red-100 rounded">
          <h4 className="font-bold">❌ Error:</h4>
          <p>Message: {error.message}</p>
          <p>Status: {error.status}</p>
          <pre className="text-xs mt-2">
            {JSON.stringify(error.data, null, 2)}
          </pre>
        </div>
      )}

      {apiResult && (
        <div className="mt-4 p-3 bg-green-900 text-green-100 rounded">
          <h4 className="font-bold">✅ Success:</h4>
          <p>Cases found: {apiResult.data?.length || 0}</p>
          <pre className="text-xs mt-2">
            {JSON.stringify(apiResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default DebugApi;
