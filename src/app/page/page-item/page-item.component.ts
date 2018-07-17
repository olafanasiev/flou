import { PageItem } from '../../models/page-item';
import { Input } from '@angular/core';

export abstract class PageItemComponent {
  @Input()
  data: PageItem;
  position: number;
  type: string;
  editMode = false;
    startEditing(e: MouseEvent) {
    this.editMode = true;
    // document.elementFromPoint(e.clientX, e.clientY).click();
  }

  stopEditing(newTitle) {
    this.editMode = false;
    this.data.title = newTitle;
  }
  constructor() { }

}
