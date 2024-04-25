import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AppHeaderService, TelemetryService } from '../../../app/services';
import { ScreenOrientation } from "@capacitor/screen-orientation";
import { Location } from '@angular/common';
import { playerConfig, videoConfig} from './playerData';
import { Content } from 'src/app/services/content/models/content';
import { DomSanitizer } from '@angular/platform-browser';
import Plyr from 'plyr';
import { TelemetryGeneratorService } from 'src/app/services/telemetry/telemetry.generator.service';
import { CorrelationData, TelemetryObject } from 'src/app/services/telemetry/models/telemetry';
import { PlayerType } from 'src/app/appConstants';
import { Platform } from '@ionic/angular';
import { Capacitor } from '@capacitor/core';

@Component({
  selector: 'app-player',
  templateUrl: './player.page.html',
  styleUrls: ['./player.page.scss'],
})
export class PlayerPage implements OnInit {
  content?: any;
  orientationType: string = "";
  playerConfig: any = {};
  videoConfig: any;
  playerType: string = '';
  srcUrl: any;
  pageId: string = '';
  cdata: Array<CorrelationData> = [];
  @ViewChild('pdf') pdf!: ElementRef;
  @ViewChild('video') video!: ElementRef;
  constructor(private router: Router,
    private headerService: AppHeaderService,
    private location: Location,
    private domSanitiser: DomSanitizer,
    private telemetryGeneratorService: TelemetryGeneratorService,
    private telemetryService: TelemetryService,
    private platform: Platform) {

    let extras = this.router.getCurrentNavigation()?.extras;
    if (extras) {
      this.content = extras.state?.['content'] as Content;
      console.log('content received in player ', this.content);
      this.playerType = this.getPlayerType(this.content.metaData.mimetype);
      this.srcUrl = this.content.metaData.link.startsWith('https://') ? this.domSanitiser.bypassSecurityTrustResourceUrl(this.content.metaData.link) : this.domSanitiser.bypassSecurityTrustResourceUrl('https://'+this.content.metaData.link); 
      this.pageId = extras.state?.['pageid'];
    }
    this.populateCData();
    if (this.content?.metaData.mimetype == PlayerType.YOUTUBE) {
      this.telemetryGeneratorService.generateStartTelemetry('content',
        'player',
        new TelemetryObject(this.content?.metaData.identifier!, this.content?.metaData.mimetype!, ''),
        { l1: this.content?.metaData.identifier! },
        this.cdata);
    }
  }

  private getPlayerType(mimetype: string): string {
    if (mimetype == PlayerType.PDF) {
      return 'pdf'
    } else if (mimetype == PlayerType.MP4 || mimetype == PlayerType.WEBM || mimetype == PlayerType.AUDIO) {
      return 'video'
    } else if (mimetype == PlayerType.YOUTUBE) {
      return 'youtube'
    }
    return ''
  }

  ngOnInit() {
    this.platform.backButton.subscribeWithPriority(11, async () => {
      this.closePlayer()
    });
    this.headerService.hideHeader();
    this.headerService.hideStatusBar();
    this.playerConfig = playerConfig;
    this.videoConfig = videoConfig;
  }

  async ngAfterViewInit() {
    this.orientationType = await (await ScreenOrientation.orientation()).type
    if (this.orientationType == "portrait-primary" || this.orientationType == "portrait-secondary") {
      this.orientationType = 'landscape-primary';
      ScreenOrientation.unlock();
      ScreenOrientation.lock({ orientation: 'landscape-primary' });
      if (this.playerType == 'pdf') {
        this.playerConfig['metadata']['identifier'] = this.content?.metaData.identifier;
        this.playerConfig['metadata']['name'] = this.content?.metaData.name;
        if ((this.content?.source === 'local' || this.content?.type === 'local') && this.content?.metaData.url.includes('file://')) {
          this.playerConfig['metadata']['streamingUrl'] = Capacitor.convertFileSrc(this.content?.metaData.url.replace('file://', ''))
          this.playerConfig['metadata']['artifactUrl'] = ""
        } else {
          this.playerConfig['metadata']['artifactUrl'] = this.content?.metaData.artifactUrl || '';
          this.playerConfig['metadata']['streamingUrl'] = this.content?.metaData.url;
        }
        this.playerConfig['metadata']['isAvailableLocally'] = (this.content?.source === 'local' || this.content?.type === 'local')? true : false;
        this.playerConfig['metadata']['baseDir']='';
        this.playerConfig['context']['cdata'] = this.cdata;
        console.log('this.playerConfig', this.playerConfig)
        const pdfElement = document.createElement('sunbird-pdf-player');
        pdfElement.setAttribute('player-config', JSON.stringify(this.playerConfig));
        pdfElement.addEventListener('playerEvent', (event) => {
          console.log("On playerEvent", event);
          this.playerEvents(event);
        });
        pdfElement.addEventListener('telemetryEvent', (event) => {
          console.log("On telemetryEvent", event);
          this.playerTelemetryEvents(event);
        });
        this.pdf.nativeElement.append(pdfElement);
      } else if (this.playerType == "video") {
        this.videoConfig['metadata']['identifier'] = this.content?.metaData.identifier;
        this.videoConfig['metadata']['name'] = this.content?.metaData.name;
        if ((this.content?.source === 'local' || this.content?.type === 'local') && this.content?.metaData.url.includes('file://')) {
          this.videoConfig['metadata']['streamingUrl'] = Capacitor.convertFileSrc(this.content?.metaData.url.replace('file://', ''));
          this.videoConfig['metadata']['artifactUrl'] = '';
        } else {
          this.videoConfig['metadata']['streamingUrl'] = '';
          this.videoConfig['metadata']['artifactUrl'] = this.content?.metaData.artifactUrl || this.content?.metaData.url || ""
        }
        this.videoConfig['context']['cdata'] = this.cdata;
        this.videoConfig['metadata']['isAvailableLocally'] = (this.content?.source === 'local' || this.content?.type === 'local')? true : false;
        const epubElement = document.createElement('sunbird-video-player');
        epubElement.setAttribute('player-config', JSON.stringify(this.videoConfig));
        epubElement.addEventListener('playerEvent', (event) => {
          console.log("On playerEvent", event);
          this.playerEvents(event);
        });
        epubElement.addEventListener('telemetryEvent', (event) => {
          console.log("On telemetryEvent", event);
          this.playerTelemetryEvents(event);
        });
        this.video.nativeElement.append(epubElement);
      }
    }
    const player = new Plyr('#player', { autoplay: true});
    console.log('player ', player);
  }

  ionViewWillLeave() {
    if (this.orientationType == "landscape-primary" || this.orientationType == "landscape-secondary") {
      this.orientationType = 'portrait-primary';
      ScreenOrientation.unlock();
      ScreenOrientation.lock({ orientation: 'portrait-primary' });
    }
    this.headerService.showHeader();
    this.headerService.showStatusBar(false);
  }

  playerTelemetryEvents(event: any) {
    if (event?.detail?.eid === 'START' || event?.detail?.eid === 'END') {
      console.log('....................', event)
      this.telemetryService.saveTelemetry(JSON.stringify(event.detail)).subscribe(
        (res: any) => console.log('response after telemetry', res),
      );
    }
  }

  closePlayer() {
    if (this.content?.metaData.mimetype == PlayerType.YOUTUBE) {
      this.telemetryGeneratorService.generateEndTelemetry('content', 'play', 'player', 'player',
        new TelemetryObject(this.content?.metaData.identifier!, this.content?.metaData.mimetype!, ''),
        { l1: this.content?.metaData.identifier! }, [])
    }
    this.location.back();
  }

  playerEvents(event: any) {
    if (event?.detail?.edata?.type) {
      let type = event?.detail?.edata?.type
      switch (type) {
        case "EXIT":
          this.location.back();
          break;
        default:
          break;
      }
    }
  }

  private populateCData() {
    this.cdata = [
      {
        'id': this.content?.metaData.mimetype,
        'type': 'MimeType'
      }];

    if (this.content?.metaData.category) {
      this.cdata.push({
        'id': this.content?.metaData.category,
        'type': 'Category'
      })
    }

    if (this.content?.metaData.language) {
      this.cdata.push({
        'id': this.content?.metaData.language,
        'type': 'Language'
      })
    }
    if (this.pageId) {
      this.cdata.push({
        'id': this.pageId,
        'type': 'SourcePage'
      })
    }
  }
}