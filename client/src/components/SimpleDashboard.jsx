import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

const SimpleDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const { users } = useSelector((state) => state.users);
  const { departments } = useSelector((state) => state.departments);
  const { cases: creditCases } = useSelector((state) => state.creditCases);
  const { cases: legalCases } = useSelector((state) => state.legalCases);
  const navigate = useNavigate();

  // Calculate simple statistics
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.isActive).length;
  const totalCreditCases = creditCases.length;
  const totalLegalCases = legalCases.length;
  const totalCases = totalCreditCases + totalLegalCases;
  const escalatedCases = creditCases.filter(c => c.status === 'escalated_to_legal').length;
  const pendingCases = [...creditCases, ...legalCases].filter(c => 
    ['new', 'pending_assignment'].includes(c.status)
  ).length;
  const resolvedCases = [...creditCases, ...legalCases].filter(c => 
    ['resolved', 'closed'].includes(c.status)
  ).length;

  // Simple stat cards data
  const statsCards = [
    {
      title: 'Total Credit Cases',
      value: totalCreditCases,
      icon: '📋',
      color: 'bg-blue-500',
      textColor: 'text-blue-600'
    },
    {
      title: 'Total Legal Cases',
      value: totalLegalCases,
      icon: '⚖️',
      color: 'bg-purple-500',
      textColor: 'text-purple-600'
    },
    {
      title: 'Total Users',
      value: totalUsers,
      icon: '👥',
      color: 'bg-green-500',
      textColor: 'text-green-600'
    },
    {
      title: 'Active Users',
      value: activeUsers,
      icon: '✅',
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600'
    },
    {
      title: 'Escalated Cases',
      value: escalatedCases,
      icon: '🚨',
      color: 'bg-red-500',
      textColor: 'text-red-600'
    },
    {
      title: 'Pending Cases',
      value: pendingCases,
      icon: '⏳',
      color: 'bg-indigo-500',
      textColor: 'text-indigo-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Law Firm Dashboard
          </h1>
          <p className="text-gray-600">
            Welcome back, {user?.firstName || 'User'}! Here's your firm's current status.
          </p>
          <div className="mt-4 text-sm text-gray-500">
            Last updated: {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statsCards.map((stat, index) => (
          <div 
            key={index}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => {
              // Navigate to relevant sections
              if (stat.title.includes('Credit Cases')) navigate('/admin/cases?type=credit');
              else if (stat.title.includes('Legal Cases')) navigate('/admin/cases?type=legal');
              else if (stat.title.includes('Users')) navigate('/admin/users');
              else if (stat.title.includes('Cases')) navigate('/admin/cases');
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">
                  {stat.title}
                </p>
                <p className={`text-3xl font-bold ${stat.textColor}`}>
                  {stat.value}
                </p>
              </div>
              <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                <span className="text-2xl text-white">
                  {stat.icon}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Summary</h2>
        <p className="text-gray-600 leading-relaxed">
          This overview provides a comprehensive snapshot of your law firm's current status, 
          including case counts, user activity, and operational metrics. Use these insights 
          to make informed decisions and track your firm's performance over time.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button 
            onClick={() => navigate('/admin/cases')}
            className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors text-left"
          >
            <div className="text-blue-600 font-medium">View All Cases</div>
            <div className="text-sm text-blue-500 mt-1">Manage your case files</div>
          </button>
          
          <button 
            onClick={() => navigate('/admin/users')}
            className="p-4 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors text-left"
          >
            <div className="text-green-600 font-medium">Manage Users</div>
            <div className="text-sm text-green-500 mt-1">Add and manage team members</div>
          </button>
          
          <button 
            onClick={() => navigate('/admin/departments')}
            className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors text-left"
          >
            <div className="text-purple-600 font-medium">Departments</div>
            <div className="text-sm text-purple-500 mt-1">Organize your teams</div>
          </button>
          
          <button 
            onClick={() => navigate('/admin/reports')}
            className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg border border-orange-200 transition-colors text-left"
          >
            <div className="text-orange-600 font-medium">Reports</div>
            <div className="text-sm text-orange-500 mt-1">View detailed analytics</div>
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-gray-500 text-sm">
        Law Firm Management System
      </div>
    </div>
  );
};

export default SimpleDashboard;
