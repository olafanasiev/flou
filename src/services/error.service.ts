import { Injectable } from "@angular/core";
import { Subject, Observable } from "rxjs";

@Injectable()
export class ErrorService { 
    onError: Subject<any>;
    onError$: Observable<any>;

    constructor() {
        this.onError = new Subject<any>();
        this.onError$ = this.onError.asObservable();
    }
}