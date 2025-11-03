import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import {Router} from '@angular/router';
import { config } from 'configuration/environment.prod';
import { HttpClient } from '@angular/common/http';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['../auth-styles.scss'],
})
export class ForgotPasswordComponent  implements OnInit {

  siteName: string = '';
  apiUrl: string = '';

  forgotPasswordData = {
   // phoneNumber:'',
    email: '',
    newPassword: '',
    confirmNewPassword: '',
    tenantName: ''
  };

  showNewPassword = false;
  showConfirmPassword = false;
  passwordMismatch : boolean = false;


  constructor(
    private http: HttpClient,
        private router: Router,
        private toastController: ToastController
  ) { }

  ngOnInit() {
    this.siteName = localStorage.getItem('siteName') || '';
    this.apiUrl = config.api.BASE_URL;
    this.forgotPasswordData.tenantName = this.siteName;
  }


togglePasswordVisibility(type: 'new' | 'confirm') {
  if (type === 'new') {
    this.showNewPassword = !this.showNewPassword;
  } else {
    this.showConfirmPassword = !this.showConfirmPassword;
  }
}

checkPasswordMatch() {
  const { newPassword, confirmNewPassword } = this.forgotPasswordData;
  this.passwordMismatch = !!(newPassword && confirmNewPassword && newPassword !== confirmNewPassword);
}


  async presentToast(message: string, color: string = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'top'
    });
    toast.present();
  }

onSubmitForgotPassword() {
  if (this.passwordMismatch) return;

  this.http.post(`${this.apiUrl}auth/change-password`, this.forgotPasswordData)
    .subscribe({
      next: async () => {
        await this.presentToast('Password reset successful!', 'success');
        this.router.navigate(['/login']);
        this.resetForm();
      },
      error: async () => {
        await this.presentToast('Something went wrong. Please try again later.', 'danger');
      }
    });
}

resetForm() {
  this.forgotPasswordData = {
    //phoneNumber:'',
    email: '',
    newPassword: '',
    confirmNewPassword: '',
    tenantName: ''
  };
}

  switchToLogin() {
   this.router.navigate(['/login']);
  }
}
