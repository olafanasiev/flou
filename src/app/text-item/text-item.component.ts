import { Component, OnInit, Input } from '@angular/core';
import { PageItemComponent } from '../page/page-item/page-item.component';
import { PageItem } from '../models/page-item';

@Component({
  selector: 'app-text-item',
  templateUrl: './text-item.component.html',
  styleUrls: ['./text-item.component.css']
})
export class TextItemComponent extends PageItemComponent implements OnInit {

  constructor() {
    super();
    this.type = 'text';
   }

  ngOnInit() {
  }

}
