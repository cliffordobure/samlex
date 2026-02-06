/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import {
  FaMoneyBillWave,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaEdit,
  FaTrash,
} from "react-icons/fa";
import creditCaseApi from "../../store/api/creditCaseApi";
import toast from "react-hot-toast";

const PromisedPaymentsList = ({ case_, onUpdate }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [newPayment, setNewPayment] = useState({
    amount: "",
    currency: "KES",
    promisedDate: new Date(),
    notes: "",
    paymentMethod: "",
  });

  const handleAddPayment = async () => {
    try {
      if (!newPayment.amount || parseFloat(newPayment.amount) <= 0) {
        toast.error("Please enter a valid amount");
        return;
      }

      const paymentData = {
        amount: parseFloat(newPayment.amount),
        currency: newPayment.currency,
        promisedDate: newPayment.promisedDate.toISOString(),
        notes: newPayment.notes,
        paymentMethod: newPayment.paymentMethod,
      };

      const response = await creditCaseApi.addPromisedPayment(
        case_._id,
        paymentData
      );

      if (response.data.success) {
        toast.success("Promised payment added successfully");
        setShowAddModal(false);
        setNewPayment({
          amount: "",
          currency: "KES",
          promisedDate: new Date(),
          notes: "",
          paymentMethod: "",
        });
        onUpdate();
      }
    } catch (error) {
      console.error("Error adding payment:", error);
      toast.error(error.response?.data?.message || "Failed to add payment");
    }
  };

  const handleUpdatePaymentStatus = async (
    paymentId,
    status,
    paymentMethod = ""
  ) => {
    try {
      const updateData = { status };
      if (status === "paid") {
        updateData.paymentMethod = paymentMethod;
      }

      const response = await creditCaseApi.updatePromisedPaymentStatus(
        case_._id,
        paymentId,
        updateData
      );

      if (response.data.success) {
        toast.success("Payment status updated successfully");
        onUpdate();
      }
    } catch (error) {
      console.error("Error updating payment status:", error);
      toast.error(
        error.response?.data?.message || "Failed to update payment status"
      );
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "paid":
        return "bg-green-500";
      case "overdue":
        return "bg-red-500";
      case "cancelled":
        return "bg-gray-500";
      default:
        return "bg-yellow-500";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "paid":
        return <FaCheckCircle className="text-green-500" />;
      case "overdue":
        return <FaTimesCircle className="text-red-500" />;
      case "cancelled":
        return <FaTimesCircle className="text-gray-500" />;
      default:
        return <FaClock className="text-yellow-500" />;
    }
  };

  const formatCurrency = (amount, currency) => {
    return `${currency} ${parseFloat(amount).toLocaleString()}`;
  };

  const isOverdue = (promisedDate) => {
    return (
      new Date(promisedDate) < new Date() &&
      new Date(promisedDate).getTime() !== new Date().setHours(0, 0, 0, 0)
    );
  };

  // Calculate remaining balance
  const calculateRemainingBalance = () => {
    if (!case_ || !case_.debtAmount) return null;
    
    const totalPaid = case_.promisedPayments
      ? case_.promisedPayments
          .filter((p) => p.status === "paid")
          .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
      : 0;
    
    const remaining = parseFloat(case_.debtAmount) - totalPaid;
    return {
      totalDebt: parseFloat(case_.debtAmount) || 0,
      totalPaid,
      remaining: remaining > 0 ? remaining : 0,
      currency: case_.currency || "KES",
    };
  };

  const balance = calculateRemainingBalance();

  return (
    <div className="bg-dark-800 rounded-lg p-6">
      {/* Remaining Balance Display */}
      {balance && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border border-blue-500/30 rounded-xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-slate-400 mb-1">Total Debt</p>
              <p className="text-lg font-bold text-white">
                {formatCurrency(balance.totalDebt, balance.currency)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">Total Paid</p>
              <p className="text-lg font-bold text-green-400">
                {formatCurrency(balance.totalPaid, balance.currency)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">Remaining Balance</p>
              <p className={`text-lg font-bold ${balance.remaining > 0 ? 'text-orange-400' : 'text-green-400'}`}>
                {formatCurrency(balance.remaining, balance.currency)}
              </p>
              {balance.remaining === 0 && (
                <span className="text-xs text-green-400 mt-1 inline-block">✓ Fully Paid</span>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <FaMoneyBillWave className="mr-2 text-green-400" />
          Promised Payments
        </h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg text-sm flex items-center"
        >
          <FaEdit className="mr-1" />
          Add Payment
        </button>
      </div>

      {case_.promisedPayments && case_.promisedPayments.length > 0 ? (
        <div className="space-y-3">
          {case_.promisedPayments.map((payment, index) => {
            const overdue = isOverdue(payment.promisedDate);
            const status =
              overdue && payment.status === "pending"
                ? "overdue"
                : payment.status;

            return (
              <div
                key={payment._id || index}
                className="bg-dark-700 rounded-lg p-4 border border-dark-600"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(status)}
                    <span className="text-white font-medium">
                      {formatCurrency(payment.amount, payment.currency)}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${getStatusColor(
                        status
                      )}`}
                    >
                      {status.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-sm text-dark-300">
                    Due: {new Date(payment.promisedDate).toLocaleDateString()}
                  </div>
                </div>

                {payment.notes && (
                  <p className="text-dark-300 text-sm mb-2">{payment.notes}</p>
                )}

                {payment.paymentMethod && (
                  <p className="text-dark-400 text-xs">
                    Method: {payment.paymentMethod}
                  </p>
                )}

                {payment.status === "pending" && (
                  <div className="flex space-x-2 mt-3">
                    <button
                      onClick={() =>
                        handleUpdatePaymentStatus(payment._id, "paid", "Cash")
                      }
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs"
                    >
                      Mark as Paid
                    </button>
                    <button
                      onClick={() =>
                        handleUpdatePaymentStatus(payment._id, "cancelled")
                      }
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {payment.status === "paid" && payment.paidAt && (
                  <p className="text-green-400 text-xs mt-2">
                    Paid on: {new Date(payment.paidAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-dark-400">
          <FaMoneyBillWave className="text-4xl mx-auto mb-2 text-dark-500" />
          <p>No promised payments yet</p>
          <p className="text-sm">
            Add a promised payment to track expected payments
          </p>
        </div>
      )}

      {/* Add Payment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-dark-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add Promised Payment</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-dark-300 hover:text-white"
              >
                <FaTimesCircle />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-dark-300 mb-2">
                  Amount
                </label>
                <input
                  type="number"
                  value={newPayment.amount}
                  onChange={(e) =>
                    setNewPayment({
                      ...newPayment,
                      amount: e.target.value,
                    })
                  }
                  placeholder="Enter amount"
                  className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-sm text-dark-300 mb-2">
                  Currency
                </label>
                <select
                  value={newPayment.currency}
                  onChange={(e) =>
                    setNewPayment({
                      ...newPayment,
                      currency: e.target.value,
                    })
                  }
                  className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white"
                >
                  <option value="KES">KES</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-dark-300 mb-2">
                  Promised Date
                </label>
                <input
                  type="date"
                  value={newPayment.promisedDate.toISOString().split("T")[0]}
                  onChange={(e) =>
                    setNewPayment({
                      ...newPayment,
                      promisedDate: new Date(e.target.value),
                    })
                  }
                  className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-sm text-dark-300 mb-2">
                  Payment Method
                </label>
                <input
                  type="text"
                  value={newPayment.paymentMethod}
                  onChange={(e) =>
                    setNewPayment({
                      ...newPayment,
                      paymentMethod: e.target.value,
                    })
                  }
                  placeholder="e.g., Cash, Bank Transfer, M-Pesa"
                  className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-sm text-dark-300 mb-2">
                  Notes
                </label>
                <textarea
                  value={newPayment.notes}
                  onChange={(e) =>
                    setNewPayment({
                      ...newPayment,
                      notes: e.target.value,
                    })
                  }
                  placeholder="Additional notes about the payment"
                  rows={3}
                  className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div className="flex space-x-2 pt-4">
                <button
                  onClick={handleAddPayment}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex-1"
                >
                  Save Payment
                </button>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="bg-dark-700 hover:bg-dark-600 text-white px-4 py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromisedPaymentsList;
