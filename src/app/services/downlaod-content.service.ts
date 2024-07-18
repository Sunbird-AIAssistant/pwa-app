import { Injectable } from '@angular/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class DownlaodContentService {
  toast: any;
  constructor(
    private toastController: ToastController,
    private translate: TranslateService
  ) { }

  async downlaodContent(content: any) {
    this.presentToast("Downloading ....");
    let arr = content.metaData.artifactUrl ? content.metaData.artifactUrl.split('/') : content.metaData.url.split("/");
    console.log(arr, arr[arr.length-1]);
    let url = content.metaData.artifactUrl ?? content.metaData.url;
    const response = await fetch(url);
    // convert to a Blob
    const blob = await response.blob();
    // convert to base64 data, which the Filesystem plugin requires
    const base64Data = await this.convertBlobToBase64(blob) as string;
    try {
      await Filesystem.mkdir({path: 'downloadedContents', directory: Directory.Data})
      return await this.writeFileStorage(arr, base64Data);
    }
    catch (e) {
      return await this.writeFileStorage(arr, base64Data);
    }
  }

  async writeFileStorage(arr:any, base64Data: any): Promise<any> {
    try {
      let writeFileRes = await Filesystem.writeFile({path: `downloadedContents/${arr[arr.length-1]}`, data: base64Data, directory: Directory.Data})
      await this.toast.dismiss();
      if(writeFileRes.uri) {
        await this.presentToast("Downloaded successfully");
      } else {
        await this.presentToast("Failed to download");
      }
      setTimeout(async () => {
        await this.toast.dismiss();
      }, 100);
      return writeFileRes;
    } catch (e) {
      console.log('e ', e);
    }
  }

  async presentToast(msg: string) {
    this.toast = await this.toastController.create({
      message: this.translate.instant(msg),
      position: 'bottom',
      color: 'dark'
    });
    await this.toast.present();
  }

  convertBlobToBase64(blob: Blob): Promise<any> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader;
      reader.onerror = reject;
      reader.onload = () => {
        resolve(reader.result);
      };
      reader.readAsDataURL(blob);
    })
  }
}
