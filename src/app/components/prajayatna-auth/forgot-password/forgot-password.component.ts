import { Component, OnInit, OnDestroy } from '@angular/core';
import { NgForm } from '@angular/forms';
import {Router} from '@angular/router';
import { config } from 'configuration/environment.prod';
import { ConfigVariables } from '../../../config';
import { HttpClient } from '@angular/common/http';
import { ToastController } from '@ionic/angular';

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
  forgotStep: 'identifier' | 'otp' = 'identifier';
  otpValue = '';
  sendOtpLoading = false;
  verifyAndResetLoading = false;

  forgotPasswordData = {
    phoneNumber: '',
    email: '',
    newPassword: '',
    confirmNewPassword: '',
    tenantName: ''
  };

  showNewPassword = false;
  showConfirmPassword = false;
  passwordMismatch : boolean = false;


  constructor(
    private http: HttpClient,
        private router: Router,
        private toastController: ToastController
  ) { }

  ngOnInit() {
    this.siteName = sessionStorage.getItem('siteName') || '';
    this.apiUrl = this.getApiBaseUrl();
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
        }
      }).catch(() => {});

      setTimeout(() => {
        const refreshed = sessionStorage.getItem('siteName') || '';
        if (refreshed && !this.forgotPasswordData.tenantName) {
          this.siteName = refreshed;
          this.forgotPasswordData.tenantName = refreshed;
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
      this.forgotPasswordData.tenantName = value;
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

  sendOtp() {
    if (!this.forgotPasswordData.tenantName) {
      const latest = sessionStorage.getItem('siteName') || '';
      this.forgotPasswordData.tenantName = latest;
      this.siteName = latest;
      this.isPrajayatna = latest === 'Prajayatna';
    }
    const payload = { ...this.getIdentifierPayload(), purpose: 'forgot_password' as const };
    this.sendOtpLoading = true;
    this.http.post(`${this.apiUrl}auth/send-otp`, payload).subscribe({
      next: () => {
        this.sendOtpLoading = false;
        this.forgotStep = 'otp';
        this.otpValue = '';
        this.presentToast('OTP sent to your ' + (this.forgotPasswordType === 'phone' ? 'phone' : 'email'), 'success');
      },
      error: (err) => {
        this.sendOtpLoading = false;
        this.presentToast(err?.error?.message || 'Failed to send OTP.', 'danger');
      }
    });
  }

  verifyOtpThenReset() {
    if (this.passwordMismatch) return;
    const payload: any = { ...this.getIdentifierPayload(), purpose: 'forgot_password', otp: this.otpValue.trim() };
    this.verifyAndResetLoading = true;
    this.http.post(`${this.apiUrl}auth/verify-otp`, payload).subscribe({
      next: () => this.doChangePassword(),
      error: (err) => {
        this.verifyAndResetLoading = false;
        this.presentToast(err?.error?.message || 'Invalid or expired OTP.', 'danger');
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
        await this.presentToast('Password reset successful!', 'success');
        this.router.navigate(['/login']);
        this.resetForm();
      },
      error: async (err) => {
        this.verifyAndResetLoading = false;
        await this.presentToast(err?.error?.message || 'Something went wrong. Please try again.', 'danger');
      }
    });
  }

  onSubmitForgotPassword() {
    if (this.passwordMismatch && this.forgotStep === 'otp') return;
    if (!this.forgotPasswordData.tenantName) {
      const latest = sessionStorage.getItem('siteName') || '';
      this.forgotPasswordData.tenantName = latest;
      this.siteName = latest;
      this.isPrajayatna = latest === 'Prajayatna';
    }
    this.apiUrl = this.getApiBaseUrl();
    if (this.isPrajayatna) {
      if (this.forgotStep === 'identifier') {
        this.sendOtp();
        return;
      }
      this.verifyOtpThenReset();
      return;
    }
    this.doChangePassword();
  }

  backToIdentifier() {
    this.forgotStep = 'identifier';
    this.otpValue = '';
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
  }

  switchToLogin() {
   this.router.navigate(['/login']);
  }
}
