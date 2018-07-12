import { Component, OnInit } from '@angular/core';
import { PageItemComponent } from '../page/page-item/page-item.component';

@Component({
  selector: 'app-button-item',
  templateUrl: './button-item.component.html',
  styleUrls: ['./button-item.component.css']
})
export class ButtonItemComponent extends PageItemComponent implements OnInit {

  constructor() {
    super();
   }

  ngOnInit() {
  }

}
