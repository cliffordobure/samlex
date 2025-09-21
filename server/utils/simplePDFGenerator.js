/**
 * Simple PDF Generator - No Puppeteer, No Font Issues
 * Uses basic HTML that renders perfectly
 */
export class SimplePDFGenerator {
  
  /**
   * Generate simple HTML template - ABSOLUTELY NO SPECIAL CHARACTERS
   */
  generateSimpleHTML(lawFirm, reportData) {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>${lawFirm.firmName} - Report</title>
        <style>
            body {
                font-family: Arial, Helvetica, sans-serif;
                margin: 0;
                padding: 20px;
                color: #333;
                line-height: 1.4;
            }
            
            .header {
                background: #2c3e50;
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
                border-bottom: 2px solid #3498db;
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
                border-left: 4px solid #3498db;
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
        </style>
    </head>
    <body>
        <div class="header">
            <h1>${lawFirm.firmName}</h1>
            <h2>Professional Business Report</h2>
            <div class="date">Generated on: ${dateStr}</div>
        </div>

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

        <div class="footer">
            <div>Professional Law Firm Management Report</div>
            <div>Generated by Law Firm Management System</div>
        </div>
    </body>
    </html>
    `;
  }

  /**
   * Generate department performance section
   */
  generateDepartmentSection(departments) {
    if (!departments || departments.length === 0) {
      return '';
    }

    const departmentRows = departments.map(dept => `
      <tr>
        <td>${dept.name}</td>
        <td>${(dept.departmentType || '').replace('_', ' ').toUpperCase()}</td>
        <td>${dept.memberCount || 0}</td>
        <td>${dept.caseCount || 0}</td>
        <td>${dept.resolvedCases || 0}</td>
        <td><span class="status ${(dept.completionRate || 0) >= 80 ? 'active' : (dept.completionRate || 0) >= 60 ? 'pending' : 'resolved'}">${dept.completionRate || 0}%</span></td>
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

  /**
   * Generate top performers section
   */
  generateTopPerformersSection(topPerformers) {
    if (!topPerformers || topPerformers.length === 0) {
      return '';
    }

    const performerRows = topPerformers.map(performer => `
      <tr>
        <td>${performer.name}</td>
        <td>${(performer.role || 'N/A').replace('_', ' ').toUpperCase()}</td>
        <td>${performer.resolvedCases || 0}</td>
        <td>${performer.totalCases || 0}</td>
        <td><span class="status ${(performer.resolutionRate || 0) >= 80 ? 'active' : (performer.resolutionRate || 0) >= 60 ? 'pending' : 'resolved'}">${(performer.resolutionRate || 0).toFixed(1)}%</span></td>
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

  /**
   * Generate recent activity section
   */
  generateRecentActivitySection(recentActivity) {
    if (!recentActivity || recentActivity.length === 0) {
      return '';
    }

    const activityRows = recentActivity.slice(0, 10).map(activity => `
      <tr>
        <td>${activity.date || 'N/A'}</td>
        <td>${activity.type || 'N/A'}</td>
        <td>${activity.description || 'N/A'}</td>
        <td><span class="status ${activity.status === 'resolved' ? 'active' : activity.status === 'pending' ? 'pending' : 'resolved'}">${activity.status || 'Unknown'}</span></td>
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

  /**
   * Generate simple law firm report (returns HTML for now)
   */
  async generateLawFirmReport(lawFirm, reportData) {
    const html = this.generateSimpleHTML(lawFirm, reportData);
    return html;
  }
}

// Export singleton instance
export const simplePDFGenerator = new SimplePDFGenerator();
