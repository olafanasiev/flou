import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'editable-text-overlay',
  templateUrl: './editable-text-overlay.component.html',
  styleUrls: ['./editable-text-overlay.component.css']
})
export class EditableTextOverlayComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

  do() {
    alert("Lol");
  }

}
