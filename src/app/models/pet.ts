export interface IPet {
  pet_id?: string;
  name: string;
  breed_id?: number;
  breed_name: string;
  pet_dob: string;
  date_of_birth?: string;
  gender: string;
  weight: string;
  location_name: string;
  description: string;
  image?: File;
  image_path?: string;
  image_name?: string;
  is_puppy: boolean | number; // Backend returns boolean, but can also be number (0/1)
  litter_id?: number | null;
  has_microchip: number;
  has_vaccination: number;
  has_healthcertificate: number;
  has_dewormed: number;
  has_birthcertificate: number;
  id: any;
}
