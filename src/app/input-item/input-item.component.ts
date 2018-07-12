import { Component, OnInit } from '@angular/core';
import { PageItemComponent } from '../page/page-item/page-item.component';

@Component({
  selector: 'app-input-item',
  templateUrl: './input-item.component.html',
  styleUrls: ['./input-item.component.css']
})
export class InputItemComponent extends PageItemComponent implements OnInit {

  constructor() {
    super();
    this.type = 'input';
  }

  ngOnInit() {
  }

}
