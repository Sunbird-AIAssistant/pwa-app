import { Component, OnInit, OnDestroy } from '@angular/core';
import {Router} from '@angular/router';
import { config } from 'configuration/environment.prod';
import { ConfigVariables } from '../../../config';
import { HttpClient } from '@angular/common/http';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-user-registration',
  templateUrl: './user-registration.component.html',
  styleUrls: ['../auth-styles.scss'],
})
export class UserRegistrationComponent  implements OnInit, OnDestroy {

  siteName: string = '';
  apiUrl: string = '';
  showPassword = false;
  // selectedState: string = '';

  // states: string[] = [
  //   'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  //   'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  //   'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  //   'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  //   'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  //   'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
  // ];


  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  userregisterData = {
    name: '',
   // phoneNumber:'',
    email: '',
   // selectedState:'',
    password: '',
    confirmPassword:'',
    tenantName: ''
  };

  constructor(
    private http: HttpClient,
    private router: Router,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.siteName = localStorage.getItem('siteName') || '';
    this.apiUrl = config.api.BASE_URL;

    this.userregisterData.tenantName = this.siteName;

    // React if siteName is set asynchronously (e.g., after splash config loads)
    if (!this.siteName) {
      // Fallback: load configuration and set siteName if splash wasn't visited
      ConfigVariables.then(cfg => {
        const computed = (cfg && cfg.siteName) || '';
        if (computed) {
          try { localStorage.setItem('siteName', computed); } catch {}
          this.siteName = computed;
          this.userregisterData.tenantName = computed;
        }
      }).catch(() => {});

      setTimeout(() => {
        const refreshed = localStorage.getItem('siteName') || '';
        if (refreshed && !this.userregisterData.tenantName) {
          this.siteName = refreshed;
          this.userregisterData.tenantName = refreshed;
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
    }
  };

  ngOnDestroy() {
    window.removeEventListener('storage', this.onStorageChange);
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

  onSubmit() {
    // Final guard to ensure tenantName is present
    if (!this.userregisterData.tenantName) {
      const latest = localStorage.getItem('siteName') || '';
      this.userregisterData.tenantName = latest;
      this.siteName = latest;
    }
    this.http.post(`${this.apiUrl}auth/register`, this.userregisterData)
      .subscribe({
        next: async (res) => {

          // Show success toast
          await this.presentToast('Registration successful!', 'success');

          // Redirect to login page
          this.router.navigate(['/login']);
          this.userregisterData.name = '';
         // this.userregisterData.phoneNumber = '',
         // this.userregisterData.selectedState='',
          this.userregisterData.email ='';
          this.userregisterData.password =''
          this.userregisterData.confirmPassword =''
          this.userregisterData.tenantName =''

        },
        error: async (err) => {
          // Show error toast
          await this.presentToast('Registration failed. Please try again later.', 'danger');
        }
      });
  }

  switchToLogin(){
    this.router.navigate(['/login']);
  }

}
