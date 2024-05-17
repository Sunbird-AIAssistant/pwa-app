import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ModalController } from '@ionic/angular';
import { EditRemovedModalComponent } from 'src/app/components/edit-removed-modal/edit-removed-modal.component';
import { AppHeaderService } from 'src/app/services/app-header.service';
import { ContentService } from 'src/app/services/content/content.service';
import { ContentUtil } from 'src/app/services/content/util/content.util';
import { PlayList } from 'src/app/services/playlist/models/playlist.content';
import { PlaylistService } from 'src/app/services/playlist/playlist.service';
import {PlayerType} from 'src/app/appConstants';
import { OnTabViewWillEnter } from 'src/app/tabs/on-tabs-view-will-enter';
import getYouTubeID from 'get-youtube-id';
import { iDbService } from '../../services/db/idb.service';

@Component({
  selector: 'app-mypitara',
  templateUrl: 'mypitara.page.html',
  styleUrls: ['mypitara.page.scss']
})
export class MyPitaraPage implements OnTabViewWillEnter{
  contentList: Array<any> = [];
  playlists: Array<any> = [];
  isNavigate = true;

  constructor(private headerService: AppHeaderService,
    private contentService: ContentService,
    private router: Router,
    private playListService: PlaylistService,
    private idbService: iDbService,
    private modalCtrl: ModalController) {
  }

  async ngOnInit(): Promise<void> {
    this.headerService.deviceBackbtnEmitted$.subscribe((event: any) => {
      if(event.name = "backBtn") {
        this.tabViewWillEnter();
      }
    })
  
  }

  async tabViewWillEnter() {
    await this.headerService.showHeader("My Jaadui Pitara");
    this.getRecentlyviewedContent();
    this.getPlaylistContent();
  }

  ionViewWillEnter() {
    this.tabViewWillEnter();
  }

  viewAllCards(event: string) {
    this.router.navigate(['/view-all'], {state: {type: event}})
  }

  async getPlaylistContent() {
    this.playlists = [];
    // await this.playListService.getAllPlayLists('guest').then((result: Array<PlayList>) => {
    //   this.playlists = result;
    // }).catch((error) => {
    //   console.log('error', error)
    // })
    await this.idbService.getValuePlayList('playList').then((res)=>{
      // console.log(res?.value);
         this.playlists  = res;
         console.log(this.playlists);
        //  this.playlists.map((e) => e.metaData = (typeof e.metaData === 'string') ? JSON.parse(e.metaData) : e.metaData)
        //  this.playlists = this.getContentImgPath(this.playlists);
        
 
     });
  }

  async getRecentlyviewedContent() {
    await this.idbService.getValueGuestRecentContent('guest').then((values)=>{
      // if () {
      //   // Sort the values array in descending order based on a timestamp or identifier
         // Replace 'timestamp' with your actual property
      //   const latestData = values[0]; // Access the first element of the sorted array
      //   console.log(latestData); // Latest data retrieved from the array
      
        this.contentList  = values;
        this.contentList.map((e) => e.metaData = (typeof e.metaData === 'string') ? JSON.parse(e.metaData) : e.metaData)
             console.log('contentList', this.contentList);

    //  }
        

    });

    // await this.contentService.getRecentlyViewedContent('guest').then((result) => {
    //   this.contentList = result;
    //   this.contentList.forEach((ele: any) => {
    //     if (ele.metaData.mimetype === PlayerType.YOUTUBE) {
    //       ele.metaData['thumbnail'] = this.loadYoutubeImg(ele.metaData)
    //     } else {
    //       ele.metaData['thumbnail'] = (ele.metaData.thumbnail && !ele?.metaData.identifier?.startsWith('do_')) ? ele.metaData.thumbnail : ContentUtil.getImagePath(ele.metaData.mimeType || ele.metaData.mimetype)
    //     }
    //   })
    //   console.log('contentList', this.contentList);
    // }).catch((err) => {
    //   console.log('error', err)
    // })
  }
  
  createList() {
    this.router.navigate(['/create-playlist'])
  }

  async deletePlaylist(content: any) {
    await this.playListService.deletePlayList(content.identifier).then((data) => {
      this.getPlaylistContent()
    }).catch((err) => {
      console.log('err', err)
    })
  }

  async openModal(content?: any) {
    this.isNavigate = false;
    const modal = await this.modalCtrl.create({
      component: EditRemovedModalComponent,
      cssClass: 'add-to-pitara',
      breakpoints: [0, 1],
      showBackdrop: false,
      initialBreakpoint: 1,
      handle: false,
      handleBehavior: "none"
    });
    await modal.present();
    modal.onWillDismiss().then((result) => {
      this.isNavigate = true;
      if(result.data && result.data.type === 'delete') {
        this.deletePlaylist(content);
      } else if (result.data && result.data.type === 'edit') {
        this.router.navigate(['/create-playlist'], { state: { playlists: content, islocal: true , status: 'edit'} })
      }
    });
  }

  loadYoutubeImg(metaData: any): string {
    let id = metaData.identifier;
    if(id && id.startsWith("do_")) {
      id = getYouTubeID(metaData.url);
    }
    return `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
  }

  navigateToDetails(playlist: Array<any>) {
    if (this.isNavigate) {
      this.router.navigate(['/playlist-details'], { state: { playlist } })
    }
  }

  async playContent(content: any) {
    await this.router.navigate(['/player'], {state: {content}});
  }
}
