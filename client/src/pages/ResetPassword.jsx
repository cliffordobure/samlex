import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, Link } from "react-router-dom";
import { resetPassword } from "../store/slices/authSlice";

const ResetPassword = () => {
  const dispatch = useDispatch();
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const { resetPasswordLoading, resetPasswordSuccess, resetPasswordError } =
    useSelector((state) => state.auth);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(resetPassword({ token, password }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-900">
      <div className="bg-dark-800 p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-white">Reset Password</h2>
        {resetPasswordSuccess ? (
          <div className="text-green-400 mb-4">
            Your password has been reset successfully.{" "}
            <Link to="/login" className="text-primary-400 underline">
              Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label className="block mb-2 text-white">New Password</label>
            <input
              type="password"
              className="input-field mb-4"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
            {resetPasswordError && (
              <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
                {Array.isArray(resetPasswordError) ? (
                  <ul className="list-disc pl-5">
                    {resetPasswordError.map((err, idx) => (
                      <li key={idx}>{err.msg || err}</li>
                    ))}
                  </ul>
                ) : (
                  resetPasswordError
                )}
              </div>
            )}
            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={resetPasswordLoading}
            >
              {resetPasswordLoading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
