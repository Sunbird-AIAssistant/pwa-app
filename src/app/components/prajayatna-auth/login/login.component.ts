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
  /** For Prajayatna: 'credentials' = enter email/phone + password then Send OTP; 'otp' = enter OTP then Verify & Login */
  loginStep: 'credentials' | 'otp' = 'credentials';
  otpValue = '';
  sendOtpLoading = false;
  verifyAndLoginLoading = false;

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
    this.apiUrl = this.getApiBaseUrl();
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

  /** Use local backend when app is served from localhost (e.g. ng serve / ionic serve). */
  private getApiBaseUrl(): string {
    if (typeof window !== 'undefined' && window.location?.hostname === 'localhost') {
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

  /** Build auth payload (email or mobileNumber + tenantName). */
  private getAuthPayload(): { email?: string; mobileNumber?: string; tenantName: string } {
    const tenantName = this.userLoginData.tenantName || sessionStorage.getItem('siteName') || '';
    const payload: any = { tenantName };
    if (this.isPrajayatna && this.loginType === 'phone') {
      payload.mobileNumber = this.userLoginData.phoneNumber;
    } else {
      payload.email = this.userLoginData.email;
    }
    return payload;
  }

  /** Prajayatna: Send OTP then show OTP step. */
  sendOtp() {
    if (!this.userLoginData.tenantName) {
      const latest = sessionStorage.getItem('siteName') || '';
      this.userLoginData.tenantName = latest;
      this.siteName = latest;
      this.isPrajayatna = latest === 'Prajayatna';
    }
    this.apiUrl = this.getApiBaseUrl();
    const payload: any = {
      ...this.getAuthPayload(),
      purpose: 'login',
      password: this.userLoginData.password
    };
    this.sendOtpLoading = true;
    this.http.post(`${this.apiUrl}auth/send-otp`, payload).subscribe({
      next: () => {
        this.sendOtpLoading = false;
        this.loginStep = 'otp';
        this.otpValue = '';
        this.presentToast('OTP sent to your ' + (this.loginType === 'phone' ? 'phone' : 'email'), 'success');
      },
      error: (err) => {
        this.sendOtpLoading = false;
        const msg = err?.error?.message || 'Failed to send OTP. Please try again.';
        this.presentToast(msg, 'danger');
      }
    });
  }

  /** Prajayatna: Verify OTP then call login. */
  verifyOtpThenLogin() {
    const payload: any = {
      ...this.getAuthPayload(),
      purpose: 'login',
      otp: this.otpValue.trim()
    };
    this.verifyAndLoginLoading = true;
    this.http.post(`${this.apiUrl}auth/verify-otp`, payload).subscribe({
      next: () => {
        this.doLogin();
      },
      error: (err) => {
        this.verifyAndLoginLoading = false;
        const msg = err?.error?.message || 'Invalid or expired OTP.';
        this.presentToast(msg, 'danger');
      }
    });
  }

  private doLogin() {
    const payload: any = {
      ...this.getAuthPayload(),
      password: this.userLoginData.password
    };
    this.http.post(`${this.apiUrl}auth/login`, payload).subscribe({
      next: async (res: any) => {
        this.verifyAndLoginLoading = false;
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
        this.verifyAndLoginLoading = false;
        await this.presentToast(err?.error?.message || 'Login failed. Please try again.', 'danger');
      }
    });
  }

  /** Non-Prajayatna: direct login. Prajayatna: credentials step -> Send OTP; otp step -> Verify & Login. */
  onSubmit() {
    if (!this.userLoginData.tenantName) {
      const latest = sessionStorage.getItem('siteName') || '';
      this.userLoginData.tenantName = latest;
      this.siteName = latest;
      this.isPrajayatna = latest === 'Prajayatna';
    }
    if (this.isPrajayatna) {
      if (this.loginStep === 'credentials') {
        this.sendOtp();
        return;
      }
      this.verifyOtpThenLogin();
      return;
    }
    this.doLogin();
  }

  backToCredentials() {
    this.loginStep = 'credentials';
    this.otpValue = '';
  }
  

  switchToRegistration() {
    this.router.navigate(['/registration']);
  }

  switchToForgotPassword(){
    this.router.navigate(['/forgot-password'])
  }

}
