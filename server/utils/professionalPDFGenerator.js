import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

/**
 * Professional PDF Generator for Law Firm Reports
 * Fixes font issues, improves layout, and creates business-grade reports
 */

export class ProfessionalPDFGenerator {
  constructor() {
    this.doc = null;
    this.currentY = 0;
    this.margin = 50;
    this.pageWidth = 0;
    this.pageHeight = 0;
  }

  /**
   * Initialize a new PDF document with professional settings
   */
  createDocument() {
    this.doc = new PDFDocument({
      size: "A4",
      margin: this.margin,
      info: {
        Title: "Law Firm Report",
        Author: "Law Firm Management System",
        Subject: "Professional Business Report",
        Keywords: "law firm, legal, report, analytics",
        Creator: "Law Firm Management System",
        Producer: "Professional PDF Generator"
      }
    });

    this.pageWidth = this.doc.page.width - (this.margin * 2);
    this.pageHeight = this.doc.page.height - (this.margin * 2);
    this.currentY = this.margin;

    return this.doc;
  }

  /**
   * Add a professional header with law firm branding
   */
  async addProfessionalHeader(lawFirm, reportTitle, reportType = "overview") {
    const headerHeight = 120;
    
    // Create a professional gradient background
    this.addGradientBackground(0, 0, this.pageWidth + (this.margin * 2), headerHeight);
    
    // Add a subtle border
    this.doc
      .rect(this.margin, this.margin, this.pageWidth, headerHeight - 20)
      .stroke("#1e293b")
      .lineWidth(1);

    // Add logo if available
    if (lawFirm.logo) {
      await this.addLogo(lawFirm.logo, this.margin + 10, this.margin + 10);
    }

    // Law firm name - large, bold, professional
    this.doc
      .fontSize(28)
      .font("Helvetica-Bold")
      .fillColor("#ffffff")
      .text(lawFirm.firmName, this.margin + 120, this.margin + 15, {
        width: this.pageWidth - 130,
        align: "left"
      });

    // Report title
    this.doc
      .fontSize(18)
      .font("Helvetica")
      .fillColor("#e2e8f0")
      .text(reportTitle, this.margin + 120, this.margin + 50, {
        width: this.pageWidth - 130,
        align: "left"
      });

    // Date and time
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

    this.doc
      .fontSize(12)
      .font("Helvetica")
      .fillColor("#cbd5e1")
      .text(`Report Generated: ${dateStr} at ${timeStr}`, this.margin + 120, this.margin + 75, {
        width: this.pageWidth - 130,
        align: "left"
      });

    // Report type badge
    this.addReportTypeBadge(reportType, this.pageWidth + this.margin - 80, this.margin + 10);

    this.currentY = this.margin + headerHeight + 20;
  }

  /**
   * Add a gradient background effect
   */
  addGradientBackground(x, y, width, height) {
    const gradientColors = [
      "#1e293b", // slate-800
      "#334155", // slate-700
      "#475569", // slate-600
      "#64748b"  // slate-500
    ];

    gradientColors.forEach((color, index) => {
      const rectHeight = height / gradientColors.length;
      const rectY = y + (index * rectHeight);
      this.doc
        .rect(x, rectY, width, rectHeight)
        .fill(color);
    });
  }

  /**
   * Add law firm logo with proper error handling
   */
  async addLogo(logoUrl, x, y) {
    try {
      // For now, we'll create a placeholder logo area
      // In production, you'd fetch the actual logo from Cloudinary
      this.doc
        .rect(x, y, 90, 90)
        .fill("#ffffff")
        .stroke("#e2e8f0")
        .lineWidth(2);

      this.doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .fillColor("#64748b")
        .text("LOGO", x + 25, y + 35, {
          width: 40,
          align: "center"
        });
    } catch (error) {
      console.log("Logo not available, using placeholder");
    }
  }

  /**
   * Add a report type badge
   */
  addReportTypeBadge(reportType, x, y) {
    const badgeColors = {
      overview: "#3b82f6",
      "admin-cases": "#8b5cf6",
      "legal-performance": "#10b981",
      "debt-collection": "#f59e0b",
      revenue: "#ef4444"
    };

    const color = badgeColors[reportType] || "#64748b";
    
    this.doc
      .rect(x, y, 70, 25)
      .fill(color)
      .stroke(color);

    this.doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .fillColor("#ffffff")
      .text(reportType.toUpperCase(), x + 5, y + 8, {
        width: 60,
        align: "center"
      });
  }

  /**
   * Add a section header with professional styling
   */
  addSectionHeader(title, subtitle = null) {
    // Add some space before the section
    this.currentY += 20;

    // Section title
    this.doc
      .fontSize(20)
      .font("Helvetica-Bold")
      .fillColor("#1e293b")
      .text(title, this.margin, this.currentY, {
        width: this.pageWidth,
        align: "left"
      });

    // Decorative line
    this.doc
      .moveTo(this.margin, this.currentY + 30)
      .lineTo(this.margin + this.pageWidth, this.currentY + 30)
      .strokeColor("#3b82f6")
      .lineWidth(2)
      .stroke();

    this.currentY += 50;

    // Subtitle if provided
    if (subtitle) {
      this.doc
        .fontSize(14)
        .font("Helvetica")
        .fillColor("#64748b")
        .text(subtitle, this.margin, this.currentY, {
          width: this.pageWidth,
          align: "left"
        });
      this.currentY += 30;
    }
  }

  /**
   * Add professional statistics cards
   */
  addStatsCards(stats) {
    const cardWidth = (this.pageWidth - 40) / 2; // 2 cards per row
    const cardHeight = 80;
    const cardSpacing = 20;

    stats.forEach((stat, index) => {
      const row = Math.floor(index / 2);
      const col = index % 2;
      
      const x = this.margin + (col * (cardWidth + cardSpacing));
      const y = this.currentY + (row * (cardHeight + cardSpacing));

      // Check if we need a new page
      if (y + cardHeight > this.pageHeight + this.margin) {
        this.addNewPage();
        this.addStatsCards(stats.slice(index));
        return;
      }

      // Card background
      this.doc
        .rect(x, y, cardWidth, cardHeight)
        .fill(stat.bgColor || "#f8fafc")
        .stroke(stat.borderColor || "#e2e8f0")
        .lineWidth(1);

      // Card content
      // Icon
      if (stat.icon) {
        this.doc
          .fontSize(24)
          .text(stat.icon, x + 15, y + 15);
      }

      // Value
      this.doc
        .fontSize(28)
        .font("Helvetica-Bold")
        .fillColor(stat.color || "#1e293b")
        .text(stat.value.toString(), x + 50, y + 15, {
          width: cardWidth - 70,
          align: "left"
        });

      // Label
      this.doc
        .fontSize(12)
        .font("Helvetica")
        .fillColor("#64748b")
        .text(stat.label, x + 15, y + 50, {
          width: cardWidth - 30,
          align: "left"
        });
    });

    // Update current Y position
    const totalRows = Math.ceil(stats.length / 2);
    this.currentY += (totalRows * (cardHeight + cardSpacing)) + 20;
  }

  /**
   * Add a professional table
   */
  addTable(headers, rows, title = null) {
    if (title) {
      this.addSectionHeader(title);
    }

    const tableWidth = this.pageWidth;
    const colWidth = tableWidth / headers.length;
    const rowHeight = 25;
    const headerHeight = 30;

    // Check if we need a new page
    if (this.currentY + headerHeight + (rows.length * rowHeight) > this.pageHeight + this.margin) {
      this.addNewPage();
    }

    // Table header
    this.doc
      .rect(this.margin, this.currentY, tableWidth, headerHeight)
      .fill("#1e293b")
      .stroke("#1e293b");

    headers.forEach((header, index) => {
      const x = this.margin + (index * colWidth);
      
      // Header text
      this.doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .fillColor("#ffffff")
        .text(header, x + 5, this.currentY + 8, {
          width: colWidth - 10,
          align: "left"
        });

      // Column separator
      if (index < headers.length - 1) {
        this.doc
          .moveTo(x + colWidth, this.currentY)
          .lineTo(x + colWidth, this.currentY + headerHeight)
          .strokeColor("#ffffff")
          .lineWidth(1)
          .stroke();
      }
    });

    this.currentY += headerHeight;

    // Table rows
    rows.forEach((row, rowIndex) => {
      const y = this.currentY + (rowIndex * rowHeight);
      
      // Alternate row colors
      const bgColor = rowIndex % 2 === 0 ? "#ffffff" : "#f8fafc";
      
      this.doc
        .rect(this.margin, y, tableWidth, rowHeight)
        .fill(bgColor)
        .stroke("#e2e8f0")
        .lineWidth(0.5);

      row.forEach((cell, colIndex) => {
        const x = this.margin + (colIndex * colWidth);
        
        this.doc
          .fontSize(10)
          .font("Helvetica")
          .fillColor("#1e293b")
          .text(cell.toString(), x + 5, y + 7, {
            width: colWidth - 10,
            align: "left"
          });

        // Column separator
        if (colIndex < headers.length - 1) {
          this.doc
            .moveTo(x + colWidth, y)
            .lineTo(x + colWidth, y + rowHeight)
            .strokeColor("#e2e8f0")
            .lineWidth(0.5)
            .stroke();
        }
      });
    });

    this.currentY += (rows.length * rowHeight) + 20;
  }

  /**
   * Add a new page with proper header continuation
   */
  addNewPage() {
    this.doc.addPage();
    this.currentY = this.margin;
  }

  /**
   * Add a professional footer
   */
  addFooter() {
    const footerY = this.pageHeight + this.margin - 30;
    
    // Footer line
    this.doc
      .moveTo(this.margin, footerY)
      .lineTo(this.margin + this.pageWidth, footerY)
      .strokeColor("#e2e8f0")
      .lineWidth(1)
      .stroke();

    // Page number and date
    this.doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("#64748b")
      .text(`Page ${this.doc.bufferedPageRange().count}`, this.margin, footerY + 5)
      .text(`Generated by Law Firm Management System`, this.margin + this.pageWidth - 200, footerY + 5, {
        width: 200,
        align: "right"
      });
  }

  /**
   * Generate the final PDF
   */
  generatePDF(response, filename) {
    // Set proper headers
    response.setHeader("Content-Type", "application/pdf");
    response.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    
    // Pipe to response
    this.doc.pipe(response);
    this.doc.end();
  }
}

/**
 * Helper function to create professional overview data
 */
export const createOverviewData = (lawFirmData) => {
  return {
    totalCreditCases: lawFirmData.totalCreditCases || 0,
    totalLegalCases: lawFirmData.totalLegalCases || 0,
    totalUsers: lawFirmData.totalUsers || 0,
    activeUsers: lawFirmData.activeUsers || 0,
    escalatedCases: lawFirmData.escalatedCases || 0,
    totalRevenue: lawFirmData.totalRevenue || 0,
    pendingCases: lawFirmData.pendingCases || 0,
    resolvedCases: lawFirmData.resolvedCases || 0
  };
};

/**
 * Helper function to create professional stats cards
 */
export const createStatsCards = (data) => {
  return [
    {
      label: "Total Credit Cases",
      value: data.totalCreditCases || 0,
      color: "#3b82f6",
      bgColor: "#dbeafe",
      borderColor: "#3b82f6",
      icon: "📋"
    },
    {
      label: "Total Legal Cases",
      value: data.totalLegalCases || 0,
      color: "#8b5cf6",
      bgColor: "#e9d5ff",
      borderColor: "#8b5cf6",
      icon: "⚖️"
    },
    {
      label: "Total Users",
      value: data.totalUsers || 0,
      color: "#10b981",
      bgColor: "#d1fae5",
      borderColor: "#10b981",
      icon: "👥"
    },
    {
      label: "Active Users",
      value: data.activeUsers || 0,
      color: "#f59e0b",
      bgColor: "#fef3c7",
      borderColor: "#f59e0b",
      icon: "✅"
    },
    {
      label: "Escalated Cases",
      value: data.escalatedCases || 0,
      color: "#ef4444",
      bgColor: "#fee2e2",
      borderColor: "#ef4444",
      icon: "🚨"
    },
    {
      label: "Pending Cases",
      value: data.pendingCases || 0,
      color: "#6366f1",
      bgColor: "#e0e7ff",
      borderColor: "#6366f1",
      icon: "⏳"
    }
  ];
};
