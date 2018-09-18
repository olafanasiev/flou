import { Component, OnInit, OnChanges } from '@angular/core';
import { FlouService } from '../../services/flou.service';
import { AppState } from '../models/app-state';

@Component({
  selector: 'app-states',
  templateUrl: './app-states.component.html',
  styleUrls: ['./app-states.component.css']
})
export class AppStatesComponent implements OnChanges {
  appStates: AppState[];
  openSaveStateDialog: boolean = false;
  selectedState: AppState;
  constructor(private _flouService: FlouService) { }


  ngOnChanges() {
    console.log('lal');
    this._flouService.loadApp().then((appStates:AppState[]) => {
      this.appStates = appStates;
    }).catch((e) => { 
      console.error('couldn\'t load app states, something went wrong',e);
    });
  }


  save() {
    this._flouService.saveState(this.selectedState.name).then((states:AppState[]) => {
      this.appStates = states;
      console.log('and new states');
      console.log(this.appStates);
    }).catch((e)=> {
      alert("can't save app state!");
    });
  }

  selectState(state: AppState) {
    console.log(state);
    this.selectedState = state;
  }

  load(stateName) {
    this._flouService.loadState("");
  }
}
