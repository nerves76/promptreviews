import type { DesignState } from '../widget/WidgetList';

/**
 * Smartly merges design changes while protecting layout fields
 * Only applies layout fields if they are explicitly set in the new design
 */
export function smartMergeDesign(prevDesign: DesignState, newDesign: Partial<DesignState>): DesignState {
  // Layout fields that should only be updated if explicitly set
  const layoutFields = [
    'width',
    'showGrid',
    'showQuotes',
    'showRelativeDate',
    'autoAdvance',
    'slideshowSpeed',
  ] as const;

  // Create the merged design
  const mergedDesign = { ...prevDesign };

  // Apply all non-layout fields
  Object.entries(newDesign).forEach(([key, value]) => {
    if (!layoutFields.includes(key as any)) {
      (mergedDesign as any)[key] = value;
    }
  });

  // Only apply layout fields if they are explicitly set in newDesign
  layoutFields.forEach(field => {
    if (field in newDesign) {
      (mergedDesign as any)[field] = (newDesign as any)[field];
    }
  });

  return mergedDesign;
} 