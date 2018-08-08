import { Component, AfterViewInit } from '@angular/core';
import { FlouService } from '../services/flou.service';
import { Page } from './models/page';
import * as _ from 'lodash';
import { MatSnackBar } from '@angular/material/snack-bar';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit {
  title = 'app';
  pages: Page[] = [];
  constructor(private flouService: FlouService, private snackBar: MatSnackBar) {}
  ngAfterViewInit() {
    this.pages =  this.flouService.getPages();
  }

  onPageDelete( pageToRemove: Page ) {
    let removedPages = _.remove(this.pages, (page) => { 
      return page.htmlId == pageToRemove.htmlId;
   });

    let removedPage = _.first(removedPages);
   let snackBarRef = this.snackBar.open( `Page "${removedPage.title}" was removed`, 'Undo' , {duration: 4000, horizontalPosition: 'center', verticalPosition:'top'} );
    snackBarRef.onAction().subscribe(() => { 
        this.pages.push(removedPage);
        snackBarRef.dismiss();
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
