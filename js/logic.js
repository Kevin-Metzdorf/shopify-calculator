import { projectTypes, modules } from './config.js';

export function calculateEstimate(state) {
  const baseHours = projectTypes[state.projectType]?.baseHours ?? 0;

  let devHours = 0;
  let otherFeatureHours = 0;
  let flatFees = 0;

  for (const [moduleKey, features] of Object.entries(state.features ?? {})) {
    for (const [featureKey, quantity] of Object.entries(features)) {
      if (quantity <= 0) continue;

      if (moduleKey === 'Content' && featureKey === 'FullServiceFlatFee') {
        flatFees += modules.Content.FullServiceFlatFee * quantity;
        continue;
      }

      const hours = modules[moduleKey]?.[featureKey] ?? 0;

      if (moduleKey === 'Dev') {
        devHours += hours * quantity;
      } else {
        otherFeatureHours += hours * quantity;
      }
    }
  }

  if (state.design === 'custom') {
    devHours *= modules.Design.CustomDesignMultiplier;
  }

  const featureHours = devHours + otherFeatureHours;
  const bufferHours = (baseHours + featureHours) * ((state.riskBuffer ?? 0) / 100);
  const totalHours = baseHours + featureHours + bufferHours;
  const netPriceEUR   = totalHours * (state.hourlyRate ?? 75) + flatFees;
  const taxAmountEUR  = netPriceEUR * (state.taxRate ?? 0);
  const grossPriceEUR = netPriceEUR + taxAmountEUR;

  return {
    baseHours,
    featureHours,
    bufferHours,
    totalHours,
    flatFees,
    netPriceEUR,
    taxAmountEUR,
    grossPriceEUR,
  };
}
