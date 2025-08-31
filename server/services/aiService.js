import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "sk-proj-your-key-here", // Fallback for development
});

/**
 * Generate AI insights for legal cases
 * @param {Object} data - The legal case data
 * @param {Array} data.cases - Array of legal cases
 * @param {string} data.userRole - User role (advocate, legal_head, etc.)
 * @param {string} data.period - Analysis period
 * @param {Object} data.statistics - Case statistics
 * @param {Object} data.advocatePerformance - Advocate performance data
 * @returns {Object} AI-generated insights
 */
export const generateLegalInsights = async (data) => {
  try {
    const { cases, userRole, period, statistics, advocatePerformance } = data;

    // Prepare the data for AI analysis
    const analysisData = {
      totalCases: statistics?.totalCases || 0,
      resolvedCases: statistics?.resolvedCases || 0,
      activeCases: statistics?.activeCases || 0,
      resolutionRate:
        statistics?.totalCases > 0
          ? ((statistics.resolvedCases / statistics.totalCases) * 100).toFixed(
              1
            )
          : 0,
      caseTypes: statistics?.caseTypes || [],
      statusDistribution: statistics?.statusDistribution || [],
      priorityDistribution: statistics?.priorityDistribution || [],
      advocatePerformance,
      userRole,
      period,
    };

    // Check if we have any meaningful data to analyze
    const hasData =
      analysisData.totalCases > 0 || analysisData.resolvedCases > 0;

    if (!hasData) {
      // Return basic insights for empty data
      return generateFallbackLegalInsights(data);
    }

    // Create the prompt for GPT-3.5
    const prompt = createLegalAnalysisPrompt(analysisData);

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are an expert legal analyst specializing in case management and legal practice optimization. Provide detailed, actionable insights based on the legal case data provided. Be specific, professional, and focus on practical recommendations for legal practitioners.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const aiResponse = completion.choices[0].message.content;

    // Parse the AI response and structure it
    return parseLegalAIResponse(aiResponse, analysisData);
  } catch (error) {
    console.error("Error generating legal insights:", error);

    // Fallback to basic insights if AI fails
    return generateFallbackLegalInsights(data);
  }
};

/**
 * Generate comprehensive legal analysis
 * @param {Object} data - The legal case data
 * @returns {Object} Comprehensive legal analysis
 */
export const generateComprehensiveLegalAnalysis = async (data) => {
  try {
    const { cases, userRole, period, statistics, advocatePerformance } = data;

    // Prepare comprehensive data
    const comprehensiveData = {
      cases,
      userRole,
      period,
      statistics,
      advocatePerformance,
      analysisDate: new Date().toISOString(),
    };

    // Create comprehensive prompt
    const prompt = createComprehensiveLegalPrompt(comprehensiveData);

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are an expert legal consultant providing comprehensive analysis and strategic recommendations for legal practice management. Focus on actionable insights, risk assessment, and strategic planning.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 1500,
      temperature: 0.7,
    });

    const aiResponse = completion.choices[0].message.content;

    // Parse and structure the comprehensive analysis
    return parseComprehensiveLegalResponse(aiResponse, comprehensiveData);
  } catch (error) {
    console.error("Error generating comprehensive legal analysis:", error);
    return generateFallbackComprehensiveLegalAnalysis(data);
  }
};

/**
 * Generate AI insights for credit collection reports
 * @param {Object} data - The credit collection data
 * @param {Object} data.performanceMetrics - Performance data
 * @param {Object} data.revenueAnalytics - Revenue data
 * @param {Object} data.promisedPaymentsAnalytics - Promised payments data
 * @param {Object} data.summary - Summary data
 * @param {string} userRole - User role (debt_collector, credit_head, etc.)
 * @returns {Object} AI-generated insights
 */
export const generateCreditCollectionInsights = async (data, userRole) => {
  try {
    const {
      performanceMetrics,
      revenueAnalytics,
      promisedPaymentsAnalytics,
      summary,
    } = data;

    // Prepare the data for AI analysis
    const analysisData = {
      performance: {
        totalCases: summary?.totalCases || 0,
        resolvedCases: performanceMetrics?.overview?.resolvedCases || 0,
        activeCases: performanceMetrics?.overview?.activeCases || 0,
        resolutionRate: performanceMetrics?.overview?.resolutionRate || 0,
        avgProcessingTime: performanceMetrics?.overview?.avgProcessingTime || 0,
      },
      revenue: {
        totalEscalationFees:
          revenueAnalytics?.overview?.totalEscalationFees || 0,
        totalPaidEscalationFees:
          revenueAnalytics?.overview?.totalPaidEscalationFees || 0,
        totalPendingEscalationFees:
          revenueAnalytics?.overview?.totalPendingEscalationFees || 0,
        paymentRate: revenueAnalytics?.overview?.paymentRate || 0,
      },
      promisedPayments: {
        totalPromisedAmount:
          promisedPaymentsAnalytics?.overview?.totalPromisedAmount || 0,
        totalPaidAmount:
          promisedPaymentsAnalytics?.overview?.totalPaidAmount || 0,
        totalPendingAmount:
          promisedPaymentsAnalytics?.overview?.totalPendingAmount || 0,
        paymentSuccessRate:
          promisedPaymentsAnalytics?.overview?.paymentSuccessRate || 0,
      },
      userRole,
    };

    // Check if we have any meaningful data to analyze
    const hasData =
      analysisData.performance.totalCases > 0 ||
      analysisData.performance.resolvedCases > 0 ||
      analysisData.revenue.totalEscalationFees > 0 ||
      analysisData.promisedPayments.totalPromisedAmount > 0;

    if (!hasData) {
      // Return basic insights for empty data
      return generateFallbackInsights(data);
    }

    // Create the prompt for GPT-3.5
    const prompt = createAnalysisPrompt(analysisData);

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are an expert credit collection analyst. Provide detailed, actionable insights based on the data provided. Be specific, professional, and focus on practical recommendations.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const aiResponse = completion.choices[0].message.content;

    // Parse the AI response and structure it
    return parseAIResponse(aiResponse, analysisData);
  } catch (error) {
    console.error("Error generating AI insights:", error);

    // Fallback to basic insights if AI fails
    return generateFallbackInsights(data);
  }
};

/**
 * Create a detailed prompt for AI analysis
 */
const createAnalysisPrompt = (data) => {
  return `
Analyze this credit collection data and provide comprehensive insights:

PERFORMANCE DATA:
- Total Cases: ${data.performance.totalCases}
- Resolved Cases: ${data.performance.resolvedCases}
- Active Cases: ${data.performance.activeCases}
- Resolution Rate: ${data.performance.resolutionRate}%
- Average Processing Time: ${data.performance.avgProcessingTime} days

REVENUE DATA:
- Total Escalation Fees: $${data.revenue.totalEscalationFees}
- Paid Escalation Fees: $${data.revenue.totalPaidEscalationFees}
- Pending Escalation Fees: $${data.revenue.totalPendingEscalationFees}
- Payment Rate: ${data.revenue.paymentRate}%

PROMISED PAYMENTS DATA:
- Total Promised Amount: $${data.promisedPayments.totalPromisedAmount}
- Total Paid Amount: $${data.promisedPayments.totalPaidAmount}
- Total Pending Amount: $${data.promisedPayments.totalPendingAmount}
- Payment Success Rate: ${data.promisedPayments.paymentSuccessRate}%

USER ROLE: ${data.userRole}

Please provide:
1. Overall performance score (0-100)
2. Key insights for each area (Performance, Revenue, Payments)
3. Specific recommendations for improvement
4. Risk factors to watch
5. Next priority actions
6. Trend analysis

Format your response as JSON with this structure:
{
  "overall": {
    "score": number,
    "trend": "improving|declining|stable",
    "summary": "string"
  },
  "performance": {
    "trend": "improving|needs_attention|critical",
    "insights": ["string"],
    "recommendations": ["string"],
    "priority": "high|medium|low"
  },
  "revenue": {
    "trend": "positive|needs_focus|critical",
    "insights": ["string"],
    "recommendations": ["string"],
    "priority": "high|medium|low"
  },
  "payments": {
    "trend": "good|needs_improvement|critical",
    "insights": ["string"],
    "recommendations": ["string"],
    "priority": "high|medium|low"
  },
  "riskFactors": ["string"],
  "nextActions": ["string"],
  "predictions": {
    "nextMonthRevenue": "string",
    "paymentSuccessRate": "string",
    "caseResolutionRate": "string"
  }
}
`;
};

/**
 * Parse AI response and structure it for frontend
 */
const parseAIResponse = (aiResponse, data) => {
  try {
    // Try to parse JSON response
    const parsed = JSON.parse(aiResponse);
    return {
      overall: {
        score: parsed.overall?.score || calculateFallbackScore(data),
        trend: parsed.overall?.trend || "stable",
        summary: parsed.overall?.summary || "Analysis completed",
      },
      performance: {
        trend: parsed.performance?.trend || "needs_attention",
        insights: parsed.performance?.insights || [
          "Performance analysis available",
        ],
        recommendations: parsed.performance?.recommendations || [
          "Review current strategies",
        ],
        priority: parsed.performance?.priority || "medium",
      },
      revenue: {
        trend: parsed.revenue?.trend || "needs_focus",
        insights: parsed.revenue?.insights || ["Revenue analysis available"],
        recommendations: parsed.revenue?.recommendations || [
          "Focus on revenue generation",
        ],
        priority: parsed.revenue?.priority || "medium",
      },
      payments: {
        trend: parsed.payments?.trend || "needs_improvement",
        insights: parsed.payments?.insights || ["Payment analysis available"],
        recommendations: parsed.payments?.recommendations || [
          "Improve payment collection",
        ],
        priority: parsed.payments?.priority || "medium",
      },
      riskFactors: parsed.riskFactors || [],
      nextActions: parsed.nextActions || ["Continue monitoring"],
      predictions: parsed.predictions || {
        nextMonthRevenue: "Based on current trends",
        paymentSuccessRate: "Monitor closely",
        caseResolutionRate: "Focus on efficiency",
      },
    };
  } catch (error) {
    console.error("Error parsing AI response:", error);
    return generateFallbackInsights({
      performanceMetrics: data.performance,
      revenueAnalytics: data.revenue,
      promisedPaymentsAnalytics: data.promisedPayments,
    });
  }
};

/**
 * Generate fallback insights when AI is not available
 */
const generateFallbackInsights = (data) => {
  const performance = data.performanceMetrics?.overview;
  const revenue = data.revenueAnalytics?.overview;
  const payments = data.promisedPaymentsAnalytics?.overview;

  return {
    overall: {
      score: calculateFallbackScore({ performance, revenue, payments }),
      trend: "stable",
      summary: "Basic analysis completed",
    },
    performance: {
      trend: performance?.resolvedCases > 0 ? "improving" : "needs_attention",
      insights: ["Performance metrics analyzed"],
      recommendations: ["Continue current strategies"],
      priority: "medium",
    },
    revenue: {
      trend: revenue?.totalEscalationFees > 0 ? "positive" : "needs_focus",
      insights: ["Revenue metrics analyzed"],
      recommendations: ["Focus on revenue generation"],
      priority: "medium",
    },
    payments: {
      trend: payments?.totalPaidAmount > 0 ? "good" : "needs_improvement",
      insights: ["Payment metrics analyzed"],
      recommendations: ["Improve payment collection"],
      priority: "medium",
    },
    riskFactors: [],
    nextActions: ["Continue monitoring"],
    predictions: {
      nextMonthRevenue: "Based on current trends",
      paymentSuccessRate: "Monitor closely",
      caseResolutionRate: "Focus on efficiency",
    },
  };
};

/**
 * Calculate fallback score based on available data
 */
const calculateFallbackScore = (data) => {
  let score = 0;
  if (data.performance?.resolvedCases > 0) score += 25;
  if (data.revenue?.totalEscalationFees > 0) score += 25;
  if (data.payments?.totalPaidAmount > 0) score += 25;
  if (data.performance?.totalCases > 0) score += 25;
  return score;
};

/**
 * Generate AI-powered case recommendations
 */
export const generateCaseRecommendations = async (caseData) => {
  try {
    const prompt = `
Analyze this credit case and provide recommendations:

Case Details:
- Debt Amount: $${caseData.debtAmount}
- Case Age: ${caseData.caseAge} days
- Status: ${caseData.status}
- Priority: ${caseData.priority}
- Payment History: ${JSON.stringify(caseData.paymentHistory)}
- Communication History: ${JSON.stringify(caseData.communicationHistory)}

Provide:
1. Recommended next action
2. Optimal follow-up timing
3. Payment strategy
4. Risk assessment
5. Success probability

Format as JSON:
{
  "recommendedAction": "string",
  "followUpTiming": "string",
  "paymentStrategy": "string",
  "riskLevel": "low|medium|high",
  "successProbability": "percentage",
  "insights": ["string"]
}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are an expert credit collection strategist. Provide specific, actionable recommendations for individual cases.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const response = completion.choices[0].message.content;
    return JSON.parse(response);
  } catch (error) {
    console.error("Error generating case recommendations:", error);
    return {
      recommendedAction: "Continue current approach",
      followUpTiming: "Within 3-5 days",
      paymentStrategy: "Negotiate payment plan",
      riskLevel: "medium",
      successProbability: "50%",
      insights: ["Standard collection approach recommended"],
    };
  }
};

/**
 * Generate AI-powered payment predictions
 */
export const generatePaymentPredictions = async (
  paymentHistory,
  debtorProfile
) => {
  try {
    const prompt = `
Predict payment behavior based on this data:

Payment History: ${JSON.stringify(paymentHistory)}
Debtor Profile: ${JSON.stringify(debtorProfile)}

Provide:
1. Likelihood of payment (0-100%)
2. Expected payment amount
3. Optimal payment timing
4. Risk factors
5. Recommended approach

Format as JSON:
{
  "paymentLikelihood": number,
  "expectedAmount": "string",
  "optimalTiming": "string",
  "riskFactors": ["string"],
  "recommendedApproach": "string"
}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are an expert in payment prediction and debtor behavior analysis.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 400,
      temperature: 0.6,
    });

    const response = completion.choices[0].message.content;
    return JSON.parse(response);
  } catch (error) {
    console.error("Error generating payment predictions:", error);
    return {
      paymentLikelihood: 50,
      expectedAmount: "Based on historical data",
      optimalTiming: "Within 30 days",
      riskFactors: ["Standard risk assessment"],
      recommendedApproach: "Standard collection approach",
    };
  }
};

/**
 * Create a detailed prompt for legal analysis
 */
const createLegalAnalysisPrompt = (data) => {
  return `
Analyze this legal case data and provide comprehensive insights:

CASE STATISTICS:
- Total Cases: ${data.totalCases}
- Resolved Cases: ${data.resolvedCases}
- Active Cases: ${data.activeCases}
- Resolution Rate: ${data.resolutionRate}%
- Analysis Period: ${data.period} days

CASE TYPE DISTRIBUTION:
${data.caseTypes
  .map((type) => `- ${type.type}: ${type.count} cases (${type.percentage}%)`)
  .join("\n")}

STATUS DISTRIBUTION:
${data.statusDistribution
  .map(
    (status) =>
      `- ${status.status}: ${status.count} cases (${status.percentage}%)`
  )
  .join("\n")}

PRIORITY DISTRIBUTION:
${data.priorityDistribution
  .map(
    (priority) =>
      `- ${priority.priority}: ${priority.count} cases (${priority.percentage}%)`
  )
  .join("\n")}

USER ROLE: ${data.userRole}

${
  data.advocatePerformance
    ? `
ADVOCATE PERFORMANCE:
- Total Cases: ${data.advocatePerformance.totalCases}
- Resolved Cases: ${data.advocatePerformance.resolvedCases}
- Resolution Rate: ${data.advocatePerformance.resolutionRate}%
`
    : ""
}

Please provide:
1. Overall performance score (0-100)
2. Key insights for case management
3. Specific recommendations for improvement
4. Risk factors to watch
5. Next priority actions
6. Predictions for future performance

Format your response as JSON with this structure:
{
  "overall": {
    "score": number,
    "trend": "improving|declining|stable",
    "summary": "string"
  },
  "performance": {
    "trend": "improving|needs_attention|critical",
    "insights": ["string"],
    "recommendations": ["string"],
    "priority": "high|medium|low"
  },
  "predictions": {
    "nextMonthCases": "string",
    "resolutionRate": "string",
    "successProbability": "string"
  },
  "recommendations": ["string"],
  "riskFactors": ["string"],
  "nextActions": ["string"]
}
`;
};

/**
 * Create comprehensive legal analysis prompt
 */
const createComprehensiveLegalPrompt = (data) => {
  return `
Provide comprehensive legal practice analysis based on this data:

CASE OVERVIEW:
- Total Cases: ${data.statistics?.totalCases || 0}
- Resolved Cases: ${data.statistics?.resolvedCases || 0}
- Active Cases: ${data.statistics?.activeCases || 0}
- Resolution Rate: ${
    data.statistics?.totalCases > 0
      ? (
          (data.statistics.resolvedCases / data.statistics.totalCases) *
          100
        ).toFixed(1)
      : 0
  }%

USER ROLE: ${data.userRole}
ANALYSIS PERIOD: ${data.period} days

${
  data.advocatePerformance
    ? `
ADVOCATE PERFORMANCE:
- Total Cases: ${data.advocatePerformance.totalCases}
- Resolved Cases: ${data.advocatePerformance.resolvedCases}
- Resolution Rate: ${data.advocatePerformance.resolutionRate}%
`
    : ""
}

Provide comprehensive analysis including:
1. Executive summary
2. Performance analysis with insights
3. Case management analysis
4. Strategic recommendations
5. Risk assessment
6. Action plan
7. Future predictions

Format as JSON:
{
  "insights": {
    "overall": {
      "summary": "string"
    },
    "performance": {
      "insights": ["string"],
      "recommendations": ["string"]
    },
    "cases": {
      "insights": ["string"],
      "recommendations": ["string"]
    },
    "strategy": {
      "insights": ["string"],
      "recommendations": ["string"]
    }
  },
  "riskFactors": ["string"],
  "nextActions": ["string"]
}
`;
};

/**
 * Parse legal AI response and structure it for frontend
 */
const parseLegalAIResponse = (aiResponse, data) => {
  try {
    // Try to parse JSON response
    const parsed = JSON.parse(aiResponse);
    return {
      overall: {
        score: parsed.overall?.score || calculateLegalFallbackScore(data),
        trend: parsed.overall?.trend || "stable",
        summary: parsed.overall?.summary || "Legal analysis completed",
      },
      performance: {
        trend: parsed.performance?.trend || "needs_attention",
        insights: parsed.performance?.insights || [
          "Legal performance analysis available",
        ],
        recommendations: parsed.performance?.recommendations || [
          "Review current legal strategies",
        ],
        priority: parsed.performance?.priority || "medium",
      },
      predictions: parsed.predictions || {
        nextMonthCases: "Based on current trends",
        resolutionRate: "Monitor closely",
        successProbability: "Focus on efficiency",
      },
      recommendations: parsed.recommendations || [
        "Schedule regular case reviews",
        "Enhance client communication",
        "Focus on priority cases",
      ],
      riskFactors: parsed.riskFactors || [],
      nextActions: parsed.nextActions || ["Continue monitoring"],
    };
  } catch (error) {
    console.error("Error parsing legal AI response:", error);
    return generateFallbackLegalInsights({
      statistics: data,
    });
  }
};

/**
 * Parse comprehensive legal response
 */
const parseComprehensiveLegalResponse = (aiResponse, data) => {
  try {
    const parsed = JSON.parse(aiResponse);
    return {
      insights: parsed.insights || {
        overall: { summary: "Comprehensive legal analysis completed" },
        performance: { insights: [], recommendations: [] },
        cases: { insights: [], recommendations: [] },
        strategy: { insights: [], recommendations: [] },
      },
      riskFactors: parsed.riskFactors || [],
      nextActions: parsed.nextActions || ["Continue monitoring"],
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error parsing comprehensive legal response:", error);
    return generateFallbackComprehensiveLegalAnalysis(data);
  }
};

/**
 * Generate fallback legal insights when AI is not available
 */
const generateFallbackLegalInsights = (data) => {
  const totalCases = data.statistics?.totalCases || 0;
  const resolvedCases = data.statistics?.resolvedCases || 0;
  const resolutionRate =
    totalCases > 0 ? (resolvedCases / totalCases) * 100 : 0;

  return {
    overall: {
      score: Math.min(100, Math.max(0, resolutionRate * 2)),
      trend: resolutionRate > 50 ? "improving" : "needs_attention",
      summary: `Analysis of ${totalCases} legal cases with ${resolutionRate.toFixed(
        1
      )}% resolution rate`,
    },
    performance: {
      trend: resolutionRate > 50 ? "improving" : "needs_attention",
      insights: [
        `Resolution rate: ${resolutionRate.toFixed(1)}%`,
        `Active cases: ${data.statistics?.activeCases || 0}`,
        `Total cases: ${totalCases}`,
      ],
      recommendations: [
        resolutionRate < 50
          ? "Focus on case resolution strategies"
          : "Maintain current performance",
        "Implement regular case reviews",
        "Enhance client communication",
      ],
      priority:
        resolutionRate < 30 ? "high" : resolutionRate < 60 ? "medium" : "low",
    },
    predictions: {
      nextMonthCases: "Based on current trends",
      resolutionRate: `${Math.min(100, resolutionRate + 10).toFixed(1)}%`,
      successProbability: "Monitor case progress closely",
    },
    recommendations: [
      "Schedule regular case reviews",
      "Enhance client communication",
      "Focus on priority cases",
      "Implement case tracking system",
    ],
    riskFactors:
      resolutionRate < 30
        ? [
            "Low resolution rate",
            "High number of pending cases",
            "Potential client dissatisfaction",
          ]
        : [],
    nextActions: [
      "Review case priorities",
      "Schedule client meetings",
      "Update case documentation",
    ],
  };
};

/**
 * Generate fallback comprehensive legal analysis
 */
const generateFallbackComprehensiveLegalAnalysis = (data) => {
  const totalCases = data.statistics?.totalCases || 0;
  const resolvedCases = data.statistics?.resolvedCases || 0;
  const resolutionRate =
    totalCases > 0 ? (resolvedCases / totalCases) * 100 : 0;

  return {
    insights: {
      overall: {
        summary: `Comprehensive analysis of ${totalCases} legal cases with ${resolutionRate.toFixed(
          1
        )}% resolution rate`,
      },
      performance: {
        insights: [
          `Resolution rate: ${resolutionRate.toFixed(1)}%`,
          `Active cases: ${data.statistics?.activeCases || 0}`,
        ],
        recommendations: [
          "Implement regular case reviews",
          "Enhance client communication",
        ],
      },
      cases: {
        insights: [
          `Total cases managed: ${totalCases}`,
          `Cases resolved: ${resolvedCases}`,
        ],
        recommendations: [
          "Focus on case resolution strategies",
          "Implement case tracking system",
        ],
      },
      strategy: {
        insights: [
          "Current performance analysis completed",
          "Strategic recommendations available",
        ],
        recommendations: [
          "Develop case management strategy",
          "Enhance client relationships",
        ],
      },
    },
    riskFactors:
      resolutionRate < 30
        ? ["Low resolution rate", "High number of pending cases"]
        : [],
    nextActions: [
      "Review case priorities",
      "Schedule client meetings",
      "Update case documentation",
    ],
  };
};

/**
 * Calculate fallback score for legal cases
 */
const calculateLegalFallbackScore = (data) => {
  let score = 0;
  if (data.resolvedCases > 0) score += 30;
  if (data.totalCases > 0) score += 20;
  if (data.resolutionRate > 50) score += 30;
  if (data.advocatePerformance?.resolutionRate > 50) score += 20;
  return Math.min(100, score);
};
