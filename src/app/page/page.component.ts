import { Component, OnInit, Input, ViewEncapsulation,
  AfterViewInit, ViewContainerRef, ViewChildren, QueryList, ElementRef, ViewChild, Output, EventEmitter } from '@angular/core';
import { FlouService } from '../../services/flou.service';
import { Page } from '../models/page';
import { InputItemComponent } from '../input-item/input-item.component';
import { PerfectScrollbarComponent } from 'ngx-perfect-scrollbar';
import { PageService } from '../../services/page.service';
declare var $: any;
@Component({
  selector: 'app-page',
  templateUrl: './page.component.html',
  styleUrls: ['./page.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class PageComponent implements OnInit, AfterViewInit {
  @ViewChild('itemTypePanel') itemTypePanel: ElementRef;
  @ViewChild(PerfectScrollbarComponent) scroll: PerfectScrollbarComponent;
  @Output()
  pageClicked: EventEmitter<Page> = new EventEmitter();
  @Input()
  page: Page;
  @ViewChildren(InputItemComponent) items: QueryList<InputItemComponent>;
  constructor(private _flouService: FlouService,
              private _viewRef: ViewContainerRef,
              private _pageService: PageService) { }

  ngOnInit() {
    this._pageService.pageActiveEvent.subscribe((htmlId) => {
      if ( this.page.htmlId !== htmlId ) {
        this.page.isActive = false;
      }
    });
  }

  ngAfterViewInit() {
    this._viewRef.element.nativeElement.id = this.page.htmlId;
    this.items.changes.subscribe((updatedItems: QueryList<InputItemComponent>) => {
      updatedItems.forEach((item: InputItemComponent) => {
        if ( !item.isJsPlumbed ) {
            this._flouService.getJsPlumbInstance().makeSource( 'anchor-' + item.htmlId, {anchor: ['RightMiddle'],
                parent: $(this._viewRef.element.nativeElement), endpoint: ['Rectangle', { width: 1, height: 1}] });
                item.isJsPlumbed = true;
        }
      });
    });

    $('.page__items').sortable({ update: () => {
      this._flouService.getJsPlumbInstance().repaintEverything();
    }});

    $(this._viewRef.element.nativeElement).draggable({
      drag: () => {
        this._flouService.getJsPlumbInstance().repaintEverything();
      }
    });
    this._flouService.getJsPlumbInstance().makeTarget(this.page.htmlId,
      {anchor: 'Continuous', endpoint: ['Rectangle', { width: 1, height: 1}]
    });
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


  addItem() {
     this._flouService.addItem(this.page);
     this.scroll.directiveRef.scrollToBottom();
  }

}
