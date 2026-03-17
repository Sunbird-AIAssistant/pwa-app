import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { config } from 'configuration/environment.prod';
import { ConfigVariables } from '../../../config';
import { HttpClient } from '@angular/common/http';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-user-registration',
  templateUrl: './user-registration.component.html',
  styleUrls: ['../auth-styles.scss'],
})
export class UserRegistrationComponent implements OnInit, OnDestroy {

  siteName: string = '';
  apiUrl: string = '';
  isPrajayatna: boolean = false;
  registrationType: 'email' | 'phone' = 'email';
  registrationStep: 'form' | 'otp' = 'form';
  otpValue = '';
  sendOtpLoading = false;
  verifyAndRegisterLoading = false;
  showPassword = false;
  selectedState: string = '';

  states: string[] = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
    'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
    'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
  ];


  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  userregisterData = {
    name: '',
    phoneNumber: '',
    email: '',
    selectedState: '',
    password: '',
    confirmPassword: '',
    tenantName: ''
  };

  constructor(
    private http: HttpClient,
    private router: Router,
    private toastController: ToastController
  ) { }

  ngOnInit() {
    this.siteName = sessionStorage.getItem('siteName') || '';
    this.apiUrl = this.getApiBaseUrl();
    this.userregisterData.tenantName = this.siteName;
    this.isPrajayatna = this.siteName === 'Prajayatna';

    // React if siteName is set asynchronously (e.g., after splash config loads)
    if (!this.siteName) {
      // Fallback: load configuration and set siteName if splash wasn't visited
      ConfigVariables.then(cfg => {
        const computed = (cfg && cfg.siteName) || '';
        if (computed) {
          try { sessionStorage.setItem('siteName', computed); } catch { }
          this.siteName = computed;
          this.userregisterData.tenantName = computed;
          this.isPrajayatna = computed === 'Prajayatna';
        }
      }).catch(() => { });

      setTimeout(() => {
        const refreshed = sessionStorage.getItem('siteName') || '';
        if (refreshed && !this.userregisterData.tenantName) {
          this.siteName = refreshed;
          this.userregisterData.tenantName = refreshed;
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
      this.userregisterData.tenantName = value;
      this.isPrajayatna = value === 'Prajayatna';
    }
  };

  ngOnDestroy() {
    window.removeEventListener('storage', this.onStorageChange);
  }

  private getApiBaseUrl(): string {
    if (typeof window !== 'undefined' && window.location?.hostname === 'localhost') {
      return 'http://localhost:3000/';
    }
    return config.api.BASE_URL;
  }

  async presentToast(message: string, color: string = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 5000,
      color,
      position: 'top'
    });
    toast.present();
  }

  private getRegisterPayload(): { email?: string; mobileNumber?: string; tenantName: string } {
    const tenantName = this.userregisterData.tenantName || sessionStorage.getItem('siteName') || '';
    const payload: any = { tenantName };
    if (this.isPrajayatna && this.registrationType === 'phone') {
      payload.mobileNumber = this.userregisterData.phoneNumber;
    } else {
      payload.email = this.userregisterData.email;
    }
    return payload;
  }

  sendOtp() {
    if (!this.userregisterData.tenantName) {
      const latest = sessionStorage.getItem('siteName') || '';
      this.userregisterData.tenantName = latest;
      this.siteName = latest;
      this.isPrajayatna = latest === 'Prajayatna';
    }
    const payload = { ...this.getRegisterPayload(), purpose: 'register' as const };
    this.sendOtpLoading = true;
    this.http.post(`${this.apiUrl}auth/send-otp`, payload).subscribe({
      next: () => {
        this.sendOtpLoading = false;
        this.registrationStep = 'otp';
        this.otpValue = '';
        this.presentToast('OTP sent to your ' + (this.registrationType === 'phone' ? 'phone' : 'email'), 'success');
      },
      error: (err) => {
        this.sendOtpLoading = false;
        this.presentToast(err?.error?.message || 'Failed to send OTP.', 'danger');
      }
    });
  }

  verifyOtpThenRegister() {
    const payload: any = { ...this.getRegisterPayload(), purpose: 'register', otp: this.otpValue.trim() };
    this.verifyAndRegisterLoading = true;
    this.http.post(`${this.apiUrl}auth/verify-otp`, payload).subscribe({
      next: () => this.doRegister(),
      error: (err) => {
        this.verifyAndRegisterLoading = false;
        this.presentToast(err?.error?.message || 'Invalid or expired OTP.', 'danger');
      }
    });
  }

  private doRegister() {
    const payload: any = {
      name: this.userregisterData.name,
      password: this.userregisterData.password,
      confirmPassword: this.userregisterData.confirmPassword,
      tenantName: this.userregisterData.tenantName,
      state: this.selectedState || undefined
    };
    if (this.isPrajayatna && this.registrationType === 'phone') {
      payload.mobileNumber = this.userregisterData.phoneNumber;
    } else {
      payload.email = this.userregisterData.email;
    }
    this.http.post(`${this.apiUrl}auth/register`, payload).subscribe({
      next: async (res: any) => {
        this.verifyAndRegisterLoading = false;
        if (res?.access_token) {
          localStorage.setItem('access_token', res.access_token);
          localStorage.setItem('user', JSON.stringify(res.user || {}));
          sessionStorage.setItem('reloadHomeOnce', '1');
        }
        await this.presentToast('Registration successful!', 'success');
        this.router.navigate(['/tabs/home']);
        this.userregisterData = { name: '', phoneNumber: '', email: '', selectedState: '', password: '', confirmPassword: '', tenantName: '' };
        this.registrationStep = 'form';
        this.otpValue = '';
      },
      error: async (err) => {
        this.verifyAndRegisterLoading = false;
        await this.presentToast(err?.error?.message || 'Registration failed.', 'danger');
      }
    });
  }

  onSubmit() {
    if (!this.userregisterData.tenantName) {
      const latest = sessionStorage.getItem('siteName') || '';
      this.userregisterData.tenantName = latest;
      this.siteName = latest;
      this.isPrajayatna = latest === 'Prajayatna';
    }
    this.apiUrl = this.getApiBaseUrl();
    if (this.isPrajayatna) {
      if (this.registrationStep === 'form') {
        this.sendOtp();
        return;
      }
      this.verifyOtpThenRegister();
      return;
    }
    this.doRegister();
  }

  backToForm() {
    this.registrationStep = 'form';
    this.otpValue = '';
  }

  switchToLogin() {
    this.router.navigate(['/login']);
  }

}
