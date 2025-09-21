import puppeteer from "puppeteer";

/**
 * Clean PDF Generator - Simple and Professional
 * No complex fonts or encoding issues
 */
export class CleanPDFGenerator {
  constructor() {
    this.browser = null;
  }

  /**
   * Initialize Puppeteer browser
   */
  async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      });
    }
    return this.browser;
  }

  /**
   * Generate clean HTML template - NO EMOJIS OR SPECIAL CHARACTERS
   */
  generateCleanHTML(lawFirm, reportData) {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    });

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${lawFirm.firmName} - Report</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }

            body {
                font-family: Arial, sans-serif;
                line-height: 1.4;
                color: #333;
                background: #fff;
                font-size: 14px;
            }

            .page {
                width: 210mm;
                min-height: 297mm;
                margin: 0 auto;
                padding: 20mm;
                background: white;
            }

            /* Header */
            .header {
                background: #2c3e50;
                color: white;
                padding: 30px;
                border-radius: 8px;
                margin-bottom: 30px;
                text-align: center;
                width: 100%;
            }

            .header h1 {
                font-size: 28px;
                font-weight: bold;
                margin-bottom: 10px;
            }

            .header h2 {
                font-size: 18px;
                font-weight: normal;
                margin-bottom: 15px;
            }

            .header .date {
                font-size: 14px;
                opacity: 0.9;
            }

            /* Section */
            .section {
                margin-bottom: 30px;
            }

            .section-title {
                font-size: 20px;
                font-weight: bold;
                color: #2c3e50;
                margin-bottom: 15px;
                border-bottom: 2px solid #3498db;
                padding-bottom: 5px;
            }

            /* Stats Grid */
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 20px;
                margin-bottom: 30px;
            }

            .stat-card {
                background: #f8f9fa;
                border: 1px solid #dee2e6;
                border-radius: 8px;
                padding: 20px;
                text-align: center;
            }

            .stat-card .label {
                font-size: 12px;
                color: #6c757d;
                margin-bottom: 8px;
                text-transform: uppercase;
                font-weight: bold;
            }

            .stat-card .value {
                font-size: 32px;
                font-weight: bold;
                color: #2c3e50;
                margin-bottom: 5px;
            }

            .stat-card.blue { border-left: 4px solid #3498db; }
            .stat-card.green { border-left: 4px solid #27ae60; }
            .stat-card.red { border-left: 4px solid #e74c3c; }
            .stat-card.orange { border-left: 4px solid #f39c12; }
            .stat-card.purple { border-left: 4px solid #9b59b6; }
            .stat-card.indigo { border-left: 4px solid #6c5ce7; }

            /* Table */
            .table-container {
                background: white;
                border: 1px solid #dee2e6;
                border-radius: 8px;
                overflow: hidden;
                margin-bottom: 20px;
            }

            .table {
                width: 100%;
                border-collapse: collapse;
                font-size: 12px;
            }

            .table thead {
                background: #34495e;
                color: white;
            }

            .table th {
                padding: 12px 8px;
                text-align: left;
                font-weight: bold;
                font-size: 11px;
                text-transform: uppercase;
            }

            .table td {
                padding: 10px 8px;
                border-bottom: 1px solid #dee2e6;
            }

            .table tbody tr:nth-child(even) {
                background: #f8f9fa;
            }

            /* Summary */
            .summary {
                background: #ecf0f1;
                padding: 20px;
                border-radius: 8px;
                border-left: 4px solid #3498db;
            }

            .summary h3 {
                font-size: 16px;
                font-weight: bold;
                color: #2c3e50;
                margin-bottom: 10px;
            }

            .summary p {
                color: #555;
                line-height: 1.6;
            }

            /* Footer */
            .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #dee2e6;
                text-align: center;
                color: #6c757d;
                font-size: 12px;
            }

            /* Status badges */
            .status {
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 10px;
                font-weight: bold;
                text-transform: uppercase;
            }

            .status.active { background: #d4edda; color: #155724; }
            .status.pending { background: #fff3cd; color: #856404; }
            .status.resolved { background: #cce5ff; color: #004085; }
            .status.closed { background: #f8f9fa; color: #495057; }

            @media print {
                .page {
                    width: 100%;
                    height: 100%;
                    margin: 0;
                    padding: 15mm;
                }
            }
        </style>
    </head>
    <body>
        <div class="page">
            <!-- Header -->
            <div class="header">
                <h1>${lawFirm.firmName}</h1>
                <h2>Professional Business Report</h2>
                <div class="date">Generated on: ${dateStr}</div>
            </div>

            <!-- Executive Summary -->
            <div class="section">
                <h2 class="section-title">Executive Summary</h2>
                
                <div class="stats-grid">
                    <div class="stat-card blue">
                        <div class="label">Total Credit Cases</div>
                        <div class="value">${reportData.totalCreditCases || 0}</div>
                    </div>
                    <div class="stat-card purple">
                        <div class="label">Total Legal Cases</div>
                        <div class="value">${reportData.totalLegalCases || 0}</div>
                    </div>
                    <div class="stat-card green">
                        <div class="label">Total Users</div>
                        <div class="value">${reportData.totalUsers || 0}</div>
                    </div>
                    <div class="stat-card orange">
                        <div class="label">Active Users</div>
                        <div class="value">${reportData.activeUsers || 0}</div>
                    </div>
                    <div class="stat-card red">
                        <div class="label">Escalated Cases</div>
                        <div class="value">${reportData.escalatedCases || 0}</div>
                    </div>
                    <div class="stat-card indigo">
                        <div class="label">Pending Cases</div>
                        <div class="value">${reportData.pendingCases || 0}</div>
                    </div>
                </div>
            </div>

            ${this.generateDepartmentSection(reportData.departments)}
            ${this.generateTopPerformersSection(reportData.topPerformers)}
            ${this.generateRecentActivitySection(reportData.recentActivity)}

            <!-- Summary -->
            <div class="summary">
                <h3>Summary</h3>
                <p>
                    This overview provides a comprehensive snapshot of your law firm's current status, 
                    including case counts, user activity, and operational metrics. Use these insights 
                    to make informed decisions and track your firm's performance over time.
                </p>
            </div>

            <!-- Footer -->
            <div class="footer">
                <div>Professional Law Firm Management Report</div>
                <div>Generated by Law Firm Management System</div>
            </div>
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
        <td>${dept.departmentType.replace('_', ' ').toUpperCase()}</td>
        <td>${dept.memberCount || 0}</td>
        <td>${dept.caseCount || 0}</td>
        <td>${dept.resolvedCases || 0}</td>
        <td><span class="status ${(dept.completionRate || 0) >= 80 ? 'active' : (dept.completionRate || 0) >= 60 ? 'pending' : 'closed'}">${dept.completionRate || 0}%</span></td>
      </tr>
    `).join('');

    return `
    <div class="section">
      <h2 class="section-title">Department Performance</h2>
      
      <div class="table-container">
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
        <td>${performer.role || 'N/A'}</td>
        <td>${performer.resolvedCases || 0}</td>
        <td>${performer.totalCases || 0}</td>
        <td><span class="status ${(performer.resolutionRate || 0) >= 80 ? 'active' : (performer.resolutionRate || 0) >= 60 ? 'pending' : 'closed'}">${(performer.resolutionRate || 0).toFixed(1)}%</span></td>
      </tr>
    `).join('');

    return `
    <div class="section">
      <h2 class="section-title">Top Performers</h2>
      
      <div class="table-container">
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
        <td>${activity.date}</td>
        <td>${activity.type}</td>
        <td>${activity.description}</td>
        <td><span class="status ${activity.status === 'resolved' ? 'active' : activity.status === 'pending' ? 'pending' : 'closed'}">${activity.status}</span></td>
      </tr>
    `).join('');

    return `
    <div class="section">
      <h2 class="section-title">Recent Activity</h2>
      
      <div class="table-container">
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
    </div>
    `;
  }

  /**
   * Generate PDF from HTML
   */
  async generatePDF(html) {
    let browser = null;
    let page = null;

    try {
      browser = await this.initBrowser();
      page = await browser.newPage();

      await page.setContent(html, { 
        waitUntil: 'domcontentloaded',
        timeout: 10000 
      });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '15mm',
          right: '15mm',
          bottom: '15mm',
          left: '15mm'
        },
        displayHeaderFooter: true,
        headerTemplate: '<div></div>',
        footerTemplate: `
          <div style="font-size: 10px; text-align: center; width: 100%; color: #6c757d;">
            Page <span class="pageNumber"></span> of <span class="totalPages"></span>
          </div>
        `
      });

      return pdfBuffer;
    } catch (error) {
      console.error("Error generating PDF:", error);
      throw error;
    } finally {
      if (page) {
        try {
          await page.close();
        } catch (e) {
          console.log("Page close error (ignored):", e.message);
        }
      }
    }
  }

  /**
   * Generate clean law firm report
   */
  async generateLawFirmReport(lawFirm, reportData) {
    const html = this.generateCleanHTML(lawFirm, reportData);
    return await this.generatePDF(html);
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

// Export singleton instance
export const cleanPDFGenerator = new CleanPDFGenerator();
