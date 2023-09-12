import { Pipe, PipeTransform } from '@angular/core';
import { IPet } from '../models/pet';

@Pipe({
  name: 'searchPets'
})
export class SearchPetsPipe implements PipeTransform {

  transform(pets: IPet[], search: string): IPet[] {
    return pets.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  }

}
