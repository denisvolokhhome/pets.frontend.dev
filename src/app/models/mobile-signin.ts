/** "Instant mobile switch": QR code on desktop → phone signed in as the same user. */

/** Frontend route that redeems a code (the QR is <site>/m#<code>). Keep in sync with the backend's SIGNIN_PATH. */
export const MOBILE_SIGNIN_PATH = '/m';

export interface MobileSigninCode {
  id: string;
  /** What the QR encodes: https://<site>/m#<code> (the code is in the fragment, never sent to a server) */
  url: string;
  expires_at: string;
  expires_in: number;
}

export type MobileSigninStatus = 'pending' | 'used' | 'already_signed_in' | 'expired';

export interface MobileSigninPreview {
  display_name: string;
  masked_email: string;
  same_account: boolean;
  target_path: string | null;
}

export interface MobileSigninRedeemed {
  access_token: string;
  token_type: string;
  target_path: string;
}
