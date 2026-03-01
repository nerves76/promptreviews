/**
 * Shared pricing calculation utility for proposals.
 *
 * Used by both ProposalLineItemsEditor (editor preview) and
 * BrandedProposalView (public-facing branded view).
 */

import { ProposalLineItem, PricingType } from './types';

export interface PricingTotals {
  oneTimeSubtotal: number;
  monthlySubtotal: number;
  discountOneTime: number;
  discountMonthly: number;
  taxOneTime: number;
  taxMonthly: number;
  grandTotalOneTime: number;
  grandTotalMonthly: number;
  hasMixedTypes: boolean;
  allSameType: boolean;
  uniformType: PricingType | null;
}

/**
 * Compute subtotals, discount, tax, and grand totals from line items.
 *
 * Calculation order: Subtotal → Discount → Tax → Grand Total
 *
 * When both one-time and monthly items exist:
 * - Flat discount is split proportionally between one-time and monthly
 * - Percentage discount is applied to each subtotal independently
 * - Tax is applied to (subtotal - discount) for each category
 */
export function computePricingTotals(
  lineItems: ProposalLineItem[],
  defaultPricingType: PricingType,
  discountType?: 'percentage' | 'flat' | null,
  discountValue?: number,
  taxRate?: number,
): PricingTotals {
  const getItemType = (item: ProposalLineItem): PricingType =>
    item.pricing_type || defaultPricingType;

  const allSameType =
    lineItems.length > 0 &&
    lineItems.every((item) => getItemType(item) === getItemType(lineItems[0]));
  const uniformType = allSameType ? getItemType(lineItems[0]) : null;

  const oneTimeSubtotal = lineItems
    .filter((item) => getItemType(item) !== 'monthly')
    .reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  const monthlySubtotal = lineItems
    .filter((item) => getItemType(item) === 'monthly')
    .reduce((sum, item) => sum + item.quantity * item.unit_price, 0);

  const hasMixedTypes = oneTimeSubtotal > 0 && monthlySubtotal > 0;
  const totalSubtotal = oneTimeSubtotal + monthlySubtotal;

  // Compute discount amounts
  let discountOneTime = 0;
  let discountMonthly = 0;

  if (discountType && discountValue && discountValue > 0) {
    if (discountType === 'percentage') {
      const rate = Math.min(discountValue, 100) / 100;
      discountOneTime = oneTimeSubtotal * rate;
      discountMonthly = monthlySubtotal * rate;
    } else {
      // Flat discount — split proportionally when mixed
      if (hasMixedTypes && totalSubtotal > 0) {
        const oneTimeProportion = oneTimeSubtotal / totalSubtotal;
        discountOneTime = discountValue * oneTimeProportion;
        discountMonthly = discountValue * (1 - oneTimeProportion);
      } else if (monthlySubtotal > 0) {
        discountMonthly = discountValue;
      } else {
        discountOneTime = discountValue;
      }
    }
    // Don't let discount exceed subtotal
    discountOneTime = Math.min(discountOneTime, oneTimeSubtotal);
    discountMonthly = Math.min(discountMonthly, monthlySubtotal);
  }

  // Compute tax on (subtotal - discount)
  let taxOneTime = 0;
  let taxMonthly = 0;

  if (taxRate && taxRate > 0) {
    const rate = taxRate / 100;
    taxOneTime = (oneTimeSubtotal - discountOneTime) * rate;
    taxMonthly = (monthlySubtotal - discountMonthly) * rate;
  }

  return {
    oneTimeSubtotal,
    monthlySubtotal,
    discountOneTime,
    discountMonthly,
    taxOneTime,
    taxMonthly,
    grandTotalOneTime: oneTimeSubtotal - discountOneTime + taxOneTime,
    grandTotalMonthly: monthlySubtotal - discountMonthly + taxMonthly,
    hasMixedTypes,
    allSameType,
    uniformType,
  };
}
