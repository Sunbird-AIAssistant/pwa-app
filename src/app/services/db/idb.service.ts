// dexie.service.ts
import { Injectable } from '@angular/core';
import Dexie from 'dexie';

@Injectable({
  providedIn: 'root'
})
export class iDbService extends Dexie {
  playList: Dexie.Table<{ key: string, value: any }, number>;
  parentSakhi: Dexie.Table<{ key: string, value: any }, number>;
  teacherSakhi: Dexie.Table<{ key: string, value: any }, number>;
  guest: Dexie.Table<{ key: string, value: any }, number>;




  constructor() {
    super('myDatabase');
    this.version(1).stores({
      // playList: '_id, name, identifier, isSelected, metaData',
      // parentSakhi: 'dislikeMsg,displayMsg,identifier,likeMsg,message,messageType,readMore,requestId,time,timeStamp,type'
    });

    this.version(1).stores({
      playList: '++id, key, value',
      parentSakhi: '++id, key, value',
      teacherSakhi: '++id, key, value',
      guest: '++id, key, value'

    });
    this.playList = this.table('playList');
    this.parentSakhi = this.table('parentSakhi');
    this.teacherSakhi = this.table('teacherSakhi');
    this.guest = this.table('guest');
  }


  async addKeyValuePair(key: string, value: any) {
    return this.playList.put({ key, value });
  }

  // Method to retrieve a value by key
  async getValuePlayList(key: string) {
    // return this.playList.where('key').equals(key).last();
    let values = await this.playList.where('key').equals(key).toArray();
    return values.map(entry => entry.value[0]);  
  }

  async getValueBotMessage(key: string) {
    if(key === 'parentSakhi')
    {
    return this.parentSakhi.where('key').equals(key).last();
    }else{
      return this.teacherSakhi.where('key').equals(key).last();
    }
    // let values = await this.parentSakhi.where('key').equals(key).toArray();
    // return values.map(entry => entry.value[0]);  
  }

  async getValueGuestRecentContent(key: string) {
    let values = await this.guest.where('key').equals(key).toArray();
    return values.map(entry => entry.value[0]);  
  }

  // Method to retrieve all key-value pairs
  async getAllKeyValuePairs() {
    return this.playList.toArray();
  }

  async save(key: string, value: any) {
    return this.playList.put({ key, value });
  }

  // Implement CRUD methods using Dexie API
  // Example methods:
  async saveBotMessageSakhi(key: string, value: any) {
    if(key === 'parentSakhi')
    {
    return this.parentSakhi.put({ key, value });
    }else{
      return this.teacherSakhi.put({ key, value });
    }
  }

  async saveGuestRecentViewContent(key: string, value: any) {
    return this.guest.put({ key, value });
  }

  async readDbData(table: string, id: any, aa = {}) {
    return this.table(table).get(id);
  }

  async updateData(table: string, id: any, changes: any) {
    return this.table(table).update(id, changes);
  }

  async deleteData(table: string, id: any) {
    return this.table(table).delete(id);
  }
}


