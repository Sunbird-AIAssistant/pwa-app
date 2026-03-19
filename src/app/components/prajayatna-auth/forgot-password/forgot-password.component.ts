import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { ConfigVariables } from '../../../config';
import { HttpClient } from '@angular/common/http';
import { ToastController } from '@ionic/angular';
import { AuthApiService } from '../auth-api.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['../auth-styles.scss'],
})
export class ForgotPasswordComponent  implements OnInit, OnDestroy {

  siteName: string = '';
  apiUrl: string = '';
  isPrajayatna: boolean = false;
  forgotPasswordType: 'email' | 'phone' = 'email';
  /** Prajayatna: identifier → otp → newPassword. */
  forgotStep: 'identifier' | 'otp' | 'newPassword' = 'identifier';
  otpValue = '';
  sendOtpLoading = false;
  verifyAndResetLoading = false;
  otpExpiresInSeconds = 600;
  otpCountdown = 0;
  resendCooldownSeconds = 0;
  private otpCountdownInterval: any;
  private resendCooldownInterval: any;
  apiErrorMessage = '';

  forgotPasswordData = {
    phoneNumber: '',
    email: '',
    newPassword: '',
    confirmNewPassword: '',
    tenantName: ''
  };

  /** When true, identifier was passed from Login screen – hide identifier form and use pre-filled value. */
  identifierPreFilledFromLogin = false;

  /** State passed from Login (captured in constructor while navigation is current). */
  private loginState: { email?: string; phoneNumber?: string; identifierType?: string } | null = null;

  showNewPassword = false;
  showConfirmPassword = false;
  passwordMismatch : boolean = false;


  constructor(
    private http: HttpClient,
    private router: Router,
    private toastController: ToastController,
    private authApi: AuthApiService
  ) {
    const nav = this.router.getCurrentNavigation();
    if (nav?.extras?.state) {
      this.loginState = nav.extras.state as { email?: string; phoneNumber?: string; identifierType?: string };
    }
  }

  ngOnInit() {
    this.siteName = sessionStorage.getItem('siteName') || '';
    this.apiUrl = this.authApi.getApiBaseUrlSync();
    this.authApi.getApiBaseUrl().then(url => { this.apiUrl = url; });
    this.forgotPasswordData.tenantName = this.siteName;
    this.isPrajayatna = this.siteName === 'Prajayatna';

    // React if siteName is set asynchronously (e.g., after splash config loads)
    if (!this.siteName) {
      // Fallback: load configuration and set siteName if splash wasn't visited
      ConfigVariables.then(cfg => {
        const computed = (cfg && cfg.siteName) || '';
        if (computed) {
          try { sessionStorage.setItem('siteName', computed); } catch {}
          this.siteName = computed;
          this.forgotPasswordData.tenantName = computed;
          this.isPrajayatna = computed === 'Prajayatna';
          setTimeout(() => this.maybeAutoSendOtpFromLogin(), 0);
        }
      }).catch(() => {});

      setTimeout(() => {
        const refreshed = sessionStorage.getItem('siteName') || '';
        if (refreshed && !this.forgotPasswordData.tenantName) {
          this.siteName = refreshed;
          this.forgotPasswordData.tenantName = refreshed;
          this.isPrajayatna = refreshed === 'Prajayatna';
          this.maybeAutoSendOtpFromLogin();
        }
      }, 300);
    }

    // Pre-fill identifier from Login when user came via Forgot Password with email/phone already entered (all tenants)
    const state = this.loginState || (history.state || {}) as { email?: string; phoneNumber?: string; identifierType?: string };
    if (state.identifierType !== undefined && (state.email !== undefined || state.phoneNumber !== undefined)) {
      this.forgotPasswordData.email = (state.email || '').trim();
      this.forgotPasswordData.phoneNumber = (state.phoneNumber || '').trim();
      this.forgotPasswordType = (state.identifierType === 'phone' ? 'phone' : 'email') as 'email' | 'phone';
      this.identifierPreFilledFromLogin = true;
    }

    // Prajayatna + from Login: send OTP immediately (email or phone per user’s login choice)
    setTimeout(() => this.maybeAutoSendOtpFromLogin(), 0);
    setTimeout(() => this.maybeAutoSendOtpFromLogin(), 400);

    window.addEventListener('storage', this.onStorageChange);
  }

  /**
   * When user opened Forgot Password from Login with email/phone already entered, send OTP without an extra tap.
   */
  private maybeAutoSendOtpFromLogin(): void {
    if (!this.identifierPreFilledFromLogin) return;
    if (this.siteName !== 'Prajayatna') return;
    if (this.forgotStep !== 'identifier') return;
    if (this.sendOtpLoading) return;
    void this.sendOtp();
  }

  private onStorageChange = (event: StorageEvent) => {
    if (event.key === 'siteName') {
      const value = event.newValue || '';
      this.siteName = value;
      this.forgotPasswordData.tenantName = value;
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

  private getIdentifierPayload(): { email?: string; mobileNumber?: string; tenantName: string } {
    const tenantName = this.forgotPasswordData.tenantName || sessionStorage.getItem('siteName') || '';
    const payload: any = { tenantName };
    if (this.isPrajayatna && this.forgotPasswordType === 'phone') {
      payload.mobileNumber = this.forgotPasswordData.phoneNumber;
    } else {
      payload.email = this.forgotPasswordData.email;
    }
    return payload;
  }

  async sendOtp() {
    if (this.sendOtpLoading) return;
    this.apiErrorMessage = '';
    this.sendOtpLoading = true;
    try {
      if (!this.forgotPasswordData.tenantName) {
        const latest = sessionStorage.getItem('siteName') || '';
        this.forgotPasswordData.tenantName = latest;
        this.siteName = latest;
        this.isPrajayatna = latest === 'Prajayatna';
      }
      await this.refreshApiUrl();
      const payload = { ...this.getIdentifierPayload(), purpose: 'forgot_password' as const };
      this.http.post<{ message?: string; expiresInSeconds?: number }>(`${this.apiUrl}auth/send-otp`, payload).subscribe({
        next: (res) => {
          this.sendOtpLoading = false;
          this.forgotStep = 'otp';
          this.otpValue = '';
          this.otpExpiresInSeconds = res?.expiresInSeconds ?? 600;
          this.otpCountdown = this.otpExpiresInSeconds;
          this.startOtpCountdown();
          this.startResendCooldown(60);
          this.presentToast('OTP sent to your ' + (this.forgotPasswordType === 'phone' ? 'phone' : 'email'), 'success');
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
    } catch {
      this.sendOtpLoading = false;
      this.apiErrorMessage = 'Failed to send OTP. Please try again.';
      this.presentToast(this.apiErrorMessage, 'danger');
    }
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

  /** Prajayatna: Verify OTP only; on success go to newPassword step (separate screen). */
  verifyOtpOnly() {
    this.apiErrorMessage = '';
    const payload: any = { ...this.getIdentifierPayload(), purpose: 'forgot_password', otp: this.otpValue.trim() };
    this.verifyAndResetLoading = true;
    this.http.post<{ message?: string; verified?: boolean }>(`${this.apiUrl}auth/verify-otp`, payload).subscribe({
      next: () => {
        this.verifyAndResetLoading = false;
        this.forgotStep = 'newPassword';
        this.otpValue = '';
        this.presentToast('OTP verified. Set your new password.', 'success');
      },
      error: (err) => {
        this.verifyAndResetLoading = false;
        this.apiErrorMessage = err?.error?.message || 'Invalid or expired OTP.';
        this.presentToast(this.apiErrorMessage, 'danger');
      }
    });
  }

  private doChangePassword() {
    const payload: any = {
      newPassword: this.forgotPasswordData.newPassword,
      confirmNewPassword: this.forgotPasswordData.confirmNewPassword,
      tenantName: this.forgotPasswordData.tenantName
    };
    if (this.isPrajayatna && this.forgotPasswordType === 'phone') {
      payload.mobileNumber = this.forgotPasswordData.phoneNumber;
    } else {
      payload.email = this.forgotPasswordData.email;
    }
    this.http.post(`${this.apiUrl}auth/change-password`, payload).subscribe({
      next: async () => {
        this.verifyAndResetLoading = false;
        this.apiErrorMessage = '';
        await this.presentToast('Password reset successful!', 'success');
        this.router.navigate(['/login']);
        this.resetForm();
      },
      error: async (err) => {
        this.verifyAndResetLoading = false;
        this.apiErrorMessage = err?.error?.message || 'Something went wrong. Please try again.';
        await this.presentToast(this.apiErrorMessage, 'danger');
      }
    });
  }

  async onSubmitForgotPassword() {
    if (!this.forgotPasswordData.tenantName) {
      const latest = sessionStorage.getItem('siteName') || '';
      this.forgotPasswordData.tenantName = latest;
      this.siteName = latest;
      this.isPrajayatna = latest === 'Prajayatna';
    }
    await this.refreshApiUrl();
    if (this.isPrajayatna) {
      if (this.forgotStep === 'identifier') {
        this.sendOtp();
        return;
      }
      if (this.forgotStep === 'otp') {
        this.verifyOtpOnly();
        return;
      }
      // forgotStep === 'newPassword'
      if (this.passwordMismatch) return;
      this.doChangePassword();
      return;
    }
    this.doChangePassword();
  }

  backToIdentifier() {
    this.forgotStep = 'identifier';
    this.otpValue = '';
    this.apiErrorMessage = '';
    if (this.otpCountdownInterval) clearInterval(this.otpCountdownInterval);
    if (this.resendCooldownInterval) clearInterval(this.resendCooldownInterval);
    this.resendCooldownSeconds = 0;
  }

  /** Prajayatna: from newPassword step back to OTP step. */
  backToOtp() {
    this.forgotStep = 'otp';
    this.apiErrorMessage = '';
  }

  resetForm() {
    this.forgotPasswordData = {
      phoneNumber: '',
      email: '',
      newPassword: '',
      confirmNewPassword: '',
      tenantName: ''
    };
    this.forgotStep = 'identifier';
    this.otpValue = '';
    this.identifierPreFilledFromLogin = false;
    if (this.otpCountdownInterval) clearInterval(this.otpCountdownInterval);
    if (this.resendCooldownInterval) clearInterval(this.resendCooldownInterval);
    this.resendCooldownSeconds = 0;
  }

  switchToLogin() {
   this.router.navigate(['/login']);
  }
}
