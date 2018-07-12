import { Component, OnInit } from '@angular/core';
import { PageItemComponent } from '../page/page-item/page-item.component';

@Component({
  selector: 'app-choice-item',
  templateUrl: './choice-item.component.html',
  styleUrls: ['./choice-item.component.css']
})
export class ChoiceItemComponent extends PageItemComponent implements OnInit {

  constructor() {
    super();
    this.type = 'choice';
  }

  ngOnInit() {
  }

}
