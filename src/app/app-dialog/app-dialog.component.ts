import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-dialog',
  templateUrl: './app-dialog.component.html',
  styleUrls: ['./app-dialog.component.css']
})
export class AppDialogComponent implements OnInit {

  @Input() closable = true;
  @Input() visible: boolean;
  @Output() visibleChange: EventEmitter<boolean> = new EventEmitter<boolean>();

  constructor() { }

  ngOnInit() { }

 
  close() {
    this.visible = false;
    this.visibleChange.emit(this.visible);
  }

}



