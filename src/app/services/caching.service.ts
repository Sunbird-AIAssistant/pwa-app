import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';

// Expire time in seconds
const TTL = 60 * 60;

@Injectable({
  providedIn: 'root'
})
export class CachingService {

  constructor(
    private storageService: StorageService) { }

  async initStorage() {
    const validUntil = (new Date().getTime()) + TTL * 1000;
    let firstLogin = await this.storageService.getData('firstTimeLoad')
    if(!firstLogin) {
      await this.storageService.setData('firstTimeLoad', 'true');
    }
    let validTimeStamp = await this.storageService.getData('validTimeStamp');
    if(!validTimeStamp) {
      this.storageService.setData('validTimeStamp', JSON.stringify(validUntil));
    }
  }
  
  async getCacheTimeout(): Promise<boolean> {
    let firstTimeLoad = await this.storageService.getData('firstTimeLoad');
    let currenttimeStamp = new Date().getTime();
    let validTimeStamp = await this.storageService.getData('validTimeStamp');
    if(currenttimeStamp > JSON.parse(validTimeStamp!)) {
      this.storageService.removeData('validTimeStamp');
      this.initStorage();
      return true;
    } else if(firstTimeLoad === 'true') {
      await this.storageService.setData('firstTimeLoad', 'false');
      return true;
    } else {
      return false;
    }
  }
}
