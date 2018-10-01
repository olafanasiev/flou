import { Component, AfterViewInit, OnInit, ChangeDetectorRef } from '@angular/core';
import { FlouService } from '../services/flou.service';
import { Page } from './models/page';
import * as _ from 'lodash';
import {SnackbarService} from 'ngx-snackbar';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit, OnInit {
  title = 'app';
  pages: Page[] = [];
  zoom: number = 1;
  constructor(private _flouService: FlouService,
    private _snackBarRef: SnackbarService, private _ref: ChangeDetectorRef) {}

  ngAfterViewInit() {
    this.pages =  this._flouService.getPages();
  }


  ngOnInit() {
    
    this._flouService.stateLoaded$.subscribe((pages) => {
      this.pages = this._flouService.getPages();
      });

      this._flouService.initJsPlumb();
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
  

  zoomIn() {
    if( this.zoom > 1.9) { 
      return;
    }
    
    this.zoom+=0.1;
    this._flouService.getJsPlumbInstance().setZoom(this.zoom);
  }

  zoomOut() {
    if( this.zoom < 0.2 ) { 
      return;
    }
    this.zoom-=0.1;
    this._flouService.getJsPlumbInstance().setZoom(this.zoom);
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
