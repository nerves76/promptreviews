/**
 * Proposal / SOW Generator - TypeScript Types
 */

// --- Proposal Status ---

export type ProposalStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'declined' | 'expired' | 'on_hold';

export const PROPOSAL_STATUS_LABELS: Record<ProposalStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  viewed: 'Viewed',
  accepted: 'Won',
  declined: 'Lost',
  expired: 'Expired',
  on_hold: 'On hold',
};

export const PROPOSAL_STATUS_COLORS: Record<ProposalStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  viewed: 'bg-purple-100 text-purple-700',
  accepted: 'bg-green-100 text-green-700',
  declined: 'bg-red-100 text-red-700',
  expired: 'bg-amber-100 text-amber-700',
  on_hold: 'bg-orange-100 text-orange-700',
};

/** Statuses that the user can manually set from the editor */
export const USER_SETTABLE_STATUSES: { value: ProposalStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'on_hold', label: 'On hold' },
  { value: 'accepted', label: 'Won' },
  { value: 'declined', label: 'Lost' },
];

// --- Pricing Type ---

export type PricingType = 'fixed' | 'monthly' | 'hourly';

export const PRICING_TYPE_LABELS: Record<PricingType, string> = {
  fixed: 'Fixed price',
  monthly: 'Monthly',
  hourly: 'Hourly',
};

// --- Line Items ---

export interface ProposalLineItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
}

// --- Custom Sections ---

export interface ProposalReviewItem {
  id: string;
  reviewer_name: string;
  star_rating: number;
  review_content: string;
  platform?: string;
  created_at?: string;
}

export interface ProposalCustomSection {
  id: string;
  type?: 'text' | 'reviews';
  title: string;
  subtitle?: string;
  body: string;
  position: number;
  reviews?: ProposalReviewItem[];
}

// --- Proposal Signature ---

export interface ProposalSignature {
  id: string;
  proposal_id: string;
  account_id: string;
  signer_name: string;
  signer_email: string;
  signature_image_url: string;
  ip_address?: string | null;
  user_agent?: string | null;
  document_hash: string;
  accepted_terms: boolean;
  signed_at: string;
}

// --- Proposal ---

export interface Proposal {
  id: string;
  account_id: string;
  token: string;
  title: string;
  proposal_date: string;
  expiration_date?: string | null;
  client_first_name?: string | null;
  client_last_name?: string | null;
  client_email?: string | null;
  client_company?: string | null;
  contact_id?: string | null;
  business_name?: string | null;
  business_email?: string | null;
  business_phone?: string | null;
  business_address?: string | null;
  business_logo_url?: string | null;
  business_website?: string | null;
  show_pricing: boolean;
  pricing_type?: PricingType;
  show_terms: boolean;
  terms_content?: string | null;
  custom_sections: ProposalCustomSection[];
  line_items: ProposalLineItem[];
  status: ProposalStatus;
  sow_number?: number | null;
  show_sow_number: boolean;
  is_template: boolean;
  template_name?: string | null;
  sent_at?: string | null;
  viewed_at?: string | null;
  accepted_at?: string | null;
  declined_at?: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  signature?: ProposalSignature | null;
}

// --- Section Templates ---

export interface ProposalSectionTemplate {
  id: string;
  account_id: string;
  name: string;
  title: string;
  subtitle?: string;
  body: string;
  created_at: string;
  updated_at: string;
}

// --- API Request Types ---

export interface CreateProposalRequest {
  title: string;
  proposal_date?: string;
  expiration_date?: string | null;
  client_first_name?: string;
  client_last_name?: string;
  client_email?: string;
  client_company?: string;
  contact_id?: string | null;
  show_pricing?: boolean;
  pricing_type?: PricingType;
  show_terms?: boolean;
  terms_content?: string;
  custom_sections?: ProposalCustomSection[];
  line_items?: ProposalLineItem[];
  show_sow_number?: boolean;
  is_template?: boolean;
  template_name?: string;
}

export interface UpdateProposalRequest extends Partial<CreateProposalRequest> {
  status?: ProposalStatus;
}

export interface SignProposalRequest {
  token: string;
  signer_name: string;
  signer_email: string;
  signature_image: string; // base64 data URL
  accepted_terms: boolean;
}

// --- API Response Types ---

export interface ProposalListResponse {
  proposals: Proposal[];
  total: number;
}
