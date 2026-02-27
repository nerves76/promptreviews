/**
 * Proposal / SOW Generator - TypeScript Types
 */

// --- Proposal Status ---

export type ProposalStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'declined' | 'expired';

export const PROPOSAL_STATUS_LABELS: Record<ProposalStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  viewed: 'Viewed',
  accepted: 'Accepted',
  declined: 'Declined',
  expired: 'Expired',
};

export const PROPOSAL_STATUS_COLORS: Record<ProposalStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  viewed: 'bg-purple-100 text-purple-700',
  accepted: 'bg-green-100 text-green-700',
  declined: 'bg-red-100 text-red-700',
  expired: 'bg-amber-100 text-amber-700',
};

// --- Line Items ---

export interface ProposalLineItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
}

// --- Custom Sections ---

export interface ProposalCustomSection {
  id: string;
  title: string;
  body: string;
  position: number;
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
  show_terms: boolean;
  terms_content?: string | null;
  custom_sections: ProposalCustomSection[];
  line_items: ProposalLineItem[];
  status: ProposalStatus;
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
  show_terms?: boolean;
  terms_content?: string;
  custom_sections?: ProposalCustomSection[];
  line_items?: ProposalLineItem[];
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
