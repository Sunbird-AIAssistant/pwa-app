import { Component, OnInit } from '@angular/core';
import { ContentService } from 'src/app/services/content/content.service';
import { PlaylistService } from 'src/app/services/playlist/playlist.service';
import { FilePicker, PickedFile } from '@capawesome/capacitor-file-picker';
import { PlayListContent} from '../../services/playlist/models/playlist.content'
import { AppHeaderService, UtilService } from 'src/app/services';
import { Router } from '@angular/router';
import { MimeType, PlayerType } from 'src/app/appConstants';
import { ContentUtil } from 'src/app/services/content/util/content.util';
import { Location } from '@angular/common';
import getYouTubeID from 'get-youtube-id';
import { SHA1 } from 'crypto-js';
import { ModalController } from '@ionic/angular';
import { UploadLocalComponent } from 'src/app/components/upload-local/upload-local.component';
import { NewPlaylistModalComponent } from 'src/app/components/new-playlist-modal/new-playlist-modal.component';
import { Content } from 'src/app/services/content/models/content';

@Component({
  selector: 'app-create-playlist',
  templateUrl: './create-playlist.page.html',
  styleUrls: ['./create-playlist.page.scss'],
})

export class CreatePlaylistPage implements OnInit {
  contentList: Array<any> = [];
  playlists: any;
  playlistName = '';
  disableCreateBtn: boolean = true;
  public files: PickedFile[] = [];
  navigateBack: boolean = false;
  resolveNativePath = (path : string) =>
  new Promise((resolve, reject) => {
    (window as any).FilePath.resolveNativePath(path, resolve, (err : any) => {
      console.error(
        `${path} could not be resolved by the plugin: ${err.message}`
      )
      reject(err)
    })
  });
  selectedContents: Array<any> = [];
  reSelectedContent: Array<any> = [];
  localContents: number = 0;
  status = '';
  optModalOpen: boolean = false;
  constructor(
    private contentService: ContentService,
    private playListService: PlaylistService,
    private headerService: AppHeaderService,
    private router: Router,
    private location: Location,
    private utilService: UtilService,
    private modalCtrl: ModalController
  ) {
    let extras = this.router.getCurrentNavigation()?.extras;
    if (extras) {
      if (extras.state?.['islocal']){
        this.playlists = extras.state?.['playlists'];
        this.selectedContents = this.playlists['playListcontentList'];
        this.selectedContents.map((e) => {
          e['isSelected'] = true;
          if (!e['metaData'] && e['content_metadata']) {
            e['metaData'] = JSON.parse(e['content_metadata'])
          }
        });
        this.playlistName = this.playlists.name;
        this.status = extras.state?.['status'];
      } else {
        this.selectedContents = extras.state?.['selectedContents'];
      }
      this.selectedContents = this.selectedContents.filter((e) => e['metaData']);
      this.reSelectedContent = this.selectedContents;
    }
  }

  ngOnInit() {
    this.getContentImgPath();
    this.contentService.getRecentlyViewedContent('guest').then((result) => {
      this.contentList = result;
      console.log('result', result)
    });
    this.headerService.headerEventEmitted$.subscribe((event) => {
      if (event === 'back' && this.status === 'edit' && !this.navigateBack) {
        this.navigateBack = true;
        this.router.navigate(['/tabs/my-pitara'])
      }
    });
  }

  ionViewWillEnter() {
    this.headerService.showHeader('create New Playlist', true)
  }

  isContentSelect(event: any, index: any) {
    this.selectedContents[index]['isSelected'] = event.detail.checked;
    this.reSelectedContent = [];
    this.selectedContents.forEach((e: { [x: string]: any; }) => {
      if (e['isSelected']) {
        this.reSelectedContent.push({ identifier: e['metaData']['contentIdentifier']});
      }
    });
    this.disableCreateBtn = false;
    if(this.reSelectedContent.length == 0 || this.playlistName.length == 0) {
      this.disableCreateBtn = true
    }
  }

  playlistNameChange() {
    if((this.playlistName.replace(/\s/g, '').length > 0 && this.selectedContents.length > 0) || (this.playlistName !== "" && this.playlistName !== this.playlists?.name)) {
      this.disableCreateBtn = false
    } else {
      this.disableCreateBtn = true
    }
  }

  async createList() {
    let request: Array<PlayListContent> = [];
    this.selectedContents.forEach((e: any) => {
      if (e['type'] === 'local' || e['source'] === 'local' ) {
        request.push({identifier: e['identifier'], type: (e.sourceType == "diksha") ? 'local_diksha' : 'local', localContent: e, isDeleted: !e['isSelected']})
      } else {
        if(e['isSelected']) {
          request.push({ identifier: e['contentIdentifier'], type: 'recentlyViewed' , localContent: e});
        } else {
          request.push({identifier: e['identifier'], type: e['type'], localContent: e, isDeleted: true})
        }
      }
    });
    if (this.playlistName.replace(/\s/g, '').length > 0) {
      let identifier = this.playlists ? this.playlists.identifier : undefined;
      this.playListService.createPlayList(this.playlistName, 'guest', request, identifier).then((data) => {
        // API
        this.headerService.deviceBackBtnEvent({name: 'backBtn'})
        if (this.status === 'edit') {
          this.location.back();
        } else {
          window.history.go(-2)
        }
      }).catch((err) => {
        console.log('errrrr', err)
      })
    }
  }


  public async openFilePicker() {
    let mimeType: string[] = [MimeType.PDF];
    mimeType = mimeType.concat(MimeType.VIDEOS).concat(MimeType.AUDIO);
    const { files } = await FilePicker.pickFiles({ types: mimeType, multiple: true, readData: true });
    const loader = await this.utilService.getLoader()
    await loader.present();
    for (let i=0; i<files.length; i++) {
      const path: string = await this.resolveNativePath(files[i].path!)as string;
      console.log('path', path);
      const fileName = path.substring(path.lastIndexOf('/') + 1);
      this.selectedContents.push({
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
    if (this.selectedContents.length) {
      this.getContentImgPath();
    }
  }

  getContentImgPath(){
    this.selectedContents.forEach((ele) => {
      if (!ele.metaData['thumbnail']) {
        if (ele.metaData.mimetype === PlayerType.YOUTUBE) {
          // ele.metaData['thumbnail'] = this.loadYoutubeImg(ele.metaData);
          ele.metaData['thumbnail'] = ele.metaData.thumbnail;
        } else {
          ele.metaData['thumbnail'] = (ele.metaData.thumbnail && !ele.metaData.identifier.startsWith('do_')) ? ele.metaData.thumbnail : ContentUtil.getImagePath(ele.metaData.mimetype || ele.metaData.mimeType)
        }
      } else if(ele.metaData.mimeType !== PlayerType.YOUTUBE) {
          ele.metaData['thumbnail'] = (ele.metaData.thumbnail && !ele.metaData.identifier.startsWith('do_')) ? ele.metaData.thumbnail : ContentUtil.getImagePath(ele.metaData.mimetype || ele.metaData.mimeType)
        }
    })
  }

  loadYoutubeImg(metaData: any): string {
    let id = metaData.identifier;
    if(id && id.startsWith("do_")) {
      id = getYouTubeID(metaData.url);
    }
    return `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
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
      let url = result.data?.url;
      if (result && result.data?.type === 'create') {
        const loader = await this.utilService.getLoader()
        await loader.present();
        let id = ""
        if(type === 'url') {
          id = getYouTubeID(url) as string
          this.selectedContents.push({
            source: 'local',
            sourceType: 'local',
            metaData: {
              identifier: id,
              url: 'https://www.youtube.com/watch?v='+id,
              name: result.data.name,
              mimetype: MimeType.YOUTUBE,
              thumbnail: ''
            }
          })
          if (this.selectedContents.length) {
            this.getContentImgPath();
          }
        } else if(type == 'diksha') {
          let arr = url.split('/')
          id = arr.filter((a: string) => a.startsWith('do_'))
          try {
            await this.contentService.readDikshaContents(id[0]).then(async (res: any) => {
              console.log('res ', res);
              let content = res.body?.result?.content;
              if(content.dialcodes?.length > 0) {
                await this.contentService.getContents(content.dialcodes[0]).then(data => {
                  console.log('content data ', data);
                  data.forEach(cont => {
                    cont.source = "local"
                    if(cont.metaData.mimetype == MimeType.PDF || cont.metaData.mimetype == MimeType.VIDEO) {
                      this.selectedContents.push(cont)
                    }
                  })
                  this.getContentImgPath();
                })
              } else if(content.mediaType = "content") {
                let localData: Content = {
                  source: "local",
                  sourceType: 'diksha',
                  metaData: {
                    identifier: content?.identifier,
                    name: content?.name,
                    thumbnail: content?.posterImage,
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
                  this.selectedContents.push(localData)
                  this.getContentImgPath();
                }
              }
            })
          }
          catch(err) {
            console.log('Server error ', err);
          }
        }
        await loader.dismiss()
      }
    });
  }
}
