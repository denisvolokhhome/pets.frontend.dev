export interface IUser {
  id: string;
  email: string;
  name?: string;
  phone_number?: string;
  oauth_provider?: string;
  breedery_name?: string;
  profile_image_path?: string;
  breedery_description?: string;
  search_tags?: string[];
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
  is_superuser?: boolean;
  is_verified?: boolean;
  is_breeder: boolean;
  account_type?: 'breeder' | 'pet_seeker' | 'service';
}

export interface IProfileImageResponse {
  profile_image_path: string;
  message: string;
}
