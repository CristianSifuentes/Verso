import { Component, OnInit } from '@angular/core';
import { GLOBAL } from './services/global';
import { UserService } from './services/user.service';
import { User } from './models/user';
import { Router, ActivatedRoute, Params } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  providers: [UserService]
})

export class AppComponent implements OnInit {
  public title = 'VERSO';
  public user: User;
  public user_register: User;
  public identity;
  public token;
  public errorMessage;
  public alertRegister;
  public url: string;


  constructor(
    private _route: ActivatedRoute,
    private _router: Router,
    private _userService: UserService
  ) {
    this.user = new User('', '', '', '', '', 'ROLE_USER', '');
    this.user_register = new User('', '', '', '', '', 'ROLE_USER', '');
    this.url = GLOBAL.url;

}

  ngOnInit() {
    this.identity = this._userService.getIdentity();
    this.token = this._userService.getToken();
    console.log(this.identity);
    console.log(this.token);
  }

  public onSubmit() {

    //Conseguir los datos del usuario identificado
    this._userService.signup(this.user).subscribe(
      response => {
        console.log(response);
        let identity = response;
        this.identity = identity;
        if (!this.identity._id) {
          alert("El usuario no esta correctamente logeado");
        } else {
          //crear elemento en el localstorage para tener al usuario en sesión
          //Conseguir el token
          localStorage.setItem('identity', JSON.stringify(identity));

          this._userService.signup(this.user, true).subscribe(
            response => {
              console.log(response);
              let token = response.token;
              this.token = token;
              if (this.token.length <= 0) {
                alert("El tokem no se ja generado");
              } else {

                //crear elemento en el localstorage para tener el token disponible
                localStorage.setItem('token', JSON.stringify(token));
                this.user = new User('', '', '', '', '', 'ROLE_USER', '');

              }

            },
            error => {
              var errorMessagex = <any>error;
              if (errorMessagex != null) {
                var body = JSON.parse(errorMessagex._body)
                this.errorMessage = body.menssage;
                console.log(error);

              }
            }
          );


        }

      },
      error => {
        var errorMessagex = <any>error;
        if (errorMessagex != null) {
          var body = JSON.parse(errorMessagex._body)
          this.errorMessage = body.menssage;
          console.log(error);

        }
      }
    );
  }

  public logout() {
    localStorage.removeItem('identity');
    localStorage.removeItem('token');
    localStorage.clear();
    this.identity = null;
    this.token = null;
    this._router.navigate(['/']);

  }
  public onSubmitRegister() {

    this._userService.register(this.user_register)
      .subscribe(
      response => {
        let user = response.message;
        this.user_register = user;
        if (!user._id) {
          this.alertRegister = 'Error al registrarse';
        } else {
          this.alertRegister = 'El registro se ha realizado correctamente, indentificate' + this.user_register.email;
          this.user_register = new User('', '', '', '', '', 'ROLE_USER', '');
        }

      },
      error => {
        var errorMessagex = <any>error;
        if (errorMessagex != null) {
          var body = JSON.parse(errorMessagex._body)
          this.alertRegister = body.menssage;
          console.log(error);

        }

      }
      );
  }
}
