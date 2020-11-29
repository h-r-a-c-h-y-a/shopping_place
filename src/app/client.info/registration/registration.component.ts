import {Component, OnInit} from '@angular/core';
import {Client} from '../Client';
import {FormArray, FormControl, Validators} from '@angular/forms';
import {RegistrationService} from './registration.service';
import {Observable} from 'rxjs';
import {ComponentCanDeactivate} from '../LeavePage.guard';
import * as firebase from 'firebase';

@Component({
  selector: 'app-registration',
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.css']
})
export class RegistrationComponent implements OnInit, ComponentCanDeactivate {
  isFailed = true;
  saved = false;
  errorMessage = 'Registration failed.. Please try later.';
  client: Client;


  constructor(private registerService: RegistrationService) {
  }

  addPhone() {
    (this.registerService.clientForm.controls.phones as FormArray).push(new FormControl('+374',
      [Validators.required, Validators.pattern('^[++][0-9]{9,12}')]));
  }

  deletePhone() {
    (this.registerService.clientForm.controls.phones as FormArray)
      .removeAt((this.registerService.clientForm.controls.phones as FormArray).length - 1);
  }

  confirm(password, confirmPassword) {
    return this.registerService.passwordValidator(password, confirmPassword);
  }

  register() {
    this.saved = !this.saved;
    const data = this.registerService.register();
    data.then((res: Client) => this.client = res,
      error => {
      console.log(error);
      this.isFailed = true;
    });
  }

  ngOnInit() {
    this.isFailed = !this.isFailed;
  }

  canDeactivate(): boolean | Observable<boolean> {
    if (!this.saved && !firebase.auth().currentUser) {
      return confirm('Data not saved are you sure you want to exit?');
    } else {
      return true;
    }
  }
}

// export let client;

@Component({
  template: `
    <p>choose confirmation method</p>
    <mat-dialog-actions align="end">
      <div class="dialog">
        <button mat-button [mat-dialog-close]="false">With Phone Number</button>
        <button mat-button [mat-dialog-close]="true">With Email</button>
      </div>
    </mat-dialog-actions>
  `,
  styles: [`div {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    justify-content: space-around;
    align-items: stretch;
    align-content: stretch;
  }

  p {
    text-align: center;
    padding: 1rem;
    font-family: monospace;
    font-style: oblique;
    font-weight: bold;
    color: darkblue;
  }

  button {
    background-color: aliceblue;
  }

  button:hover {
    background-color: aquamarine;
    color: black
  }`]
})
export class DialogContentExampleComponent {
}

