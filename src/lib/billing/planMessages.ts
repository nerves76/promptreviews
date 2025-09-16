interface PlanTransitionMessage {
  title: string;
  subtitle: string;
  benefits?: string[];
  warnings?: string[];
  confirmButtonText: string;
  confirmButtonClass: string;
  icon?: 'upgrade' | 'downgrade' | 'switch';
}

type PlanKey = 'grower' | 'builder' | 'maven';
type BillingPeriod = 'monthly' | 'annual';

const PLAN_FEATURES = {
  grower: {
    name: 'Grower',
    teamMembers: 1,
    promptPages: 3,
    contacts: 0,
    locations: 1,
    googleBusiness: false,
    workflow: false,
  },
  builder: {
    name: 'Builder',
    teamMembers: 3,
    promptPages: 50,
    contacts: 1000,
    locations: 1,
    googleBusiness: true,
    workflow: true,
  },
  maven: {
    name: 'Maven',
    teamMembers: 5,
    promptPages: 500,
    contacts: 10000,
    locations: 10,
    googleBusiness: true,
    workflow: true,
  },
};

function getFeatureDifferences(from: PlanKey, to: PlanKey): { gained: string[], lost: string[] } {
  const fromPlan = PLAN_FEATURES[from];
  const toPlan = PLAN_FEATURES[to];
  const gained: string[] = [];
  const lost: string[] = [];

  // Team members
  if (toPlan.teamMembers > fromPlan.teamMembers) {
    gained.push(`${toPlan.teamMembers} team members (up from ${fromPlan.teamMembers})`);
  } else if (toPlan.teamMembers < fromPlan.teamMembers) {
    lost.push(`Limited to ${toPlan.teamMembers} team member${toPlan.teamMembers === 1 ? '' : 's'}`);
  }

  // Prompt pages
  if (toPlan.promptPages > fromPlan.promptPages) {
    gained.push(`${toPlan.promptPages} Prompt Pages (up from ${fromPlan.promptPages})`);
  } else if (toPlan.promptPages < fromPlan.promptPages) {
    lost.push(`Reduced to ${toPlan.promptPages} Prompt Pages`);
  }

  // Contacts
  if (toPlan.contacts > fromPlan.contacts && fromPlan.contacts === 0) {
    gained.push(`${toPlan.contacts.toLocaleString()} contacts upload capability`);
  } else if (toPlan.contacts > fromPlan.contacts) {
    gained.push(`${toPlan.contacts.toLocaleString()} contacts (up from ${fromPlan.contacts.toLocaleString()})`);
  } else if (toPlan.contacts < fromPlan.contacts && toPlan.contacts === 0) {
    lost.push(`Contact upload capability`);
  } else if (toPlan.contacts < fromPlan.contacts) {
    lost.push(`Reduced to ${toPlan.contacts.toLocaleString()} contacts`);
  }

  // Locations
  if (toPlan.locations > fromPlan.locations) {
    gained.push(`Up to ${toPlan.locations} business locations`);
  } else if (toPlan.locations < fromPlan.locations) {
    lost.push(`Limited to ${toPlan.locations} location${toPlan.locations === 1 ? '' : 's'}`);
  }

  // Google Business
  if (toPlan.googleBusiness && !fromPlan.googleBusiness) {
    gained.push(`Google Business Profile management`);
  } else if (!toPlan.googleBusiness && fromPlan.googleBusiness) {
    lost.push(`Google Business Profile management`);
  }

  // Workflow
  if (toPlan.workflow && !fromPlan.workflow) {
    gained.push(`Workflow management`);
  } else if (!toPlan.workflow && fromPlan.workflow) {
    lost.push(`Workflow management`);
  }

  return { gained, lost };
}

export function getPlanTransitionMessage(
  currentPlan: PlanKey,
  currentBilling: BillingPeriod,
  targetPlan: PlanKey,
  targetBilling: BillingPeriod
): PlanTransitionMessage {
  const isSamePlan = currentPlan === targetPlan;
  const isBillingChange = currentBilling !== targetBilling;
  
  // Handle billing period changes for same plan
  if (isSamePlan && isBillingChange) {
    const isToAnnual = targetBilling === 'annual';
    return {
      title: isToAnnual ? 'Switch to Annual Billing' : 'Switch to Monthly Billing',
      subtitle: isToAnnual 
        ? `Save 15% with annual billing on your ${PLAN_FEATURES[currentPlan].name} plan`
        : `Switch to monthly billing for your ${PLAN_FEATURES[currentPlan].name} plan`,
      benefits: isToAnnual 
        ? ['Save 15% compared to monthly billing', 'Lock in your rate for the full year', 'Simplified billing with one annual payment']
        : ['More flexibility with monthly payments', 'Easier to adjust your plan as needed'],
      confirmButtonText: isToAnnual ? 'Switch to Annual' : 'Switch to Monthly',
      confirmButtonClass: 'bg-slate-blue hover:bg-slate-blue/90',
      icon: 'switch',
    };
  }

  const { gained, lost } = getFeatureDifferences(currentPlan, targetPlan);
  const planOrder = { grower: 1, builder: 2, maven: 3 };
  const isUpgrade = planOrder[targetPlan] > planOrder[currentPlan];

  // Upgrade messages
  if (isUpgrade) {
    const messages: Record<string, PlanTransitionMessage> = {
      'grower-builder-monthly': {
        title: 'Upgrade to Builder',
        subtitle: 'Unlock powerful features to grow your review collection',
        benefits: gained,
        confirmButtonText: 'Upgrade to Builder',
        confirmButtonClass: 'bg-slate-blue hover:bg-slate-blue/90',
        icon: 'upgrade',
      },
      'grower-builder-annual': {
        title: 'Upgrade to Builder (Annual)',
        subtitle: 'Save 15% and unlock powerful features',
        benefits: [...gained, 'Save $63/year with annual billing'],
        confirmButtonText: 'Upgrade to Builder Annual',
        confirmButtonClass: 'bg-slate-blue hover:bg-slate-blue/90',
        icon: 'upgrade',
      },
      'grower-maven-monthly': {
        title: 'Upgrade to Maven',
        subtitle: 'Get the complete review management platform',
        benefits: gained,
        confirmButtonText: 'Upgrade to Maven',
        confirmButtonClass: 'bg-slate-blue hover:bg-slate-blue/90',
        icon: 'upgrade',
      },
      'grower-maven-annual': {
        title: 'Upgrade to Maven (Annual)',
        subtitle: 'Maximum features with maximum savings',
        benefits: [...gained, 'Save $180/year with annual billing'],
        confirmButtonText: 'Upgrade to Maven Annual',
        confirmButtonClass: 'bg-slate-blue hover:bg-slate-blue/90',
        icon: 'upgrade',
      },
      'builder-maven-monthly': {
        title: 'Upgrade to Maven',
        subtitle: 'Scale your review management across multiple locations',
        benefits: gained,
        confirmButtonText: 'Upgrade to Maven',
        confirmButtonClass: 'bg-slate-blue hover:bg-slate-blue/90',
        icon: 'upgrade',
      },
      'builder-maven-annual': {
        title: 'Upgrade to Maven (Annual)',
        subtitle: 'Scale up and save with annual billing',
        benefits: [...gained, 'Save $180/year with annual billing'],
        confirmButtonText: 'Upgrade to Maven Annual',
        confirmButtonClass: 'bg-slate-blue hover:bg-slate-blue/90',
        icon: 'upgrade',
      },
    };

    const key = `${currentPlan}-${targetPlan}-${targetBilling}`;
    return messages[key] || messages['grower-builder-monthly'];
  }

  // Downgrade messages
  const messages: Record<string, PlanTransitionMessage> = {
    'maven-builder-monthly': {
      title: 'Downgrade to Builder',
      subtitle: 'Reduce your plan to Builder features',
      warnings: lost,
      confirmButtonText: 'Downgrade to Builder',
      confirmButtonClass: 'bg-red-600 hover:bg-red-700',
      icon: 'downgrade',
    },
    'maven-builder-annual': {
      title: 'Downgrade to Builder (Annual)',
      subtitle: 'Reduce costs while keeping essential features',
      benefits: ['Save with annual billing on Builder plan'],
      warnings: lost,
      confirmButtonText: 'Downgrade to Builder Annual',
      confirmButtonClass: 'bg-red-600 hover:bg-red-700',
      icon: 'downgrade',
    },
    'maven-grower-monthly': {
      title: 'Downgrade to Grower',
      subtitle: 'Switch to the basic Grower plan',
      warnings: lost,
      confirmButtonText: 'Downgrade to Grower',
      confirmButtonClass: 'bg-red-600 hover:bg-red-700',
      icon: 'downgrade',
    },
    'maven-grower-annual': {
      title: 'Downgrade to Grower (Annual)',
      subtitle: 'Switch to basic features with annual savings',
      benefits: ['Save with annual billing on Grower plan'],
      warnings: lost,
      confirmButtonText: 'Downgrade to Grower Annual',
      confirmButtonClass: 'bg-red-600 hover:bg-red-700',
      icon: 'downgrade',
    },
    'builder-grower-monthly': {
      title: 'Downgrade to Grower',
      subtitle: 'Switch to the basic Grower plan',
      warnings: lost,
      confirmButtonText: 'Downgrade to Grower',
      confirmButtonClass: 'bg-red-600 hover:bg-red-700',
      icon: 'downgrade',
    },
    'builder-grower-annual': {
      title: 'Downgrade to Grower (Annual)',
      subtitle: 'Reduce to basic features with annual billing',
      benefits: ['Save with annual billing on Grower plan'],
      warnings: lost,
      confirmButtonText: 'Downgrade to Grower Annual',
      confirmButtonClass: 'bg-red-600 hover:bg-red-700',
      icon: 'downgrade',
    },
  };

  const key = `${currentPlan}-${targetPlan}-${targetBilling}`;
  return messages[key] || {
    title: 'Change Plan',
    subtitle: 'Update your subscription',
    confirmButtonText: 'Confirm Change',
    confirmButtonClass: 'bg-slate-blue hover:bg-slate-blue/90',
  };
}

export function getSuccessMessage(
  action: 'upgrade' | 'downgrade' | 'billing_period' | 'new',
  fromPlan?: PlanKey,
  toPlan?: PlanKey,
  toBilling?: BillingPeriod
): { title: string; message: string } {
  if (action === 'new') {
    return {
      title: 'Welcome to Prompt Reviews!',
      message: "Your account has been created and you're ready to start collecting reviews!",
    };
  }

  if (action === 'billing_period') {
    const isAnnual = toBilling === 'annual';
    return {
      title: 'Billing Period Updated!',
      message: isAnnual
        ? 'You\'ve switched to annual billing and will save 15% on your subscription.'
        : 'You\'ve switched to monthly billing for more flexibility.',
    };
  }

  if (action === 'upgrade' && fromPlan && toPlan) {
    const fromName = PLAN_FEATURES[fromPlan].name;
    const toName = PLAN_FEATURES[toPlan].name;
    return {
      title: `Upgraded to ${toName}!`,
      message: `You've successfully upgraded from ${fromName} to ${toName}. All new features are now available in your account.`,
    };
  }

  if (action === 'downgrade' && fromPlan && toPlan) {
    const fromName = PLAN_FEATURES[fromPlan].name;
    const toName = PLAN_FEATURES[toPlan].name;
    return {
      title: 'Plan Changed Successfully',
      message: `Your plan has been changed from ${fromName} to ${toName}. The change will take effect at the end of your current billing period.`,
    };
  }

  // Default messages
  return {
    title: action === 'upgrade' ? 'Plan Upgraded Successfully!' : 'Plan Updated Successfully!',
    message: action === 'upgrade'
      ? 'You now have access to all the features in your new plan. Any unused time from your previous subscription has been automatically credited to your account.'
      : 'Your plan has been updated successfully. Proration has been automatically applied to your account.',
  };
}