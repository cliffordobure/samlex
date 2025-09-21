import puppeteer from "puppeteer";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Modern Professional PDF Generator using HTML-to-PDF conversion
 * This ensures perfect font rendering and professional styling
 */
export class ModernPDFGenerator {
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
   * Close browser instance
   */
  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Generate professional HTML template for law firm reports
   */
  generateProfessionalHTML(lawFirm, reportData, reportType = "overview") {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      weekday: 'long'
    });
    const timeStr = now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${lawFirm.firmName} - Professional Report</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }

            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
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
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }

            /* Header Styles */
            .header {
                background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #60a5fa 100%);
                color: white;
                padding: 30px;
                border-radius: 12px;
                margin-bottom: 30px;
                position: relative;
                overflow: hidden;
            }

            .header::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
                opacity: 0.3;
            }

            .header-content {
                position: relative;
                z-index: 2;
                display: flex;
                align-items: center;
                justify-content: space-between;
            }

            .firm-info h1 {
                font-size: 32px;
                font-weight: 700;
                margin-bottom: 8px;
                text-shadow: 0 2px 4px rgba(0,0,0,0.3);
            }

            .firm-info h2 {
                font-size: 20px;
                font-weight: 400;
                opacity: 0.9;
                margin-bottom: 12px;
            }

            .report-meta {
                text-align: right;
                opacity: 0.9;
            }

            .report-meta .date {
                font-size: 16px;
                margin-bottom: 4px;
            }

            .report-meta .time {
                font-size: 14px;
                opacity: 0.8;
            }

            .report-badge {
                background: rgba(255,255,255,0.2);
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 1px;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255,255,255,0.3);
            }

            /* Section Styles */
            .section {
                margin-bottom: 40px;
            }

            .section-title {
                font-size: 24px;
                font-weight: 700;
                color: #1e3a8a;
                margin-bottom: 8px;
                display: flex;
                align-items: center;
            }

            .section-title::before {
                content: '';
                width: 4px;
                height: 24px;
                background: linear-gradient(135deg, #3b82f6, #1d4ed8);
                margin-right: 12px;
                border-radius: 2px;
            }

            .section-subtitle {
                color: #64748b;
                font-size: 16px;
                margin-bottom: 20px;
            }

            /* Stats Grid */
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px;
                margin-bottom: 30px;
            }

            .stat-card {
                background: white;
                border-radius: 12px;
                padding: 24px;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                border: 1px solid #e2e8f0;
                transition: all 0.3s ease;
                position: relative;
                overflow: hidden;
            }

            .stat-card::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 4px;
                background: var(--card-color);
            }

            .stat-card.blue { --card-color: #3b82f6; }
            .stat-card.purple { --card-color: #8b5cf6; }
            .stat-card.green { --card-color: #10b981; }
            .stat-card.yellow { --card-color: #f59e0b; }
            .stat-card.red { --card-color: #ef4444; }
            .stat-card.indigo { --card-color: #6366f1; }

            .stat-icon {
                font-size: 24px;
                margin-bottom: 12px;
                display: block;
            }

            .stat-value {
                font-size: 36px;
                font-weight: 700;
                color: var(--card-color);
                margin-bottom: 8px;
                line-height: 1;
            }

            .stat-label {
                font-size: 14px;
                color: #64748b;
                font-weight: 500;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            /* Table Styles */
            .table-container {
                background: white;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                border: 1px solid #e2e8f0;
            }

            .table {
                width: 100%;
                border-collapse: collapse;
                font-size: 14px;
            }

            .table thead {
                background: linear-gradient(135deg, #1e3a8a, #3b82f6);
                color: white;
            }

            .table th {
                padding: 16px 12px;
                text-align: left;
                font-weight: 600;
                font-size: 13px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .table td {
                padding: 12px;
                border-bottom: 1px solid #e2e8f0;
            }

            .table tbody tr:hover {
                background: #f8fafc;
            }

            .table tbody tr:nth-child(even) {
                background: #f8fafc;
            }

            /* Footer */
            .footer {
                margin-top: 50px;
                padding-top: 20px;
                border-top: 2px solid #e2e8f0;
                text-align: center;
                color: #64748b;
                font-size: 12px;
            }

            .footer .page-info {
                margin-bottom: 8px;
            }

            .footer .generated-by {
                opacity: 0.7;
            }

            /* Status badges */
            .status-badge {
                display: inline-block;
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 11px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .status-active { background: #dcfce7; color: #166534; }
            .status-pending { background: #fef3c7; color: #92400e; }
            .status-resolved { background: #dbeafe; color: #1e40af; }
            .status-closed { background: #f3f4f6; color: #374151; }

            /* Responsive */
            @media print {
                .page {
                    width: 100%;
                    height: 100%;
                    margin: 0;
                    padding: 15mm;
                    box-shadow: none;
                }
            }
        </style>
    </head>
    <body>
        <div class="page">
            <!-- Header -->
            <div class="header">
                <div class="header-content">
                    <div class="firm-info">
                        <h1>${lawFirm.firmName}</h1>
                        <h2>Professional Business Report</h2>
                        <div class="report-badge">${reportType.toUpperCase()}</div>
                    </div>
                    <div class="report-meta">
                        <div class="date">${dateStr}</div>
                        <div class="time">Generated at ${timeStr}</div>
                    </div>
                </div>
            </div>

            <!-- Executive Summary -->
            <div class="section">
                <h2 class="section-title">Executive Summary</h2>
                <p class="section-subtitle">Key performance indicators and business metrics</p>
                
                <div class="stats-grid">
                    <div class="stat-card blue">
                        <span class="stat-icon">📋</span>
                        <div class="stat-value">${reportData.totalCreditCases || 0}</div>
                        <div class="stat-label">Total Credit Cases</div>
                    </div>
                    <div class="stat-card purple">
                        <span class="stat-icon">⚖️</span>
                        <div class="stat-value">${reportData.totalLegalCases || 0}</div>
                        <div class="stat-label">Total Legal Cases</div>
                    </div>
                    <div class="stat-card green">
                        <span class="stat-icon">👥</span>
                        <div class="stat-value">${reportData.totalUsers || 0}</div>
                        <div class="stat-label">Total Users</div>
                    </div>
                    <div class="stat-card yellow">
                        <span class="stat-icon">✅</span>
                        <div class="stat-value">${reportData.activeUsers || 0}</div>
                        <div class="stat-label">Active Users</div>
                    </div>
                    <div class="stat-card red">
                        <span class="stat-icon">🚨</span>
                        <div class="stat-value">${reportData.escalatedCases || 0}</div>
                        <div class="stat-label">Escalated Cases</div>
                    </div>
                    <div class="stat-card indigo">
                        <span class="stat-icon">⏳</span>
                        <div class="stat-value">${reportData.pendingCases || 0}</div>
                        <div class="stat-label">Pending Cases</div>
                    </div>
                </div>
            </div>

            ${this.generateDepartmentSection(reportData.departments)}
            ${this.generateTopPerformersSection(reportData.topPerformers)}
            ${this.generateRecentActivitySection(reportData.recentActivity)}

            <!-- Footer -->
            <div class="footer">
                <div class="page-info">Professional Law Firm Management Report</div>
                <div class="generated-by">Generated by Law Firm Management System</div>
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
        <td><strong>${dept.name}</strong></td>
        <td>${dept.departmentType.replace('_', ' ').toUpperCase()}</td>
        <td>${dept.memberCount || 0}</td>
        <td>${dept.caseCount || 0}</td>
        <td>${dept.resolvedCases || 0}</td>
        <td><span class="status-badge status-${(dept.completionRate || 0) >= 80 ? 'active' : (dept.completionRate || 0) >= 60 ? 'pending' : 'closed'}">${dept.completionRate || 0}%</span></td>
      </tr>
    `).join('');

    return `
    <div class="section">
      <h2 class="section-title">Department Performance</h2>
      <p class="section-subtitle">Performance metrics by department</p>
      
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
        <td><strong>${performer.name}</strong></td>
        <td>${performer.role || 'N/A'}</td>
        <td>${performer.resolvedCases || 0}</td>
        <td>${performer.totalCases || 0}</td>
        <td><span class="status-badge status-${(performer.resolutionRate || 0) >= 80 ? 'active' : (performer.resolutionRate || 0) >= 60 ? 'pending' : 'closed'}">${(performer.resolutionRate || 0).toFixed(1)}%</span></td>
      </tr>
    `).join('');

    return `
    <div class="section">
      <h2 class="section-title">Top Performers</h2>
      <p class="section-subtitle">Team members with highest case resolution rates</p>
      
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
        <td><span class="status-badge status-${activity.status === 'resolved' ? 'active' : activity.status === 'pending' ? 'pending' : 'closed'}">${activity.status}</span></td>
      </tr>
    `).join('');

    return `
    <div class="section">
      <h2 class="section-title">Recent Activity</h2>
      <p class="section-subtitle">Latest case updates and system activities</p>
      
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
  async generatePDF(html, options = {}) {
    const browser = await this.initBrowser();
    const page = await browser.newPage();

    try {
      await page.setContent(html, { 
        waitUntil: 'networkidle0',
        timeout: 30000 
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
          <div style="font-size: 10px; text-align: center; width: 100%; color: #64748b;">
            <span class="pageNumber"></span> / <span class="totalPages"></span>
          </div>
        `,
        ...options
      });

      return pdfBuffer;
    } finally {
      await page.close();
    }
  }

  /**
   * Generate professional law firm report
   */
  async generateLawFirmReport(lawFirm, reportData, reportType = "overview") {
    const html = this.generateProfessionalHTML(lawFirm, reportData, reportType);
    return await this.generatePDF(html);
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    await this.closeBrowser();
  }
}

// Export singleton instance
export const modernPDFGenerator = new ModernPDFGenerator();
