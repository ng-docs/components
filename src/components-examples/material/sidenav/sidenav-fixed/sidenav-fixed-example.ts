import {Component} from '@angular/core';
import {FormBuilder, FormGroup} from '@angular/forms';

/** @title Fixed sidenav */
@Component({
  selector: 'sidenav-fixed-example',
  templateUrl: 'sidenav-fixed-example.html',
  styleUrls: ['sidenav-fixed-example.css'],
})
export class SidenavFixedExample {
  options: FormGroup;

  constructor(fb: FormBuilder) {
    this.options = fb.group({
      bottom: 0,
      fixed: false,
      top: 0,
    });
  }

  shouldRun = /(^|.)(stackblitz|webcontainer).(io|com)$/.test(window.location.host);
}
