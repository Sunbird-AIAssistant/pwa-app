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
  registrationType: 'email' | 'phone' = 'email'; // For Prajayatna: toggle between email and phone
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
    this.apiUrl = config.api.BASE_URL;
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

  async presentToast(message: string, color: string = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 5000,
      color,
      position: 'top'
    });
    toast.present();
  }

  onSubmit() {
    // Final guard to ensure tenantName is present
    if (!this.userregisterData.tenantName) {
      const latest = sessionStorage.getItem('siteName') || '';
      this.userregisterData.tenantName = latest;
      this.siteName = latest;
      this.isPrajayatna = latest === 'Prajayatna';
    }

    // Prepare payload based on registration type for Prajayatna
    const payload: any = {
      name: this.userregisterData.name,
      password: this.userregisterData.password,
      confirmPassword: this.userregisterData.confirmPassword,
      tenantName: this.userregisterData.tenantName
    };

    // Include either email or mobileNumber
    if (this.isPrajayatna && this.registrationType === 'phone') {
      payload.mobileNumber = this.userregisterData.phoneNumber;
    } else {
      payload.email = this.userregisterData.email;
    }

    // Include state if available
    if (this.selectedState) {
      payload.state = this.selectedState;
    }

    this.http.post(`${this.apiUrl}auth/register`, payload)
      .subscribe({
        next: async (res) => {

          // Show success toast
          await this.presentToast('Registration successful!', 'success');

          // Redirect to login page
          this.router.navigate(['/login']);
          this.userregisterData.name = '';
          this.userregisterData.phoneNumber = '';
          // this.userregisterData.selectedState='',
          this.userregisterData.email = '';
          this.userregisterData.password = ''
          this.userregisterData.confirmPassword = ''
          this.userregisterData.tenantName = ''

        },
        error: async (err) => {
          console.log("Registration failed", err);
          const errorMessage = err?.error?.message || 'Registration failed. Please try again later.';
          // Show error toast
          await this.presentToast(errorMessage, 'danger');
        }
      });
  }

  switchToLogin() {
    this.router.navigate(['/login']);
  }

}
