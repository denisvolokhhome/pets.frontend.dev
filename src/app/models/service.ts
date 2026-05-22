export interface IServiceImage {
  id: string;
  service_id: string;
  image_path: string;
  is_primary: boolean;
  display_order: number;
  created_at: string;
}

export interface IService {
  id: string;
  user_id: string;
  category_id: number;
  category_name: string;
  category_slug: string;
  title: string;
  description?: string;
  price_from?: number;
  price_to?: number;
  price_unit?: 'per_session' | 'per_hour' | 'per_day' | 'per_visit';
  is_active: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at?: string;
  images: IServiceImage[];
  primary_image?: IServiceImage;
}

export interface IServiceListResponse {
  items: IService[];
  total: number;
  page: number;
  page_size: number;
}

export interface IServiceCreate {
  category_id: number;
  title: string;
  description?: string;
  price_from?: number;
  price_to?: number;
  price_unit?: 'per_session' | 'per_hour' | 'per_day' | 'per_visit';
  location_ids: number[];
}

export interface IServiceUpdate {
  category_id?: number;
  title?: string;
  description?: string;
  price_from?: number;
  price_to?: number;
  price_unit?: 'per_session' | 'per_hour' | 'per_day' | 'per_visit';
  location_ids?: number[];
  is_active?: boolean;
}
