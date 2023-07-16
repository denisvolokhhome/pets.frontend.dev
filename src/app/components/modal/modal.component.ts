import { ModalService } from './../../services/modal.service';
import { Component, Input, OnInit } from '@angular/core';
declare var window: any;

@Component({
  selector: '[app-modal]',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.css'],
})
export class ModalComponent implements OnInit {
  @Input() title: string;
  formModal: any;

  constructor(public ModalService: ModalService) {}

  ngOnInit(): void {


  }
}
