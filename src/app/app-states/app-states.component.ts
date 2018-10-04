import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FlouService } from '../../services/flou.service';
import { AppState } from '../models/app-state';
import * as _ from 'lodash';
import { NgSelectComponent } from '@ng-select/ng-select';
import { ItemsList } from '@ng-select/ng-select/ng-select/items-list';
import { SafeUrl, DomSanitizer } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { ErrorService } from '../../services/error.service';
@Component({
  selector: 'app-states',
  templateUrl: './app-states.component.html',
  styleUrls: ['./app-states.component.css']
})
export class AppStatesComponent implements OnInit {
  @ViewChild(NgSelectComponent) select:NgSelectComponent;
  appStates: AppState[];
  openSaveStateDialog: boolean = false;
  selectedState: AppState;
  @ViewChild("exportLink") exportLink: ElementRef;
  constructor(private _flouService: FlouService,
              private _errorService: ErrorService) { }


  ngOnInit() {
    this._flouService.loadApp().then((appStates:AppState[]) => {
      this.appStates = appStates;
    }).catch((e) => { 
      console.error('couldn\'t load app states, something went wrong',e);
    });
  }

  remove() {
    console.log("Remove action");
  }

  export() {
    let statesAsStr = JSON.stringify(this.appStates);
    let blob = new Blob([statesAsStr], { type: 'text/json' });
    let url= window.URL.createObjectURL(blob);
    this.exportLink.nativeElement.href= url;
    this.exportLink.nativeElement.download = "flou-states.json";
  }

  validateStates( states:any ):boolean {
    let isValid = true;
    states.forEach((state) => {
        if( !state.uid || !state.name || !state.data ) {
          this._errorService.onError.next({code:"1001", message: `State ${state} is not valid!`});
          isValid = false;
        }
    });
    return isValid;
  }
  import(e) {
    let fileReader = new FileReader();
    fileReader.onload = (e) => {
      try { 
        let states:AppState[] = JSON.parse(fileReader.result.toString());
        if ( !this.validateStates(states) ) { 
          return;
        }
        this._flouService.mergeStates(states).then((newStates) => { 
          this.appStates = newStates;
        });
      } catch( e ) { 
        this._errorService.onError.next({code:"1003", message: "Can't merge states with existing"});
      }
    }
    if( e.target.files && !_.isEmpty(e.target.files)){ 
      fileReader.readAsText(e.target.files[0]);
    }
  }

  save() {
    
    if( this.selectedState ) { 
      this.selectedState.name = this.selectedState.name.trim();
      this._flouService.saveState(this.selectedState.name).then((savedState:AppState) => {
        let foundItem = _.find( this.select.itemsList.items, (item) => {
          return item.value.name == savedState.name;
        });
        this.selectedState = savedState;
        foundItem.value = savedState;
      }).catch((e)=> {
        this._errorService.onError.next({code:"1002", message: "Can't save the state"});
        console.error(e);
      });
    }
  }
  
  selectState(state: AppState) {
    _.remove( this.select.itemsList.items, ( item:any ) => {
       return !item.selected && !item.value.uid;
    });
    this.selectedState = state;
  }

  load() {
    this._flouService.loadState(this.selectedState);
  }
}
