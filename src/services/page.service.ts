import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';

@Injectable()
export class PageService {

  pageActiveEvent: Subject<string>;
  constructor() {
      this.pageActiveEvent = new Subject();
  }

  emitPageActiveEvent(htmlId: string) {
      this.pageActiveEvent.next(htmlId);
  }

}
