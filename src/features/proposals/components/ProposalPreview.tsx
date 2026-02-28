'use client';

import { Proposal, ProposalLineItem, ProposalCustomSection } from '../types';
import { formatSowNumber } from '../sowHelpers';

interface ProposalPreviewProps {
  proposal: Proposal;
  id?: string;
  textColor?: string;
  sowPrefix?: string | null;
}

export function ProposalPreview({ proposal, id, textColor, sowPrefix }: ProposalPreviewProps) {
  const color = textColor || '#1f2937';
  const mutedColor = textColor ? `${textColor}B3` : '#6b7280'; // 70% opacity

  const sections: ProposalCustomSection[] = Array.isArray(proposal.custom_sections)
    ? proposal.custom_sections
    : [];

  const lineItems: ProposalLineItem[] = Array.isArray(proposal.line_items)
    ? proposal.line_items
    : [];

  const grandTotal = lineItems.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);

  return (
    <div id={id} className="space-y-6">
      {/* Title and dates */}
      <div>
        <h2 className="text-2xl font-bold" style={{ color }}>{proposal.title}</h2>
        <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2 text-sm" style={{ color: mutedColor }}>
          {proposal.show_sow_number && proposal.sow_number != null && sowPrefix && (
            <span className="font-medium">SOW #{formatSowNumber(sowPrefix, proposal.sow_number)}</span>
          )}
          <span>Date: {new Date(proposal.proposal_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          {proposal.expiration_date && (
            <span>Expires: {new Date(proposal.expiration_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          )}
        </div>
      </div>

      {/* Client info */}
      {(proposal.client_first_name || proposal.client_last_name || proposal.client_email || proposal.client_company) && (
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide mb-2" style={{ color: mutedColor }}>
            Prepared for
          </h3>
          <div className="text-sm space-y-0.5" style={{ color }}>
            {(proposal.client_first_name || proposal.client_last_name) && (
              <p className="font-medium">{[proposal.client_first_name, proposal.client_last_name].filter(Boolean).join(' ')}</p>
            )}
            {proposal.client_company && <p>{proposal.client_company}</p>}
            {proposal.client_email && <p>{proposal.client_email}</p>}
          </div>
        </div>
      )}

      {/* Custom sections */}
      {sections
        .sort((a, b) => a.position - b.position)
        .map((section) => (
          <div key={section.id}>
            {section.title && (
              <h3 className="text-lg font-semibold" style={{ color }}>{section.title}</h3>
            )}
            {section.subtitle && (
              <p className="text-sm mt-0.5 mb-2" style={{ color: mutedColor }}>{section.subtitle}</p>
            )}
            {!section.subtitle && section.title && <div className="mb-2" />}
            {section.body && (
              <div className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color }}>
                {section.body}
              </div>
            )}
          </div>
        ))}

      {/* Pricing table */}
      {proposal.show_pricing && lineItems.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3" style={{ color }}>Pricing</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr style={{ borderBottom: `1px solid ${mutedColor}33` }}>
                  <th className="text-left py-2 pr-4 font-medium" style={{ color: mutedColor }}>Description</th>
                  <th className="text-right py-2 px-4 font-medium w-20" style={{ color: mutedColor }}>Qty</th>
                  <th className="text-right py-2 px-4 font-medium w-28" style={{ color: mutedColor }}>Unit price</th>
                  <th className="text-right py-2 pl-4 font-medium w-28" style={{ color: mutedColor }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item) => (
                  <tr key={item.id} style={{ borderBottom: `1px solid ${mutedColor}1A` }}>
                    <td className="py-2 pr-4" style={{ color }}>{item.description}</td>
                    <td className="text-right py-2 px-4" style={{ color }}>{item.quantity}</td>
                    <td className="text-right py-2 px-4" style={{ color }}>${item.unit_price.toFixed(2)}</td>
                    <td className="text-right py-2 pl-4 font-medium" style={{ color }}>
                      ${(item.quantity * item.unit_price).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: `2px solid ${mutedColor}33` }}>
                  <td colSpan={3} className="text-right py-3 pr-4 font-semibold" style={{ color }}>
                    Grand total
                  </td>
                  <td className="text-right py-3 pl-4 font-bold text-lg" style={{ color }}>
                    ${grandTotal.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Terms & Conditions */}
      {proposal.show_terms && proposal.terms_content && (
        <div>
          <h3 className="text-lg font-semibold mb-2" style={{ color }}>Terms & conditions</h3>
          <div
            className="text-sm whitespace-pre-wrap leading-relaxed"
            style={{ color: mutedColor }}
          >
            {proposal.terms_content}
          </div>
        </div>
      )}
    </div>
  );
}
