import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { ModalService } from 'src/app/services/modal.service';
declare var window: any;
@Component({
  selector: 'app-sub-menu',
  templateUrl: './sub-menu.component.html',
  styleUrls: ['./sub-menu.component.css']
})


export class SubMenuComponent implements OnInit {

  constructor(
    private modalService: ModalService,
  ) {}

  inputView: string = 'cards';

  @Output() buttonClicked = new EventEmitter();
  formModal: any;




  ngOnInit() {

  }


  changeLayout(layout: any) {
    console.log('change layout clicked.');
    this.inputView = layout;
    this.buttonClicked.emit(this.inputView);
    console.log(this.inputView);
  }

  openModal(){
    console.log('open modal clicked');
    this.modalService.open();
  }



}
