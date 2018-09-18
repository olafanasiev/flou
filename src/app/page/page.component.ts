import { Component, OnInit, Input, ViewEncapsulation,
  AfterViewInit, ViewContainerRef, ViewChildren, QueryList, ElementRef, ViewChild, Output, EventEmitter, OnDestroy } from '@angular/core';
import { FlouService } from '../../services/flou.service';
import { Page } from '../models/page';
import { InputItemService } from '../../services/input-item.service';
import { InputItemComponent } from '../input-item/input-item.component';
import { PageService } from '../../services/page.service';
import * as _ from 'lodash';
import { PageItem } from '../models/page-item';
import { Connection } from '../models/connection';
import { Subscription } from 'rxjs';
import { UUID } from 'angular2-uuid';
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
  @ViewChild('pageTitle') titleElRef: ElementRef;
  @ViewChildren(InputItemComponent) items: QueryList<InputItemComponent>;
  subscriptions: Subscription[] = [];
  constructor(private _flouService: FlouService,
              private _viewRef: ViewContainerRef,
              private _inputItemService: InputItemService,
              private _pageService: PageService) { }

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
    this._viewRef.element.nativeElement.id = this.page.htmlId ;// UUID.UUID();// this.page.htmlId;
    this._flouService.getJsPlumbInstance().makeTarget(this.page.htmlId,
        {anchor: 'Continuous', 
        parent: this.page.htmlId,
        endpoint: ['Rectangle', { width: 1, height: 1}],
        
    });
    
    let $itemsContainer = $(this.itemsContainer.nativeElement);
      $itemsContainer.sortable({ handle: '.item-sortable-icon' , update: () => {
    }, start: () => {
      this._inputItemService.emitPanelHideEvent();
    }});
          
    this._flouService.getJsPlumbInstance().draggable(this._viewRef.element.nativeElement, {
      stop: (info) => { 
        this.page.x = info.pos[0];
        this.page.y = info.pos[1];
      }
    });
    if( this.page.inputConnections ) { 
      this.page.inputConnections.forEach((inputConnection: Connection) => { 
        this._flouService.drawConnection(inputConnection.source, this.page.htmlId);
      });
    }
    $(this.titleElRef.nativeElement).select();
    // this._flouService.getJsPlumbInstance().repaintEverything();
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
    this._flouService.removePage(this.page).then((removedPage) => {
      this.pageDeleted.next(removedPage);
    });
  }

  addItem(e) {
    if( e ) { 
      if( e.target && e.target.classList && e.target.classList.contains('can-add-item')) {
        this._flouService.addItem(this.page);
      }
    } else { 
     this._flouService.addItem(this.page);
    }
  }

}
