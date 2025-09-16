import { getPlanTransitionMessage, getSuccessMessage } from '../planMessages';

type PlanKey = 'grower' | 'builder' | 'maven';
type BillingPeriod = 'monthly' | 'annual';

describe('Plan Transition Messages - All 30 Combinations', () => {
  const plans: PlanKey[] = ['grower', 'builder', 'maven'];
  const billingPeriods: BillingPeriod[] = ['monthly', 'annual'];
  
  // Generate all possible combinations
  const allCombinations: Array<{
    from: { plan: PlanKey; billing: BillingPeriod };
    to: { plan: PlanKey; billing: BillingPeriod };
    type: 'upgrade' | 'downgrade' | 'billing_change' | 'same';
  }> = [];

  plans.forEach(fromPlan => {
    billingPeriods.forEach(fromBilling => {
      plans.forEach(toPlan => {
        billingPeriods.forEach(toBilling => {
          // Skip identical combinations
          if (fromPlan === toPlan && fromBilling === toBilling) {
            return;
          }
          
          const planOrder = { grower: 1, builder: 2, maven: 3 };
          let type: 'upgrade' | 'downgrade' | 'billing_change' | 'same';
          
          if (fromPlan === toPlan) {
            type = 'billing_change';
          } else if (planOrder[toPlan] > planOrder[fromPlan]) {
            type = 'upgrade';
          } else {
            type = 'downgrade';
          }
          
          allCombinations.push({
            from: { plan: fromPlan, billing: fromBilling },
            to: { plan: toPlan, billing: toBilling },
            type,
          });
        });
      });
    });
  });

  describe('Upgrades (12 combinations)', () => {
    const upgrades = allCombinations.filter(c => c.type === 'upgrade');
    
    test.each(upgrades)(
      'Upgrade from $from.plan ($from.billing) to $to.plan ($to.billing)',
      ({ from, to }) => {
        const message = getPlanTransitionMessage(from.plan, from.billing, to.plan, to.billing);
        
        expect(message).toBeDefined();
        expect(message.title).toContain('Upgrade');
        expect(message.confirmButtonClass).toContain('slate-blue');
        expect(message.icon).toBe('upgrade');
        expect(message.benefits).toBeDefined();
        expect(message.benefits!.length).toBeGreaterThan(0);
        expect(message.warnings).toBeUndefined();
      }
    );
  });

  describe('Downgrades (12 combinations)', () => {
    const downgrades = allCombinations.filter(c => c.type === 'downgrade');
    
    test.each(downgrades)(
      'Downgrade from $from.plan ($from.billing) to $to.plan ($to.billing)',
      ({ from, to }) => {
        const message = getPlanTransitionMessage(from.plan, from.billing, to.plan, to.billing);
        
        expect(message).toBeDefined();
        expect(message.title).toContain('Downgrade');
        expect(message.confirmButtonClass).toContain('red');
        expect(message.icon).toBe('downgrade');
        expect(message.warnings).toBeDefined();
        expect(message.warnings!.length).toBeGreaterThan(0);
      }
    );
  });

  describe('Billing Period Changes (6 combinations)', () => {
    const billingChanges = allCombinations.filter(c => c.type === 'billing_change');
    
    test.each(billingChanges)(
      'Billing change for $from.plan from $from.billing to $to.billing',
      ({ from, to }) => {
        const message = getPlanTransitionMessage(from.plan, from.billing, to.plan, to.billing);
        
        expect(message).toBeDefined();
        expect(message.title).toContain('Switch to');
        expect(message.title).toContain(to.billing === 'annual' ? 'Annual' : 'Monthly');
        expect(message.confirmButtonClass).toContain('slate-blue');
        expect(message.icon).toBe('switch');
        expect(message.benefits).toBeDefined();
        
        if (to.billing === 'annual') {
          expect(message.subtitle).toContain('Save 15%');
        }
      }
    );
  });

  describe('Message Content Validation', () => {
    test('Grower to Builder upgrade shows correct features', () => {
      const message = getPlanTransitionMessage('grower', 'monthly', 'builder', 'monthly');
      
      expect(message.benefits).toContainEqual(expect.stringContaining('3 team members'));
      expect(message.benefits).toContainEqual(expect.stringContaining('50 Prompt Pages'));
      expect(message.benefits).toContainEqual(expect.stringContaining('1,000 contacts'));
      expect(message.benefits).toContainEqual(expect.stringContaining('Google Business Profile'));
      expect(message.benefits).toContainEqual(expect.stringContaining('Workflow management'));
    });

    test('Maven to Grower downgrade shows correct warnings', () => {
      const message = getPlanTransitionMessage('maven', 'monthly', 'grower', 'monthly');
      
      expect(message.warnings).toContainEqual(expect.stringContaining('1 team member'));
      expect(message.warnings).toContainEqual(expect.stringContaining('3 Prompt Pages'));
      expect(message.warnings).toContainEqual(expect.stringContaining('Contact upload'));
      expect(message.warnings).toContainEqual(expect.stringContaining('Google Business Profile'));
      expect(message.warnings).toContainEqual(expect.stringContaining('Workflow management'));
    });

    test('Annual billing switch shows savings', () => {
      const message = getPlanTransitionMessage('builder', 'monthly', 'builder', 'annual');
      
      expect(message.benefits).toContainEqual(expect.stringContaining('Save 15%'));
      expect(message.benefits).toContainEqual(expect.stringContaining('Lock in your rate'));
    });
  });
});

describe('Success Messages', () => {
  test('New user message', () => {
    const message = getSuccessMessage('new');
    expect(message.title).toContain('Welcome');
    expect(message.message).toContain('ready to start');
  });

  test('Upgrade success message', () => {
    const message = getSuccessMessage('upgrade', 'grower', 'builder');
    expect(message.title).toContain('Upgraded to Builder');
    expect(message.message).toContain('Grower to Builder');
  });

  test('Downgrade success message', () => {
    const message = getSuccessMessage('downgrade', 'maven', 'builder');
    expect(message.title).toContain('Plan Changed Successfully');
    expect(message.message).toContain('Maven to Builder');
    expect(message.message).toContain('end of your current billing period');
  });

  test('Billing period change message', () => {
    const message = getSuccessMessage('billing_period', undefined, undefined, 'annual');
    expect(message.title).toContain('Billing Period Updated');
    expect(message.message).toContain('save 15%');
  });
});

// Summary test to ensure we cover all 30 combinations
describe('Coverage Check', () => {
  test('All 30 unique combinations are tested', () => {
    expect(allCombinations.length).toBe(30);
    
    // Verify distribution
    const upgrades = allCombinations.filter(c => c.type === 'upgrade');
    const downgrades = allCombinations.filter(c => c.type === 'downgrade');
    const billingChanges = allCombinations.filter(c => c.type === 'billing_change');
    
    expect(upgrades.length).toBe(12); // 2 plans * 2 billing * 3 target combinations
    expect(downgrades.length).toBe(12); // Same but reversed
    expect(billingChanges.length).toBe(6); // 3 plans * 2 billing switches
  });

  test('Each combination returns a valid message', () => {
    allCombinations.forEach(({ from, to }) => {
      const message = getPlanTransitionMessage(from.plan, from.billing, to.plan, to.billing);
      
      expect(message).toBeDefined();
      expect(message.title).toBeTruthy();
      expect(message.subtitle).toBeTruthy();
      expect(message.confirmButtonText).toBeTruthy();
      expect(message.confirmButtonClass).toBeTruthy();
    });
  });
});