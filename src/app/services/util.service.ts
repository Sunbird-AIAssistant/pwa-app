import { Injectable } from '@angular/core';
import { App, AppInfo } from '@capacitor/app';
import { Device, DeviceId } from '@capacitor/device';
import { TranslateService } from '@ngx-translate/core';
import { DeviceSpecification } from './telemetry/models/telemetry';
import * as SHA1 from 'crypto-js/sha1';
import { LoadingController } from '@ionic/angular';
import { Capacitor } from '@capacitor/core';

@Injectable({
  providedIn: 'root'
})
export class UtilService {

  constructor(private translate: TranslateService,
    private loadingCtrl: LoadingController,) { }

  async getDeviceSpec(): Promise<DeviceSpecification> {
    const spec = await Device.getInfo();
    const did = await this.getDeviceId();
    return {
      os: `${spec.operatingSystem} ${spec.osVersion}`,
      make: spec.manufacturer,
      id: did
    } as DeviceSpecification
  }
  async getDeviceId(): Promise<string> {
    const deviceId: DeviceId = await Device.getId()
    return SHA1(deviceId.identifier).toString();
  }
  /**
   * App.getInfo() throws "Not implemented on web" in Capacitor — use this everywhere instead of App.getInfo().
   */
  async getAppInfo(): Promise<AppInfo> {
    if (Capacitor.getPlatform() === 'web') {
      const title =
        typeof document !== 'undefined' && document.title
          ? document.title.split('|')[0].trim()
          : 'Web App';
      return {
        name: title,
        id: 'web',
        build: '0',
        version: '1.0.0',
      };
    }
    return App.getInfo();
  }
  

  translateMessage(messageConst: string, fields?: string | any): string {
    let translatedMsg = '';
    let replaceObject: any = '';

    if (typeof (fields) === 'object') {
      replaceObject = fields;
    } else {
      replaceObject = { '%s': fields };
    }

    this.translate.get(messageConst, replaceObject).subscribe(
      (value: any) => {
        translatedMsg = value;
      }
    );
    return translatedMsg;
  }

  getLoader(duration?: number, message?: string): any {
    return this.loadingCtrl.create({
      message,
      duration: duration ? duration : 30000,
      cssClass: message ? 'custom-loader-message-class' : 'custom-loader-class'
    });
  }
}
