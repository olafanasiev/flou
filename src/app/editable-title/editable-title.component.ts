import { Component, EventEmitter, OnInit, Input, Output } from '@angular/core';

@Component({
  selector: 'app-editable-title',
  templateUrl: './editable-title.component.html',
  styleUrls: ['./editable-title.component.css']
})
export class EditableTitleComponent implements OnInit {
  @Input()
  editTitle = false;
  @Input()
  title = '';
  @Output()
  done = new EventEmitter<string>();
  constructor() { }

  ngOnInit() {
    console.log(this.editTitle);
  }

  stopEditing(e: KeyboardEvent) {
    if ( e.keyCode === 13 ) {
      

      this.editTitle = false;
      this.title = (<any>e.target).value;
      this.done.emit(this.title);
    }
  }
}
