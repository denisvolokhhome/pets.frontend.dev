export interface IPetBasicInfo {
  id: string;
  name: string;
}

export interface ILocation {
  id?: number;
  user_id?: string;
  created_at: string;
  updated_at?: string;
  name: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  country: string;
  zipcode: string;
  location_type: string;
  pets?: IPetBasicInfo[];
}
