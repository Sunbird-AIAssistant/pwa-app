import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PlayerType } from 'src/app/appConstants';
import { AppHeaderService } from 'src/app/services';
import { PlaylistService } from 'src/app/services/playlist/playlist.service';
import { ModalController } from '@ionic/angular';
import { EditRemovedModalComponent } from 'src/app/components/edit-removed-modal/edit-removed-modal.component';
import { Subscription } from 'rxjs';
@Component({
  selector: 'app-playlist-details',
  templateUrl: './playlist-details.page.html',
  styleUrls: ['./playlist-details.page.scss'],
})
export class PlaylistDetailsPage implements OnInit, OnDestroy {
  playContentObject: any;
  playlists: Array<any> = [];
  mimeType = PlayerType;
  navigated = false;
  headerEventSub: Subscription | null = null;
  constructor(private router: Router,
    private headerService: AppHeaderService,
    private modalCtrl: ModalController,
    private playlistService: PlaylistService) {
    let extras = this.router.getCurrentNavigation()?.extras;
    if (extras) {
      this.playContentObject = extras.state?.['playlist'];
      this.playContentObject['playListcontentList'].map((playListcontent: any) => {
        playListcontent['metaData'] = JSON.parse(playListcontent['content_metadata'])
      });
      this.playlists = this.playContentObject['playListcontentList'];
    }
  }

  ngOnInit() {
    this.headerService.showHeader(this.playContentObject.name, true, ['edit'])
    this.headerService.headerEventEmitted$.subscribe((event) => {
      if (event === 'edit') {
        this.router.navigate(['/create-playlist'], { state: { playlists: this.playContentObject, islocal: true } })
      } else if (event === 'back' && !this.navigated) {
        this.navigated = true;
        this.router.navigate(['/tabs/my-pitara'])
      }
    })
  }

  ionViewWillEnter() {
    this.navigated = false;
    this.headerService.showHeader(this.playContentObject.name, true, ['edit'])
  }

  ngOnDestroy(): void {
    try {
      this.headerEventSub && this.headerEventSub.unsubscribe()  
    } catch (error) {
      console.log(`error in unsubscribe`, error)
    }
  }

  async playContent(content: any) {
    await this.router.navigate(['/player'], { state: { content } });
  }

  async deletePlaylist(content: any) {
    await this.playlistService.deleteContentFromPlayList(this.playContentObject.identifier, [content.identifier]).then((data) => {
      this.getPlaylistContent()
    }).catch((err) => {
      console.log('err', err)
    })
  }

  async getPlaylistContent() {
    await this.playlistService.getPlayListContents(this.playContentObject.identifier).then((data) => {
      this.playlists = data;
      this.playlists.map((playlist) => {
        playlist['metaData'] = JSON.parse(playlist['content_metadata'])
      });
      this.playContentObject['playListcontentList'] = this.playlists;
    })
  }

  async moreOtions(content: any) {
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
      if (result && result.data.type === 'delete') {
        this.deletePlaylist(content);
      } else if (result && result.data.type === 'edit') {
        this.router.navigate(['/create-playlist'], { state: { playlists: this.playContentObject, islocal: true } })
      }
    });
  }

}
