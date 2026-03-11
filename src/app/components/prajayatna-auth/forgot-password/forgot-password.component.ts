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

  /** OTP flow for Prajayatna only */
  forgotStep: 'form' | 'otp' = 'form';
  otpValue = '';
  sendingOtp = false;
  verifyingOtp = false;

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
    this.apiUrl = this.getAuthApiUrl();
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
    if (this.passwordMismatch) return;
    if (!this.forgotPasswordData.tenantName) {
      const latest = sessionStorage.getItem('siteName') || '';
      this.forgotPasswordData.tenantName = latest;
      this.siteName = latest;
      this.isPrajayatna = latest === 'Prajayatna';
    }
    const payload: any = {
      tenantName: this.forgotPasswordData.tenantName,
      purpose: 'forgot_password'
    };
    if (this.forgotPasswordType === 'phone') {
      payload.mobileNumber = this.forgotPasswordData.phoneNumber;
    } else {
      payload.email = this.forgotPasswordData.email;
    }
    this.sendingOtp = true;
    this.http.post(`${this.apiUrl}auth/send-otp`, payload).subscribe({
      next: async () => {
        this.sendingOtp = false;
        this.forgotStep = 'otp';
        this.otpValue = '';
        await this.presentToast('OTP sent to your ' + (this.forgotPasswordType === 'phone' ? 'phone' : 'email'), 'success');
      },
      error: async (err) => {
        this.sendingOtp = false;
        await this.presentToast(err?.error?.message || 'Failed to send OTP', 'danger');
      }
    });
  }

  verifyAndReset() {
    if (!this.otpValue?.trim()) {
      this.presentToast('Please enter OTP', 'danger');
      return;
    }
    if (!this.forgotPasswordData.tenantName) {
      const latest = sessionStorage.getItem('siteName') || '';
      this.forgotPasswordData.tenantName = latest;
    }
    const verifyPayload: any = {
      tenantName: this.forgotPasswordData.tenantName,
      purpose: 'forgot_password',
      otp: this.otpValue.trim()
    };
    if (this.forgotPasswordType === 'phone') {
      verifyPayload.mobileNumber = this.forgotPasswordData.phoneNumber;
    } else {
      verifyPayload.email = this.forgotPasswordData.email;
    }
    this.verifyingOtp = true;
    this.http.post(`${this.apiUrl}auth/verify-otp`, verifyPayload).subscribe({
      next: () => {
        this.verifyingOtp = false;
        this.doChangePassword();
      },
      error: async (err) => {
        this.verifyingOtp = false;
        await this.presentToast(err?.error?.message || 'Invalid OTP', 'danger');
      }
    });
  }

  backToForm() {
    this.forgotStep = 'form';
    this.otpValue = '';
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
        await this.presentToast('Password reset successful!', 'success');
        this.router.navigate(['/login']);
        this.resetForm();
        this.forgotStep = 'form';
        this.otpValue = '';
      },
      error: async () => {
        await this.presentToast('Something went wrong. Please try again later.', 'danger');
      }
    });
  }

  onSubmitForgotPassword() {
    if (this.passwordMismatch) return;
    if (!this.forgotPasswordData.tenantName) {
      const latest = sessionStorage.getItem('siteName') || '';
      this.forgotPasswordData.tenantName = latest;
      this.siteName = latest;
      this.isPrajayatna = latest === 'Prajayatna';
    }
    if (this.isPrajayatna) {
      this.sendOtp();
      return;
    }
    this.doChangePassword();
  }

  resetForm() {
    this.forgotPasswordData = {
      phoneNumber: '',
      email: '',
      newPassword: '',
      confirmNewPassword: '',
      tenantName: ''
    };
  }

  switchToLogin() {
   this.router.navigate(['/login']);
  }
}
