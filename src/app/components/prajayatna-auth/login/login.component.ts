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

  /** OTP flow for Prajayatna only */
  loginStep: 'credentials' | 'otp' = 'credentials';
  otpValue = '';
  sendingOtp = false;
  verifyingOtp = false;

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
    this.apiUrl = this.getAuthApiUrl();
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

  private getAuthApiUrl(): string {
    if (typeof window !== 'undefined' && (window.location?.hostname === 'localhost' || window.location?.hostname === '127.0.0.1')) {
      return 'http://localhost:3000/';
    }
    return config.api.BASE_URL;
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

  sendOtp() {
    if (!this.userLoginData.tenantName) {
      const latest = sessionStorage.getItem('siteName') || '';
      this.userLoginData.tenantName = latest;
      this.siteName = latest;
      this.isPrajayatna = latest === 'Prajayatna';
    }
    const payload: any = {
      tenantName: this.userLoginData.tenantName,
      purpose: 'login',
      password: this.userLoginData.password,
    };
    if (this.loginType === 'phone') {
      payload.mobileNumber = this.userLoginData.phoneNumber;
    } else {
      payload.email = this.userLoginData.email;
    }
    this.sendingOtp = true;
    this.http.post(`${this.apiUrl}auth/send-otp`, payload).subscribe({
      next: async () => {
        this.sendingOtp = false;
        this.loginStep = 'otp';
        this.otpValue = '';
        await this.presentToast('OTP sent to your ' + (this.loginType === 'phone' ? 'phone' : 'email'), 'success');
      },
      error: async (err) => {
        this.sendingOtp = false;
        await this.presentToast(err?.error?.message || 'Failed to send OTP', 'danger');
      }
    });
  }

  verifyAndLogin() {
    if (!this.otpValue?.trim()) {
      this.presentToast('Please enter OTP', 'danger');
      return;
    }
    if (!this.userLoginData.tenantName) {
      const latest = sessionStorage.getItem('siteName') || '';
      this.userLoginData.tenantName = latest;
    }
    const verifyPayload: any = {
      tenantName: this.userLoginData.tenantName,
      purpose: 'login',
      otp: this.otpValue.trim()
    };
    if (this.loginType === 'phone') {
      verifyPayload.mobileNumber = this.userLoginData.phoneNumber;
    } else {
      verifyPayload.email = this.userLoginData.email;
    }
    this.verifyingOtp = true;
    this.http.post(`${this.apiUrl}auth/verify-otp`, verifyPayload).subscribe({
      next: () => {
        this.verifyingOtp = false;
        this.doLogin();
      },
      error: async (err) => {
        this.verifyingOtp = false;
        await this.presentToast(err?.error?.message || 'Invalid OTP', 'danger');
      }
    });
  }

  backToCredentials() {
    this.loginStep = 'credentials';
    this.otpValue = '';
  }

  private doLogin() {
    const payload: any = {
      password: this.userLoginData.password,
      tenantName: this.userLoginData.tenantName
    };
    if (this.isPrajayatna && this.loginType === 'phone') {
      payload.mobileNumber = this.userLoginData.phoneNumber;
    } else {
      payload.email = this.userLoginData.email;
    }
    this.http.post(`${this.apiUrl}auth/login`, payload).subscribe({
      next: async (res: any) => {
        localStorage.setItem('access_token', res.access_token);
        localStorage.setItem('user', JSON.stringify(res.user));
        await this.presentToast('Login successful!', 'success');
        sessionStorage.setItem('reloadHomeOnce', '1');
        this.router.navigate(['/tabs/home']);
        this.userLoginData.email = '';
        this.userLoginData.phoneNumber = '';
        this.userLoginData.password = '';
        this.userLoginData.tenantName = '';
        this.loginStep = 'credentials';
        this.otpValue = '';
      },
      error: async (err) => {
        console.error('Login failed:', err);
        const msg = err?.error?.message || err?.message || 'Login failed. Please check your credentials.';
        await this.presentToast(msg, 'danger');
      }
    });
  }

  onSubmit() {
    if (!this.userLoginData.tenantName) {
      const latest = sessionStorage.getItem('siteName') || '';
      this.userLoginData.tenantName = latest;
      this.siteName = latest;
      this.isPrajayatna = latest === 'Prajayatna';
    }
    if (this.isPrajayatna) {
      this.sendOtp();
      return;
    }
    this.doLogin();
  }
  

  switchToRegistration() {
    this.router.navigate(['/registration']);
  }

  switchToForgotPassword(){
    this.router.navigate(['/forgot-password'])
  }

}
