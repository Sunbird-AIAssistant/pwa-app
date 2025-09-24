import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular'; // optional if using Ionic
import { AuthRoutingModule } from './auth-routing.module';
import { UserRegistrationComponent } from './user-registration/user-registration.component';
import { LoginComponent } from './login/login.component';


@NgModule({
  declarations: [
    LoginComponent,
    UserRegistrationComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,  // optional
    AuthRoutingModule
  ]
})
export class AuthModule { }
