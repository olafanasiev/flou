import { Component, OnInit, ViewChild } from '@angular/core';
import { FlouService } from '../../services/flou.service';
import { AppState } from '../models/app-state';
import * as _ from 'lodash';
import { NgSelectComponent } from '@ng-select/ng-select';
import { ItemsList } from '@ng-select/ng-select/ng-select/items-list';

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
  constructor(private _flouService: FlouService) { }


  ngOnInit() {
    this._flouService.loadApp().then((appStates:AppState[]) => {
      this.appStates = appStates;
    }).catch((e) => { 
      console.error('couldn\'t load app states, something went wrong',e);
    });
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
        alert("can't save app state!");
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
    // console.log(this.selectedState);
    this._flouService.loadState(this.selectedState);
  }
}
