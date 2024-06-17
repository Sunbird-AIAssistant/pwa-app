import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService, AppHeaderService, CachingService, ConfigService, LocalNotificationService, UtilService } from '../../../app/services';
import { AppInitializeService } from '../../../app/services/appInitialize.service';
import { StorageService } from '../../../app/services/storage.service';
import { v4 as uuidv4 } from "uuid";
import { TelemetryGeneratorService } from 'src/app/services/telemetry/telemetry.generator.service';
import { TranslateService } from '@ngx-translate/core';
import { ApiModule } from 'src/app/services/api/api.module';
import { Config } from 'src/app/appConstants';
import { LocalNotificationSchema } from '@capacitor/local-notifications';
import { ConfigVariables } from "../../config";

@Component({
  selector: 'app-splash',
  templateUrl: 'splash.page.html',
  styleUrls: ['splash.page.scss'],
})
export class SplashPage implements OnInit {
  configVariables : any;
  constructor(private appinitialise: AppInitializeService,
    private storage: StorageService,
    private router: Router,
    private headerService: AppHeaderService,
    private telemetryGeneratorService: TelemetryGeneratorService,
    private utilService: UtilService,
    private cachingService: CachingService,
    private configService: ConfigService,
    private translate: TranslateService,
    private apiService: ApiService,
    private lcoalNotifService: LocalNotificationService) {
      this.cachingService.initStorage();
    }
    
  async ngOnInit() {
    ConfigVariables.then(config => {
      console.log('Configuration:', config);
      this.configVariables = config;
      // Use the config data as needed
    }).catch(error => {
      console.error('Failed to load configuration:', error);
    });
    
    this.headerService.showStatusBar(true);
    this.headerService.hideHeader();
    ApiModule.getInstance().init(await this.utilService.getDeviceId())
    this.apiService.onInit().subscribe();
    let sid = uuidv4();
    this.storage.setData("sid", sid);
    this.appinitialise.initialize();
    setTimeout(async () => {
      console.log('route');
      this.startTelemetry()
      this.router.navigate(['/tabs/home']);
    }, 2000);
    let config: Config = await this.configService.getConfigMeta();
    let notif: LocalNotificationSchema = config?.notification?.android
    if(notif) {
      await this.lcoalNotifService.cancelNotification(notif.id);
      await this.lcoalNotifService.initializeLocalNotif(notif);
    }
    this.storage.setData('configMeta', JSON.stringify(config));
    let lang = await this.storage.getData('lang')
    if(lang) {
      // if(lang !== 'hi') {
      //   this.translate.use('en');
      // } else {
        this.translate.use(lang);
      // }
    } else {
      config?.languages.forEach(lang => {
        if (lang?.default) {
          this.storage.setData('lang', lang.id);
          // if(lang.id !== 'hi') {
          //   this.translate.use('en');
          //   this.translate.setDefaultLang('en')
          // } else {
            this.translate.use(lang.id);
            this.translate.setDefaultLang(lang.id)
          // }
        }
      })
    }
  }

  async startTelemetry(): Promise<void> {
    this.telemetryGeneratorService.genererateAppStartTelemetry(await this.utilService.getDeviceSpec());
  }
} 
