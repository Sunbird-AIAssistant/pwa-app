import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { config } from 'configuration/environment.prod';
import { ConfigVariables } from '../../../config';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['../auth-styles.scss'],
})
export class LoginComponent  implements OnInit, OnDestroy {

  siteName: string = '';
  apiUrl: string = '';
  isPrajayatna: boolean = false;
  loginType: 'email' | 'phone' = 'email'; // For Prajayatna: toggle between email and phone

  showPassword = false;

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }


  userLoginData = {
    email: '',
    phoneNumber: '',
    password: '',
    tenantName: ''
  };



  constructor(
    private http: HttpClient,
    private router: Router,
    private toastController: ToastController
  ) {}

  ngOnInit() {
   this.siteName = sessionStorage.getItem('siteName') || '';
    this.apiUrl = config.api.BASE_URL;
    this.userLoginData.tenantName = this.siteName;
    this.isPrajayatna = this.siteName === 'Prajayatna';

    // React if siteName is set asynchronously (e.g., after splash config loads)
    if (!this.siteName) {
      // Fallback: load configuration and set siteName if splash wasn't visited
      ConfigVariables.then(cfg => {
        const computed = (cfg && cfg.siteName) || '';
        if (computed) {
          try { sessionStorage.setItem('siteName', computed); } catch {}
          this.siteName = computed;
          this.userLoginData.tenantName = computed;
          this.isPrajayatna = computed === 'Prajayatna';
        }
      }).catch(() => {});

      setTimeout(() => {
        const refreshed = sessionStorage.getItem('siteName') || '';
        if (refreshed && !this.userLoginData.tenantName) {
          this.siteName = refreshed;
          this.userLoginData.tenantName = refreshed;
          this.isPrajayatna = refreshed === 'Prajayatna';
        }
      }, 300);
    }

    window.addEventListener('storage', this.onStorageChange);
  }

  private onStorageChange = (event: StorageEvent) => {
    if (event.key === 'siteName') {
      const value = event.newValue || '';
      this.siteName = value;
      this.userLoginData.tenantName = value;
      this.isPrajayatna = value === 'Prajayatna';
    }
  };

  ngOnDestroy() {
    window.removeEventListener('storage', this.onStorageChange);
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
    // Final guard to ensure tenantName is present
    if (!this.userLoginData.tenantName) {
      const latest = sessionStorage.getItem('siteName') || '';
      this.userLoginData.tenantName = latest;
      this.siteName = latest;
      this.isPrajayatna = latest === 'Prajayatna';
    }
    
    // Prepare payload based on login type for Prajayatna
    const payload: any = {
      password: this.userLoginData.password,
      tenantName: this.userLoginData.tenantName
    };
    
    if (this.isPrajayatna && this.loginType === 'phone') {
      payload.mobileNumber = this.userLoginData.phoneNumber;
    } else {
      payload.email = this.userLoginData.email;
    }
    
    this.http.post(`${this.apiUrl}auth/login`, payload)
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
          this.router.navigate(['/tabs/home']); // replace with your route
          this.userLoginData.email = '';
          this.userLoginData.phoneNumber = '';
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
