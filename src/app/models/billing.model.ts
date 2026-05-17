export interface IPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  billing_interval: string;
  max_pets: number;
  max_published_locations: number;
  max_simultaneous_offsprings: number;
  is_default: boolean;
}

export interface ISubscription {
  id: string;
  user_id: string;
  plan_id: string;
  plan: IPlan;
  status: string;
  current_period_start: string;
  current_period_end: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  pending_plan_id: string | null;
  pending_plan_effective_date: string | null;
  pending_plan: IPlan | null;
}

export interface IInvoice {
  id: string;
  subscription_id: string;
  amount: number;
  currency: string;
  status: string;
  period_start: string;
  period_end: string;
  stripe_invoice_id: string | null;
  created_at: string;
}

export interface IInvoiceDownload {
  hosted_invoice_url: string | null;
  invoice_pdf: string | null;
}

export interface ICheckoutSessionResponse {
  checkout_url: string;
}

export interface IPortalSessionResponse {
  portal_url: string;
}
