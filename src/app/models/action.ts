import { Page } from "./page";
import { environment } from '../../environments/environment';
export let steps  = {
    actionsCount: 0
};
export class Action { 
    pages: Page[];
    next: Action = null;
    prev: Action = null;

    addAction(pages: Page[]) {
        const newPages = pages;
          debugger;
        let action = new Action(newPages);
            action.prev = this;
            this.next = action;

            if( steps.actionsCount >= environment.numberActionsToSave ) {
                this.removeFirstAction(action);
            }
        return action;
    }

    constructor(pages:Page[]) {
        this.pages = pages;
    }

    removeFirstAction(action:Action) {
        if( action.prev==null ){
            let secondAction = action.next;
            action.next = null;
            action.prev = null;
            action.pages = null;
            secondAction.prev = null;
        } else { 
            this.removeFirstAction(action.prev);
        }
         
    }

}
