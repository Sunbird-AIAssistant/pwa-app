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

  forgotPasswordData = {
   // phoneNumber:'',
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
    this.siteName = localStorage.getItem('siteName') || '';
    this.apiUrl = config.api.BASE_URL;
    this.forgotPasswordData.tenantName = this.siteName;

    // React if siteName is set asynchronously (e.g., after splash config loads)
    if (!this.siteName) {
      // Fallback: load configuration and set siteName if splash wasn't visited
      ConfigVariables.then(cfg => {
        const computed = (cfg && cfg.siteName) || '';
        if (computed) {
          try { localStorage.setItem('siteName', computed); } catch {}
          this.siteName = computed;
          this.forgotPasswordData.tenantName = computed;
        }
      }).catch(() => {});

      setTimeout(() => {
        const refreshed = localStorage.getItem('siteName') || '';
        if (refreshed && !this.forgotPasswordData.tenantName) {
          this.siteName = refreshed;
          this.forgotPasswordData.tenantName = refreshed;
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


  async presentToast(message: string, color: string = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'top'
    });
    toast.present();
  }

onSubmitForgotPassword() {
  if (this.passwordMismatch) return;
  // Final guard to ensure tenantName is present
  if (!this.forgotPasswordData.tenantName) {
    const latest = localStorage.getItem('siteName') || '';
    this.forgotPasswordData.tenantName = latest;
    this.siteName = latest;
  }

  this.http.post(`${this.apiUrl}auth/change-password`, this.forgotPasswordData)
    .subscribe({
      next: async () => {
        await this.presentToast('Password reset successful!', 'success');
        this.router.navigate(['/login']);
        this.resetForm();
      },
      error: async () => {
        await this.presentToast('Something went wrong. Please try again later.', 'danger');
      }
    });
}

resetForm() {
  this.forgotPasswordData = {
    //phoneNumber:'',
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
