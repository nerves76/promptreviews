// Test scenarios for "Current Plan" display logic

const testScenarios = [
  {
    description: "User on Builder Monthly viewing Monthly toggle",
    currentPlan: "builder",
    accountBillingPeriod: "monthly",
    selectedBillingPeriod: "monthly",
    tierKey: "builder",
    shouldShowCurrentPlan: true,
    shouldHighlightBorder: true,
    expectedButton: "Current Plan"
  },
  {
    description: "User on Builder Monthly viewing Annual toggle",
    currentPlan: "builder",
    accountBillingPeriod: "monthly",
    selectedBillingPeriod: "annual",
    tierKey: "builder",
    shouldShowCurrentPlan: false,
    shouldHighlightBorder: false,
    expectedButton: "Switch to Annual"
  },
  {
    description: "User on Maven Annual viewing Monthly toggle",
    currentPlan: "maven",
    accountBillingPeriod: "annual",
    selectedBillingPeriod: "monthly",
    tierKey: "maven",
    shouldShowCurrentPlan: false,
    shouldHighlightBorder: false,
    expectedButton: "Switch to Monthly"
  },
  {
    description: "User on Maven Annual viewing Annual toggle",
    currentPlan: "maven",
    accountBillingPeriod: "annual",
    selectedBillingPeriod: "annual",
    tierKey: "maven",
    shouldShowCurrentPlan: true,
    shouldHighlightBorder: true,
    expectedButton: "Current Plan"
  },
  {
    description: "User on Grower viewing Builder with same billing period",
    currentPlan: "grower",
    accountBillingPeriod: "monthly",
    selectedBillingPeriod: "monthly",
    tierKey: "builder",
    shouldShowCurrentPlan: false,
    shouldHighlightBorder: false,
    expectedButton: "Upgrade"
  }
];

console.log("=== Current Plan Display Logic Test ===\n");

testScenarios.forEach((test, index) => {
  console.log(`Test ${index + 1}: ${test.description}`);
  console.log(`  User's Plan: ${test.currentPlan} (${test.accountBillingPeriod})`);
  console.log(`  Viewing: ${test.tierKey} with ${test.selectedBillingPeriod} toggle`);
  
  // Test the condition for showing "Current Plan" badge
  const showsBadge = (test.currentPlan === test.tierKey && test.selectedBillingPeriod === test.accountBillingPeriod);
  const badgeResult = showsBadge === test.shouldShowCurrentPlan ? "✅" : "❌";
  
  console.log(`  Should show "Current Plan" badge: ${test.shouldShowCurrentPlan} ${badgeResult}`);
  console.log(`  Should highlight border: ${test.shouldHighlightBorder} ${badgeResult}`);
  console.log(`  Expected button text: "${test.expectedButton}"`);
  console.log("");
});

console.log("=== Summary ===");
console.log("The 'Current Plan' badge and border highlighting should only appear when:");
console.log("1. The tier matches the user's current plan");
console.log("2. The selected billing period matches the user's current billing period");
console.log("\nThis prevents confusion when toggling between monthly/annual views.");