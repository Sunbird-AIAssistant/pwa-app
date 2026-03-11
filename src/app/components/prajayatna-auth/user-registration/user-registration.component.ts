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
  showPassword = false;
  selectedState: string = '';

  /** OTP flow for Prajayatna only */
  registrationStep: 'form' | 'otp' = 'form';
  otpValue = '';
  sendingOtp = false;
  verifyingOtp = false;

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
    this.apiUrl = this.getAuthApiUrl();
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

  private getAuthApiUrl(): string {
    if (typeof window !== 'undefined' && (window.location?.hostname === 'localhost' || window.location?.hostname === '127.0.0.1')) {
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

  sendOtp() {
    if (!this.userregisterData.tenantName) {
      const latest = sessionStorage.getItem('siteName') || '';
      this.userregisterData.tenantName = latest;
      this.siteName = latest;
      this.isPrajayatna = latest === 'Prajayatna';
    }
    const payload: any = {
      tenantName: this.userregisterData.tenantName,
      purpose: 'register'
    };
    if (this.registrationType === 'phone') {
      payload.mobileNumber = this.userregisterData.phoneNumber;
    } else {
      payload.email = this.userregisterData.email;
    }
    this.sendingOtp = true;
    this.http.post(`${this.apiUrl}auth/send-otp`, payload).subscribe({
      next: async () => {
        this.sendingOtp = false;
        this.registrationStep = 'otp';
        this.otpValue = '';
        await this.presentToast('OTP sent to your ' + (this.registrationType === 'phone' ? 'phone' : 'email'), 'success');
      },
      error: async (err) => {
        this.sendingOtp = false;
        await this.presentToast(err?.error?.message || 'Failed to send OTP', 'danger');
      }
    });
  }

  verifyAndRegister() {
    if (!this.otpValue?.trim()) {
      this.presentToast('Please enter OTP', 'danger');
      return;
    }
    if (!this.userregisterData.tenantName) {
      const latest = sessionStorage.getItem('siteName') || '';
      this.userregisterData.tenantName = latest;
    }
    const verifyPayload: any = {
      tenantName: this.userregisterData.tenantName,
      purpose: 'register',
      otp: this.otpValue.trim()
    };
    if (this.registrationType === 'phone') {
      verifyPayload.mobileNumber = this.userregisterData.phoneNumber;
    } else {
      verifyPayload.email = this.userregisterData.email;
    }
    this.verifyingOtp = true;
    this.http.post(`${this.apiUrl}auth/verify-otp`, verifyPayload).subscribe({
      next: () => {
        this.verifyingOtp = false;
        this.doRegister();
      },
      error: async (err) => {
        this.verifyingOtp = false;
        await this.presentToast(err?.error?.message || 'Invalid OTP', 'danger');
      }
    });
  }

  backToForm() {
    this.registrationStep = 'form';
    this.otpValue = '';
  }

  private doRegister() {
    const payload: any = {
      name: this.userregisterData.name,
      password: this.userregisterData.password,
      confirmPassword: this.userregisterData.confirmPassword,
      tenantName: this.userregisterData.tenantName
    };
    if (this.isPrajayatna && this.registrationType === 'phone') {
      payload.mobileNumber = this.userregisterData.phoneNumber;
    } else {
      payload.email = this.userregisterData.email;
    }
    if (this.selectedState) {
      payload.state = this.selectedState;
    }
    this.http.post(`${this.apiUrl}auth/register`, payload).subscribe({
      next: async (res: any) => {
        await this.presentToast('Registration successful!', 'success');
        if (res?.access_token && res?.user) {
          localStorage.setItem('access_token', res.access_token);
          localStorage.setItem('user', JSON.stringify(res.user));
          sessionStorage.setItem('reloadHomeOnce', '1');
          this.router.navigate(['/tabs/home']);
        } else {
          this.router.navigate(['/login']);
        }
        this.userregisterData.name = '';
        this.userregisterData.phoneNumber = '';
        this.userregisterData.email = '';
        this.userregisterData.password = '';
        this.userregisterData.confirmPassword = '';
        this.userregisterData.tenantName = '';
        this.registrationStep = 'form';
        this.otpValue = '';
      },
      error: async (err) => {
        const errorMessage = err?.error?.message || 'Registration failed. Please try again later.';
        await this.presentToast(errorMessage, 'danger');
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
    if (this.isPrajayatna) {
      this.sendOtp();
      return;
    }
    this.doRegister();
  }

  switchToLogin() {
    this.router.navigate(['/login']);
  }

}
