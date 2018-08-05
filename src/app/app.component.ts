import { Component, AfterViewInit } from '@angular/core';
import { FlouService } from '../services/flou.service';
import { Page } from './models/page';
import * as _ from 'lodash';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit {
  title = 'app';
  pages: Page[] = [];

  constructor(private flouService: FlouService) {}
  ngAfterViewInit() {
    this.pages =  this.flouService.getPages();
  }

  onPageDelete( pageToRemove: Page ) {
    _.remove(this.pages, (page) => { 
       return page.htmlId == pageToRemove.htmlId;
    });
  }

  addPage(e) {
    if( e && e.target ) {
      if( e.target.id == 'pages') {
        this.flouService.addPage();
      }
    } else { 
      this.flouService.addPage();
    }

  
  }

}
