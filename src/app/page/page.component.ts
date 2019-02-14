import { Component, OnInit, Input, ViewEncapsulation, ChangeDetectorRef,
  AfterViewInit, ViewContainerRef, ViewChildren, QueryList, ElementRef, ViewChild, Output, EventEmitter, OnDestroy } from '@angular/core';
import { FlouService } from '../../services/flou.service';
import { Page } from '../models/page';
import { InputItemService } from '../../services/input-item.service';
import { InputItemComponent } from '../input-item/input-item.component';
import { PageService } from '../../services/page.service';
import * as _ from 'lodash';
import { PageItem } from '../models/page-item';
import { Subscription } from 'rxjs';
declare var $: any;
@Component({
  selector: 'app-page',
  templateUrl: './page.component.html',
  styleUrls: ['./page.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class PageComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('itemTypePanel') itemTypePanel: ElementRef;
  @ViewChild('itemsContainer') itemsContainer: ElementRef;
  @Output()
  pageClicked: EventEmitter<Page> = new EventEmitter();
  @Output()
  pageDeleted: EventEmitter<Page> = new EventEmitter();
  @Input()
  page: Page;
  @ViewChildren(InputItemComponent) items: QueryList<InputItemComponent>;
  subscriptions: Subscription[] = [];
  constructor(private _flouService: FlouService,
              private _viewRef: ViewContainerRef,
              private _inputItemService: InputItemService,
              private _pageService: PageService,
              private _cd: ChangeDetectorRef) { }

  ngOnInit() {
    this.subscriptions.push(this._pageService.pageActiveEvent.subscribe((htmlId) => {
      if ( this.page.htmlId !== htmlId ) {
        this.page.isActive = false;
      }
    }));

  }

  ngOnDestroy() {
    this.subscriptions.forEach((subscription: Subscription) => {
      subscription.unsubscribe();
    });
  }

  removeEmptyItem( htmlId) { 
    _.remove( this.page.items,( item: PageItem )=> {
        return item.htmlId == htmlId;
    });
  }

  ngAfterViewInit() {
    this._viewRef.element.nativeElement.id = this.page.htmlId;
    //TODO:: there is an issue on production, this.page - is null
    //makeTarget will cause an exception. We should implement ready lifecycle for FLOUJS
    setTimeout(() => {
      this._flouService.makeTarget(this.page.htmlId);

      let $itemsContainer = $(this.itemsContainer.nativeElement);
        $itemsContainer.sortable({ handle: '.item-sortable-icon' , update: () => {

      }, start: () => {
        this._inputItemService.emitPanelHideEvent();
        this._flouService.saveAction();
      }, stop: () => {
        this._flouService.saveAction();
      }});
      this.enableDragging();

      this._flouService.pageLoaded.next(this.page);
    }, 0);

  }



  enableDragging() {
    this._flouService.enableDragging(this._viewRef.element.nativeElement, {
      start: () => {
        this._flouService.saveAction();
      },
      stop: (info) => { 
        this.page.x = info.pos[0];
        this.page.y = info.pos[1];
        this._flouService.saveAction();
        // this.updateWindowSize();
        this._flouService.emitDragStopped();
        },
      force: true
    });
    this._flouService.getJsPlumbInstance().setDraggable(this._viewRef.element.nativeElement, true);
  }

  disableDragging() {
    this._flouService.disableDragging(this._viewRef.element.nativeElement);
  }

  updatePosition( x, y) {
    this.page.x = x;
    this.page.y = y;
  }

  makeActive() {
    this.page.isActive = true;
    this._pageService.emitPageActiveEvent(this.page.htmlId);
  }

  makeNotActive(e) {
    if ( !$(e.target).hasClass('item-panel') && !$(e.target).hasClass('context-menu-item')) {
      this.page.isActive = false;
    }
  }

  deletePage(){
    let doSaveAction = true;
    this._flouService.removePage(this.page, doSaveAction).then((removedPage) => {
      this.pageDeleted.next(removedPage);
    });
  }

  addItem(e) {
    let doSaveAction = true;
    if( e ) { 
      if( e.target && e.target.classList && e.target.classList.contains('can-add-item')) {
        this._flouService.addItem(this.page, null, doSaveAction );
      }
    } else { 
       this._flouService.addItem(this.page, null, doSaveAction);
    }
    this._cd.detectChanges();
  }

}
