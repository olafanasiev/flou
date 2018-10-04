import { Injectable } from "@angular/core";
import { Subject, Observable } from "rxjs";


export interface ErrorCode {
    code: string,
    message: string
}

@Injectable()
export class ErrorService { 
    onError: Subject<ErrorCode>;
    onError$: Observable<ErrorCode>;

    constructor() {
        this.onError = new Subject<ErrorCode>();
        this.onError$ = this.onError.asObservable();
    }
}