import {
  Component, OnInit, Input, ViewEncapsulation, ChangeDetectorRef,
  AfterViewInit, ViewContainerRef, ViewChildren, QueryList, ElementRef, ViewChild, Output, EventEmitter, OnDestroy
} from '@angular/core';
import {FlouService} from '../../services/flou.service';
import {Page} from '../models/page';
import {InputItemService} from '../../services/input-item.service';
import {InputItemComponent} from '../input-item/input-item.component';
import {PageService} from '../../services/page.service';
import * as _ from 'lodash';
import {PageItem} from '../models/page-item';
import {Subscription} from 'rxjs';
import {Endpoint} from 'jsplumb';
import {RemovedPageMeta} from '../models/removed-page-meta';
import {CdkDragDrop, moveItemInArray} from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-page',
  templateUrl: './page.component.html',
  styleUrls: ['./page.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class PageComponent implements OnInit, AfterViewInit, OnDestroy {
  @Output()
  pageClicked: EventEmitter<Page> = new EventEmitter();
  @Output()
  pageDeleted: EventEmitter<RemovedPageMeta> = new EventEmitter();
  @Input()
  page: Page;
  subscriptions: Subscription[] = [];

  constructor(private _flouService: FlouService,
              private _viewRef: ViewContainerRef,
              private _inputItemService: InputItemService,
              private _pageService: PageService,
              private _cd: ChangeDetectorRef) {
  }

  ngOnInit() {
    this.subscriptions.push(this._pageService.pageActiveEvent.subscribe((htmlId) => {
      if (this.page.endpointId !== htmlId) {
        this.page.isActive = false;
      }
    }));

    this.subscriptions.push(this._flouService.connectionWithPageEstablished$.subscribe((pageId) => {
      if (this.page.endpointId === pageId) {
        this.makeActive();
      }
    }));

  }

  ngOnDestroy() {
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });
  }

  removeEmptyItem(htmlId) {
    _.remove(this.page.items, (item: PageItem) => {
      return item.endpointId === htmlId;
    });
  }

  onItemRemove(item: PageItem) {
    this._cd.detectChanges();
    this._flouService.getJsPlumbInstance().repaintEverything();
  }

  drop(event: CdkDragDrop<PageItem>) {
    moveItemInArray(this.page.items, event.previousIndex, event.currentIndex);
    this.enableDragging();
    this._flouService.getJsPlumbInstance().revalidate(this.page.endpointId);
  }

  ngAfterViewInit() {
    this._viewRef.element.nativeElement.id = this.page.endpointId;
    this._flouService.makeTarget(this.page.endpointId);
    this.enableDragging();

  }

  enableDragging() {
    this._cd.detectChanges();
    this._flouService.enableDragging(this._viewRef.element.nativeElement, {
      start: () => {
        this._flouService.saveAction();
        this._inputItemService.emitPanelHideEvent();
        this._flouService.getJsPlumbInstance().repaintEverything();
      },
      stop: (info) => {
        this.page.x = info.pos[0];
        this.page.y = info.pos[1];
        this._flouService.saveAction();
        this._flouService.emitPageDragStopped(this.page);
        // debugger;
        this._flouService.getJsPlumbInstance().repaintEverything();
      },
      force: true
    });
  }

  makeActive() {
    this.page.isActive = true;
    this._pageService.emitPageActiveEvent(this.page.endpointId);
  }

  makeNotActive(e) {
    // console.log( "page is not active now ");
    if (!e.target.classList.contains('item-panel') && !e.target.classList.contains('context-menu-item')) {
      this.page.isActive = false;
    }
  }

  deletePage() {
    const doSaveAction = true;
    this._flouService.removePage(this.page, doSaveAction).then((removedPage: RemovedPageMeta) => {
      this.pageDeleted.next(removedPage);
    });
  }

  addItem(e?) {
    const doSaveAction = true;
    if (e) {
      if (e.target && e.target.classList && e.target.classList.contains('can-add-item')) {
        this._flouService.addItem(this.page, null, doSaveAction);
      }
    } else {
      this._flouService.addItem(this.page, null, doSaveAction);
    }
    this._cd.detectChanges();
  }

}
