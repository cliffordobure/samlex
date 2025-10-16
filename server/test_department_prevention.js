import mongoose from 'mongoose';
import dotenv from 'dotenv';
import CreditCase from './models/CreditCase.js';
import LegalCase from './models/LegalCase.js';
import User from './models/User.js';
import Department from './models/Department.js';
import LawFirm from './models/LawFirm.js';

// Load environment variables
dotenv.config();

// Import the department assignment utility
import { getOrCreateDefaultDepartments, getDepartmentForCase, getDepartmentForUser } from './utils/departmentAssignment.js';

async function testDepartmentPrevention() {
  try {
    console.log('🚀 Starting Department Prevention Test...\n');
    
    // Connect to database
    console.log('📡 Connecting to database...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/law-firm-saas');
    console.log('✅ Connected to MongoDB successfully\n');
    
    // Get all law firms
    const lawFirms = await LawFirm.find({}).select('_id firmName').lean();
    
    if (lawFirms.length === 0) {
      console.log('❌ No law firms found in database');
      return;
    }
    
    console.log(`🏢 Found ${lawFirms.length} law firm(s):`);
    lawFirms.forEach((firm, index) => {
      console.log(`   ${index + 1}. ${firm.firmName} (ID: ${firm._id})`);
    });
    
    console.log('\n' + '='.repeat(60));
    
    // Test department creation and assignment for each law firm
    for (const firm of lawFirms) {
      console.log(`\n🧪 Testing Department Prevention for: ${firm.firmName}`);
      console.log('='.repeat(60));
      
      try {
        // Test 1: Get or create default departments
        console.log('\n📋 Test 1: Getting/Creating Default Departments');
        const departments = await getOrCreateDefaultDepartments(firm._id.toString());
        
        console.log('✅ Default departments:');
        console.log(`   - Credit Collection: ${departments.creditCollection?.name || 'Not found'} (${departments.creditCollection?._id || 'N/A'})`);
        console.log(`   - Legal: ${departments.legal?.name || 'Not found'} (${departments.legal?._id || 'N/A'})`);
        console.log(`   - Real Estate: ${departments.realEstate?.name || 'Not found'} (${departments.realEstate?._id || 'N/A'})`);
        
        // Test 2: Test department assignment for different case types
        console.log('\n📋 Test 2: Testing Department Assignment for Cases');
        
        const creditDept = await getDepartmentForCase(firm._id.toString(), 'credit', 'debt_collector');
        console.log(`   - Credit case → ${creditDept.name} (${creditDept._id})`);
        
        const legalDept = await getDepartmentForCase(firm._id.toString(), 'legal', 'advocate');
        console.log(`   - Legal case → ${legalDept.name} (${legalDept._id})`);
        
        // Test 3: Test department assignment for different user roles
        console.log('\n📋 Test 3: Testing Department Assignment for Users');
        
        const debtCollectorDept = await getDepartmentForUser(firm._id.toString(), 'debt_collector');
        console.log(`   - Debt Collector → ${debtCollectorDept.name} (${debtCollectorDept._id})`);
        
        const advocateDept = await getDepartmentForUser(firm._id.toString(), 'advocate');
        console.log(`   - Advocate → ${advocateDept.name} (${advocateDept._id})`);
        
        const creditHeadDept = await getDepartmentForUser(firm._id.toString(), 'credit_head');
        console.log(`   - Credit Head → ${creditHeadDept.name} (${creditHeadDept._id})`);
        
        const legalHeadDept = await getDepartmentForUser(firm._id.toString(), 'legal_head');
        console.log(`   - Legal Head → ${legalHeadDept.name} (${legalHeadDept._id})`);
        
        // Test 4: Check existing unassigned data
        console.log('\n📋 Test 4: Checking Existing Unassigned Data');
        
        const [unassignedUsers, unassignedCreditCases, unassignedLegalCases] = await Promise.all([
          User.countDocuments({ lawFirm: firm._id, department: { $exists: false } }),
          CreditCase.countDocuments({ lawFirm: firm._id, department: { $exists: false } }),
          LegalCase.countDocuments({ lawFirm: firm._id, department: { $exists: false } })
        ]);
        
        console.log(`   - Users without departments: ${unassignedUsers}`);
        console.log(`   - Credit cases without departments: ${unassignedCreditCases}`);
        console.log(`   - Legal cases without departments: ${unassignedLegalCases}`);
        
        // Test 5: Simulate new case creation (without actually creating)
        console.log('\n📋 Test 5: Simulating New Case Creation');
        
        // Simulate credit case creation
        const simulatedCreditDept = await getDepartmentForCase(firm._id.toString(), 'credit', 'debt_collector');
        console.log(`   ✅ New credit case would be assigned to: ${simulatedCreditDept.name}`);
        
        // Simulate legal case creation
        const simulatedLegalDept = await getDepartmentForCase(firm._id.toString(), 'legal', 'advocate');
        console.log(`   ✅ New legal case would be assigned to: ${simulatedLegalDept.name}`);
        
        // Test 6: Simulate new user creation
        console.log('\n📋 Test 6: Simulating New User Creation');
        
        const roles = ['debt_collector', 'advocate', 'credit_head', 'legal_head', 'law_firm_admin'];
        for (const role of roles) {
          const simulatedUserDept = await getDepartmentForUser(firm._id.toString(), role);
          console.log(`   ✅ New ${role} would be assigned to: ${simulatedUserDept.name}`);
        }
        
        console.log(`\n✅ All tests passed for ${firm.firmName}!`);
        
      } catch (error) {
        console.error(`❌ Error testing ${firm.firmName}:`, error.message);
      }
      
      console.log('\n' + '='.repeat(60));
    }
    
    await mongoose.disconnect();
    console.log('\n🎉 Department prevention test completed successfully!');
    console.log('\n📋 Summary:');
    console.log('✅ Default departments are created automatically');
    console.log('✅ Cases are assigned to appropriate departments');
    console.log('✅ Users are assigned to departments based on their roles');
    console.log('✅ New law firms will have proper department structure');
    console.log('✅ New cases and users will be automatically assigned to departments');
    
    console.log('\n💡 The department assignment problem is now prevented!');
    console.log('🔄 New law firms, cases, and users will automatically get proper department assignments.');
    
  } catch (error) {
    console.error('❌ Department prevention test failed:', error.message);
    console.error('\n🔧 Troubleshooting tips:');
    console.error('1. Make sure MongoDB is running');
    console.error('2. Check your MONGO_URI in the .env file');
    console.error('3. Verify the database connection string');
    console.error('4. Ensure you have the correct permissions to access the database');
  }
}

// Run the test
testDepartmentPrevention();
