import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { AppHeaderService, UtilService } from '../../../app/services';
import { MenuController, ModalController } from '@ionic/angular';
import { TelemetryGeneratorService } from 'src/app/services/telemetry/telemetry.generator.service';
import { App } from '@capacitor/app';
import { ConfigVariables } from '../../config';
import { QrcodePopupComponent } from '../qrcode-popup/qrcode-popup.component';
import { StorageService } from 'src/app/services';
import { LanguageService } from '../../components/langauge-select/language.service';
import { AlertController } from '@ionic/angular';
import { ToastController } from '@ionic/angular';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';


@Component({
  selector: 'app-application-header',
  templateUrl: './application-header.component.html',
  styleUrls: ['./application-header.component.scss'],
})
export class ApplicationHeaderComponent implements OnInit, OnDestroy {
  appInfo: any;
  @Input() headerConfig: any = false;
  @Output() headerEvents = new EventEmitter();
  @Output() sideMenuItemEvent = new EventEmitter();
  isMenuOpen: boolean = false;
  filters: Array<any> = []
  defaultFilter!: any;
  appVersion: string = ''
  appName: string = ""
  configVariables : any;
  isTitleChanged : boolean = false;
  languageSubscription: any;
  routerSubscription: any;
  userName: string = '';

  language: string = '';
  constructor(private utilService: UtilService,
    private telemetryGeneratorService: TelemetryGeneratorService,
    public menuCtrl: MenuController,
    public headerService: AppHeaderService,
    private storage : StorageService,
    private languageService: LanguageService,
    private modalCtrl: ModalController,
    private alertController: AlertController,
    private toastController: ToastController,
    private router: Router,
    ) {
      App.getInfo().then(val => {
        this.appVersion = `v${val.version}.${val.build}`
        this.appName = val.name
      })

      ConfigVariables.then(config => {
        this.configVariables = config;
        // Use the config data as needed
      }).catch(error => {
        console.error('Failed to load configuration:', error);
      });
      this.userName = JSON.parse(localStorage.getItem('user') || '{}').name || '';
    }

    loadTabData(language: string) {
      this.language = language;
    this.isTitleChanged = this.configVariables.titleCode.includes(language);
    }

  async ngOnInit() {
    this.defaultFilter = {};
    this.language = await this.storage.getData('lang') || 'en';
    this.isTitleChanged = this.configVariables.titleCode.includes(this.language);

    this.languageSubscription = this.languageService.currentLanguage$.subscribe(
      (language) => {
        this.loadTabData(language);
      }
    );

    this.headerService.filterConfigEmitted$.subscribe((val: any) => {
      this.filters = [];
      this.defaultFilter = val.defaultFilter;
      this.filters.push(val.defaultFilter);
      val.filter.forEach((item: any) => {
        this.filters.push(item);
      });
    })
    this.appInfo = await this.utilService.getAppInfo();

    this.refreshUserName();

    // Refresh name on every navigation (e.g. after login or registration)
    this.routerSubscription = this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd)
    ).subscribe(() => this.refreshUserName());

    // Keep userName in sync if localStorage changes in this or other tabs
    window.addEventListener('storage', (event: StorageEvent) => {
      if (event.key === 'user') {
        try {
          this.userName = event.newValue ? (JSON.parse(event.newValue).name || '') : '';
        } catch {
          this.userName = '';
        }
      }
    });

    // Fallback: if username still not visible, refresh the screen once
    setTimeout(() => {
      if (!this.userName) {
        const hasReloaded = sessionStorage.getItem('reloadedForUserName');
        if (!hasReloaded) {
          sessionStorage.setItem('reloadedForUserName', '1');
          window.location.reload();
        }
      }
    }, 500);

  }

  refreshUserName() {
    try {
      const userRaw = localStorage.getItem('user');
      this.userName = userRaw ? (JSON.parse(userRaw).name || '') : '';
    } catch {
      this.userName = '';
    }
  }

  ngOnDestroy() {
    this.routerSubscription?.unsubscribe();
  }

  async scan() {
    this.telemetryGeneratorService.generateInteractTelemetry('TOUCH', 'qrscanner-clicked', 'home', 'home');
  }

  async handleSearch(event: Event) {
    this.emitEvent(event, 'search');
  }

  emitEvent(event: Event, name: string) {
    if (name == 'scan') {
      this.scan();
    }
    this.headerEvents.emit({event, name});
  }

  async toggleMenu() {
    await this.menuCtrl.toggle();
    this.isMenuOpen = await this.menuCtrl.isEnabled();
    if (this.isMenuOpen) {
    }
  }

  emitSideMenuItemEvent(event: any, item: string) {
    this.menuCtrl.close().then(() => {
      this.handleFilter(item);
    }).catch((e) => {
      this.handleFilter(item);
    })
  }

  handleFilter(filter: any) {
    this.defaultFilter = filter;
    this.sideMenuItemEvent.emit({ filter });
  }

  async navigateToQRScreen() {
    const modal = await this.modalCtrl.create({
      component: QrcodePopupComponent,
      cssClass: 'add-to-pitara',
      breakpoints: [0, 1],
      showBackdrop: false,
      initialBreakpoint: 1,
      handle: false,
      handleBehavior: "none"
    });
    await modal.present();
    modal.onDidDismiss();
  }

  async logout() {
    const alert = await this.alertController.create({
      header: 'Confirm Logout',
      message: 'Are you sure you want to logout?',
      cssClass:'custom-alert',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
            console.log('Logout canceled');
          },
        },
        {
          text: 'Logout',
          role: 'destructive',
          handler: () => {
            this.performLogout();
          },
        },
      ],
    });

    await alert.present();
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

  performLogout() {
    this.headerConfig= false;
      // Remove token and user info from localStorage
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
    
      // Optional: show toast
      this.presentToast('Logged out successfully', 'success');
    
      // Redirect to login page
      this.router.navigate(['/login']);
    
    
    this.emitEvent(new Event(''), 'logout');
  }

  
}
