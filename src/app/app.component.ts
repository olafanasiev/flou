import {Component, AfterViewInit, OnInit, ChangeDetectorRef, HostListener, ViewChild, ElementRef} from '@angular/core';
import {FlouService} from '../services/flou.service';
import {Page} from './models/page';
import * as _ from 'lodash';
import {SnackbarService} from 'ngx-snackbar';
import {ErrorService} from '../services/error.service';
import {RemovedPageMeta} from './models/removed-page-meta';
import {Theme, ThemingService} from './theming.service';
import {ThemeName} from './shared/app.const';

const Y_LETTER_CODE = 89;
const Z_LETTER_CODE = 90;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, AfterViewInit {
  title = 'app';
  theme: Theme;
  appHeight = 0;
  pages: Page[] = [];
  @ViewChild('downloadLink')
  downloadLink: ElementRef;
  @ViewChild('importApp')
  importApp: ElementRef;

  constructor(private _flouService: FlouService,
              private _snackBarRef: SnackbarService,
              private _theming: ThemingService,
              private _cd: ChangeDetectorRef,
              private _errorService: ErrorService) {
    this._flouService.pageDragStop$.subscribe(() => {
      this.appHeight = this.getNewWindowSize();
      this._flouService.saveAppHeight(this.appHeight);
    });
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    if (event.target.innerHeight > this.appHeight) {
      this.appHeight = event.target.innerHeight;
    }
  }

  changeTheme() {
    this.theme = this.theme.name === ThemeName.DARK ? this._theming.changeTheme(ThemeName.LIGHT) : this._theming.changeTheme(ThemeName.DARK);
  }

  getNewWindowSize() {
    const scrollHeight = Math.max(
      document.body.scrollHeight, document.documentElement.scrollHeight,
      document.body.offsetHeight, document.documentElement.offsetHeight,
      document.body.clientHeight, document.documentElement.clientHeight
    );
    return scrollHeight;
  }

  @HostListener('window:keyup', ['$event'])
  keyEvent(event: KeyboardEvent) {

    if (event.ctrlKey && event.keyCode === Z_LETTER_CODE) {
      this._flouService.ctrlZ().then(() => {
        this.pages = this._flouService.getPages();
        this._cd.detectChanges();
        this.redrawConnections();
      });
      return;
    }

    if (event.ctrlKey && event.keyCode === Y_LETTER_CODE) {
      this._flouService.ctrlY().then(() => {
        this.pages = this._flouService.getPages();
        this._cd.detectChanges();
        this.redrawConnections();
      });
      return;
    }
  }

  ngOnInit(): void {
    this._theming.register(ThemeName.DARK, {fill: '#FF8800', stroke: '#FF8800', color: '#FFFFFF'});
    this._theming.register(ThemeName.LIGHT, {fill: '#FF8800', stroke: '#FF8800', color: '#8a8a8a'});
    this.theme = this._theming.changeTheme(ThemeName.DARK);
    this.appHeight = this._flouService.getLastAppHeight() || window.innerHeight;
    this._flouService.initJsPlumb().then(() => {
      this._flouService.loadLastAppState().then(() => {
        this.pages = this._flouService.getPages();
      });
    });
  }

  redrawConnections() {
    // setting timeout gives 100% confidence that all components are loaded
    setTimeout(() => {
      this.pages.forEach((page) => {
        page.items.forEach(pageItem => {
          pageItem.connectionMeta.forEach((connection) => {
            this._flouService.drawConnection(connection.sourceEndpointId, connection.targetEndpointId, connection.label);
          });
        });
      });
    });
  }

  ngAfterViewInit() {
    this.redrawConnections();
    this._flouService.saveAction();
  }


  clearApp() {

  }

  onPageDelete(removedPage: RemovedPageMeta) {
    const doSaveAction = true;
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
              this._flouService.drawConnection(connectionMeta.sourceEndpointId, connectionMeta.targetEndpointId, connectionMeta.label));
          removedPage.page.items
            .forEach(pageItem => pageItem.connectionMeta
              .forEach(connectionMeta => this._flouService.drawConnection(connectionMeta.sourceEndpointId, connectionMeta.targetEndpointId, connectionMeta.label)));
          this._snackBarRef.clear();
        },
      },
    });
  }

  export() {
    const state = this._flouService.export();
    const blob = new Blob([state], {type: 'text/json'});
    const url = window.URL.createObjectURL(blob);
    this.downloadLink.nativeElement.href = url;
    this.downloadLink.nativeElement.download = 'flou-app.json';
    this.downloadLink.nativeElement.click();
  }

  import(e) {
    const fileReader = new FileReader();

    fileReader.onload = () => {
      try {
        this._flouService.import(JSON.parse(fileReader.result.toString())).then(() => {
          this.pages = this._flouService.getPages();
          this._cd.detectChanges();
          this.redrawConnections();
        });

      } catch (e) {
        this._errorService.onError.next({code: '1003', message: 'Can\'t import app'});
      }
      this.importApp.nativeElement.value = '';
    };
    if (e.target.files && !_.isEmpty(e.target.files)) {
      fileReader.readAsText(_.first(e.target.files));
    }
  }

  addPage(e: MouseEvent) {
    const doSaveAction = true;
    if (e && e.target) {
      if ((<any>e.target).id === 'pages-wrapper' || (<any>e.target).id === 'pages') {
        this._flouService.addPage(e.screenX + window.scrollX, e.screenY + window.scrollY, doSaveAction);
      }
    } else {
      this._flouService.addPage(null, null, doSaveAction);
    }


  }

}
