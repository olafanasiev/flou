import { Component, AfterViewInit, OnInit, ChangeDetectorRef, HostListener, ViewChild, ElementRef } from '@angular/core';
import { FlouService } from '../services/flou.service';
import { Page } from './models/page';
import * as _ from 'lodash';
import {SnackbarService} from 'ngx-snackbar';
import { ErrorService } from '../services/error.service';

const Y_LETTER_CODE = 89;
const Z_LETTER_CODE = 90;
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit, OnInit {
  title = 'app';
  pages: Page[] = [];
  zoom: number = 1;
  @ViewChild('downloadLink')
  downloadLink:ElementRef;
  constructor(private _flouService: FlouService,
    private _snackBarRef: SnackbarService, 
    private _cd: ChangeDetectorRef,
    private _errorService: ErrorService) {}


  @HostListener('window:keyup', ['$event'])
  keyEvent(event: KeyboardEvent) {
      if( event.ctrlKey && event.keyCode == Z_LETTER_CODE ) {
        this._flouService.ctrlZ();
        this._cd.detectChanges();
        return;
      }

      if( event.ctrlKey && event.keyCode == Y_LETTER_CODE ) {
        this._flouService.ctrlY();
        this._cd.detectChanges();
        return;
      }
  }

  ngAfterViewInit() {
    this.pages =  this._flouService.getPages();
    setInterval( this.autosave.bind(this), 10000);
  }

  autosave() {
    localStorage.setItem("flou_autosave", JSON.stringify(this.pages) );
  }
  
  ngOnInit() {
      this._flouService.initJsPlumb();
  }

  onPageDelete( removedPage: Page ) {
      let doSaveAction = true;
      this._snackBarRef.add({
        msg: `Page "${removedPage.title}" was removed`,
        timeout: 4000,
        action: {
          text: 'Undo',
          onClick: (snack) => {
            this._flouService.restorePage(removedPage, doSaveAction);
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

  export(){ 
    let state = this._flouService.export();
    let blob = new Blob([state], { type: 'text/json' });
    let url= window.URL.createObjectURL(blob);
    this.downloadLink.nativeElement.href= url;
    this.downloadLink.nativeElement.download = "flou-app.json";
    this.downloadLink.nativeElement.click();
  }

  import(e) {
    let fileReader = new FileReader();
    fileReader.onload = (e) => {
      try { 
        this._flouService.import(JSON.parse(fileReader.result.toString()));
        this.pages = this._flouService.getPages();
      } catch( e ) { 
        this._errorService.onError.next({code:"1003", message: "Can't import app"});
      }
    }
    if( e.target.files && !_.isEmpty(e.target.files)){ 
      fileReader.readAsText(e.target.files[0]);
    }
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
    let doSaveAction = true;
    if( e && e.target ) {
      if( e.target.id == 'pages-wrapper' || e.target.id == 'pages') {
        this._flouService.addPage(doSaveAction);
      }
    } else { 
      this._flouService.addPage(doSaveAction);
    }

  
  }

}
