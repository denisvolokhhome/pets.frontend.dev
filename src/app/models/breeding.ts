import { IPet } from './pet';

export enum BreedingStatus {
  Started = 'Started',
  InProcess = 'InProcess',
  Done = 'Done',
  Voided = 'Voided'
}

export interface IBreeding {
  id: string;
  description?: string | null;
  status: BreedingStatus;
  created_at: string;
  updated_at: string;
  parent_pets?: IPet[];
  puppies?: IPet[];
}

export interface IBreedingFilter {
  location_id?: string;
  status?: BreedingStatus;
  breed_id?: string;
}

export interface IPetAssignment {
  pet_ids: string[];
}

export interface IPuppyInput {
  name: string;
  gender: 'Male' | 'Female';
  birth_date: string;
}
