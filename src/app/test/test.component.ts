import {Component} from '@angular/core';

@Component({
  template: `<div><h1 (click)="test()">LOL KEK</h1></div>`,
  styles: [],
  selector: "test"
})
export class TestComponent{

  test() {
    alert("LOL");
  }
}
