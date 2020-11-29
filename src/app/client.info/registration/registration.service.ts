import {Component, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Client} from '../Client';
import * as firebase from 'firebase';
import {FirebaseConfig} from '../../firebase/firebase.config';
import {Router} from '@angular/router';
import {userUrl} from '../../profile-editor/profile-editor.service';
import {FormArray, FormBuilder, FormGroup, Validators} from "@angular/forms";
import {MatDialog} from "@angular/material/dialog";
import {DialogContentExampleComponent} from "./registration.component";

@Injectable()
export class RegistrationService {
  successMessage = 'An email confirmation link has been sent to your email. please click on it';
  client: Client;
  clientForm: FormGroup;

  constructor(private http: HttpClient,
              private firebaseConfig: FirebaseConfig,
              private route: Router,
              private formBuilder: FormBuilder,
              private dialog: MatDialog) {
    this.clientForm = formBuilder.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phones: formBuilder.array([['+374',
        [Validators.required, Validators.pattern('^[++][0-9]{9,12}')]]]),
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required,
        Validators.minLength(6),
        Validators.pattern('(?=\\D*\\d)(?=[^a-z]*[a-z])(?=[^A-Z]*[A-Z]).{8,30}')]]
    });
    if (firebaseConfig.ui.isPendingRedirect()) {
      firebaseConfig.ui.start('#firebaseui-auth-container', firebaseConfig.uiConfig);
    }
    if ((firebase.auth().isSignInWithEmailLink(window.location.href))) {
      firebaseConfig.ui.start('#firebaseui-auth-container', firebaseConfig.uiConfig);
    }
  }

  passwordValidator(password: string, confirmPassword: string): boolean {
    return password.trim() === confirmPassword.trim();
  }

  register(): Promise<Client | string> {
    const name = this.clientForm.controls.name.value;
    const email = this.clientForm.controls.email.value;
    const password = this.clientForm.controls.password.value;
    const phones = (this.clientForm.controls.phones as FormArray).getRawValue();
    const newClient = new Client(name, email, password, phones);
    const dialogRef = this.dialog.open(DialogContentExampleComponent);
    return new Promise<Client | string>((resolve, reject) => {
      dialogRef.afterClosed().subscribe(answer => {
        if (answer) {
          if (firebase.auth().currentUser) {
            const credential = firebase.auth.EmailAuthProvider.credential(newClient.email, newClient.password);
            firebase.auth().currentUser.linkWithCredential(credential).then((auth) => {
              console.log('Anonymous account successfully upgraded', auth);
              this.client = newClient;
              this.client.id = auth.user.uid;
              if (auth.user && auth.user.emailVerified === false) {
                auth.user.sendEmailVerification().then(() => {
                  this.save(this.client).subscribe(response => {
                    alert(this.successMessage);
                    this.route.navigate(['/login']).then(() => {
                      resolve(response as Client);
                    });
                  }, error => {
                    this.unregister();
                    reject(error);
                  });
                });
              }
            }, (error) => {
              console.log('Error upgrading anonymous account', error);
              reject(error);
            });
          }
        } else {
          this.client = newClient;
          this.route.navigate(['/verify-phone-number']).then();
          resolve(newClient);
        }
      });
    });
    // return firebase.auth().createUserWithEmailAndPassword(newClient.email, newClient.password)
    //   .then(auth => {
    //     this.client = newClient;
    //     this.client.id = auth.user.uid;
    //     if (auth.user && auth.user.emailVerified === false) {
    //       auth.user.sendEmailVerification().then(() => {
    //         this.save(this.client).subscribe(response => {
    //           alert(this.successMessage);
    //           this.route.navigate(['/login']);
    //           return;
    //         }, error => {
    //           this.unregister();
    //         });
    //       });
    //     }
    //   }).catch((error) => {
    //     // Handle Errors here.
    //     const errorCode = error.code;
    //     const errorMessage = error.message;
    //     console.log(errorCode, errorMessage);
    //   });
    // firebase.auth().sendSignInLinkToEmail(client.email, {
    //   url: 'http://localhost:4200/login',
    //   handleCodeInApp: true
    // }).then(() => {
    //
    // });
  }

  unregister() {
    const user = firebase.auth().currentUser;
    if(user) user.delete().then().catch((error) => console.log(error));
    // this.route.navigate(['/login']).then();
  }

  save(client: Client) {
    return this.http.post(auth + '/register', client);
  }


  getByUID(uid: string) {
    return this.http.get(userUrl + '/user/' + uid);
  }

  getEmail() {
    return this.http.get('https://api.github.com/user/emails', {
      headers: {
        Authorization: `token ${(JSON.parse(JSON.stringify(firebase.auth().currentUser)).stsTokenManager.accessToken)}`
      }
    });
  }
}

export const auth = 'http://localhost:8080/auth';

