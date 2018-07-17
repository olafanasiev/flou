import { Component, OnInit, Input, ViewEncapsulation } from '@angular/core';
import { PageItemComponent } from '../page/page-item/page-item.component';
import { FlouService } from '../../services/flou.service';
import { Page } from '../models/page';

@Component({
  selector: 'app-page',
  templateUrl: './page.component.html',
  styleUrls: ['./page.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class PageComponent implements OnInit {
  @Input()
  page: Page;
  constructor(private flouService: FlouService) { }
  editMode = false;
  ngOnInit() {
  }

  startEditing() {
    this.editMode = true;
  }

  addItem() {
     this.flouService.addItem(this.page);
  }

  stopEditing(newTitle) {
    this.page.title = newTitle;
    this.editMode = false;
  }

}
