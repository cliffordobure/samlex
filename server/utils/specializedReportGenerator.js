/**
 * Specialized Report Generator - Different reports for different sections
 * Each section gets its own tailored report
 */
export class SpecializedReportGenerator {
  
  /**
   * Generate specialized HTML template based on report type
   */
  generateSpecializedHTML(lawFirm, reportData, reportType, user = null) {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });

    const reportConfig = this.getReportConfig(reportType);

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>${lawFirm.firmName} - ${reportConfig.title}</title>
        <style>
            body {
                font-family: Arial, Helvetica, sans-serif;
                margin: 0;
                padding: 20px;
                color: #333;
                line-height: 1.4;
            }
            
            .header {
                background: ${reportConfig.headerColor};
                color: white;
                padding: 20px;
                text-align: center;
                margin-bottom: 20px;
            }
            
            .header h1 {
                margin: 0 0 10px 0;
                font-size: 24px;
            }
            
            .header h2 {
                margin: 0 0 5px 0;
                font-size: 16px;
                font-weight: normal;
            }
            
            .header .date {
                font-size: 12px;
                opacity: 0.8;
            }
            
            .section {
                margin-bottom: 20px;
            }
            
            .section-title {
                font-size: 18px;
                font-weight: bold;
                color: #2c3e50;
                margin-bottom: 10px;
                border-bottom: 2px solid ${reportConfig.accentColor};
                padding-bottom: 5px;
            }
            
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 15px;
                margin-bottom: 20px;
            }
            
            .stat-card {
                background: #f8f9fa;
                border: 1px solid #ddd;
                padding: 15px;
                text-align: center;
            }
            
            .stat-card .label {
                font-size: 11px;
                color: #666;
                margin-bottom: 5px;
                font-weight: bold;
            }
            
            .stat-card .value {
                font-size: 24px;
                font-weight: bold;
                color: #2c3e50;
                margin-bottom: 5px;
            }
            
            .table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
            }
            
            .table th {
                background: #34495e;
                color: white;
                padding: 8px;
                text-align: left;
                font-size: 12px;
                font-weight: bold;
            }
            
            .table td {
                padding: 8px;
                border-bottom: 1px solid #ddd;
                font-size: 11px;
            }
            
            .table tbody tr:nth-child(even) {
                background: #f8f9fa;
            }
            
            .summary {
                background: #ecf0f1;
                padding: 15px;
                border-left: 4px solid ${reportConfig.accentColor};
                margin-bottom: 20px;
            }
            
            .summary h3 {
                margin: 0 0 10px 0;
                font-size: 14px;
                color: #2c3e50;
            }
            
            .summary p {
                margin: 0;
                font-size: 12px;
                color: #555;
            }
            
            .footer {
                margin-top: 30px;
                padding-top: 15px;
                border-top: 1px solid #ddd;
                text-align: center;
                color: #666;
                font-size: 11px;
            }
            
            .status {
                padding: 2px 6px;
                border-radius: 3px;
                font-size: 9px;
                font-weight: bold;
            }
            
            .status.active { background: #d4edda; color: #155724; }
            .status.pending { background: #fff3cd; color: #856404; }
            .status.resolved { background: #cce5ff; color: #004085; }
            .status.closed { background: #f8f9fa; color: #495057; }
            .status.overdue { background: #f8d7da; color: #721c24; }
            .status.assigned { background: #e2e3e5; color: #383d41; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>${lawFirm.firmName}</h1>
            <h2>${reportConfig.title}</h2>
            <div class="date">Generated on: ${dateStr}</div>
        </div>

        ${this.generateReportContent(reportData, reportType, user)}

        <div class="footer">
            <div>Professional Law Firm Management Report</div>
            <div>Generated by Law Firm Management System</div>
        </div>
    </body>
    </html>
    `;
  }

  /**
   * Get report configuration based on type
   */
  getReportConfig(reportType) {
    const configs = {
      'overview': {
        title: 'Executive Overview Report',
        headerColor: '#2c3e50',
        accentColor: '#3498db'
      },
      'mycases': {
        title: 'My Cases Report',
        headerColor: '#8e44ad',
        accentColor: '#9b59b6'
      },
      'legal-performance': {
        title: 'Legal Performance Report',
        headerColor: '#27ae60',
        accentColor: '#2ecc71'
      },
      'debt-collection': {
        title: 'Debt Collection Report',
        headerColor: '#e74c3c',
        accentColor: '#c0392b'
      },
      'revenue-analytics': {
        title: 'Revenue Analytics Report',
        headerColor: '#f39c12',
        accentColor: '#e67e22'
      },
      'case-analysis': {
        title: 'Case Analysis Report',
        headerColor: '#34495e',
        accentColor: '#2c3e50'
      },
      'financial': {
        title: 'Financial Reports',
        headerColor: '#16a085',
        accentColor: '#1abc9c'
      },
      'performance-metrics': {
        title: 'Performance Metrics Report',
        headerColor: '#1abc9c',
        accentColor: '#16a085'
      },
      'monthly-trends': {
        title: 'Monthly Trends Report',
        headerColor: '#e67e22',
        accentColor: '#d35400'
      },
      'promised-payments': {
        title: 'Promised Payments Report',
        headerColor: '#8e44ad',
        accentColor: '#7d3c98'
      }
    };

    return configs[reportType] || configs['overview'];
  }

  /**
   * Generate report content based on type
   */
  generateReportContent(reportData, reportType, user = null) {
    switch (reportType) {
      case 'overview':
        return this.generateOverviewContent(reportData);
      case 'mycases':
        return this.generateMyCasesContent(reportData);
      case 'legal-performance':
        return this.generateLegalPerformanceContent(reportData, user);
      case 'debt-collection':
        return this.generateDebtCollectionContent(reportData, user);
      case 'revenue-analytics':
        return this.generateRevenueAnalyticsContent(reportData);
      case 'case-analysis':
        return this.generateCaseAnalysisContent(reportData);
      case 'financial':
        return this.generateFinancialContent(reportData);
      case 'performance-metrics':
        return this.generatePerformanceMetricsContent(reportData, user);
      case 'monthly-trends':
        return this.generateMonthlyTrendsContent(reportData, user);
      case 'promised-payments':
        return this.generatePromisedPaymentsContent(reportData, user);
      default:
        return this.generateOverviewContent(reportData);
    }
  }

  /**
   * Generate Overview Report Content
   */
  generateOverviewContent(reportData) {
    return `
    <div class="section">
      <h2 class="section-title">Executive Summary</h2>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="label">Total Credit Cases</div>
          <div class="value">${reportData.totalCreditCases || 0}</div>
        </div>
        <div class="stat-card">
          <div class="label">Total Legal Cases</div>
          <div class="value">${reportData.totalLegalCases || 0}</div>
        </div>
        <div class="stat-card">
          <div class="label">Total Users</div>
          <div class="value">${reportData.totalUsers || 0}</div>
        </div>
        <div class="stat-card">
          <div class="label">Active Users</div>
          <div class="value">${reportData.activeUsers || 0}</div>
        </div>
        <div class="stat-card">
          <div class="label">Escalated Cases</div>
          <div class="value">${reportData.escalatedCases || 0}</div>
        </div>
        <div class="stat-card">
          <div class="label">Pending Cases</div>
          <div class="value">${reportData.pendingCases || 0}</div>
        </div>
      </div>
    </div>

    ${this.generateDepartmentSection(reportData.departments)}
    ${this.generateTopPerformersSection(reportData.topPerformers)}
    ${this.generateRecentActivitySection(reportData.recentActivity)}

    <div class="summary">
      <h3>Summary</h3>
      <p>
        This overview provides a comprehensive snapshot of your law firm's current status, 
        including case counts, user activity, and operational metrics. Use these insights 
        to make informed decisions and track your firm's performance over time.
      </p>
    </div>
    `;
  }

  /**
   * Generate My Cases Report Content
   */
  generateMyCasesContent(reportData) {
    return `
    <div class="section">
      <h2 class="section-title">My Cases Summary</h2>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="label">Total Assigned Cases</div>
          <div class="value">${reportData.totalAssignedCases || 0}</div>
        </div>
        <div class="stat-card">
          <div class="label">Active Cases</div>
          <div class="value">${reportData.activeCases || 0}</div>
        </div>
        <div class="stat-card">
          <div class="label">Completed Cases</div>
          <div class="value">${reportData.completedCases || 0}</div>
        </div>
        <div class="stat-card">
          <div class="label">Overdue Cases</div>
          <div class="value">${reportData.overdueCases || 0}</div>
        </div>
        <div class="stat-card">
          <div class="label">Due This Week</div>
          <div class="value">${reportData.dueThisWeek || 0}</div>
        </div>
        <div class="stat-card">
          <div class="label">Success Rate</div>
          <div class="value">${reportData.successRate || 0}%</div>
        </div>
      </div>
    </div>

    ${this.generateMyCasesTable(reportData.myCases)}
    ${this.generateCaseStatusBreakdown(reportData.caseStatusBreakdown)}

    <div class="summary">
      <h3>Summary</h3>
      <p>
        This report shows your personal case workload and performance metrics. 
        Track your progress, identify priority cases, and maintain high-quality 
        service delivery to your clients.
      </p>
    </div>
    `;
  }

  /**
   * Generate Legal Performance Report Content
   */
  generateLegalPerformanceContent(reportData, user = null) {
    const title = user && user.role === 'advocate' 
      ? `Legal Performance Metrics - ${user.firstName} ${user.lastName}`
      : 'Legal Performance Metrics';
      
    return `
    <div class="section">
      <h2 class="section-title">${title}</h2>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="label">Total Legal Cases</div>
          <div class="value">${reportData.totalLegalCases || 0}</div>
        </div>
        <div class="stat-card">
          <div class="label">Cases Resolved</div>
          <div class="value">${reportData.resolvedCases || 0}</div>
        </div>
        <div class="stat-card">
          <div class="label">Resolution Rate</div>
          <div class="value">${reportData.resolutionRate || 0}%</div>
        </div>
        <div class="stat-card">
          <div class="label">Average Resolution Time</div>
          <div class="value">${reportData.avgResolutionTime || 0} days</div>
        </div>
        <div class="stat-card">
          <div class="label">Client Satisfaction</div>
          <div class="value">${reportData.clientSatisfaction || 0}%</div>
        </div>
        <div class="stat-card">
          <div class="label">Revenue Generated</div>
          <div class="value">KES ${reportData.revenueGenerated || 0}</div>
        </div>
      </div>
    </div>

    ${this.generateLegalTeamPerformance(reportData.legalTeamPerformance)}
    ${this.generateCaseTypeAnalysis(reportData.caseTypeAnalysis)}
    ${this.generateLegalTrends(reportData.legalTrends)}

    <div class="summary">
      <h3>Summary</h3>
      <p>
        This legal performance report provides insights into case resolution efficiency, 
        team productivity, and client satisfaction. Use this data to optimize legal 
        operations and improve service delivery.
      </p>
    </div>
    `;
  }

  /**
   * Generate Debt Collection Report Content
   */
  generateDebtCollectionContent(reportData, user = null) {
    const title = user && user.role === 'debt_collector' 
      ? `Debt Collection Performance - ${user.firstName} ${user.lastName}`
      : 'Debt Collection Performance';
    
    // Ensure we have valid data
    const safeData = {
      totalCreditCases: reportData?.totalCreditCases || 0,
      collectedCases: reportData?.collectedCases || 0,
      collectionRate: reportData?.collectionRate || 0,
      totalAmountCollected: reportData?.totalAmountCollected || 0,
      outstandingAmount: reportData?.outstandingAmount || 0,
      escalatedToLegal: reportData?.escalatedToLegal || 0
    };
      
    return `
    <div class="section">
      <h2 class="section-title">${title}</h2>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="label">Total Credit Cases</div>
          <div class="value">${safeData.totalCreditCases}</div>
        </div>
        <div class="stat-card">
          <div class="label">Cases Collected</div>
          <div class="value">${safeData.collectedCases}</div>
        </div>
        <div class="stat-card">
          <div class="label">Collection Rate</div>
          <div class="value">${safeData.collectionRate}%</div>
        </div>
        <div class="stat-card">
          <div class="label">Total Amount Collected</div>
          <div class="value">Ksh ${safeData.totalAmountCollected.toLocaleString()}</div>
        </div>
        <div class="stat-card">
          <div class="label">Outstanding Amount</div>
          <div class="value">Ksh ${safeData.outstandingAmount.toLocaleString()}</div>
        </div>
        <div class="stat-card">
          <div class="label">Escalated to Legal</div>
          <div class="value">${safeData.escalatedToLegal}</div>
        </div>
      </div>
    </div>

    <!-- Placeholder sections removed - now handled by separate reports -->

    <div class="summary">
      <h3>Summary</h3>
      <p>
        This debt collection report shows collection efficiency, payment trends, 
        and collector performance. Monitor collection rates and identify 
        opportunities for improvement in debt recovery processes.
      </p>
    </div>
    `;
  }

  /**
   * Generate Performance Metrics Report Content
   */
  generatePerformanceMetricsContent(reportData, user = null) {
    const title = user && user.role === 'debt_collector' 
      ? `Performance Metrics - ${user.firstName} ${user.lastName}`
      : 'Performance Metrics Overview';
    
    return `
    <div class="section">
      <h2 class="section-title">${title}</h2>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="label">Success Rate</div>
          <div class="value">${reportData.successRate || 0}%</div>
        </div>
        <div class="stat-card">
          <div class="label">Average Resolution Time</div>
          <div class="value">${reportData.avgResolutionTime || 0} days</div>
        </div>
        <div class="stat-card">
          <div class="label">Cases Per Month</div>
          <div class="value">${reportData.casesPerMonth || 0}</div>
        </div>
        <div class="stat-card">
          <div class="label">Client Satisfaction</div>
          <div class="value">${reportData.clientSatisfaction || 0}%</div>
        </div>
        <div class="stat-card">
          <div class="label">Efficiency Score</div>
          <div class="value">${reportData.efficiencyScore || 0}/100</div>
        </div>
        <div class="stat-card">
          <div class="label">Productivity Index</div>
          <div class="value">${reportData.productivityIndex || 0}</div>
        </div>
      </div>
    </div>

    ${this.generatePerformanceBreakdown(reportData.performanceBreakdown)}
    ${this.generateEfficiencyTrends(reportData.efficiencyTrends)}

    <div class="summary">
      <h3>Summary</h3>
      <p>
        This performance metrics report provides detailed insights into individual and team 
        performance indicators. Use this data to identify top performers, areas for improvement, 
        and set realistic performance targets.
      </p>
    </div>
    `;
  }

  /**
   * Generate Monthly Trends Report Content
   */
  generateMonthlyTrendsContent(reportData, user = null) {
    const title = user && user.role === 'debt_collector' 
      ? `Monthly Trends - ${user.firstName} ${user.lastName}`
      : 'Monthly Trends Analysis';
    
    return `
    <div class="section">
      <h2 class="section-title">${title}</h2>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="label">This Month Cases</div>
          <div class="value">${reportData.thisMonthCases || 0}</div>
        </div>
        <div class="stat-card">
          <div class="label">Last Month Cases</div>
          <div class="value">${reportData.lastMonthCases || 0}</div>
        </div>
        <div class="stat-card">
          <div class="label">Growth Rate</div>
          <div class="value">${reportData.growthRate || 0}%</div>
        </div>
        <div class="stat-card">
          <div class="label">Peak Month</div>
          <div class="value">${reportData.peakMonth || 'N/A'}</div>
        </div>
        <div class="stat-card">
          <div class="label">Average Monthly</div>
          <div class="value">${reportData.avgMonthly || 0}</div>
        </div>
        <div class="stat-card">
          <div class="label">Trend Direction</div>
          <div class="value">${reportData.trendDirection || 'Stable'}</div>
        </div>
      </div>
    </div>

    ${this.generateTrendChart(reportData.monthlyData)}
    ${this.generateSeasonalAnalysis(reportData.seasonalAnalysis)}

    <div class="summary">
      <h3>Summary</h3>
      <p>
        This monthly trends report shows patterns and seasonal variations in case volume, 
        resolution rates, and performance metrics. Use this data to forecast future trends 
        and plan resource allocation.
      </p>
    </div>
    `;
  }

  /**
   * Generate Promised Payments Report Content
   */
  generatePromisedPaymentsContent(reportData, user = null) {
    const title = user && user.role === 'debt_collector' 
      ? `Promised Payments - ${user.firstName} ${user.lastName}`
      : 'Promised Payments Overview';
    
    return `
    <div class="section">
      <h2 class="section-title">${title}</h2>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="label">Total Promised</div>
          <div class="value">Ksh ${(reportData.totalPromisedAmount || 0).toLocaleString()}</div>
        </div>
        <div class="stat-card">
          <div class="label">Amount Paid</div>
          <div class="value">Ksh ${(reportData.totalPaidAmount || 0).toLocaleString()}</div>
        </div>
        <div class="stat-card">
          <div class="label">Pending Amount</div>
          <div class="value">Ksh ${(reportData.totalPendingAmount || 0).toLocaleString()}</div>
        </div>
        <div class="stat-card">
          <div class="label">Overdue Amount</div>
          <div class="value">Ksh ${(reportData.totalOverdueAmount || 0).toLocaleString()}</div>
        </div>
        <div class="stat-card">
          <div class="label">Payment Rate</div>
          <div class="value">${reportData.paymentRate || 0}%</div>
        </div>
        <div class="stat-card">
          <div class="label">Overdue Rate</div>
          <div class="value">${reportData.overdueRate || 0}%</div>
        </div>
      </div>
    </div>

    ${this.generatePaymentBreakdown(reportData.paymentBreakdown)}
    ${this.generatePaymentTrends(reportData.paymentTrends)}

    <div class="summary">
      <h3>Summary</h3>
      <p>
        This promised payments report tracks payment commitments, actual collections, 
        and overdue amounts. Use this data to improve payment follow-up processes 
        and reduce outstanding receivables.
      </p>
    </div>
    `;
  }

  /**
   * Generate Revenue Analytics Report Content
   */
  generateRevenueAnalyticsContent(reportData) {
    return `
    <div class="section">
      <h2 class="section-title">Revenue Analytics</h2>
      
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="label">Total Revenue</div>
                    <div class="value">KES ${reportData.totalRevenue || 0}</div>
                </div>
                <div class="stat-card">
                    <div class="label">Filing Fees</div>
                    <div class="value">KES ${reportData.filingFees || 0}</div>
                </div>
                <div class="stat-card">
                    <div class="label">Money Recovered</div>
                    <div class="value">KES ${reportData.moneyRecovered || 0}</div>
                </div>
                <div class="stat-card">
                    <div class="label">Escalation Fees</div>
                    <div class="value">KES ${reportData.escalationFees || 0}</div>
                </div>
                <div class="stat-card">
                    <div class="label">Service Charges</div>
                    <div class="value">KES ${reportData.serviceCharges || 0}</div>
                </div>
                <div class="stat-card">
                    <div class="label">Consultation Fees</div>
                    <div class="value">KES ${reportData.consultationFees || 0}</div>
                </div>
            </div>
    </div>

    ${this.generateRevenueBreakdown(reportData.revenueBreakdown)}
    ${this.generateRevenueTrends(reportData.revenueTrends)}
    ${this.generateRevenueSources(reportData.revenueSources)}

    <div class="summary">
      <h3>Summary</h3>
      <p>
        This revenue analytics report provides insights into revenue streams, 
        growth trends, and financial performance. Use this data to make 
        informed business decisions and optimize revenue generation.
      </p>
    </div>
    `;
  }

  /**
   * Generate Case Analysis Report Content
   */
  generateCaseAnalysisContent(reportData) {
    return `
    <div class="section">
      <h2 class="section-title">Case Analysis</h2>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="label">Total Cases</div>
          <div class="value">${reportData.totalCases || 0}</div>
        </div>
        <div class="stat-card">
          <div class="label">New Cases</div>
          <div class="value">${reportData.newCases || 0}</div>
        </div>
        <div class="stat-card">
          <div class="label">In Progress</div>
          <div class="value">${reportData.inProgressCases || 0}</div>
        </div>
        <div class="stat-card">
          <div class="label">Resolved Cases</div>
          <div class="value">${reportData.resolvedCases || 0}</div>
        </div>
        <div class="stat-card">
          <div class="label">Closed Cases</div>
          <div class="value">${reportData.closedCases || 0}</div>
        </div>
        <div class="stat-card">
          <div class="label">Average Case Duration</div>
          <div class="value">${reportData.avgCaseDuration || 0} days</div>
        </div>
      </div>
    </div>

    ${this.generateCaseStatusDistribution(reportData.caseStatusDistribution)}
    ${this.generateCaseTypeBreakdown(reportData.caseTypeBreakdown)}
    ${this.generateCaseTimeline(reportData.caseTimeline)}

    <div class="summary">
      <h3>Summary</h3>
      <p>
        This case analysis report provides insights into case distribution, 
        status trends, and processing efficiency. Use this data to optimize 
        case management and improve workflow processes.
      </p>
    </div>
    `;
  }

  /**
   * Generate Financial Report Content
   */
  generateFinancialContent(reportData) {
    return `
    <div class="section">
      <h2 class="section-title">Financial Overview</h2>
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="label">Total Revenue</div>
          <div class="value">KES ${reportData.totalRevenue || 0}</div>
        </div>
        <div class="stat-card">
          <div class="label">Total Expenses</div>
          <div class="value">KES ${reportData.totalExpenses || 0}</div>
        </div>
        <div class="stat-card">
          <div class="label">Net Profit</div>
          <div class="value">KES ${reportData.netProfit || 0}</div>
        </div>
        <div class="stat-card">
          <div class="label">Profit Margin</div>
          <div class="value">${reportData.profitMargin || 0}%</div>
        </div>
        <div class="stat-card">
          <div class="label">Cash Flow</div>
          <div class="value">KES ${reportData.cashFlow || 0}</div>
        </div>
        <div class="stat-card">
          <div class="label">Outstanding Invoices</div>
          <div class="value">KES ${reportData.outstandingInvoices || 0}</div>
        </div>
      </div>
    </div>

    ${this.generateExpenseBreakdown(reportData.expenseBreakdown)}
    ${this.generateFinancialTrends(reportData.financialTrends)}
    ${this.generateProfitabilityAnalysis(reportData.profitabilityAnalysis)}

    <div class="summary">
      <h3>Summary</h3>
      <p>
        This financial report provides a comprehensive view of the firm's 
        financial health, including revenue, expenses, and profitability. 
        Use this data to make strategic financial decisions.
      </p>
    </div>
    `;
  }

  // Helper methods for generating specific sections
  generateDepartmentSection(departments) {
    if (!departments || departments.length === 0) return '';

    const departmentRows = departments.map(dept => `
      <tr>
        <td>${dept.name}</td>
        <td>${(dept.departmentType || '').replace('_', ' ').toUpperCase()}</td>
        <td>${dept.memberCount || 0}</td>
        <td>${dept.caseCount || 0}</td>
        <td>${dept.resolvedCases || 0}</td>
        <td><span class="status ${(dept.completionRate || 0) >= 80 ? 'active' : (dept.completionRate || 0) >= 60 ? 'pending' : 'closed'}">${dept.completionRate || 0}%</span></td>
      </tr>
    `).join('');

    return `
    <div class="section">
      <h2 class="section-title">Department Performance</h2>
      <table class="table">
        <thead>
          <tr>
            <th>Department</th>
            <th>Type</th>
            <th>Members</th>
            <th>Total Cases</th>
            <th>Resolved</th>
            <th>Completion Rate</th>
          </tr>
        </thead>
        <tbody>
          ${departmentRows}
        </tbody>
      </table>
    </div>
    `;
  }

  generateTopPerformersSection(topPerformers) {
    if (!topPerformers || topPerformers.length === 0) return '';

    const performerRows = topPerformers.map(performer => `
      <tr>
        <td>${performer.name}</td>
        <td>${(performer.role || 'N/A').replace('_', ' ').toUpperCase()}</td>
        <td>${performer.resolvedCases || 0}</td>
        <td>${performer.totalCases || 0}</td>
        <td><span class="status ${(performer.resolutionRate || 0) >= 80 ? 'active' : (performer.resolutionRate || 0) >= 60 ? 'pending' : 'closed'}">${(performer.resolutionRate || 0).toFixed(1)}%</span></td>
      </tr>
    `).join('');

    return `
    <div class="section">
      <h2 class="section-title">Top Performers</h2>
      <table class="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Role</th>
            <th>Resolved Cases</th>
            <th>Total Cases</th>
            <th>Success Rate</th>
          </tr>
        </thead>
        <tbody>
          ${performerRows}
        </tbody>
      </table>
    </div>
    `;
  }

  generateRecentActivitySection(recentActivity) {
    if (!recentActivity || recentActivity.length === 0) return '';

    const activityRows = recentActivity.slice(0, 10).map(activity => `
      <tr>
        <td>${activity.date || 'N/A'}</td>
        <td>${activity.type || 'N/A'}</td>
        <td>${activity.description || 'N/A'}</td>
        <td><span class="status ${activity.status === 'resolved' ? 'active' : activity.status === 'pending' ? 'pending' : 'closed'}">${activity.status || 'Unknown'}</span></td>
      </tr>
    `).join('');

    return `
    <div class="section">
      <h2 class="section-title">Recent Activity</h2>
      <table class="table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Description</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${activityRows}
        </tbody>
      </table>
    </div>
    `;
  }

  // Placeholder methods for specialized sections - can be expanded
  generateMyCasesTable(myCases) {
    if (!myCases || myCases.length === 0) return '';
    // Implementation for my cases table
    return '<div class="section"><h2 class="section-title">My Cases</h2><p>Cases assigned to you will be displayed here.</p></div>';
  }

  generateCaseStatusBreakdown(caseStatusBreakdown) {
    if (!caseStatusBreakdown) return '';
    // Implementation for case status breakdown
    return '<div class="section"><h2 class="section-title">Case Status Breakdown</h2><p>Case status distribution will be displayed here.</p></div>';
  }

  generateLegalTeamPerformance(legalTeamPerformance) {
    if (!legalTeamPerformance) return '';
    return '<div class="section"><h2 class="section-title">Legal Team Performance</h2><p>Legal team metrics will be displayed here.</p></div>';
  }

  generateCaseTypeAnalysis(caseTypeAnalysis) {
    if (!caseTypeAnalysis) return '';
    return '<div class="section"><h2 class="section-title">Case Type Analysis</h2><p>Case type breakdown will be displayed here.</p></div>';
  }

  generateLegalTrends(legalTrends) {
    if (!legalTrends) return '';
    return '<div class="section"><h2 class="section-title">Legal Trends</h2><p>Legal performance trends will be displayed here.</p></div>';
  }

  generateDebtCollectorPerformance(debtCollectorPerformance) {
    if (!debtCollectorPerformance) return '';
    return '<div class="section"><h2 class="section-title">Debt Collector Performance</h2><p>Debt collector metrics will be displayed here.</p></div>';
  }

  generateCollectionTrends(collectionTrends) {
    if (!collectionTrends) return '';
    return '<div class="section"><h2 class="section-title">Collection Trends</h2><p>Collection trends will be displayed here.</p></div>';
  }

  generatePaymentAnalysis(paymentAnalysis) {
    if (!paymentAnalysis) return '';
    return '<div class="section"><h2 class="section-title">Payment Analysis</h2><p>Payment analysis will be displayed here.</p></div>';
  }

  // Helper methods for new report sections
  generatePerformanceBreakdown(performanceBreakdown) {
    if (!performanceBreakdown) return '';
    return '<div class="section"><h2 class="section-title">Performance Breakdown</h2><p>Performance breakdown will be displayed here.</p></div>';
  }

  generateEfficiencyTrends(efficiencyTrends) {
    if (!efficiencyTrends) return '';
    return '<div class="section"><h2 class="section-title">Efficiency Trends</h2><p>Efficiency trends will be displayed here.</p></div>';
  }

  generateTrendChart(monthlyData) {
    if (!monthlyData) return '';
    return '<div class="section"><h2 class="section-title">Trend Chart</h2><p>Monthly trend chart will be displayed here.</p></div>';
  }

  generateSeasonalAnalysis(seasonalAnalysis) {
    if (!seasonalAnalysis) return '';
    return '<div class="section"><h2 class="section-title">Seasonal Analysis</h2><p>Seasonal analysis will be displayed here.</p></div>';
  }

  generatePaymentBreakdown(paymentBreakdown) {
    if (!paymentBreakdown) return '';
    return '<div class="section"><h2 class="section-title">Payment Breakdown</h2><p>Payment breakdown will be displayed here.</p></div>';
  }

  generatePaymentTrends(paymentTrends) {
    if (!paymentTrends) return '';
    return '<div class="section"><h2 class="section-title">Payment Trends</h2><p>Payment trends will be displayed here.</p></div>';
  }

  generateRevenueBreakdown(revenueBreakdown) {
    if (!revenueBreakdown) return '';
    
    const breakdownRows = Object.entries(revenueBreakdown).map(([source, amount]) => `
      <tr>
        <td>${source.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</td>
        <td>Ksh ${amount || 0}</td>
        <td><span class="status ${amount > 0 ? 'active' : 'closed'}">${amount > 0 ? 'Active' : 'None'}</span></td>
      </tr>
    `).join('');

    return `
    <div class="section">
      <h2 class="section-title">Revenue Breakdown by Source</h2>
      
      <table class="table">
        <thead>
          <tr>
            <th>Revenue Source</th>
            <th>Amount</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${breakdownRows}
        </tbody>
      </table>
    </div>
    `;
  }

  generateRevenueTrends(revenueTrends) {
    if (!revenueTrends) return '';
    return '<div class="section"><h2 class="section-title">Revenue Trends</h2><p>Revenue trends will be displayed here.</p></div>';
  }

  generateRevenueSources(revenueSources) {
    if (!revenueSources) return '';
    return '<div class="section"><h2 class="section-title">Revenue Sources</h2><p>Revenue sources will be displayed here.</p></div>';
  }

  generateCaseStatusDistribution(caseStatusDistribution) {
    if (!caseStatusDistribution) return '';
    return '<div class="section"><h2 class="section-title">Case Status Distribution</h2><p>Case status distribution will be displayed here.</p></div>';
  }

  generateCaseTypeBreakdown(caseTypeBreakdown) {
    if (!caseTypeBreakdown) return '';
    return '<div class="section"><h2 class="section-title">Case Type Breakdown</h2><p>Case type breakdown will be displayed here.</p></div>';
  }

  generateCaseTimeline(caseTimeline) {
    if (!caseTimeline) return '';
    return '<div class="section"><h2 class="section-title">Case Timeline</h2><p>Case timeline will be displayed here.</p></div>';
  }

  generateExpenseBreakdown(expenseBreakdown) {
    if (!expenseBreakdown) return '';
    return '<div class="section"><h2 class="section-title">Expense Breakdown</h2><p>Expense breakdown will be displayed here.</p></div>';
  }

  generateFinancialTrends(financialTrends) {
    if (!financialTrends) return '';
    return '<div class="section"><h2 class="section-title">Financial Trends</h2><p>Financial trends will be displayed here.</p></div>';
  }

  generateProfitabilityAnalysis(profitabilityAnalysis) {
    if (!profitabilityAnalysis) return '';
    return '<div class="section"><h2 class="section-title">Profitability Analysis</h2><p>Profitability analysis will be displayed here.</p></div>';
  }

  /**
   * Generate specialized law firm report
   */
  async generateSpecializedReport(lawFirm, reportData, reportType, user = null) {
    const html = this.generateSpecializedHTML(lawFirm, reportData, reportType, user);
    return html;
  }
}

// Export singleton instance
export const specializedReportGenerator = new SpecializedReportGenerator();
