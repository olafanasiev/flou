import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-input-item',
  templateUrl: './input-item.component.html',
  styleUrls: ['./input-item.component.css']
})
export class InputItemComponent implements OnInit {
  @Input()
  type = 'input';
  @Input()
  position: number;
  @Input()
  title: string;
  constructor() {
    this.type = 'input';
  }

  ngOnInit() {
  }

}
