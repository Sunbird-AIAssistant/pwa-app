import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { config } from 'configuration/environment.prod';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['../auth-styles.scss'],
})
export class LoginComponent  implements OnInit {

  siteName: string = '';
  apiUrl: string = '';

  showPassword = false;

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }


  userLoginData = {
    phoneNumber :'',
    email: '',
    password: '',
    tenantName: ''
  };



  constructor(
    private http: HttpClient,
    private router: Router,
    private toastController: ToastController
  ) {}

  ngOnInit() {
   this.siteName = localStorage.getItem('siteName') || '';
    this.apiUrl = config.api.BASE_URL;
    this.userLoginData.tenantName = this.siteName;
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
    this.http.post(`${this.apiUrl}auth/login`, this.userLoginData)
      .subscribe({
        next: async (res: any) => {
  
          // Store access_token and user info in localStorage
          localStorage.setItem('access_token', res.access_token);
          localStorage.setItem('user', JSON.stringify(res.user));
  
          // Show success toast
          await this.presentToast('Login successful!', 'success');
  
          // Redirect to home/dashboard page
          // Set a one-time reload flag for Home to ensure initial state is fully rendered
          sessionStorage.setItem('reloadHomeOnce', '1');
          this.router.navigate(['/home']); // replace with your route
          this.userLoginData.phoneNumber = '';
          this.userLoginData.email = '';
          this.userLoginData.password ='';
          this.userLoginData.tenantName =''


        },
        error: async (err) => {
          console.error('Login failed:', err);
  
          await this.presentToast('Login failed. Please check your credentials.', 'danger');
        }
      });
  }
  

  switchToRegistration() {
    this.router.navigate(['/registration']);
  }

  switchToForgotPassword(){
    this.router.navigate(['/forgot-password'])
  }

}
