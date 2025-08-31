import {
  generateCreditCollectionInsights,
  generateCaseRecommendations,
  generatePaymentPredictions,
  generateLegalInsights,
  generateComprehensiveLegalAnalysis,
} from "../services/aiService.js";
import { protect, authorize } from "../middleware/auth.js";

/**I
 * Generate AI insights for credit collection reports
 * @route GET /api/ai/insights
 */
export const getAiInsights = async (req, res) => {
  try {
    const {
      performanceMetrics,
      revenueAnalytics,
      promisedPaymentsAnalytics,
      summary,
    } = req.body;
    const userRole = req.user.role;

    // Log the received data for debugging
    console.log("AI Insights Request Data:", {
      hasPerformanceMetrics: !!performanceMetrics,
      hasRevenueAnalytics: !!revenueAnalytics,
      hasPromisedPaymentsAnalytics: !!promisedPaymentsAnalytics,
      hasSummary: !!summary,
      userRole,
    });

    // Always proceed with AI analysis, even with empty data
    // The AI service will handle empty data gracefully

    // Generate AI insights
    const insights = await generateCreditCollectionInsights(
      {
        performanceMetrics,
        revenueAnalytics,
        promisedPaymentsAnalytics,
        summary,
      },
      userRole
    );

    res.json({
      success: true,
      data: insights,
    });
  } catch (error) {
    console.error("Error generating AI insights:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate AI insights",
      error: error.message,
    });
  }
};

/**
 * Generate AI recommendations for a specific case
 * @route POST /api/ai/case-recommendations
 */
export const getCaseRecommendations = async (req, res) => {
  try {
    const { caseData } = req.body;

    if (!caseData) {
      return res.status(400).json({
        success: false,
        message: "Case data is required",
      });
    }

    // Generate AI recommendations
    const recommendations = await generateCaseRecommendations(caseData);

    res.json({
      success: true,
      data: recommendations,
    });
  } catch (error) {
    console.error("Error generating case recommendations:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate case recommendations",
      error: error.message,
    });
  }
};

/**
 * Generate AI payment predictions
 * @route POST /api/ai/payment-predictions
 */
export const getPaymentPredictions = async (req, res) => {
  try {
    const { paymentHistory, debtorProfile } = req.body;

    if (!paymentHistory || !debtorProfile) {
      return res.status(400).json({
        success: false,
        message: "Payment history and debtor profile are required",
      });
    }

    // Generate AI predictions
    const predictions = await generatePaymentPredictions(
      paymentHistory,
      debtorProfile
    );

    res.json({
      success: true,
      data: predictions,
    });
  } catch (error) {
    console.error("Error generating payment predictions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate payment predictions",
      error: error.message,
    });
  }
};

/**
 * Generate comprehensive AI analysis for reports
 * @route POST /api/ai/comprehensive-analysis
 */
export const getComprehensiveAnalysis = async (req, res) => {
  try {
    const {
      performanceMetrics,
      revenueAnalytics,
      promisedPaymentsAnalytics,
      summary,
      caseData,
      paymentHistory,
      debtorProfile,
    } = req.body;

    const userRole = req.user.role;

    // Generate all AI insights
    const [insights, caseRecommendations, paymentPredictions] =
      await Promise.all([
        generateCreditCollectionInsights(
          {
            performanceMetrics,
            revenueAnalytics,
            promisedPaymentsAnalytics,
            summary,
          },
          userRole
        ),
        caseData ? generateCaseRecommendations(caseData) : null,
        paymentHistory && debtorProfile
          ? generatePaymentPredictions(paymentHistory, debtorProfile)
          : null,
      ]);

    const comprehensiveAnalysis = {
      insights,
      caseRecommendations,
      paymentPredictions,
      generatedAt: new Date().toISOString(),
      userRole,
    };

    res.json({
      success: true,
      data: comprehensiveAnalysis,
    });
  } catch (error) {
    console.error("Error generating comprehensive analysis:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate comprehensive analysis",
      error: error.message,
    });
  }
};

/**
 * Generate AI insights for legal cases
 * @route POST /api/ai/legal-insights
 */
export const getLegalInsights = async (req, res) => {
  try {
    const { cases, userRole, period, statistics, advocatePerformance } =
      req.body;

    // Generate legal case insights
    const insights = await generateLegalInsights({
      cases,
      userRole,
      period,
      statistics,
      advocatePerformance,
    });

    res.json({
      success: true,
      data: insights,
    });
  } catch (error) {
    console.error("Error generating legal insights:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate legal insights",
      error: error.message,
    });
  }
};

/**
 * Generate comprehensive legal analysis
 * @route POST /api/ai/comprehensive-legal-analysis
 */
export const getComprehensiveLegalAnalysis = async (req, res) => {
  try {
    const { cases, userRole, period, statistics, advocatePerformance } =
      req.body;

    // Generate comprehensive legal analysis
    const analysis = await generateComprehensiveLegalAnalysis({
      cases,
      userRole,
      period,
      statistics,
      advocatePerformance,
    });

    res.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error("Error generating comprehensive legal analysis:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate comprehensive legal analysis",
      error: error.message,
    });
  }
};
