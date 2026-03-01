'use client';

import { ProposalLineItem, PricingType, PRICING_TYPE_LABELS } from '../types';
import Icon from '@/components/Icon';

interface ProposalLineItemsEditorProps {
  lineItems: ProposalLineItem[];
  onChange: (items: ProposalLineItem[]) => void;
  /** Default pricing type applied to newly added items */
  defaultPricingType?: PricingType;
}

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

function getQtyLabel(pt: PricingType) {
  return pt === 'hourly' ? 'Hours' : 'Qty';
}

function getRateLabel(pt: PricingType) {
  return pt === 'hourly' ? 'Rate' : pt === 'monthly' ? 'Monthly rate' : 'Unit price';
}

export function ProposalLineItemsEditor({ lineItems, onChange, defaultPricingType = 'fixed' }: ProposalLineItemsEditorProps) {
  const addItem = () => {
    onChange([...lineItems, { id: generateId(), description: '', quantity: 1, unit_price: 0, pricing_type: defaultPricingType }]);
  };

  const removeItem = (id: string) => {
    onChange(lineItems.filter((item) => item.id !== id));
  };

  const updateItem = (id: string, field: keyof ProposalLineItem, value: string | number) => {
    onChange(
      lineItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  // Check if all items share the same pricing type
  const allSameType = lineItems.length > 0 && lineItems.every((item) => (item.pricing_type || defaultPricingType) === (lineItems[0].pricing_type || defaultPricingType));
  const uniformType = allSameType ? (lineItems[0]?.pricing_type || defaultPricingType) : null;

  // Compute totals
  const oneTimeTotal = lineItems
    .filter((item) => (item.pricing_type || defaultPricingType) !== 'monthly')
    .reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  const monthlyTotal = lineItems
    .filter((item) => (item.pricing_type || defaultPricingType) === 'monthly')
    .reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  const grandTotal = lineItems.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-32">Type</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-24">
                {uniformType ? getQtyLabel(uniformType) : 'Qty/Hrs'}
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-32">
                {uniformType ? getRateLabel(uniformType) : 'Rate'}
              </th>
              <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase w-28">Total</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {lineItems.map((item) => {
              const itemType = item.pricing_type || defaultPricingType;
              return (
                <tr key={item.id}>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                      placeholder="Line item description"
                      className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-1"
                      aria-label="Description"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={itemType}
                      onChange={(e) => updateItem(item.id, 'pricing_type', e.target.value)}
                      className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-1"
                      aria-label="Pricing type"
                    >
                      {(Object.keys(PRICING_TYPE_LABELS) as PricingType[]).map((key) => (
                        <option key={key} value={key}>{PRICING_TYPE_LABELS[key]}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min="0"
                      step={itemType === 'hourly' ? '0.5' : '1'}
                      value={item.quantity || ''}
                      onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                      className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-1"
                      aria-label={getQtyLabel(itemType)}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unit_price || ''}
                        onChange={(e) => updateItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                        className="w-full border border-gray-300 rounded pl-6 pr-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-blue focus:ring-offset-1"
                        aria-label={getRateLabel(itemType)}
                      />
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right text-sm font-medium text-gray-700">
                    ${(item.quantity * item.unit_price).toFixed(2)}
                    {itemType === 'monthly' && <span className="text-gray-500 text-xs">/mo</span>}
                  </td>
                  <td className="px-1 py-2">
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="p-1 text-red-500 hover:text-red-700 transition-colors"
                      aria-label="Remove line item"
                    >
                      <Icon name="FaTimes" size={14} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {lineItems.length > 0 && (
        <div className="flex justify-end mt-2 pr-12">
          <div className="text-right space-y-0.5">
            {/* When mixed types, show split totals */}
            {oneTimeTotal > 0 && monthlyTotal > 0 ? (
              <>
                <div>
                  <span className="text-sm font-medium text-gray-500 mr-4">One-time:</span>
                  <span className="text-base font-semibold text-gray-900">${oneTimeTotal.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500 mr-4">Recurring:</span>
                  <span className="text-base font-semibold text-gray-900">${monthlyTotal.toFixed(2)}/mo</span>
                </div>
                <div className="pt-1 border-t border-gray-200">
                  <span className="text-sm font-medium text-gray-500 mr-4">Grand total:</span>
                  <span className="text-lg font-bold text-gray-900">
                    ${oneTimeTotal.toFixed(2)} + ${monthlyTotal.toFixed(2)}/mo
                  </span>
                </div>
              </>
            ) : (
              <div>
                <span className="text-sm font-medium text-gray-500 mr-4">
                  Grand total{uniformType === 'monthly' ? '/mo' : ''}:
                </span>
                <span className="text-lg font-bold text-gray-900">${grandTotal.toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={addItem}
        className="mt-3 flex items-center gap-1.5 text-sm text-slate-blue hover:text-slate-blue/80 font-medium transition-colors"
      >
        <Icon name="FaPlus" size={12} />
        Add line item
      </button>
    </div>
  );
}
