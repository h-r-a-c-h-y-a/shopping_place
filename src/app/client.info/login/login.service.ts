import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import * as firebase from 'firebase';
import {auth} from '../registration/registration.service';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {Client} from "../Client";

@Injectable()
export class LoginService {

  name = '';
  loginForm: FormGroup;

  constructor(private http: HttpClient) {
    this.loginForm = new FormBuilder().group({
      email: ['', [Validators.email, Validators.required]],
      password: ['', [Validators.required,
        Validators.minLength(6),
        Validators.pattern('(?=\\D*\\d)(?=[^a-z]*[a-z])(?=[^A-Z]*[A-Z]).{8,30}')]]
    });
  }

  login(email: string, password: string): Promise<Client | string>{
    return new Promise((resolve, reject) => {
      this.validateData(email, password)
        .then(resp => {
          if (resp.user.emailVerified) {
            this.http.post(auth + '/login', {email, password})
              .subscribe((response: RespModel) => {
                const client: Client = response.client;
                localStorage.setItem('token', response.token);
                console.log(response);
                resolve(client);
              }, error1 => {
                reject(error1.message);
                // this.success = false;
                // this.error = error1.error.message; // 'Something went wrong, please try later.';
              });
          }
          // 'Please verify your email and try again.';
        })
        .catch((error) => {
           reject(error.message);
        });
    });
  }

  validateData(email: string, password: string) {
    return firebase.auth().signInWithEmailAndPassword(email, password);
  }
}

interface RespModel {
  token: string;
  client: Client;
}
