import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { AppHeaderService, UtilService } from '../../../app/services';
import { MenuController, ModalController } from '@ionic/angular';
import { TelemetryGeneratorService } from 'src/app/services/telemetry/telemetry.generator.service';
import { App } from '@capacitor/app';
import { ConfigVariables } from '../../config';
import { QrcodePopupComponent } from '../qrcode-popup/qrcode-popup.component';
import { StorageService } from 'src/app/services';
import { AuthTokenService } from 'src/app/services/auth-token.service';
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
    private authToken: AuthTokenService
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
      const user = this.authToken.getUser();
      this.userName = user?.name || '';
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

    // Keep userName in sync when navigating (e.g. after login)
    // Note: sessionStorage does not fire storage events across tabs; refreshUserName() covers same-tab updates

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
    const user = this.authToken.getUser();
    this.userName = user?.name || '';
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
    this.headerConfig = false;
    this.authToken.clear();
    this.presentToast('Logged out successfully', 'success');
    this.router.navigate(['/login']);
    this.emitEvent(new Event(''), 'logout');
  }

  
}
