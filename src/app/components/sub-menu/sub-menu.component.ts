import { Component, EventEmitter, OnInit, Output } from '@angular/core';



@Component({
  selector: 'app-sub-menu',
  templateUrl: './sub-menu.component.html',
  styleUrls: ['./sub-menu.component.css']
})
export class SubMenuComponent implements OnInit {

  inputView: string = 'cards'
  @Output() buttonClicked = new EventEmitter();
  ngOnInit() {
  }

  changeLayout(layout: any) {
    console.log('change layout clicked.');
    this.inputView = layout;
    this.buttonClicked.emit(this.inputView);
    console.log(this.inputView);
  }
}
