import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree} from '@angular/router';
import {Observable} from 'rxjs';
import {CookieService} from 'ngx-cookie-service';
import {Injectable} from '@angular/core';
import {FirebaseConfig} from '../firebase/firebase.config';
import * as firebase from "firebase";

@Injectable()
export class ShopListGuard implements CanActivate {

  constructor(private cookie: CookieService,
              private route: Router,
              private firebaseConfig: FirebaseConfig) {
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot)
    : Observable<boolean | UrlTree> | Promise<boolean> | boolean {

    return new Promise<boolean>((resolve, reject) => {
      firebase.auth().onAuthStateChanged(user => {
        if (user) {
          if (user.emailVerified) return resolve(true);
          else alert('An email confirmation link has been sent to your email. please click on it and sign in again');
        } else alert('Login only to authorized users\n Please register or login in system.');
        this.route.navigate(['/login']).then();
        reject(false);
      });
    });
  }

}
