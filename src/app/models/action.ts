import { Page } from "./page";
import { environment } from '../../environments/environment';
export let steps  = {
    actionsCount: 0
}
export class Action { 
    pages: string;
    next: Action = null;
    prev: Action = null;

    addAction(pages) { 
        const newPages = JSON.parse(JSON.stringify(pages));
        
        let action = new Action(newPages);
            action.prev = this;
            this.next = action;

            if( steps.actionsCount >= environment.numberActionsToSave ) {
                this.removeFirstAction(action);
            }
        return action;
    }

    constructor(pages) {
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