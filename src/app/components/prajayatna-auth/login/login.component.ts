import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { ConfigVariables } from '../../../config';
import { AuthApiService } from '../auth-api.service';
import { AuthTokenService } from '../../../services/auth-token.service';

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
  /** OTP validity in seconds from send-otp response */
  otpExpiresInSeconds = 600;
  /** Countdown for display (seconds until OTP expires) */
  otpCountdown = 0;
  /** Resend cooldown in seconds (button disabled when > 0) */
  resendCooldownSeconds = 0;
  private otpCountdownInterval: any;
  private resendCooldownInterval: any;
  /** Inline error message from API (cleared on success or when user retries) */
  apiErrorMessage = '';
  /** Validation message when Forgot Password is clicked without Email/Mobile */
  forgotPasswordValidationMessage = '';

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
    private toastController: ToastController,
    private authApi: AuthApiService,
    private authToken: AuthTokenService
  ) {}

  ngOnInit() {
   this.siteName = sessionStorage.getItem('siteName') || '';
    this.apiUrl = this.authApi.getApiBaseUrlSync();
    this.authApi.getApiBaseUrl().then(url => { this.apiUrl = url; });
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
    if (this.otpCountdownInterval) clearInterval(this.otpCountdownInterval);
    if (this.resendCooldownInterval) clearInterval(this.resendCooldownInterval);
  }

  private async refreshApiUrl(): Promise<void> {
    this.apiUrl = await this.authApi.getApiBaseUrl();
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
  async sendOtp() {
    if (!this.userLoginData.tenantName) {
      const latest = sessionStorage.getItem('siteName') || '';
      this.userLoginData.tenantName = latest;
      this.siteName = latest;
      this.isPrajayatna = latest === 'Prajayatna';
    }
    await this.refreshApiUrl();
    const payload: any = {
      ...this.getAuthPayload(),
      purpose: 'login',
      password: this.userLoginData.password
    };
    this.apiErrorMessage = '';
    this.sendOtpLoading = true;
    this.http.post<{ message?: string; expiresInSeconds?: number }>(`${this.apiUrl}auth/send-otp`, payload).subscribe({
      next: (res) => {
        this.sendOtpLoading = false;
        this.loginStep = 'otp';
        this.otpValue = '';
        this.otpExpiresInSeconds = res?.expiresInSeconds ?? 600;
        this.otpCountdown = this.otpExpiresInSeconds;
        this.startOtpCountdown();
        this.startResendCooldown(60);
        this.presentToast('OTP sent to your ' + (this.loginType === 'phone' ? 'phone' : 'email'), 'success');
      },
      error: (err) => {
        this.sendOtpLoading = false;
        const status = err?.status;
        const msg = err?.error?.message || 'Failed to send OTP. Please try again.';
        this.apiErrorMessage = msg;
        if (status === 429) {
          const retryAfter = err?.error?.retryAfterSeconds ?? 60;
          this.startResendCooldown(retryAfter);
          this.presentToast(msg, 'warning');
        } else {
          this.presentToast(msg, 'danger');
        }
      }
    });
  }

  private startOtpCountdown(): void {
    if (this.otpCountdownInterval) clearInterval(this.otpCountdownInterval);
    this.otpCountdownInterval = setInterval(() => {
      if (this.otpCountdown <= 0) {
        clearInterval(this.otpCountdownInterval);
        return;
      }
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

  /** Prajayatna: Verify OTP then call login. */
  verifyOtpThenLogin() {
    const payload: any = {
      ...this.getAuthPayload(),
      purpose: 'login',
      otp: this.otpValue.trim()
    };
    this.apiErrorMessage = '';
    this.verifyAndLoginLoading = true;
    this.http.post(`${this.apiUrl}auth/verify-otp`, payload).subscribe({
      next: () => {
        this.doLogin();
      },
      error: (err) => {
        this.verifyAndLoginLoading = false;
        const msg = err?.error?.message || 'Invalid or expired OTP.';
        this.apiErrorMessage = msg;
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
        this.apiErrorMessage = '';
        this.authToken.setTokenAndUser(res.access_token, res.user || {});
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
        const msg = err?.error?.message || 'Login failed. Please try again.';
        this.apiErrorMessage = msg;
        await this.presentToast(msg, 'danger');
      }
    });
  }

  /** Non-Prajayatna: direct login. Prajayatna: credentials step -> Send OTP; otp step -> Verify & Login. */
  async onSubmit() {
    if (!this.userLoginData.tenantName) {
      const latest = sessionStorage.getItem('siteName') || '';
      this.userLoginData.tenantName = latest;
      this.siteName = latest;
      this.isPrajayatna = latest === 'Prajayatna';
    }
    await this.refreshApiUrl();
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
    this.apiErrorMessage = '';
    if (this.otpCountdownInterval) clearInterval(this.otpCountdownInterval);
    if (this.resendCooldownInterval) clearInterval(this.resendCooldownInterval);
    this.resendCooldownSeconds = 0;
  }
  

  switchToRegistration() {
    this.router.navigate(['/registration']);
  }

  /** Validates email format. */
  private isValidEmail(value: string): boolean {
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test((value || '').trim());
  }

  /** Validates 10-digit mobile number. */
  private isValidPhone(value: string): boolean {
    return /^[0-9]{10}$/.test((value || '').replace(/\s/g, ''));
  }

  switchToForgotPassword() {
    this.forgotPasswordValidationMessage = '';
    // Prajayatna: require email/phone and validate before navigating
    if (this.siteName === 'Prajayatna') {
      const usePhone = this.loginType === 'phone';
      const email = (this.userLoginData.email || '').trim();
      const phone = (this.userLoginData.phoneNumber || '').trim();
      const identifier = usePhone ? phone : email;
      if (!identifier) {
        this.forgotPasswordValidationMessage = 'Please enter an Email or Number';
        return;
      }
      if (usePhone && !this.isValidPhone(phone)) {
        this.forgotPasswordValidationMessage = 'Please enter a valid 10-digit Phone Number';
        return;
      }
      if (!usePhone && !this.isValidEmail(email)) {
        this.forgotPasswordValidationMessage = 'Please enter a valid Email address';
        return;
      }
    }
    // All tenants: pass email/phone in state when entered so Forgot Password doesn't ask again
    const email = (this.userLoginData.email || '').trim();
    const phone = (this.userLoginData.phoneNumber || '').trim();
    if (email || phone) {
      this.router.navigate(['/forgot-password'], {
        state: {
          email: this.userLoginData.email.trim(),
          phoneNumber: this.userLoginData.phoneNumber.trim(),
          identifierType: this.siteName === 'Prajayatna' ? this.loginType : 'email'
        }
      });
    } else {
      this.router.navigate(['/forgot-password']);
    }
  }

}
