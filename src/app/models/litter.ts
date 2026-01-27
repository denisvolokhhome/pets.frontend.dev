import { IPet } from './pet';

export enum LitterStatus {
  Started = 'Started',
  InProcess = 'InProcess',
  Done = 'Done',
  Voided = 'Voided'
}

export interface ILitter {
  id: string;
  description?: string | null;
  status: LitterStatus;
  created_at: string;
  updated_at: string;
  parent_pets?: IPet[];
  puppies?: IPet[];
}

export interface ILitterFilter {
  location_id?: string;
  status?: LitterStatus;
  breed_id?: string;
}

export interface IPetAssignment {
  pet_ids: string[];
}

export interface IPuppyInput {
  name: string;
  gender: 'Male' | 'Female';
  birth_date: string;
  microchip?: string;
}
