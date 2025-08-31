import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { forgotPassword } from "../store/slices/authSlice";

const ForgotPassword = () => {
  const dispatch = useDispatch();
  const [email, setEmail] = useState("");
  const { forgotPasswordLoading, forgotPasswordSuccess, forgotPasswordError } =
    useSelector((state) => state.auth);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(forgotPassword(email));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-900">
      <div className="bg-dark-800 p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-white">Forgot Password</h2>
        {forgotPasswordSuccess ? (
          <div className="text-green-400 mb-4">
            If an account with that email exists, a password reset link has been
            sent.
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label className="block mb-2 text-white">Email Address</label>
            <input
              type="email"
              className="input-field mb-4"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {forgotPasswordError && (
              <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
                {Array.isArray(forgotPasswordError) ? (
                  <ul className="list-disc pl-5">
                    {forgotPasswordError.map((err, idx) => (
                      <li key={idx}>{err.msg || err}</li>
                    ))}
                  </ul>
                ) : (
                  forgotPasswordError
                )}
              </div>
            )}
            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={forgotPasswordLoading}
            >
              {forgotPasswordLoading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
