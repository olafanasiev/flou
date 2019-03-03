import { Component, AfterViewInit, OnInit, ChangeDetectorRef, HostListener, ViewChild, ElementRef } from '@angular/core';
import { FlouService } from '../services/flou.service';
import { Page } from './models/page';
import * as _ from 'lodash';
import {SnackbarService} from 'ngx-snackbar';
import { ErrorService } from '../services/error.service';
import {Theme} from "./shared/app.const";
import {RemovedPageMeta} from "./models/removed-page-meta";

const Y_LETTER_CODE = 89;
const Z_LETTER_CODE = 90;
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'app';
  theme = 'dark';
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

  @HostListener('window:resize',['$event'])
  onResize(event) {
    if( event.target.innerHeight > this.appHeight) {
      this.appHeight = event.target.innerHeight;
    }
  }

  changeTheme() {
    this.theme = this.theme == Theme.DARK ? Theme.LIGHT:Theme.DARK;
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
        this._flouService.ctrlZ().then(() => {
          this.pages = this._flouService.getPages();
          this._cd.detectChanges();
          this.redrawConnections();
        });
        return;
      }

      if( event.ctrlKey && event.keyCode == Y_LETTER_CODE ) {
        this._flouService.ctrlY().then(() => {
          this.pages = this._flouService.getPages();
          this._cd.detectChanges();
          this.redrawConnections();
        });
        return;
      }
  }

  ngOnInit(): void {
    this.appHeight = this._flouService.getLastAppHeight() || window.innerHeight;
    this._flouService.initJsPlumb().then(() => {
      this._flouService.loadLastAppState().then(() => {
        this.pages = this._flouService.getPages();
      });
    });
  }

  redrawConnections() {
    //setting timeout gives 100% confidence that all components are loaded
    setTimeout(() => {
      this.pages.forEach((page) => {
        page.items.forEach(pageItem => {
          pageItem.connectionMeta.forEach(( connection ) => {
            this._flouService.drawViewConnection(connection.sourceEndpointId, connection.targetEndpointId, connection.label);
          });
        });
      });
    });
  }

  ngAfterViewInit() {
    this.redrawConnections();
    this._flouService.saveAction();
  }

  onPageDelete( removedPage: RemovedPageMeta ) {
      let doSaveAction = true;
      this._snackBarRef.add({
        msg: `Page "${removedPage.page.title}" was removed`,
        timeout: 4000,
        action: {
          text: 'Undo',
          onClick: (snack) => {
            this._flouService.restorePage(removedPage.page, doSaveAction);
            this._cd.detectChanges();
            removedPage.inputConnections
                  .forEach(connectionMeta =>
                      this._flouService.drawViewConnection(connectionMeta.sourceEndpointId, connectionMeta.targetEndpointId, connectionMeta.label));
            removedPage.page.items
                            .forEach( pageItem => pageItem.connectionMeta
                            .forEach( connectionMeta => this._flouService.drawViewConnection(connectionMeta.sourceEndpointId, connectionMeta.targetEndpointId, connectionMeta.label)))
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
        this._flouService.import(JSON.parse(fileReader.result.toString())).then(() => {
            this.pages = this._flouService.getPages();
            this._cd.detectChanges();
            this.redrawConnections();
        });

      } catch( e ) {
        this._errorService.onError.next({code:"1003", message: "Can't import app"});
      }
        this.importApp.nativeElement.value = '';
    };
    if( e.target.files && !_.isEmpty(e.target.files)){ 
      fileReader.readAsText(_.first(e.target.files));
    }
  }

  addPage(e:MouseEvent) {
    let doSaveAction = true;
    if( e && e.target ) {
      if( (<any> e.target).id == 'pages-wrapper' || (<any> e.target).id == 'pages') {
        this._flouService.addPage(e.screenX + window.scrollX, e.screenY + window.scrollY, doSaveAction);
      }
    } else { 
      this._flouService.addPage(null, null, doSaveAction);
    }

  
  }

}
