/// <reference types="@types/grecaptcha" />
import {Component, OnInit} from '@angular/core';
import * as firebase from 'firebase';
import {Client} from '../Client';
import {RegistrationService} from '../registration/registration.service';
import {Router} from '@angular/router';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ComponentCanDeactivate} from '../LeavePage.guard';
import {Observable} from 'rxjs';


@Component({
  selector: 'app-verify-phone-number',
  templateUrl: './verify-phone-number.component.html',
  styleUrls: ['./verify-phone-number.component.css']
})
export class VerifyPhoneNumberComponent implements OnInit, ComponentCanDeactivate {

  isVerify = false;
  client: Client;
  recaptchaVerifier;
  recaptchaWidgetId;
  confirmationResult;
  code: number;
  formGroup: FormGroup;
  errorMessage: string;

  constructor(private regService: RegistrationService,
              private router: Router) {
    this.formGroup = new FormBuilder().group({
      code: ['code', [Validators.required]],
    });
  }

  ngOnInit() {
    this.sendCode()
  }

  sendCode(): void {
    this.isVerify = false;
    this.client = this.regService.client;
    if (!this.client) return;
    this.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container');
    this.recaptchaVerifier.render().then(widgetId => {
      this.recaptchaWidgetId = widgetId;
    });
    // firebase.auth.PhoneAuthProvider.
    firebase.auth().signInWithPhoneNumber(this.client.phones[0], this.recaptchaVerifier)
      .then((confirmationResult) => {
        this.confirmationResult = confirmationResult;
      })
      .catch(err => {
        console.log(err);
        this.regService.unregister();
      });
  }

  confCode() {
    const code = this.code;
    const isChecked = (document.getElementById('defaultChecked2') as HTMLInputElement).checked;
    if (!isChecked) {
      firebase.auth().setPersistence(firebase.auth.Auth.Persistence.SESSION).then(() => {
        this.confirmCode(String(code));
      });
    } else {
      this.confirmCode(String(code));
    }
  }
confirmCode(code: string) {
  if (firebase.auth().currentUser) {
    const verificationId = this.confirmationResult.verificationId;
    const credentials = firebase.auth.PhoneAuthProvider.credential(verificationId, String(code));
    firebase.auth().currentUser.linkWithCredential(credentials).then((auth) => {
      console.log('Anonymous account successfully upgraded', auth);
      this.client.uid = auth.user.uid;
      this.regService.save(this.client).subscribe(response => {
        this.router.navigate(['/shop']).then();
        return;
      }, error => {
        this.regService.unregister();
        this.recaptchaVerifier.render().then((widgetId) => {
          grecaptcha.reset(widgetId);
        });
      });
    }, (error) => {
      this.regService.unregister();
      this.recaptchaVerifier.render().then((widgetId) => {
        grecaptcha.reset(widgetId);
      });
      console.error('Error upgrading anonymous account', error);
    });
    return;
  }
  this.confirmationResult.confirm(code)
    .then(result => {
      this.client.uid = result.user.uid;
      this.regService.save(this.client)
        .subscribe(resp => {
          this.isVerify = true;
          this.router.navigate(['/shop']).then();
        }, err => {
          this.errorMessage = err.message;
          this.regService.unregister();
          this.recaptchaVerifier.render().then((widgetId) => {
            grecaptcha.reset(widgetId);
          });
        });
    }).catch(err => {
    this.errorMessage = err.message;
    this.regService.unregister();
    this.recaptchaVerifier.render().then((widgetId) => {
      grecaptcha.reset(widgetId);
    });
  });
}

  canDeactivate(): boolean | Observable<boolean> {
      if (!this.isVerify && !firebase.auth().currentUser)  {
        const res = confirm('Data not saved are you sure you want to exit?');
        if (res) {
          this.regService.unregister();
          return true;
        } else return false;
      } else return true;
  }

}
