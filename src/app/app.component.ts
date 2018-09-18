import { Component, AfterViewInit } from '@angular/core';
import { FlouService } from '../services/flou.service';
import { Page } from './models/page';
import * as _ from 'lodash';
import {SnackbarService} from 'ngx-snackbar';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit {
  title = 'app';
  pages: Page[] = [];
  constructor(private _flouService: FlouService,
    private _snackBarRef: SnackbarService) {}//, private snackBar: MatSnackBar) {}
  ngAfterViewInit() {
    this.pages =  this._flouService.getPages();
  }

  onPageDelete( removedPage: Page ) {
      this._snackBarRef.add({
        msg: `Page "${removedPage.title}" was removed`,
        timeout: 4000,
        action: {
          text: 'Undo',
          onClick: (snack) => {
            this._flouService.restorePage(removedPage);
            this._snackBarRef.clear();
          },
        },
        onAdd: (snack) => {
          console.log('added: ' + snack.id);
        },
        onRemove: (snack) => {
          console.log('removed: ' + snack.id);
        }
      });
  }

  addPage(e) {
    if( e && e.target ) {
      if( e.target.id == 'pages') {
        this._flouService.addPage();
      }
    } else { 
      this._flouService.addPage();
    }

  
  }

}
