import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { ConfigVariables } from '../../../config';
import { HttpClient } from '@angular/common/http';
import { ToastController } from '@ionic/angular';
import { AuthApiService } from '../auth-api.service';
import { AuthTokenService } from '../../../services/auth-token.service';

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
  otpExpiresInSeconds = 600;
  otpCountdown = 0;
  resendCooldownSeconds = 0;
  private otpCountdownInterval: any;
  private resendCooldownInterval: any;
  apiErrorMessage = '';
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
    private toastController: ToastController,
    private authApi: AuthApiService,
    private authToken: AuthTokenService
  ) { }

  ngOnInit() {
    this.siteName = sessionStorage.getItem('siteName') || '';
    this.apiUrl = this.authApi.getApiBaseUrlSync();
    this.authApi.getApiBaseUrl().then(url => { this.apiUrl = url; });
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
    if (this.otpCountdownInterval) clearInterval(this.otpCountdownInterval);
    if (this.resendCooldownInterval) clearInterval(this.resendCooldownInterval);
  }

  private async refreshApiUrl(): Promise<void> {
    this.apiUrl = await this.authApi.getApiBaseUrl();
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

  async sendOtp() {
    if (!this.userregisterData.tenantName) {
      const latest = sessionStorage.getItem('siteName') || '';
      this.userregisterData.tenantName = latest;
      this.siteName = latest;
      this.isPrajayatna = latest === 'Prajayatna';
    }
    await this.refreshApiUrl();
    const payload = { ...this.getRegisterPayload(), purpose: 'register' as const };
    this.sendOtpLoading = true;
    this.http.post<{ message?: string; expiresInSeconds?: number }>(`${this.apiUrl}auth/send-otp`, payload).subscribe({
      next: (res) => {
        this.sendOtpLoading = false;
        this.registrationStep = 'otp';
        this.otpValue = '';
        this.otpExpiresInSeconds = res?.expiresInSeconds ?? 600;
        this.otpCountdown = this.otpExpiresInSeconds;
        this.startOtpCountdown();
        this.startResendCooldown(60);
        this.presentToast('OTP sent to your ' + (this.registrationType === 'phone' ? 'phone' : 'email'), 'success');
      },
      error: (err) => {
        this.sendOtpLoading = false;
        this.apiErrorMessage = err?.error?.message || 'Failed to send OTP.';
        if (err?.status === 429) {
          this.startResendCooldown(err?.error?.retryAfterSeconds ?? 60);
          this.presentToast(this.apiErrorMessage, 'warning');
        } else {
          this.presentToast(this.apiErrorMessage, 'danger');
        }
      }
    });
  }

  private startOtpCountdown(): void {
    if (this.otpCountdownInterval) clearInterval(this.otpCountdownInterval);
    this.otpCountdownInterval = setInterval(() => {
      if (this.otpCountdown <= 0) { clearInterval(this.otpCountdownInterval); return; }
      this.otpCountdown -= 1;
    }, 1000);
  }

  private startResendCooldown(seconds: number): void {
    if (this.resendCooldownInterval) clearInterval(this.resendCooldownInterval);
    this.resendCooldownSeconds = seconds;
    this.resendCooldownInterval = setInterval(() => {
      this.resendCooldownSeconds -= 1;
      if (this.resendCooldownSeconds <= 0) clearInterval(this.resendCooldownInterval);
    }, 1000);
  }

  resendOtp(): void {
    if (this.resendCooldownSeconds > 0) return;
    this.sendOtp();
  }

  verifyOtpThenRegister() {
    const payload: any = { ...this.getRegisterPayload(), purpose: 'register', otp: this.otpValue.trim() };
    this.apiErrorMessage = '';
    this.verifyAndRegisterLoading = true;
    this.http.post(`${this.apiUrl}auth/verify-otp`, payload).subscribe({
      next: () => this.doRegister(),
      error: (err) => {
        this.verifyAndRegisterLoading = false;
        this.apiErrorMessage = err?.error?.message || 'Invalid or expired OTP.';
        this.presentToast(this.apiErrorMessage, 'danger');
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
        this.apiErrorMessage = '';
        if (res?.access_token) {
          this.authToken.setTokenAndUser(res.access_token, res.user || {});
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
        this.apiErrorMessage = err?.error?.message || 'Registration failed.';
        await this.presentToast(this.apiErrorMessage, 'danger');
      }
    });
  }

  async onSubmit() {
    if (!this.userregisterData.tenantName) {
      const latest = sessionStorage.getItem('siteName') || '';
      this.userregisterData.tenantName = latest;
      this.siteName = latest;
      this.isPrajayatna = latest === 'Prajayatna';
    }
    await this.refreshApiUrl();
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
    this.apiErrorMessage = '';
    if (this.otpCountdownInterval) clearInterval(this.otpCountdownInterval);
    if (this.resendCooldownInterval) clearInterval(this.resendCooldownInterval);
    this.resendCooldownSeconds = 0;
  }

  switchToLogin() {
    this.router.navigate(['/login']);
  }

}
