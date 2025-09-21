#!/usr/bin/env node

/**
 * Create test data for debt collector reports
 * This script creates sample debt collectors and credit cases for testing
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import CreditCase from '../models/CreditCase.js';
import User from '../models/User.js';
import LawFirm from '../models/LawFirm.js';
import Department from '../models/Department.js';

// Load environment variables
dotenv.config();

async function createTestData() {
  try {
    console.log('🚀 Creating test data for debt collector reports...\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/law-firm-saas');
    console.log('✅ Connected to MongoDB\n');

    // Step 1: Create or find a law firm
    console.log('1️⃣ Creating/finding law firm...');
    let lawFirm = await LawFirm.findOne({ firmName: 'Martha Law Firm' });
    
    if (!lawFirm) {
      lawFirm = new LawFirm({
        firmName: 'Martha Law Firm',
        firmCode: 'MLF',
        firmEmail: 'admin@marthalaw.com',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
        loginEmail: 'admin@marthalaw.com',
        phone: '+254700000000',
        address: 'Nairobi, Kenya',
        description: 'Professional law firm specializing in debt collection',
        isActive: true,
        registrationStatus: 'approved'
      });
      await lawFirm.save();
      console.log('✅ Created new law firm: Martha Law Firm');
    } else {
      console.log('✅ Found existing law firm: Martha Law Firm');
    }

    // Step 2: Create or find a department
    console.log('\n2️⃣ Creating/finding department...');
    let department = await Department.findOne({ 
      name: 'Credit Collection', 
      lawFirm: lawFirm._id 
    });
    
    if (!department) {
      department = new Department({
        name: 'Credit Collection',
        code: 'CC',
        description: 'Debt collection and credit recovery department',
        lawFirm: lawFirm._id,
        departmentType: 'credit_collection',
        createdBy: lawFirm._id, // Use law firm as creator
        isActive: true
      });
      await department.save();
      console.log('✅ Created new department: Credit Collection');
    } else {
      console.log('✅ Found existing department: Credit Collection');
    }

    // Step 3: Create debt collector users
    console.log('\n3️⃣ Creating debt collector users...');
    
    const debtCollectors = [
      {
        firstName: 'Romano',
        lastName: 'Okinyi',
        email: 'romano.okinyi@marthalaw.com',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
        role: 'debt_collector',
        lawFirm: lawFirm._id,
        department: department._id,
        isActive: true
      },
      {
        firstName: 'Sarah',
        lastName: 'Mwangi',
        email: 'sarah.mwangi@marthalaw.com',
        password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
        role: 'debt_collector',
        lawFirm: lawFirm._id,
        department: department._id,
        isActive: true
      }
    ];

    const createdCollectors = [];
    for (const collectorData of debtCollectors) {
      let collector = await User.findOne({ email: collectorData.email });
      
      if (!collector) {
        collector = new User(collectorData);
        await collector.save();
        console.log(`✅ Created debt collector: ${collector.firstName} ${collector.lastName}`);
      } else {
        console.log(`✅ Found existing debt collector: ${collector.firstName} ${collector.lastName}`);
      }
      createdCollectors.push(collector);
    }

    // Step 4: Create credit cases assigned to debt collectors
    console.log('\n4️⃣ Creating credit cases...');
    
    const creditCases = [
      {
        title: 'Outstanding Loan Payment - John Doe',
        description: 'Client owes KES 150,000 for personal loan taken 6 months ago',
        debtorName: 'John Doe',
        debtorEmail: 'john.doe@email.com',
        debtorContact: '+254712345678',
        creditorName: 'ABC Bank',
        creditorEmail: 'collections@abcbank.com',
        creditorContact: '+254700000001',
        debtAmount: 150000,
        currency: 'KES',
        status: 'resolved',
        priority: 'high',
        assignedTo: createdCollectors[0]._id,
        assignedBy: createdCollectors[0]._id,
        assignedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        lawFirm: lawFirm._id,
        department: department._id,
        caseReference: 'MLF-CC-2024-0001',
        tags: ['loan', 'bank', 'resolved']
      },
      {
        title: 'Credit Card Debt - Jane Smith',
        description: 'Outstanding credit card balance of KES 75,000',
        debtorName: 'Jane Smith',
        debtorEmail: 'jane.smith@email.com',
        debtorContact: '+254723456789',
        creditorName: 'XYZ Credit Union',
        creditorEmail: 'debt@xyzcredit.com',
        creditorContact: '+254700000002',
        debtAmount: 75000,
        currency: 'KES',
        status: 'in_progress',
        priority: 'medium',
        assignedTo: createdCollectors[0]._id,
        assignedBy: createdCollectors[0]._id,
        assignedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
        lawFirm: lawFirm._id,
        department: department._id,
        caseReference: 'MLF-CC-2024-0002',
        tags: ['credit-card', 'in-progress']
      },
      {
        title: 'Business Loan Default - Tech Solutions Ltd',
        description: 'Company owes KES 500,000 for business loan default',
        debtorName: 'Tech Solutions Ltd',
        debtorEmail: 'finance@techsolutions.co.ke',
        debtorContact: '+254734567890',
        creditorName: 'Commercial Bank',
        creditorEmail: 'recovery@commercialbank.com',
        creditorContact: '+254700000003',
        debtAmount: 500000,
        currency: 'KES',
        status: 'assigned',
        priority: 'urgent',
        assignedTo: createdCollectors[0]._id,
        assignedBy: createdCollectors[0]._id,
        assignedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        lawFirm: lawFirm._id,
        department: department._id,
        caseReference: 'MLF-CC-2024-0003',
        tags: ['business-loan', 'urgent']
      },
      {
        title: 'Personal Loan - Mary Wanjiku',
        description: 'Personal loan of KES 200,000 overdue by 3 months',
        debtorName: 'Mary Wanjiku',
        debtorEmail: 'mary.wanjiku@email.com',
        debtorContact: '+254745678901',
        creditorName: 'Microfinance Bank',
        creditorEmail: 'collections@microbank.com',
        creditorContact: '+254700000004',
        debtAmount: 200000,
        currency: 'KES',
        status: 'resolved',
        priority: 'high',
        assignedTo: createdCollectors[1]._id,
        assignedBy: createdCollectors[1]._id,
        assignedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
        lawFirm: lawFirm._id,
        department: department._id,
        caseReference: 'MLF-CC-2024-0004',
        tags: ['personal-loan', 'resolved']
      },
      {
        title: 'Vehicle Loan - Peter Kamau',
        description: 'Car loan default of KES 300,000',
        debtorName: 'Peter Kamau',
        debtorEmail: 'peter.kamau@email.com',
        debtorContact: '+254756789012',
        creditorName: 'Auto Finance Ltd',
        creditorEmail: 'recovery@autofinance.com',
        creditorContact: '+254700000005',
        debtAmount: 300000,
        currency: 'KES',
        status: 'follow_up_required',
        priority: 'medium',
        assignedTo: createdCollectors[1]._id,
        assignedBy: createdCollectors[1]._id,
        assignedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
        lawFirm: lawFirm._id,
        department: department._id,
        caseReference: 'MLF-CC-2024-0005',
        tags: ['vehicle-loan', 'follow-up']
      },
      {
        title: 'Student Loan - Grace Akinyi',
        description: 'Education loan of KES 100,000 in default',
        debtorName: 'Grace Akinyi',
        debtorEmail: 'grace.akinyi@email.com',
        debtorContact: '+254767890123',
        creditorName: 'Education Finance',
        creditorEmail: 'collections@edufinance.com',
        creditorContact: '+254700000006',
        debtAmount: 100000,
        currency: 'KES',
        status: 'escalated_to_legal',
        priority: 'high',
        assignedTo: createdCollectors[0]._id,
        assignedBy: createdCollectors[0]._id,
        assignedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
        lawFirm: lawFirm._id,
        department: department._id,
        caseReference: 'MLF-CC-2024-0006',
        tags: ['student-loan', 'escalated']
      }
    ];

    let createdCases = 0;
    for (const caseData of creditCases) {
      let existingCase = await CreditCase.findOne({ caseReference: caseData.caseReference });
      
      if (!existingCase) {
        const creditCase = new CreditCase(caseData);
        await creditCase.save();
        createdCases++;
        console.log(`✅ Created credit case: ${creditCase.title} (${creditCase.caseReference})`);
      } else {
        console.log(`✅ Found existing credit case: ${existingCase.title} (${existingCase.caseReference})`);
      }
    }

    // Step 5: Create promised payments for some cases
    console.log('\n5️⃣ Creating promised payments...');
    
    const casesWithPromises = await CreditCase.find({ 
      status: { $in: ['in_progress', 'follow_up_required'] },
      lawFirm: lawFirm._id 
    }).limit(3);

    for (const case_ of casesWithPromises) {
      const promisedPayment = {
        amount: Math.floor(case_.debtAmount * 0.3), // 30% of debt amount
        currency: 'KES',
        promisedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        status: 'pending',
        notes: 'First installment payment promised',
        createdBy: case_.assignedTo
      };
      
      case_.promisedPayments.push(promisedPayment);
      await case_.save();
      console.log(`✅ Added promised payment of KES ${promisedPayment.amount.toLocaleString()} for case: ${case_.title}`);
    }

    // Step 6: Summary
    console.log('\n📊 Test Data Summary:');
    console.log(`   Law Firm: ${lawFirm.firmName}`);
    console.log(`   Department: ${department.name}`);
    console.log(`   Debt Collectors: ${createdCollectors.length}`);
    console.log(`   Credit Cases: ${createdCases} new cases created`);
    console.log(`   Total Cases in System: ${await CreditCase.countDocuments({ lawFirm: lawFirm._id })}`);

    // Step 7: Show statistics for Romano Okinyi (the user from your report)
    console.log('\n👤 Romano Okinyi Statistics:');
    const romano = createdCollectors.find(c => c.firstName === 'Romano');
    if (romano) {
      const romanoCases = await CreditCase.find({ assignedTo: romano._id });
      const resolvedCases = romanoCases.filter(c => c.status === 'resolved');
      const totalDebtAmount = romanoCases.reduce((sum, c) => sum + (c.debtAmount || 0), 0);
      const collectedAmount = resolvedCases.reduce((sum, c) => sum + (c.debtAmount || 0), 0);
      const collectionRate = totalDebtAmount > 0 ? (collectedAmount / totalDebtAmount) * 100 : 0;

      console.log(`   Total Cases: ${romanoCases.length}`);
      console.log(`   Resolved Cases: ${resolvedCases.length}`);
      console.log(`   Collection Rate: ${collectionRate.toFixed(1)}%`);
      console.log(`   Total Debt Amount: KES ${totalDebtAmount.toLocaleString()}`);
      console.log(`   Collected Amount: KES ${collectedAmount.toLocaleString()}`);
      console.log(`   Outstanding Amount: KES ${(totalDebtAmount - collectedAmount).toLocaleString()}`);
    }

    console.log('\n🎉 Test data creation completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('   1. Login as Romano Okinyi (romano.okinyi@marthalaw.com / password)');
    console.log('   2. Go to Legal Reports page');
    console.log('   3. You should now see real data instead of zeros!');

  } catch (error) {
    console.error('❌ Error creating test data:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

// Run the script
createTestData();
