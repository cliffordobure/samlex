import Notification from "../models/Notification.js";
import LegalCase from "../models/LegalCase.js";
import CreditCase from "../models/CreditCase.js";
import User from "../models/User.js";
import emailService from "../utils/emailService.js";

/**
 * Create a notification for a user
 */
export const createNotification = async ({
  user,
  title,
  message,
  type = "system",
  priority = "medium",
  relatedCase = null,
  relatedCreditCase = null,
  eventDate = null,
  actionUrl = null,
  metadata = {},
  sendEmail = false,
}) => {
  try {
    const notification = new Notification({
      user: user._id || user,
      title,
      message,
      type,
      priority,
      relatedCase,
      relatedCreditCase,
      eventDate,
      actionUrl,
      metadata,
    });

    await notification.save();

    // Send email if requested and it's a case assignment
    if (sendEmail && (type === "case_assigned" || type === "credit_case_assigned")) {
      await sendCaseAssignmentEmail(notification);
    }

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};

/**
 * Create court date notifications for upcoming dates
 */
export const createCourtDateNotifications = async () => {
  try {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    // Find cases with upcoming court dates
    const upcomingCases = await LegalCase.find({
      $or: [
        {
          "courtDetails.courtDate": {
            $gte: today,
            $lte: nextWeek,
          },
        },
        {
          "courtDetails.nextHearingDate": {
            $gte: today,
            $lte: nextWeek,
          },
        },
        {
          "courtDetails.mentioningDate": {
            $gte: today,
            $lte: nextWeek,
          },
        },
      ],
    }).populate("assignedTo", "firstName lastName email");

    for (const legalCase of upcomingCases) {
      const courtDate = legalCase.courtDetails?.courtDate;
      const nextHearingDate = legalCase.courtDetails?.nextHearingDate;
      const mentioningDate = legalCase.courtDetails?.mentioningDate;

      // Check if assigned to someone
      if (!legalCase.assignedTo) continue;

      // Create notifications for different date types
      if (courtDate && courtDate >= today && courtDate <= nextWeek) {
        const daysUntil = Math.ceil(
          (courtDate - today) / (1000 * 60 * 60 * 24)
        );
        const priority =
          daysUntil <= 1 ? "urgent" : daysUntil <= 3 ? "high" : "medium";

        await createNotification({
          user: legalCase.assignedTo._id,
          title: `Court Date Reminder: ${legalCase.caseNumber}`,
          message: `Court date for case "${
            legalCase.title
          }" is in ${daysUntil} day${
            daysUntil !== 1 ? "s" : ""
          }. Date: ${courtDate.toLocaleDateString()}`,
          type: "court_date",
          priority,
          relatedCase: legalCase._id,
          eventDate: courtDate,
          actionUrl: `/legal/cases/${legalCase._id}`,
          metadata: {
            caseNumber: legalCase.caseNumber,
            caseTitle: legalCase.title,
            daysUntil,
            courtName: legalCase.courtDetails?.courtName,
          },
        });
      }

      if (
        nextHearingDate &&
        nextHearingDate >= today &&
        nextHearingDate <= nextWeek
      ) {
        const daysUntil = Math.ceil(
          (nextHearingDate - today) / (1000 * 60 * 60 * 24)
        );
        const priority =
          daysUntil <= 1 ? "urgent" : daysUntil <= 3 ? "high" : "medium";

        await createNotification({
          user: legalCase.assignedTo._id,
          title: `Next Hearing Reminder: ${legalCase.caseNumber}`,
          message: `Next hearing for case "${
            legalCase.title
          }" is in ${daysUntil} day${
            daysUntil !== 1 ? "s" : ""
          }. Date: ${nextHearingDate.toLocaleDateString()}`,
          type: "hearing_date",
          priority,
          relatedCase: legalCase._id,
          eventDate: nextHearingDate,
          actionUrl: `/legal/cases/${legalCase._id}`,
          metadata: {
            caseNumber: legalCase.caseNumber,
            caseTitle: legalCase.title,
            daysUntil,
            courtName: legalCase.courtDetails?.courtName,
          },
        });
      }

      if (
        mentioningDate &&
        mentioningDate >= today &&
        mentioningDate <= nextWeek
      ) {
        const daysUntil = Math.ceil(
          (mentioningDate - today) / (1000 * 60 * 60 * 24)
        );
        const priority =
          daysUntil <= 1 ? "urgent" : daysUntil <= 3 ? "high" : "medium";

        await createNotification({
          user: legalCase.assignedTo._id,
          title: `Mentioning Date Reminder: ${legalCase.caseNumber}`,
          message: `Mentioning date for case "${
            legalCase.title
          }" is in ${daysUntil} day${
            daysUntil !== 1 ? "s" : ""
          }. Date: ${mentioningDate.toLocaleDateString()}`,
          type: "mentioning_date",
          priority,
          relatedCase: legalCase._id,
          eventDate: mentioningDate,
          actionUrl: `/legal/cases/${legalCase._id}`,
          metadata: {
            caseNumber: legalCase.caseNumber,
            caseTitle: legalCase.title,
            daysUntil,
            courtName: legalCase.courtDetails?.courtName,
          },
        });
      }
    }

    console.log(
      `Created notifications for ${upcomingCases.length} cases with upcoming dates`
    );
  } catch (error) {
    console.error("Error creating court date notifications:", error);
  }
};

/**
 * Create follow-up date notifications for credit collection cases
 */
export const createFollowUpDateNotifications = async () => {
  try {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    // Find credit cases with upcoming follow-up dates
    const upcomingFollowUps = await CreditCase.aggregate([
      {
        $unwind: "$notes",
      },
      {
        $match: {
          "notes.followUpDate": {
            $gte: today,
            $lte: nextWeek,
          },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "assignedTo",
          foreignField: "_id",
          as: "assignedUser",
        },
      },
      {
        $unwind: "$assignedUser",
      },
    ]);

    for (const caseData of upcomingFollowUps) {
      const followUpDate = new Date(caseData.notes.followUpDate);
      const daysUntil = Math.ceil(
        (followUpDate - today) / (1000 * 60 * 60 * 24)
      );
      const priority =
        daysUntil <= 1 ? "urgent" : daysUntil <= 3 ? "high" : "medium";

      await createNotification({
        user: caseData.assignedUser._id,
        title: `Follow-up Reminder: ${caseData.caseNumber}`,
        message: `Follow-up for case "${
          caseData.title
        }" is due in ${daysUntil} day${
          daysUntil !== 1 ? "s" : ""
        }. Date: ${followUpDate.toLocaleDateString()}`,
        type: "follow_up_reminder",
        priority,
        relatedCreditCase: caseData._id,
        eventDate: followUpDate,
        actionUrl: `/credit-collection/cases/${caseData._id}`,
        metadata: {
          caseNumber: caseData.caseNumber,
          caseTitle: caseData.title,
          daysUntil,
          debtorName: caseData.debtorName,
          noteContent: caseData.notes.content.substring(0, 100) + "...",
        },
      });
    }
  } catch (error) {
    console.error("Error creating follow-up date notifications:", error);
  }
};

/**
 * Create promised payment notifications for credit collection cases
 */
export const createPromisedPaymentNotifications = async () => {
  try {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    // Find credit cases with upcoming promised payments
    const upcomingPayments = await CreditCase.aggregate([
      {
        $unwind: "$promisedPayments",
      },
      {
        $match: {
          "promisedPayments.promisedDate": {
            $gte: today,
            $lte: nextWeek,
          },
          "promisedPayments.status": { $in: ["pending"] },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "assignedTo",
          foreignField: "_id",
          as: "assignedUser",
        },
      },
      {
        $unwind: "$assignedUser",
      },
    ]);

    for (const caseData of upcomingPayments) {
      const paymentDate = new Date(caseData.promisedPayments.promisedDate);
      const daysUntil = Math.ceil(
        (paymentDate - today) / (1000 * 60 * 60 * 24)
      );
      const priority =
        daysUntil <= 1 ? "urgent" : daysUntil <= 3 ? "high" : "medium";

      await createNotification({
        user: caseData.assignedUser._id,
        title: `Payment Due Reminder: ${caseData.caseNumber}`,
        message: `A payment of ${
          caseData.promisedPayments.currency
        } ${caseData.promisedPayments.amount.toLocaleString()} for case "${
          caseData.title
        }" is due in ${daysUntil} day${
          daysUntil !== 1 ? "s" : ""
        }. Date: ${paymentDate.toLocaleDateString()}`,
        type: "payment_due_reminder",
        priority,
        relatedCreditCase: caseData._id,
        eventDate: paymentDate,
        actionUrl: `/credit-collection/cases/${caseData._id}`,
        metadata: {
          caseNumber: caseData.caseNumber,
          caseTitle: caseData.title,
          daysUntil,
          debtorName: caseData.debtorName,
          paymentAmount: caseData.promisedPayments.amount,
          paymentCurrency: caseData.promisedPayments.currency,
          paymentNotes: caseData.promisedPayments.notes,
        },
      });
    }
  } catch (error) {
    console.error("Error creating promised payment notifications:", error);
  }
};

/**
 * Send daily summary emails to users
 */
export const sendDailySummaryEmails = async () => {
  try {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get all advocates and legal heads
    const users = await User.find({
      role: { $in: ["advocate", "legal_head"] },
      isActive: true,
    });

    for (const user of users) {
      let summaryData = {
        todayEvents: [],
        tomorrowEvents: [],
        pendingTasks: [],
        recentCases: [],
      };

      if (user.role === "advocate") {
        // Get cases assigned to this advocate
        const assignedCases = await LegalCase.find({
          assignedTo: user._id,
        }).populate("client", "firstName lastName");

        // Get today's and tomorrow's events
        summaryData.todayEvents = assignedCases.filter((legalCase) => {
          const courtDate = legalCase.courtDetails?.courtDate;
          const nextHearingDate = legalCase.courtDetails?.nextHearingDate;
          const mentioningDate = legalCase.courtDetails?.mentioningDate;

          return (
            (courtDate && courtDate.toDateString() === today.toDateString()) ||
            (nextHearingDate &&
              nextHearingDate.toDateString() === today.toDateString()) ||
            (mentioningDate &&
              mentioningDate.toDateString() === today.toDateString())
          );
        });

        summaryData.tomorrowEvents = assignedCases.filter((legalCase) => {
          const courtDate = legalCase.courtDetails?.courtDate;
          const nextHearingDate = legalCase.courtDetails?.nextHearingDate;
          const mentioningDate = legalCase.courtDetails?.mentioningDate;

          return (
            (courtDate &&
              courtDate.toDateString() === tomorrow.toDateString()) ||
            (nextHearingDate &&
              nextHearingDate.toDateString() === tomorrow.toDateString()) ||
            (mentioningDate &&
              mentioningDate.toDateString() === tomorrow.toDateString())
          );
        });

        // Get pending tasks (cases that need attention)
        summaryData.pendingTasks = assignedCases.filter((legalCase) =>
          ["assigned", "under_review"].includes(legalCase.status)
        );

        // Get recent cases (last 5)
        summaryData.recentCases = assignedCases
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
          .slice(0, 5);
      } else if (user.role === "legal_head") {
        // Get all cases in the law firm
        const allCases = await LegalCase.find({
          lawFirm: user.lawFirm,
        })
          .populate("client", "firstName lastName")
          .populate("assignedTo", "firstName lastName");

        // Get unassigned cases
        summaryData.pendingTasks = allCases.filter(
          (legalCase) => !legalCase.assignedTo
        );

        // Get recent cases
        summaryData.recentCases = allCases
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
          .slice(0, 5);
      }

      // Send email if there are events or tasks
      if (
        summaryData.todayEvents.length > 0 ||
        summaryData.tomorrowEvents.length > 0 ||
        summaryData.pendingTasks.length > 0
      ) {
        await sendDailySummaryEmail(user, summaryData);
      }
    }

    console.log(`Sent daily summary emails to ${users.length} users`);
  } catch (error) {
    console.error("Error sending daily summary emails:", error);
  }
};

/**
 * Send daily summary email to a user
 */
const sendDailySummaryEmail = async (user, summaryData) => {
  try {
    const subject = `Daily Summary - ${new Date().toLocaleDateString()}`;

    let htmlContent = `
      <h2>Daily Summary for ${user.firstName} ${user.lastName}</h2>
      <p>Date: ${new Date().toLocaleDateString()}</p>
    `;

    if (summaryData.todayEvents.length > 0) {
      htmlContent += `
        <h3>Today's Events (${summaryData.todayEvents.length})</h3>
        <ul>
          ${summaryData.todayEvents
            .map(
              (legalCase) => `
            <li>
              <strong>${legalCase.caseNumber}</strong> - ${legalCase.title}<br>
              Client: ${legalCase.client?.firstName} ${legalCase.client?.lastName}<br>
              Status: ${legalCase.status}
            </li>
          `
            )
            .join("")}
        </ul>
      `;
    }

    if (summaryData.tomorrowEvents.length > 0) {
      htmlContent += `
        <h3>Tomorrow's Events (${summaryData.tomorrowEvents.length})</h3>
        <ul>
          ${summaryData.tomorrowEvents
            .map(
              (legalCase) => `
            <li>
              <strong>${legalCase.caseNumber}</strong> - ${legalCase.title}<br>
              Client: ${legalCase.client?.firstName} ${legalCase.client?.lastName}<br>
              Status: ${legalCase.status}
            </li>
          `
            )
            .join("")}
        </ul>
      `;
    }

    if (summaryData.pendingTasks.length > 0) {
      htmlContent += `
        <h3>Pending Tasks (${summaryData.pendingTasks.length})</h3>
        <ul>
          ${summaryData.pendingTasks
            .map(
              (legalCase) => `
            <li>
              <strong>${legalCase.caseNumber}</strong> - ${legalCase.title}<br>
              Client: ${legalCase.client?.firstName} ${legalCase.client?.lastName}<br>
              Status: ${legalCase.status}
            </li>
          `
            )
            .join("")}
        </ul>
      `;
    }

    if (summaryData.recentCases.length > 0) {
      htmlContent += `
        <h3>Recent Cases</h3>
        <ul>
          ${summaryData.recentCases
            .map(
              (legalCase) => `
            <li>
              <strong>${legalCase.caseNumber}</strong> - ${legalCase.title}<br>
              Client: ${legalCase.client?.firstName} ${legalCase.client?.lastName}<br>
              Status: ${legalCase.status}
            </li>
          `
            )
            .join("")}
        </ul>
      `;
    }

    htmlContent += `
      <p><a href="${
        process.env.CLIENT_URL || "https://samlex-client.vercel.app"
      }/legal">View Dashboard</a></p>
    `;

    await emailService.sendEmail({
      to: user.email,
      subject,
      html: htmlContent,
    });

    console.log(`Sent daily summary email to ${user.email}`);
  } catch (error) {
    console.error(`Error sending daily summary email to ${user.email}:`, error);
  }
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (notificationId, userId) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { isRead: true },
      { new: true }
    );
    return notification;
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw error;
  }
};

/**
 * Mark all notifications as read for a user
 */
export const markAllNotificationsAsRead = async (userId) => {
  try {
    await Notification.updateMany(
      { user: userId, isRead: false },
      { isRead: true }
    );
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    throw error;
  }
};

/**
 * Send case assignment email to user
 */
const sendCaseAssignmentEmail = async (notification) => {
  try {
    // Get user details
    const user = await User.findById(notification.user).populate('lawFirm', 'firmName');
    if (!user) {
      console.error("User not found for notification:", notification._id);
      return;
    }

    let caseData = null;
    let caseType = "Case";
    let caseUrl = "";

    // Get case details based on notification type
    if (notification.relatedCase) {
      caseData = await LegalCase.findById(notification.relatedCase);
      caseType = "Legal Case";
      caseUrl = `${process.env.CLIENT_URL || "https://samlex-client.vercel.app"}/legal/cases/${notification.relatedCase}`;
    } else if (notification.relatedCreditCase) {
      caseData = await CreditCase.findById(notification.relatedCreditCase);
      caseType = "Credit Collection Case";
      caseUrl = `${process.env.CLIENT_URL || "https://samlex-client.vercel.app"}/credit-collection/cases/${notification.relatedCreditCase}`;
    }

    if (!caseData) {
      console.error("Case not found for notification:", notification._id);
      return;
    }

    const subject = `📋 ${caseType} Assigned: ${caseData.caseNumber}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc; padding: 20px;">
        <div style="background-color: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="background: linear-gradient(135deg, #0ea5e9, #3b82f6); color: white; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
              <h1 style="margin: 0; font-size: 24px; font-weight: bold;">📋 Case Assignment</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">You have been assigned a new case</p>
            </div>
          </div>

          <div style="background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #1e293b; margin-top: 0; font-size: 20px;">Case Details</h2>
            <div style="display: grid; gap: 10px;">
              <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                <span style="font-weight: bold; color: #475569;">Case Number:</span>
                <span style="color: #1e293b;">${caseData.caseNumber}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                <span style="font-weight: bold; color: #475569;">Title:</span>
                <span style="color: #1e293b;">${caseData.title}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                <span style="font-weight: bold; color: #475569;">Type:</span>
                <span style="color: #1e293b;">${caseType}</span>
              </div>
              <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                <span style="font-weight: bold; color: #475569;">Status:</span>
                <span style="color: #1e293b; text-transform: capitalize;">${caseData.status.replace('_', ' ')}</span>
              </div>
              ${caseData.priority ? `
              <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                <span style="font-weight: bold; color: #475569;">Priority:</span>
                <span style="color: #1e293b; text-transform: capitalize;">${caseData.priority}</span>
              </div>
              ` : ''}
            </div>
          </div>

          ${caseData.description ? `
          <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #f59e0b;">
            <h3 style="color: #92400e; margin-top: 0; font-size: 16px;">Description</h3>
            <p style="color: #92400e; margin: 0; line-height: 1.5;">${caseData.description}</p>
          </div>
          ` : ''}

          ${notification.metadata.assignedBy ? `
          <div style="background-color: #ecfdf5; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #10b981;">
            <h3 style="color: #065f46; margin-top: 0; font-size: 16px;">Assigned By</h3>
            <p style="color: #065f46; margin: 0; font-weight: bold;">${notification.metadata.assignedBy}</p>
          </div>
          ` : ''}

          <div style="text-align: center; margin: 30px 0;">
            <a href="${caseUrl}" 
               style="background: linear-gradient(135deg, #0ea5e9, #3b82f6); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              📋 View Case Details
            </a>
          </div>

          <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin-top: 20px;">
            <h3 style="color: #475569; margin-top: 0; font-size: 14px;">Next Steps</h3>
            <ul style="color: #64748b; margin: 0; padding-left: 20px; font-size: 14px;">
              <li>Review the case details and requirements</li>
              <li>Contact the client if needed</li>
              <li>Update the case status as you progress</li>
              <li>Add notes and documents as required</li>
            </ul>
          </div>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;">
          <p style="color: #64748b; font-size: 12px; text-align: center; margin: 0;">
            This is an automated notification from ${user.lawFirm?.firmName || 'Samlex'} Case Management System.<br>
            If you have any questions, please contact your supervisor or system administrator.
          </p>
        </div>
      </div>
    `;

    await emailService.sendEmail({
      to: user.email,
      subject,
      html,
    });

    console.log(`📧 Case assignment email sent to ${user.email} for case ${caseData.caseNumber}`);
  } catch (error) {
    console.error("Error sending case assignment email:", error);
  }
};

/**
 * Get unread notifications count for a user
 */
export const getUnreadNotificationsCount = async (userId) => {
  try {
    const count = await Notification.countDocuments({
      user: userId,
      isRead: false,
    });
    return count;
  } catch (error) {
    console.error("Error getting unread notifications count:", error);
    throw error;
  }
};
