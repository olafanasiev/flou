import {Injectable} from '@angular/core';
import * as _ from 'lodash';

export interface Theme {
  name: string;
  style: any;
}

@Injectable()
export class ThemingService {
  themes: Theme[] = [];
  currentTheme: Theme;

  register(name: string, style: any) {
    this.themes.push({name: name, style: style});
  }

  getCurrent() {
    return this.currentTheme;
  }

  changeTheme(themeName) {
    const theme = _.find(this.themes, {name: themeName});
    if (!theme) {
      console.error(`${themeName} is not registered!`);
      return null;
    }
    this.currentTheme = theme;
    return this.currentTheme;
  }


}
