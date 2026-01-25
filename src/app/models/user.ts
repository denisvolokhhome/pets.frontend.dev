export interface IUser {
  id: string;
  email: string;
  name?: string;
  breedery_name?: string;
  profile_image_path?: string;
  breedery_description?: string;
  search_tags?: string[];
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
  is_superuser?: boolean;
  is_verified?: boolean;
}

export interface IProfileImageResponse {
  profile_image_path: string;
  message: string;
}
