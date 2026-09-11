import assert from 'node:assert/strict';
import { getDb, saveDb } from './src/lib/db';

async function runTests() {
  console.log('🧪 Starting Transactions & Deletion Workflow Test Suite...\n');

  // Test 1: In-memory DB structure and default fallback
  const db = getDb();
  assert.ok(db.settings, 'AppSettings should exist');
  assert.ok(Array.isArray(db.contributions), 'Contributions array should exist');
  assert.ok(Array.isArray(db.expenses), 'Expenses array should exist');
  assert.ok(Array.isArray(db.programmes), 'Programmes array should exist');
  console.log('✅ Test 1 Passed: Database schema initialization verified');

  // Test 2: Adding a contribution & verifying state
  const testContribId = `test-cnt-${Date.now()}`;
  db.contributions.push({
    id: testContribId,
    receiptNo: `REC-TEST-${Date.now()}`,
    amount: 1000,
    paymentMode: 'CASH',
    date: new Date().toISOString(),
    memberId: 'usr-test-1',
    memberName: 'Test Member',
    memberArea: 'Sector 1 / Wing A',
    collectorId: 'luhurenbaiclub@gmail.com',
    collectorName: 'Super Admin',
    status: 'APPROVED',
    isSelfContribution: false,
    isPrivate: false
  });
  saveDb(db);

  let updatedDb = getDb();
  let found = updatedDb.contributions.find(c => c.id === testContribId);
  assert.ok(found, 'Added contribution should exist in DB');
  assert.equal(found.amount, 1000, 'Contribution amount should be 1000');
  console.log('✅ Test 2 Passed: Create transaction state verified');

  // Test 3: Updating contribution (e.g. toggle privacy)
  found.isPrivate = true;
  saveDb(updatedDb);
  let updatedDb2 = getDb();
  let found2 = updatedDb2.contributions.find(c => c.id === testContribId);
  assert.equal(found2?.isPrivate, true, 'Contribution should be marked private');
  console.log('✅ Test 3 Passed: Update transaction state verified');

  // Test 4: Delete collection workflow & verifying complete removal
  updatedDb2.contributions = updatedDb2.contributions.filter(c => c.id !== testContribId);
  saveDb(updatedDb2);
  let finalDb = getDb();
  let deletedFound = finalDb.contributions.find(c => c.id === testContribId);
  assert.equal(deletedFound, undefined, 'Deleted contribution must no longer exist in DB state');
  console.log('✅ Test 4 Passed: Delete transaction workflow verified');

  // Test 5: Programme Deletion Workflow
  const testProgId = `test-prog-${Date.now()}`;
  finalDb.programmes.push({
    id: testProgId,
    title: 'Test Programme',
    description: 'Test Description',
    dateTime: new Date().toISOString(),
    createdAt: new Date().toISOString()
  });
  saveDb(finalDb);
  assert.ok(getDb().programmes.find(p => p.id === testProgId), 'Programme should be created');

  finalDb.programmes = finalDb.programmes.filter(p => p.id !== testProgId);
  saveDb(finalDb);
  assert.equal(getDb().programmes.find(p => p.id === testProgId), undefined, 'Deleted programme must no longer exist');
  console.log('✅ Test 5 Passed: Programme deletion workflow verified');

  // Test 6: User Deletion Workflow
  const testUserId = `usr-test-${Date.now()}`;
  const testUserEmail = `testuser_${Date.now()}@example.com`;
  finalDb.users.push({
    id: testUserId,
    name: 'Test User Delete',
    email: testUserEmail,
    role: 'MEMBER',
    createdAt: new Date().toISOString()
  });
  finalDb.roleAssignments[testUserEmail] = {
    email: testUserEmail,
    role: 'MEMBER',
    assignedBy: 'SUPER_ADMIN',
    updatedAt: new Date().toISOString()
  };
  saveDb(finalDb);

  assert.ok(getDb().users.find(u => u.id === testUserId), 'Test user created');
  assert.ok(getDb().roleAssignments[testUserEmail], 'Role assignment created');

  finalDb.users = finalDb.users.filter(u => u.id !== testUserId);
  delete finalDb.roleAssignments[testUserEmail];
  saveDb(finalDb);

  assert.equal(getDb().users.find(u => u.id === testUserId), undefined, 'Deleted user must be removed');
  assert.equal(getDb().roleAssignments[testUserEmail], undefined, 'Deleted user role assignment must be removed');
  console.log('✅ Test 6 Passed: User deletion workflow verified');

  console.log('\n🎉 ALL TEST CASES PASSED SUCCESSFULLY!');
}

runTests().catch(err => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
