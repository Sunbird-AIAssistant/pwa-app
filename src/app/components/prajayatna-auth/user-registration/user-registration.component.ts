import { Component, OnInit } from '@angular/core';
import {Router} from '@angular/router';
import { config } from 'configuration/environment.prod';
import { HttpClient } from '@angular/common/http';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-user-registration',
  templateUrl: './user-registration.component.html',
  styleUrls: ['../auth-styles.scss'],
})
export class UserRegistrationComponent  implements OnInit {

  siteName: string = '';
  apiUrl: string = '';
  showPassword = false;

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  userregisterData = {
    name: '',
    email: '',
    password: '',
    confirmPassword:'',
    tenantName: ''
  };

  constructor(
    private http: HttpClient,
    private router: Router,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    try {
      const hostname = new URL(document.baseURI).hostname;
      const parts = hostname.split('.');
      this.siteName = parts[0] || '';
    } catch {
      this.siteName = localStorage.getItem('siteName') || '';
    }
    this.apiUrl = config.api.BASE_URL;

    this.userregisterData.tenantName = this.siteName;
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

  onSubmit() {
    this.http.post(`${this.apiUrl}auth/register`, this.userregisterData)
      .subscribe({
        next: async (res) => {

          // Show success toast
          await this.presentToast('Registration successful!', 'success');

          // Redirect to login page
          this.router.navigate(['/login']);
          this.userregisterData.name = '';
          this.userregisterData.email ='';
          this.userregisterData.password =''
          this.userregisterData.confirmPassword =''
          this.userregisterData.tenantName =''

        },
        error: async (err) => {
          // Show error toast
          await this.presentToast('Registration failed. Please try again later.', 'danger');
        }
      });
  }

  switchToLogin(){
    this.router.navigate(['/login']);
  }

}
