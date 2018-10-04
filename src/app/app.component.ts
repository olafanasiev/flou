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
    private _snackBarRef: SnackbarService) {}

  ngAfterViewInit() {
    this.pages =  this._flouService.getPages();
  }


  ngOnInit() {
    this._flouService.stateImported$.subscribe((states) => { 
      this._snackBarRef.add({
        msg: `New ${states.length} states was successfully imported!`,
        action: {
          text:''
        },
        timeout: 4000
      });
    
    });

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
      });
  }
  

  zoomIn() {
    if( this.zoom > 1.9) { 
      return;
    }
    
    this.zoom+=0.1;
    this._flouService.getJsPlumbInstance().setZoom(this.zoom);
  }

  resetZoom() { 
    this.zoom = 1;
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
      if( e.target.id == 'pages-wrapper' || e.target.id == 'pages') {
        this._flouService.addPage();
      }
    } else { 
      this._flouService.addPage();
    }

  
  }

}
