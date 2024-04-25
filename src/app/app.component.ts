import { Component, OnInit, ViewChild } from '@angular/core';
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

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit {
  headerConfig!: HeaderConfig;
  langModalOpen: boolean = false;
  languages: Array<any> = [];
  @ViewChild('mainContent', { read: IonRouterOutlet, static: false }) routerOutlet!: IonRouterOutlet;
  constructor(private headerService: AppHeaderService,
    private telemetryAutoSyncService: TelemetryAutoSyncService,
    private scannerService: ScannerService,
    private popoverCtrl: PopoverController,
    private modalCtrl: ModalController,
    private router: Router,
    private swUpdate: SwUpdate) {
      this.initializeApp();
  }

  initializeApp(): void {
    if (this.swUpdate.available) {
      this.swUpdate.available.subscribe(() => {
        if (confirm('A new version is available. Load it?'))
          window.location.reload();
      });
    }    
  }

  async ngOnInit() {
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
