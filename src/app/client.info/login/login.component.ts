import {Component, OnInit} from '@angular/core';
import {LoginService} from './login.service';
import {Router} from '@angular/router';
import {ComponentCanDeactivate} from '../LeavePage.guard';
import {Observable} from 'rxjs';
import {Client} from '../Client';
import * as firebase from 'firebase';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  providers: [LoginService]
})
export class LoginComponent implements OnInit, ComponentCanDeactivate {

  success = false;
  saved = false;
  error: string;
  client: Client;

  constructor(private loginService: LoginService,
              private route: Router,) {}

  ngOnInit() {
    this.success = !this.success;
    this.error = '';
    const checkbox = (document.getElementById('defaultChecked2') as HTMLInputElement);
    checkbox.addEventListener('change', ev => {
      if (!checkbox.checked) {
        firebase.auth().setPersistence(firebase.auth.Auth.Persistence.SESSION).then();
      } else {
        firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL).then();
      }
    });
  }

  login() {
    this.saved = !this.saved;
    const email = this.loginService.loginForm.controls.email.value;
    const password = this.loginService.loginForm.controls.password.value;
    // const isChecked = (document.getElementById('defaultChecked2') as HTMLInputElement).checked;
    // if (!isChecked) firebase.auth().setPersistence(firebase.auth.Auth.Persistence.SESSION).then();
    this.loginService.login(email, password).then(res => {
      this.client = res as Client;
      this.saved = true;
      this.route.navigate(['/shop']).then();
    }, err => {
      this.success = false;
      this.error = err;
    });
  }

  canDeactivate(): boolean | Observable<boolean> {
    // this.social.isChecked = (document.getElementById('defaultChecked2') as HTMLInputElement).checked;
    if (!this.saved && !firebase.auth().currentUser) {
      return confirm('Data not saved are you sure you want to exit?');
    } else {
      return true;
    }
  }

}

