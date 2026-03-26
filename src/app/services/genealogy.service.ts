import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface PetNode {
  id: string;
  name: string;
  gender?: string;
  date_of_birth?: string;
  breed_name?: string;
  image_url?: string;
  node_type: string;
}

export interface OffspringMini {
  id: string;
  name?: string;
  gender: string;
  date_of_birth: string;
  status: string;
  breed_name?: string;
  image_url?: string;
  converted_to_pet_id?: string;
}

export interface OffspringGroupNode {
  breeding_id: number;
  breeding_date?: string;
  count: number;
  offsprings: OffspringMini[];
  node_type: string;
}

export interface BreedingEdge {
  father?: PetNode;
  mother?: PetNode;
  breeding_id: number;
  offspring_group: OffspringGroupNode;
  converted_pets: PetNode[];
}

export interface GenealogyTree {
  pets: PetNode[];
  edges: BreedingEdge[];
}

@Injectable({ providedIn: 'root' })
export class GenealogyService {
  private apiUrl = environment.API_URL;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders().set(
      'Authorization', 'Bearer ' + localStorage.getItem('id_token')
    );
  }

  getTree(): Observable<GenealogyTree> {
    return this.http.get<GenealogyTree>(
      `${this.apiUrl}/genealogy/tree`,
      { headers: this.getHeaders() }
    );
  }

  convertOffspringToPet(offspringId: string): Observable<{ pet_id: string; message: string }> {
    return this.http.post<{ pet_id: string; message: string }>(
      `${this.apiUrl}/genealogy/offspring/${offspringId}/convert-to-pet`,
      {},
      { headers: this.getHeaders() }
    );
  }
}
