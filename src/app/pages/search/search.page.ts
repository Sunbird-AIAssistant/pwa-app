import { Location } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { Content } from 'src/app/appConstants';
import { SearchService } from 'src/app/services/search.service';
import { AppHeaderService, StorageService } from 'src/app/services';
import { RecordingService } from 'src/app/services/recording.service';
import { OnTabViewWillEnter } from 'src/app/tabs/on-tabs-view-will-enter';
import { PlayerType } from "../../appConstants";
import { ModalController } from '@ionic/angular';
import { SheetModalComponent } from 'src/app/components/sheet-modal/sheet-modal.component';
import { AddToPitaraComponent } from 'src/app/components/add-to-pitara/add-to-pitara.component';
import { ContentService } from 'src/app/services/content/content.service';
import { Router } from '@angular/router';
import { TelemetryGeneratorService } from 'src/app/services/telemetry/telemetry.generator.service';
import { TelemetryObject } from 'src/app/services/telemetry/models/telemetry';
import { Keyboard } from "@capacitor/keyboard";
import { RecordingAlertComponent } from 'src/app/components/recording-alert/recording-alert.component';
import { NativeAudio } from '@capacitor-community/native-audio';
import confetti from 'canvas-confetti';
import { VoiceRecorder } from 'capacitor-voice-recorder';

@Component({
  selector: 'app-search',
  templateUrl: './search.page.html',
  styleUrls: ['./search.page.scss'],
})
export class SearchPage implements OnInit, OnTabViewWillEnter {
  showSheenAnimation: boolean = false;
  @ViewChild('searchInput', { static: false }) searchBar: any;
  searchKeywords: string = "";
  searchContentResult: Array<any> = [];
  optModalOpen: boolean = false;
  mimeType = PlayerType;
  noSearchData: boolean = false;
  errMsg = "";
  modalPresent: boolean = false;
  disabled: boolean = false;
  startRecording: boolean = false;
  duration = 0;
  durationDisplay = '';

  constructor(
    private headerService: AppHeaderService,
    private location: Location,
    private record: RecordingService,
    private searchApi: SearchService,
    private modalCtrl: ModalController,
    private contentService: ContentService,
    private router: Router,
    private telemetryGeneratorService: TelemetryGeneratorService,
    private storage: StorageService
  ) { }
  
  tabViewWillEnter(): void {
    this.headerService.hideHeader();
    this.headerService.showStatusBar(false);
  }

  ngOnInit() {}

  navigateBack() {
    this.location.back();
  }

  ionViewWillEnter() {
    this.headerService.hideHeader();
    this.headerService.showStatusBar(false);
  }

 async ngOnDestroy() {
    const modal = await this.modalCtrl.getTop();
    if (modal) {
      modal.dismiss();
    }
  }

  async handleSearch(data?: any, audio: boolean = false) {
    if(audio) {
      this.showSheenAnimation = true;
      let res = await this.makeSearchContextApiCall(data, audio);
      if (res?.input) {
        if(res.input?.sourceText) {
          this.searchKeywords = res.input.sourceText;
        }
        this.handleContentSearch(res, audio);
      } else {
        this.disabled = false;
        this.showSheenAnimation = false;
        this.noSearchData = true;
        this.searchContentResult = [];
        this.errMsg = "Sorry, please try again!"
      }
    } else if(this.searchKeywords.replace(/\s/g, '').length > 0) {
      this.showSheenAnimation = true;
      Keyboard.hide();
      let res = await this.makeSearchContextApiCall(this.searchKeywords, audio);
      if(res?.input?.sourceText) {
        this.searchKeywords = res?.input?.sourceText;
      }
      this.handleContentSearch(res, false);
    }
  }

  async makeSearchContextApiCall(data: string, audio: boolean): Promise<any> {
    return await this.searchApi.postSearchContext({text: data, currentLang:  await this.storage.getData('lang')}, audio).then(res => {
      return res;
    }).catch(err => {
      if(audio) {
        this.disabled = false;
        this.showSheenAnimation = false;
        this.noSearchData = true;
        this.searchContentResult = [];
        this.errMsg = err?.body?.detail?.toLowerCase() == "unsupported language!" ? "Sorry, this language is not currently supported." : "Sorry, please try again!"
      } else {
        this.handleContentSearch('', false);
      }
    });
  }

  async handleContentSearch(res?: any, audio: boolean = false) {

    let req = { "name" : res?.context ?? this.searchKeywords };
    await this.searchApi.postContentSearch(req, await this.storage.getData('lang')).then(searchRes => {
      console.log('searchRes ', searchRes);
      this.telemetryGeneratorService.generateSearchTelemetry(audio ? 'audio': 'text', audio ? '' : this.searchKeywords, searchRes.length, 'search', '' )
      this.disabled = false;
      if(searchRes.length > 0) {
        this.showSheenAnimation = false;
        this.noSearchData = false;
        let list: any = {};
        this.searchContentResult = [];
        searchRes.forEach((ele: any) => {
          list = {}
          list.source = 'djp'
          list.sourceType = 'djp-content'
          list.metaData = ele
          this.searchContentResult.push(list)
        });
      } else {
        this.showSheenAnimation = false;
        this.noSearchData = true;
        this.searchContentResult = [];
        this.errMsg = "No Result";
      }
    }).catch(e => {
      this.disabled = false;
      this.showSheenAnimation = false;
      this.noSearchData = true;
      this.searchContentResult = [];
      this.errMsg = e?.body?.detail?.toLowerCase() == "unsupported language!" ? "Sorry, this language is not currently supported." : "Sorry, please try again!"
    })
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
        this.telemetryGeneratorService.generateInteractTelemetry('TOUCH', 'content-liked', 'search', 'search', new TelemetryObject(content?.metaData.identifier!, content?.metaData.mimetype!, ''))
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

  async playContent(event: Event, content: Content) {
    this.contentService.markContentAsViewed(content)
    await this.router.navigate(['/player'], {state: {content}})
  }

  async onLongPressStart() {
    console.log('long press on search start');
    this.searchKeywords = "";
    if(await (await VoiceRecorder.hasAudioRecordingPermission()).value) {
      this.record.startRecognition('search');
      this.disabled = true;
      this.startRecording = true;
      this.presentPopover(event);
      this.calculation();
    } else {
      await VoiceRecorder.requestAudioRecordingPermission();
    }
  }
  modal: any
  async presentPopover(event: any) {
    this.modal = await this.modalCtrl.create({
      component: RecordingAlertComponent,
      cssClass: 'sheet-modal',
      breakpoints: [0.4],
      showBackdrop: false,
      initialBreakpoint: 0.4,
      handle: false,
      handleBehavior: "none"
    });
    this.modalPresent = true;
    await this.modal.present();
    await this.modal.onDidDismiss().then((res: any) => {
      if(res.data === 'search') {
        this.onLongPressEnd();
      }
    })
  }

  calculation() {
    if (!this.startRecording) {
      this.duration = 0;
      this.durationDisplay = '';
      return;
    }

    this.duration += 1;
    const min = Math.floor(this.duration / 60);
    const sec = (this.duration % 60).toString().padStart(2, '0');
    this.durationDisplay = `${min}:${sec}`;
    if(this.durationDisplay > '0:05') {
      this.onLongPressEnd();
    }
    setTimeout(() => {
      this.calculation();
    }, 1000);
  }

  async onLongPressEnd() {
    console.log('long press on search end');
    await this.record.stopRecognition('search').then(async res => {
      if(this.modalPresent) {
        this.modalPresent = false;
        await this.modal.dismiss();
      }
      this.startRecording = false;
      this.handleSearch(res, true);
    })
  }
}
