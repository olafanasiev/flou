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
  appHeight = 0;
  pages: Page[] = [];
  @ViewChild('downloadLink')
  downloadLink:ElementRef;
  @ViewChild('importApp')
  importApp: ElementRef;
  constructor(private _flouService: FlouService,
    private _snackBarRef: SnackbarService,
    private _cd: ChangeDetectorRef,
    private _errorService: ErrorService) {
    this._flouService.pageDragStop$.subscribe(() => {
        this.appHeight = this.getNewWindowSize();
        this._flouService.saveAppHeight(this.appHeight);
    });
  }

  getNewWindowSize() {
    let scrollHeight = Math.max(
      document.body.scrollHeight, document.documentElement.scrollHeight,
      document.body.offsetHeight, document.documentElement.offsetHeight,
      document.body.clientHeight, document.documentElement.clientHeight
    );
    return scrollHeight;
  }

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

  ngOnInit(): void {
    this.appHeight = this._flouService.getLastAppHeight() || window.innerHeight;
    this._flouService.initJsPlumb();
  }

  ngAfterViewInit() {
    this._flouService.loadLastAppState().then(() => {
      this.pages = this._flouService.getPages();
    });
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
        this.importApp.nativeElement.value = '';
    }
    if( e.target.files && !_.isEmpty(e.target.files)){ 
      fileReader.readAsText(_.first(e.target.files));
    }
  }

  addPage(e:MouseEvent) {
    let doSaveAction = true;
    if( e && e.target ) {
      if( (<any> e.target).id == 'pages-wrapper' || (<any> e.target).id == 'pages') {
        this._flouService.addPage(e.screenX, e.screenY, doSaveAction);
      }
    } else { 
      this._flouService.addPage(null, null, doSaveAction);
    }

  
  }

}
