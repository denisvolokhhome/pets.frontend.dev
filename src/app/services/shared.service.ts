import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SharedService {

private subject = new Subject<void>();

sendClickEvent() {
  this.subject.next();
}

getClickEvent(): Observable<any>{
  return this.subject.asObservable();
}

}
