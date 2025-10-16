import mongoose from 'mongoose';
import dotenv from 'dotenv';
import CreditCase from './models/CreditCase.js';
import LegalCase from './models/LegalCase.js';
import User from './models/User.js';
import Department from './models/Department.js';
import LawFirm from './models/LawFirm.js';

// Load environment variables
dotenv.config();

// Import the overview data function from the controller
const getOverviewData = async (lawFirmId) => {
  console.log(`🔍 Fetching overview data for law firm: ${lawFirmId}`);
  
  // Validate law firm exists
  const lawFirm = await LawFirm.findById(lawFirmId);
  if (!lawFirm) {
    console.error(`❌ Law firm not found: ${lawFirmId}`);
    throw new Error(`Law firm not found: ${lawFirmId}`);
  }
  
  console.log(`✅ Law firm found: ${lawFirm.firmName}`);
  
  const [users, departments, creditCases, legalCases] = await Promise.all([
    User.find({ lawFirm: lawFirmId }).lean(),
    Department.find({ lawFirm: lawFirmId }).lean(),
    CreditCase.find({ lawFirm: lawFirmId }).lean(),
    LegalCase.find({ lawFirm: lawFirmId }).lean()
  ]);
  
  console.log(`📊 Raw data counts:`);
  console.log(`- Users: ${users.length}`);
  console.log(`- Departments: ${departments.length}`);
  console.log(`- Credit Cases: ${creditCases.length}`);
  console.log(`- Legal Cases: ${legalCases.length}`);

  // Calculate department performance
  const departmentPerformance = departments.map(dept => {
    const deptUsers = users.filter(u => 
      u.department && u.department.toString() === dept._id.toString()
    );
    
    const deptCreditCases = creditCases.filter(c => 
      c.department && c.department.toString() === dept._id.toString()
    );
    
    const deptLegalCases = legalCases.filter(c => 
      c.department && c.department.toString() === dept._id.toString()
    );

    const allDeptCases = [...deptCreditCases, ...deptLegalCases];
    const resolvedCases = allDeptCases.filter(c => 
      ['resolved', 'closed'].includes(c.status)
    );

    return {
      ...dept,
      memberCount: deptUsers.length,
      caseCount: allDeptCases.length,
      resolvedCases: resolvedCases.length,
      completionRate: allDeptCases.length > 0 ? 
        Math.round((resolvedCases.length / allDeptCases.length) * 100) : 0
    };
  });

  // Get recent activity - show more items and better data
  const allCases = [...creditCases, ...legalCases];
  const recentActivity = allCases
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
    .slice(0, 50) // Increased from 20 to 50
    .map(caseItem => ({
      date: new Date(caseItem.updatedAt || caseItem.createdAt).toLocaleDateString(),
      type: caseItem.caseType || (creditCases.includes(caseItem) ? 'Credit Collection' : 'Legal'),
      description: caseItem.title || caseItem.caseNumber || 'No title',
      status: caseItem.status || 'Unknown'
    }));
  
  console.log(`📈 Recent activity items: ${recentActivity.length}`);

  // Get top performers
  const userStats = {};
  allCases.forEach(caseItem => {
    if (caseItem.assignedTo) {
      const userId = caseItem.assignedTo.toString();
      if (!userStats[userId]) {
        userStats[userId] = { resolved: 0, total: 0 };
      }
      userStats[userId].total++;
      if (['resolved', 'closed'].includes(caseItem.status)) {
        userStats[userId].resolved++;
      }
    }
  });

  const topPerformers = Object.entries(userStats)
    .map(([userId, stats]) => {
      const user = users.find(u => u._id.toString() === userId);
      if (!user) return null;
      
      const resolutionRate = stats.total > 0 ? (stats.resolved / stats.total) * 100 : 0;
      return {
        name: `${user.firstName} ${user.lastName}`,
        role: user.role,
        resolvedCases: stats.resolved,
        totalCases: stats.total,
        resolutionRate: Math.round(resolutionRate * 100) / 100
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.resolutionRate - a.resolutionRate)
    .slice(0, 10);

  // Calculate comprehensive revenue from all sources
  const paidLegalCases = legalCases.filter(c => c.filingFee && c.filingFee.paid === true);
  const filingFees = paidLegalCases.reduce((sum, c) => sum + (c.filingFee?.amount || 0), 0);
  
  const resolvedCreditCases = creditCases.filter(c => c.status === 'resolved');
  const moneyRecovered = resolvedCreditCases.reduce((sum, c) => sum + (c.debtAmount || 0), 0);
  
  const totalRevenue = filingFees + moneyRecovered;

  // Calculate final statistics with detailed logging
  const finalStats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.isActive !== false).length, // Changed to include users without isActive field
    totalDepartments: departments.length,
    totalCreditCases: creditCases.length,
    totalLegalCases: legalCases.length,
    escalatedCases: creditCases.filter(c => c.status === 'escalated_to_legal').length,
    pendingCases: allCases.filter(c => ['new', 'pending_assignment'].includes(c.status)).length,
    resolvedCases: allCases.filter(c => ['resolved', 'closed'].includes(c.status)).length,
    totalRevenue: totalRevenue,
    departments: departmentPerformance,
    recentActivity,
    topPerformers
  };
  
  console.log(`📊 Final statistics:`);
  console.log(`- Total Users: ${finalStats.totalUsers}`);
  console.log(`- Active Users: ${finalStats.activeUsers}`);
  console.log(`- Total Credit Cases: ${finalStats.totalCreditCases}`);
  console.log(`- Total Legal Cases: ${finalStats.totalLegalCases}`);
  console.log(`- Escalated Cases: ${finalStats.escalatedCases}`);
  console.log(`- Pending Cases: ${finalStats.pendingCases}`);
  console.log(`- Resolved Cases: ${finalStats.resolvedCases}`);
  console.log(`- Total Revenue: ${finalStats.totalRevenue}`);
  console.log(`- Departments: ${finalStats.departments.length}`);
  console.log(`- Top Performers: ${finalStats.topPerformers.length}`);
  
  return finalStats;
};

async function debugReportData() {
  try {
    console.log('🚀 Starting Report Debug Test...\n');
    
    // Try to connect to database
    console.log('📡 Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/law-firm-saas');
    console.log('✅ Connected to MongoDB successfully\n');
    
    // Get all law firms
    console.log('🏢 Fetching all law firms...');
    const lawFirms = await LawFirm.find({}).select('_id firmName').lean();
    
    if (lawFirms.length === 0) {
      console.log('❌ No law firms found in database');
      return;
    }
    
    console.log(`✅ Found ${lawFirms.length} law firm(s):`);
    lawFirms.forEach((firm, index) => {
      console.log(`   ${index + 1}. ${firm.firmName} (ID: ${firm._id})`);
    });
    
    console.log('\n' + '='.repeat(60));
    
    // Test overview data for each law firm
    for (const firm of lawFirms) {
      console.log(`\n🔍 Testing Overview Data for: ${firm.firmName}`);
      console.log('='.repeat(60));
      
      try {
        const overviewData = await getOverviewData(firm._id.toString());
        
        console.log('\n📋 OVERVIEW REPORT RESULTS:');
        console.log('='.repeat(40));
        console.log(`📊 Executive Summary:`);
        console.log(`   • Total Credit Cases: ${overviewData.totalCreditCases}`);
        console.log(`   • Total Legal Cases: ${overviewData.totalLegalCases}`);
        console.log(`   • Total Users: ${overviewData.totalUsers}`);
        console.log(`   • Active Users: ${overviewData.activeUsers}`);
        console.log(`   • Escalated Cases: ${overviewData.escalatedCases}`);
        console.log(`   • Pending Cases: ${overviewData.pendingCases}`);
        console.log(`   • Resolved Cases: ${overviewData.resolvedCases}`);
        console.log(`   • Total Revenue: KES ${overviewData.totalRevenue.toLocaleString()}`);
        
        if (overviewData.departments.length > 0) {
          console.log(`\n🏢 Department Performance:`);
          overviewData.departments.forEach(dept => {
            console.log(`   • ${dept.name} (${dept.departmentType}):`);
            console.log(`     - Members: ${dept.memberCount}`);
            console.log(`     - Total Cases: ${dept.caseCount}`);
            console.log(`     - Resolved: ${dept.resolvedCases}`);
            console.log(`     - Completion Rate: ${dept.completionRate}%`);
          });
        }
        
        if (overviewData.topPerformers.length > 0) {
          console.log(`\n⭐ Top Performers:`);
          overviewData.topPerformers.forEach(performer => {
            console.log(`   • ${performer.name} (${performer.role}):`);
            console.log(`     - Cases: ${performer.resolvedCases}/${performer.totalCases}`);
            console.log(`     - Success Rate: ${performer.resolutionRate}%`);
          });
        }
        
        console.log(`\n📅 Recent Activity (${overviewData.recentActivity.length} items):`);
        overviewData.recentActivity.slice(0, 10).forEach(activity => {
          console.log(`   • ${activity.date}: ${activity.description} (${activity.status})`);
        });
        
      } catch (error) {
        console.error(`❌ Error testing ${firm.firmName}:`, error.message);
      }
      
      console.log('\n' + '='.repeat(60));
    }
    
    await mongoose.disconnect();
    console.log('\n✅ Debug test completed successfully!');
    console.log('\n💡 Compare the results above with your Executive Overview Report to identify any discrepancies.');
    
  } catch (error) {
    console.error('❌ Debug test failed:', error.message);
    console.error('\n🔧 Troubleshooting tips:');
    console.error('1. Make sure MongoDB is running');
    console.error('2. Check your MONGO_URI in the .env file');
    console.error('3. Verify the database connection string');
    console.error('4. Ensure you have the correct permissions to access the database');
  }
}

// Run the debug test
debugReportData();
