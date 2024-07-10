import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AppHeaderService, UtilService } from '../../../app/services';
import { MenuController, ModalController } from '@ionic/angular';
import { TelemetryGeneratorService } from 'src/app/services/telemetry/telemetry.generator.service';
import { App } from '@capacitor/app';
import { ConfigVariables } from '../../config';
import { QrcodePopupComponent } from '../qrcode-popup/qrcode-popup.component';
import { StorageService } from 'src/app/services';
import { LanguageService } from '../../components/langauge-select/language.service';

@Component({
  selector: 'app-application-header',
  templateUrl: './application-header.component.html',
  styleUrls: ['./application-header.component.scss'],
})
export class ApplicationHeaderComponent  implements OnInit {
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

  language: string = '';
  constructor(private utilService: UtilService,
    private telemetryGeneratorService: TelemetryGeneratorService,
    public menuCtrl: MenuController,
    public headerService: AppHeaderService,
    private storage : StorageService,
    private languageService: LanguageService,
    private modalCtrl: ModalController,
    ) {
      App.getInfo().then(val => {
        this.appVersion = `v${val.version}.${val.build}`
        this.appName = val.name
      })

      ConfigVariables.then(config => {
        console.log('Configuration:', config);
        this.configVariables = config;
        // Use the config data as needed
      }).catch(error => {
        console.error('Failed to load configuration:', error);
      });
    }

    loadTabData(language: string) {
      this.language = language;
    this.isTitleChanged = this.configVariables.titleCode.includes(language);
      console.log(`Loading data for language: ${language}`);
      // Example data loading logic:
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
}
