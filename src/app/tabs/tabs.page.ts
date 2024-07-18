import { Component, ViewChild, OnInit } from '@angular/core';
import { IonTabs, ModalController, Platform } from '@ionic/angular';
import { OnTabViewWillEnter } from './on-tabs-view-will-enter';
import { Router } from '@angular/router';
import { TabsService } from '../services/tabs.service';
import { TelemetryGeneratorService } from '../services/telemetry/telemetry.generator.service';
import { AppExitComponent } from '../components/app-exit/app-exit.component';
import { App } from '@capacitor/app';
import { ConfigVariables } from "../config";
import { LanguageService } from '../components/langauge-select/language.service';
import { StorageService } from 'src/app/services';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss']
})
export class TabsPage implements OnTabViewWillEnter, OnInit{
  subscription: any;
  optModalOpen = false;
  configVariables: any;
  languageSubscription: any;
  isTitleChanged : boolean = false;
  language: string = '';

  @ViewChild('tabRef', { static: false }) tabRef!: IonTabs;
  constructor(private platform: Platform,
    private router: Router,
    private tabService: TabsService,
    private telemetry: TelemetryGeneratorService,
    private languageService: LanguageService,
    private storage : StorageService,
    private modalCtrl: ModalController) {
      ConfigVariables.then(config => {
        console.log('Configuration:', config);
        this.configVariables = config;
        // Use the config data as needed
      }).catch(error => {
        console.error('Failed to load configuration:', error);
      });
  }

  tabViewWillEnter(): void {
    this.tabService.show();
  }

    async ngOnInit() {
      this.language = await this.storage.getData('lang') || 'en';
      this.isTitleChanged = this.configVariables.titleCode.includes(this.language);
    this.languageSubscription = this.languageService.currentLanguage$.subscribe(
      (language) => {
        this.loadTabData(language);
      }
    );
  }

  loadTabData(language: string) {
    this.language = language;
  this.isTitleChanged = this.configVariables.titleCode.includes(language);
  }

  // Prevent back naviagtion
  ionViewDidEnter() {
    this.tabService.show()
    this.subscription = this.platform.backButton.subscribeWithPriority(9999, async () => {
      // do nothing
      let modal: any;
      if (!this.optModalOpen) {
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
      }

      modal.onDidDismiss().then((result: any) => {
        this.optModalOpen = false;
        if (result.data && result.data) {
          App.exitApp();
        }
      });
    }
  )}

  ionViewWillEnter() {
    if (this.tabRef.outlet.component['tabViewWillEnter']) {
      (this.tabRef.outlet.component as unknown as OnTabViewWillEnter).tabViewWillEnter();
    }
  }
  
  ionViewWillLeave() {
    this.subscription.unsubscribe();
  }

  async ngOnDestroy() {
    const modal = await this.modalCtrl.getTop();
    if (modal) {
      modal.dismiss();
    }
  }

  ionTabsDidChange(event: any) {
    if(event.tab == 'story') {
      this.tabService.hide();
      this.telemetry.generateStartTelemetry('bot', 'story-sakhi');
      this.router.navigate(['/story'])
    } else if(event.tab == 'parent-sakhi') {
      this.tabService.hide();
      this.telemetry.generateStartTelemetry('bot', 'parent-sakhi');
      this.router.navigate(['/parent-sakhi'])
    } else if(event.tab == 'teacher-sakhi') {
      this.tabService.hide();
      this.telemetry.generateStartTelemetry('bot', 'teacher-sakhi');
      this.router.navigate(['/teacher-sakhi'])
    }
  }
}
