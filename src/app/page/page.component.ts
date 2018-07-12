import { Component, OnInit, Input } from '@angular/core';
import { PageItemComponent } from '../page/page-item/page-item.component';
import { FlouService } from '../../services/flou.service';
import { Page } from '../models/page';
import { analyzeAndValidateNgModules } from '@angular/compiler';

@Component({
  selector: 'app-page',
  templateUrl: './page.component.html',
  styleUrls: ['./page.component.css']
})
export class PageComponent implements OnInit {
  @Input()
  page: Page;
  constructor(private flouService: FlouService) { }

  ngOnInit() {
  }

  addItem() {
     this.flouService.addItem(this. page);
  }

}
