import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { InputItemComponent } from '../app/input-item/input-item.component';

@Injectable()
export class InputItemService {
    panelShowEvent: Subject<InputItemComponent>;
    panelHideEvent: Subject<any>;
    constructor() {
        this.panelShowEvent = new Subject();
        this.panelHideEvent = new Subject();
    }


    emitPanelShowEvent(component: InputItemComponent) {
        this.panelShowEvent.next(component);
    }

    emitPanelHideEvent() {
        this.panelHideEvent.next();
    }
}
