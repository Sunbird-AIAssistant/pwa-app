import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { IonModal, ModalController, Platform } from '@ionic/angular';
import { AppHeaderService, UtilService } from 'src/app/services';
import { ContentService } from 'src/app/services/content/content.service';
import { PlaylistService } from 'src/app/services/playlist/playlist.service';
import { Location } from '@angular/common';
import { MimeType, PlayerType } from 'src/app/appConstants';
import { FilePicker } from '@capawesome/capacitor-file-picker';
import { Content } from 'src/app/services/content/models/content';
import { ContentUtil } from 'src/app/services/content/util/content.util';
import { SHA1 } from 'crypto-js';
import { SheetModalComponent } from 'src/app/components/sheet-modal/sheet-modal.component';
import { AddToPitaraComponent } from 'src/app/components/add-to-pitara/add-to-pitara.component';
import { NativeAudio } from '@capacitor-community/native-audio';
import confetti from 'canvas-confetti';
import getYouTubeID from 'get-youtube-id';
import { UploadLocalComponent } from 'src/app/components/upload-local/upload-local.component';
import { NewPlaylistModalComponent } from 'src/app/components/new-playlist-modal/new-playlist-modal.component';

@Component({
  selector: 'app-view-all',
  templateUrl: './view-all.page.html',
  styleUrls: ['./view-all.page.scss'],
})
export class ViewAllPage implements OnInit {
  contentList: Array<any> = [];
  type = '';
  playlists: Array<any> = [];
  deleteContent: any;
  selectedContents: Array<any> = [];
  optModalOpen: boolean = false;
  resolveNativePath = (path: string) =>
    new Promise((resolve, reject) => {
      (window as any).FilePath.resolveNativePath(path, resolve, (err: any) => {
        console.error(
          `${path} could not be resolved by the plugin: ${err.message}`
        )
        reject(err)
      })
    });
  @ViewChild(IonModal) modal: IonModal | undefined;
  navigated = false;
  constructor(
    private contentService: ContentService,
    private router: Router,
    private headerService: AppHeaderService,
    private playListService: PlaylistService,
    private platform: Platform,
    private location: Location,
    private modalCtrl: ModalController,
    private utilService: UtilService
  ) {
    let extras = this.router.getCurrentNavigation()?.extras;
    if (extras) {
      this.type = extras.state?.['type'];
    }
  }


  async ngOnInit(): Promise<void> {
    this.platform.backButton.subscribeWithPriority(11, async () => {
      this.location.back();
      this.headerService.deviceBackBtnEvent({ name: 'backBtn' })
    });
    this.headerService.headerEventEmitted$.subscribe((event) => {
      if(event === 'back' && !this.navigated) {
        this.navigated = true;
        this.location.back();
      }
    })
    this.getRecentlyviewedContent()
  }

  async getPlaylistContent() {
    await this.playListService.getAllPlayLists('guest').then((result) => {
      if (result) {
        this.playlists = result;
      }
    }).catch((error) => {
      console.log('error', error)
    })
  }

  async getRecentlyviewedContent() {
    await this.contentService.getRecentlyViewedContent('guest').then((result) => {
      let uniqueIds: any = {};
      result.filter(item => {
        if (!uniqueIds[item.contentIdentifier]) {
            uniqueIds[item.contentIdentifier] = true;
            this.contentList.push(item);
            return true;
        }
        return false;
    });
     
      this.contentList.map((e) => e.metaData = (typeof e.metaData === 'string') ? JSON.parse(e.metaData) : e.metaData)
      this.contentList = this.getContentImgPath(this.contentList);
    }).catch((err) => {
      console.log('error', err)
    })
  }

  async ngOnDestroy() {
    const modal = await this.modalCtrl.getTop();
    if (modal) {
      modal.dismiss();
    }
  }

  createList() {
    let result: { [x: string]: any; }[] = [];
    this.contentList.forEach((e: { [x: string]: any; }) => {
      if (e['isSelected']) {
        result.push(e);
      }
    });
    console.log('...................', result)
    this.router.navigate(['/create-playlist'], { state: { selectedContents: result } })
  }

  async deletePlaylist() {
    await this.playListService.deletePlayList(this.deleteContent.identifier).then((data) => {
      this.getPlaylistContent()
    }).catch((err) => {
      console.log('err', err)
    })
  }

  ionViewWillEnter() {
    this.navigated = false;
    if (this.type === 'recentlyviewed') {
      this.headerService.showHeader('Recently Viewed', true);
    } else if (this.type === 'playlist') {
      this.headerService.showHeader('Select from Recently Viewed', true);
    }
    this.getPlaylistContent();
  }

  async openModal(content: any) {
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
      //  this.telemetryGeneratorService.generateInteractTelemetry('TOUCH', 'content-liked', 'home', 'home', new TelemetryObject(content?.metaData.identifier!, content?.metaData.mimetype!, ''));
      }
    });
  }

  async addContentToMyPitara(content: Content) {
    const modal = await this.modalCtrl.create({
      component: AddToPitaraComponent,
      componentProps: {
        content: content
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


  isContentSelect(event: any, index: any) {
    this.contentList[index]['isSelected'] = event.detail.checked;
    this.checkSelectedContent();
  }

  checkSelectedContent() {
    this.selectedContents = []
    this.contentList.forEach((e: { [x: string]: any; }) => {
      if (e['isSelected']) {
        this.selectedContents.push(e);
      }
    });
  }

  async openFilePicker() {
    let mimeType: string[] = [MimeType.PDF];
    mimeType = mimeType.concat(MimeType.VIDEOS).concat(MimeType.AUDIO);
    const { files } = await FilePicker.pickFiles({ types: mimeType, multiple: true, readData: false });
    let localContents: Array<Content> = []
    const loader = await this.utilService.getLoader()
    await loader.present();
    for (let i=0; i<files.length; i++) {
      const path: string = await this.resolveNativePath(files[i].path!)as string;
      console.log('path', path);
      const fileName = path.substring(path.lastIndexOf('/') + 1);
      localContents.push({
        source: 'local',
        sourceType: 'local',
        metaData: {
          identifier: SHA1(path).toString(),
          url: path,
          name: fileName,
          mimetype: ContentUtil.getMimeType(fileName),
          thumbnail: ''
        }
      })
    }
    await loader.dismiss()
    if (localContents.length) {
      localContents = this.getContentImgPath(localContents, true);
      this.contentList = localContents.concat(this.contentList);
    }
  }

  getContentImgPath(contents: Array<any>, isSelected?: boolean) : Array<any>{
    contents.forEach((ele) => {
      if (ele.metaData.mimetype === PlayerType.YOUTUBE) {
        // ele.metaData['thumbnail'] = this.loadYoutubeImg(ele.metaData.thumbnail)
        ele.metaData['thumbnail'] = ele.metaData.thumbnail;
      } else {
        ele.metaData['thumbnail'] = (ele.metaData.thumbnail && !ele?.metaData.identifier?.startsWith('do_')) ? ele.mediaData.thumbnail : ContentUtil.getImagePath(ele.metaData.mimetype || ele.metaData.mimeType)
      }
      if (isSelected) {
        ele['isSelected'] = true;
        this.selectedContents.push(ele);
      }
    })
    return contents;
  }

  loadYoutubeImg(metaData: any): string {
    let id = metaData.identifier;
    if(id && id.startsWith("do_")) {
      id = getYouTubeID(metaData.url);
    }
    return `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
  }

  async playcontent(content: any) {
    if (this.type === 'recentlyviewed' && !this.optModalOpen) {
      await this.router.navigate(['/player'], {state: {content}});
    }
  }

  async uploadLocalContents() {
    let modal: any;
    if (!this.optModalOpen) {
      this.optModalOpen = true;
      modal = await this.modalCtrl.create({
        component: UploadLocalComponent,
//         componentProps: {uploadType: [{type: 'url', label: "Upload from Youtube"}, {type: 'file', label: 'Upload from Local Files' }, {type: 'diksha', label: 'Upload from Diksha' }]},
        componentProps: {uploadType: [{type: 'url', label: "Upload from Youtube"}, {type: 'diksha', label: 'Upload from Diksha' }]},
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
      if (result.data.type === 'file') {
        this.openFilePicker();
      } else {
        this.createYoutubeContent(result.data.type);
      }
    })
  }

  async createYoutubeContent(type: string) {
    const modal = await this.modalCtrl.create({
      component: NewPlaylistModalComponent,
      componentProps: {title: type == 'url' ? 'Add Youtube URL': 'Add Diksha URL', placeholder: 'Name'},
      cssClass: 'auto-height'
    });
    await modal.present();
    modal.onDidDismiss().then(async (result) => {
      let url = result.data?.url
      if (result && result.data.type === 'create') {
        let localContents: Array<Content> = []
        const loader = await this.utilService.getLoader()
        await loader.present();
        let id = ''
        if(type === 'url') {
          id = getYouTubeID(url) as string
          localContents.push({
            source: 'local',
            sourceType: 'local',
            metaData: {
              identifier: id,
              url: 'https://www.youtube.com/watch?v='+id,
              name: result.data.name,
              mimetype: MimeType.YOUTUBE,
              thumbnail: ''
            }
          });
          localContents = this.getContentImgPath(localContents, true);
          this.contentList = localContents.concat(this.contentList);
        } else if(type === 'diksha') {
          let arr = url.split('/')
          id = arr.filter((a: string) => a.startsWith('do_'))
          try {
            await this.contentService.readDikshaContents(id[0]).then(async (res) => {
              console.log('res ', res);
              let content = res.body?.result?.content;
              if(content.dialcodes?.length > 0) {
                await this.contentService.getContents(content.dialcodes[0]).then(data => {
                  console.log('content data ', data);
                  if(data.length > 0) {
                    data.forEach(cont => {
                      cont.source = "local"
                      if(cont.metaData.mimetype == MimeType.PDF || cont.metaData.mimetype == MimeType.VIDEO) {
                        localContents.push(cont)
                      }
                    })
                    localContents = this.getContentImgPath(localContents, true);
                    this.contentList = localContents.concat(this.contentList);
                  }
                })
              } else if(content.mediaType = "content") {
                let localData: Content = {
                  source: "local",
                  sourceType: 'diksha',
                  metaData: {
                    identifier: content?.identifier,
                    name: content?.name,
                    thumbnail: content?.thumbnail,
                    description: content?.name,
                    mimetype: content?.mimetype || content?.mimeType,
                    url: content?.streamingUrl,
                    focus: content?.focus,
                    keyword: content?.keyword,
                    domain: content?.domain,
                    curriculargoal: content?.curriculargoal,
                    competencies: content?.competencies,
                    language: content?.language,
                    category: content?.category,
                    audience: content?.audience,
                    status: content?.status,
                    createdon: content?.createdOn,
                    lastupdatedon: content?.lastupdatedon || content?.lastUpdatedOn,
                    artifactUrl: content?.artifactUrl
                  }
                };
                if(localData.metaData.mimetype == MimeType.PDF || localData.metaData.mimetype == MimeType.VIDEO) {
                  localContents.push(localData)
                  localContents = this.getContentImgPath(localContents, true);
                  this.contentList = localContents.concat(this.contentList);
                }
              }
            })
          }
          catch(err) {
            console.log('server err ', err);
          }
        }
        await loader.dismiss()
      }
    });
  }
}
