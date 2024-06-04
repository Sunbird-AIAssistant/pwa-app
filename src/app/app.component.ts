import { Component, OnInit, ViewChild, HostListener } from '@angular/core';
import { AppHeaderService } from './services/app-header.service';
import { HeaderConfig } from './appConstants';
import { IonRouterOutlet, ModalController, PopoverController } from '@ionic/angular';
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
    private swUpdate: SwUpdate) {
    this.initializeApp();
  }

  initializeApp(): void {
    this.swUpdate.versionUpdates.subscribe(evt => {
      switch (evt.type) {
        case 'VERSION_DETECTED':
          console.log(`Downloading new app version: ${evt.version.hash}`);
          this.presentUpdateAlert();
          break;
        case 'VERSION_READY':
          console.log(`Current app version: ${evt.currentVersion.hash}`);
          console.log(`New app version ready for use: ${evt.latestVersion.hash}`);
          break;
        case 'VERSION_INSTALLATION_FAILED':
          console.log(`Failed to install app version '${evt.version.hash}': ${evt.error}`);
          break;
      }
    });
  }

  @HostListener('window:popstate', ['$event'])
  async onPopState(event: any) {

    console.log('Back button pressed', event);
    const state = this.location.path(true);
    console.log(state);
    const modal = await this.modalCtrl.getTop();
    if (modal) {
      history.pushState(null, document.title, window.location.href);
      modal.dismiss();
      this.optModalOpen = false;
    } 
  }


  async presentUpdateAlert() {
    const alert = await this.alertController.create({
      header: 'Update Available',
      message: 'A new version of the application is available. Load it?',
      buttons: [
         {
          text: 'Yes',
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

    this.findSiteSubDomain();
    this.headerService.headerConfigEmitted$.subscribe((config: HeaderConfig) => {
      this.headerConfig = config;
    });
    this.headerService.filterConfigEmitted$.subscribe((val: any) => {
      this.languages = val.languages;
      console.log(val, this.languages);
    })
    this.autoSyncTelemetry()
    App.addListener('pause', () => this.telemetryAutoSyncService.pause());
    App.addListener('resume', () => this.telemetryAutoSyncService.continue());
  }

  findSiteSubDomain(){
    const urlObj = new URL(document.baseURI);
      // Extract the hostname
      const hostname = urlObj.hostname; // e.g., "subdomain.example.com"
      // Split the hostname by dots
      const domainParts = hostname.split('.');
      localStorage.setItem('subDomain', domainParts[0])
      // Return the first part of the domain
      console.log(domainParts[0]);
  }

  async handleHeaderEvents($event: any) {
    console.log('events', $event);
    if (($event as any).name == 'scan') {
      this.scannerService.requestPermission(
        (scannedData) => {
          if (scannedData === 'cancel' ||
              scannedData === 'cancel_hw_back' ||
              scannedData === 'cancel_nav_back') {
                return;
              }
          console.log("Scan Result", scannedData);
          let scannenValue = ''
          const execArray = (new RegExp('(/dial/(?<djp>[a-zA-Z0-9]+)|(/QR/\\?id=(?<epathshala>[a-zA-Z0-9]+)))')).exec(scannedData);
          if (execArray && execArray.length > 1) {
            scannenValue = execArray?.groups![Object.keys(execArray?.groups!).find((key) => !!execArray?.groups![key])!]
          }
          console.log('Scanned Value', scannenValue);
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
      console.log('dismiss');
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
