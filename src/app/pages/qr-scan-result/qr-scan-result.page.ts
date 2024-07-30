import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NativeAudio } from '@capacitor-community/native-audio';
import { ModalController } from '@ionic/angular';
import confetti from 'canvas-confetti';
import { Content, PlayerType } from 'src/app/appConstants';
import { AddToPitaraComponent } from 'src/app/components/add-to-pitara/add-to-pitara.component';
import { SheetModalComponent } from 'src/app/components/sheet-modal/sheet-modal.component';
import { AppHeaderService } from 'src/app/services';
import { ContentService } from 'src/app/services/content/content.service';
import { TelemetryObject } from 'src/app/services/telemetry/models/telemetry';
import { TelemetryGeneratorService } from 'src/app/services/telemetry/telemetry.generator.service';
import { OnTabViewWillEnter } from 'src/app/tabs/on-tabs-view-will-enter';

@Component({
  selector: 'app-qr-scan-result',
  templateUrl: './qr-scan-result.page.html',
  styleUrls: ['./qr-scan-result.page.scss'],
})
export class QrScanResultPage implements OnInit, OnTabViewWillEnter {
  configContents!: Array<any>
  optModalOpen: boolean = false;
  showSheenAnimation: boolean = true;
  scanText: string = '';
  mimeType = PlayerType;
  navigated = false;
  constructor(
    private headerService: AppHeaderService,
    private location: Location,
    private modalCtrl: ModalController,
    private contentService: ContentService,
    private router: Router,
    private telemetryGeneratorService: TelemetryGeneratorService
  ) { 
    let extras = this.router.getCurrentNavigation()?.extras;
    if(extras) {
      this.scanText = extras.state?.['scannedData'];
    }
  }

  tabViewWillEnter(): void {
    this.headerService.showHeader('QR Scan Result', true, []);
    this.headerService.showStatusBar(false);
  }

  ngOnInit() {
    this.headerService.headerEventEmitted$.subscribe((name: any) => {
      if(name == "back" && !this.navigated) {
        this.navigated = true;
        this.location.back();
      } 
    })
    this.configContents = [];
    // this.configContents = [{metaData: {name: 'Res 1'}}, {metaData: {name: 'res 2'}}, {metaData: {name: 'res 3'}}]
  }

  ionViewWillEnter() {
    this.navigated = false;
    this.headerService.showHeader('QR Scan Result', true, []);
    this.headerService.showStatusBar(false);
    this.contentService.getContents(this.scanText).then((result) => {
      this.showSheenAnimation = false;
      this.configContents = result;
    }).catch(err => {
      this.showSheenAnimation = false;
    })
  }

  // ionViewWillEnter() {
  //   this.headerService.showHeader('QrScan Result', true, []);
  //   this.headerService.showStatusBar();
  // }

  async ngOnDestroy() {
    const modal = await this.modalCtrl.getTop();
    if (modal) {
      modal.dismiss();
    }
  }

  async playContent(event: Event, content: Content) {
    this.contentService.markContentAsViewed(content)
    await this.router.navigate(['/player'], {state: {content}});
  }

  async moreOtions(content: any) {
    let modal: any;
    if(!this.optModalOpen) {
      this.optModalOpen = true;
      modal = await this.modalCtrl.create({
        component: SheetModalComponent,
        componentProps: {
          content: content
        },
        cssClass: 'sheet-modal',
        breakpoints: [0.25],
        showBackdrop: false,
        initialBreakpoint: 0.25,
        handle: false,
        handleBehavior: "none"
      });
      await modal.present();
    }
    modal.onDidDismiss().then(async (result: any) => {
      this.optModalOpen = false;
      if(result.data && result.data.type === 'addToPitara') {
          this.addContentToMyPitara(result.data.content || content)
      } else if(result.data && result.data.type == 'like') {
        this.contentService.likeContent(result.data.content || content, 'guest', true)
        if(result.data.content.metaData.isLiked) {
          await NativeAudio.play({
            assetId: 'windchime',
          });
          confetti({
            startVelocity: 30,
            particleCount: 400,
            spread: 360,
            ticks: 60,
            origin: { y: 0.5, x: 0.5 },
            colors: ['#a864fd', '#29cdff', '#78ff44', '#ff718d', '#fdff6a']
          });
        }
        this.telemetryGeneratorService.generateInteractTelemetry('TOUCH', 'content-liked', 'qr-scan-result', 'qr-scan-result', new TelemetryObject(content?.metaData.identifier!, content?.metaData.mimetype!, ''));
      }
    });
  }

  async addContentToMyPitara(content: Content) {
    const modal = await this.modalCtrl.create({
      component: AddToPitaraComponent,
      componentProps: {
        content
      },
      cssClass: 'add-to-pitara',
      breakpoints: [0, 1],
      showBackdrop: false,
      initialBreakpoint: 1,
      handle: false,
      handleBehavior: "none"
    });
    await modal.present();
    modal.onWillDismiss().then((result) => {
    });
  }
}
