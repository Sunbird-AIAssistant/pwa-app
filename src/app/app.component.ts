import { Component, OnInit, ViewChild } from '@angular/core';
import { AppHeaderService } from './services/app-header.service';
import { HeaderConfig } from './appConstants';
import { IonRouterOutlet, ModalController, PopoverController, Platform } from '@ionic/angular';
import { TelemetryAutoSyncService } from './services/telemetry/telemetry.auto.sync.service';
import { App } from '@capacitor/app';
import { ScannerService } from './services/scan/scanner.service';
import { LangaugeSelectComponent } from './components/langauge-select/langauge-select.component';
import { Router } from '@angular/router';
import { QrcodePopupComponent } from './components/qrcode-popup/qrcode-popup.component';
import { SwUpdate } from '@angular/service-worker';
import { EnvironmentInjector, inject } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { AppExitComponent } from './components/app-exit/app-exit.component';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit {
  headerConfig!: HeaderConfig;
  langModalOpen: boolean = false;
  count = 0;
  optModalOpen = false;
  languages: Array<any> = [];
  private exitModalPresented = false;

  @ViewChild('mainContent', { read: IonRouterOutlet, static: false }) routerOutlet!: IonRouterOutlet;
  public environmentInjector = inject(EnvironmentInjector);

  constructor(private headerService: AppHeaderService,
    private telemetryAutoSyncService: TelemetryAutoSyncService,
    private scannerService: ScannerService,
    private popoverCtrl: PopoverController,
    private modalCtrl: ModalController,
    private router: Router,
    public alertController: AlertController,
    private location: Location,
    private route: ActivatedRoute,
    public platform: Platform,
    private translate: TranslateService,
    private swUpdate: SwUpdate) {
    this.initializeApp();
    this.initialize();

  }

  initializeApp(): void {
    history.pushState(null, '', location.href);
    this.swUpdate.versionUpdates.subscribe(evt => {
      switch (evt.type) {
        case 'VERSION_DETECTED':
          this.presentUpdateAlert();
          break;
        case 'VERSION_READY':
          console.log(`Current app version: ${evt.currentVersion.hash}`);
          break;
        case 'VERSION_INSTALLATION_FAILED':
          console.log(`Failed to install app version '${evt.version.hash}': ${evt.error}`);
          break;
      }
    });
  }

  async initialize() {
    window.onpopstate = async () => {
      history.pushState(null, '', location.href);
      const modal = await this.modalCtrl.getTop();
      if (modal) {
        modal.dismiss();
      }
    // Add the popstate listener when the app initializes
  /*  if ((this.router.url === '/' || this.router.url === '/tabs/home') && !this.exitModalPresented && !modal)  {
      history.pushState(null, '', location.href);

      
      await this.presentExitConfirmationModal();

      // Push state to keep the URL the same after the user decides not to exit
    } */
  }
  }

 async presentExitConfirmationModal(){
  this.exitModalPresented = true;
  setTimeout(() => {
    this.exitModalPresented = false;
  }, 4000);
    let modal: any;
    this.optModalOpen = true;
    modal = await this.modalCtrl.create({
      component: AppExitComponent,
      cssClass: 'sheet-modal',
      breakpoints: [0.2],
      showBackdrop: false,
      backdropDismiss: false,
      initialBreakpoint: 0.2,
      handle: false,
      handleBehavior: "none"
    });
    await modal.present();
  

  modal.onDidDismiss().then((result: any) => {
    this.optModalOpen = false;
    if (result.data && result.data) {
      window.close();

      App.exitApp();

    }
  });
  }



  async presentUpdateAlert() {
    const alert = await this.alertController.create({
      header: this.translate.instant('Update Available'),
      message: this.translate.instant('A new version of the application is available. Load it?'),
      buttons: [
         {
          text: this.translate.instant('Yes'),
          handler: () => {
            window.location.reload();
            // Add logic to load new version here
          }
        }
      ]
    });
  
    await alert.present();
  }
  
  async ngOnInit() {
    history.pushState(null, document.title, window.location.href);

    this.headerService.headerConfigEmitted$.subscribe((config: HeaderConfig) => {
      this.headerConfig = config;
    });
    this.headerService.filterConfigEmitted$.subscribe((val: any) => {
      this.languages = val.languages;
    })
    this.autoSyncTelemetry()
    App.addListener('pause', () => this.telemetryAutoSyncService.pause());
    App.addListener('resume', () => this.telemetryAutoSyncService.continue());
  }

  async handleHeaderEvents($event: any) {
    if (($event as any).name == 'scan') {
      this.scannerService.requestPermission(
        (scannedData) => {
          if (scannedData === 'cancel' ||
              scannedData === 'cancel_hw_back' ||
              scannedData === 'cancel_nav_back') {
                return;
              }
          let scannenValue = ''
          const execArray = (new RegExp('(/dial/(?<djp>[a-zA-Z0-9]+)|(/QR/\\?id=(?<epathshala>[a-zA-Z0-9]+)))')).exec(scannedData);
          if (execArray && execArray.length > 1) {
            scannenValue = execArray?.groups![Object.keys(execArray?.groups!).find((key) => !!execArray?.groups![key])!]
          }
          if (scannenValue) {
            this.router.navigate(['/qr-scan-result'], {state: {scannedData: scannenValue}})
          } else {
            this.handleInvalidQRcode(scannedData);
          }
        },
        (error) => {
          console.warn(error);
        }
      );
    } else if($event.name == "profile") {
      if(!this.langModalOpen) {
        this.presentModal($event);
        this.langModalOpen = true
      }
    } else if($event.name == "search") {
      this.router.navigate(['/search']);
    }
    this.headerService.sidebarEvent($event);
  }

  async presentModal(event: any) {
    const modal = await this.popoverCtrl.create({
      component: LangaugeSelectComponent,
      componentProps: {
        languages: this.languages
      },
      cssClass: 'lang-modal',
      event: event,
      translucent: true,
      dismissOnSelect: true
    });
    await modal.present();
    modal.onDidDismiss().then((_ => {
      this.langModalOpen = false
      this.headerService.sidebarEvent({name: 'language'});
    }));
  }

  async menuItemAction(item: any) {
    this.headerService.sideMenuItemEvents(item);
  }

  private autoSyncTelemetry() {
    this.telemetryAutoSyncService.start(30 * 1000).subscribe();
  }

  async handleInvalidQRcode(scannedData: string) {
    const modal = await this.modalCtrl.create({
      component: QrcodePopupComponent,
      componentProps: {
        scannedData
      },
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
}
