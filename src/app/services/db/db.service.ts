import { Injectable } from '@angular/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection, CapacitorSQLitePlugin, capSQLiteSet } from '@capacitor-community/sqlite';
import { dbinfo } from '../../appConstants';
import { PlaylistContentEntry } from '../playlist/db/playlist.content.schema';
import { PlaylistEntry } from '../playlist/db/playlist.schema';
import { RecentlyViewedContentEntry } from '../content/db/recently.viewed.content.schema';
import { TelemetryConfigEntry } from './telemetrySchema';
import { ContentEntry } from '../content/db/content.schema';
import { TelemetryProcessedEntry } from '../telemetry/db/telemetry.processed.schema';
import { ContentReactionsEntry } from '../content/db/content.reactions.schema';
import { BotChatEntry } from '../bot/db/chat.schema';
import { Capacitor } from '@capacitor/core';

@Injectable({
  providedIn: 'root'
})
export class DbService {
  sqliteConnection!: SQLiteConnection;
  sqliteDBConnection!: SQLiteDBConnection;
  sqlitePlugin!: CapacitorSQLitePlugin;
  dbname!: string;
  platform!: string;

  constructor() { }

  // Initilaise sqlite database
  async initializePlugin(): Promise<boolean> {

    this.platform = Capacitor.getPlatform();

    this.sqlitePlugin = CapacitorSQLite;
    this.sqliteConnection = new SQLiteConnection(this.sqlitePlugin);

    if( this.platform === 'web') {
      await this.initWebStore();
     }

     // Initialize whatever database and/or MOCK_DATA you like

    await this.openDatabase(dbinfo.dbName, false, "no-encryption", dbinfo.version, false);
    await this.createTable(TelemetryConfigEntry.getCreateEntry());
    await this.createTable(TelemetryProcessedEntry.getCreateEntry());
    await this.createTable(ContentEntry.getCreateEntry());
    await this.createTable(RecentlyViewedContentEntry.getCreateEntry());
    await this.createTable(PlaylistEntry.getCreateEntry());
    await this.createTable(PlaylistContentEntry.getCreateEntry());
    await this.createTable(ContentReactionsEntry.getCreateEntry());
    await this.createTable(BotChatEntry.getCreateEntry());
    return true;
  }

  async initWebStore(): Promise<void> {
    try {
    await this.sqliteConnection.initWebStore();
    } catch(err: any) {
    const msg = err.message ? err.message : err;
    return Promise.reject(`initWebStore: ${err}`);
    }
}


  // opem database
  async openDatabase(dbName: string, encrypted: boolean, mode: string, version: number, readonly: boolean): Promise<boolean> {
    let db: SQLiteDBConnection;
    const retCC = (await this.sqliteConnection.checkConnectionsConsistency()).result;
    let isConn = (await this.sqliteConnection.isConnection(dbName, readonly)).result;
    if (retCC && isConn) {
      db = await this.sqliteConnection.retrieveConnection(dbName, readonly);
    } else {
      db = await this.sqliteConnection.createConnection(dbName, encrypted, mode, version, readonly);
    }
    await db.open();
    this.sqliteDBConnection = db;
    return true;
  }

  // close db connection
  async closeConnection(database: string, readonly?: boolean): Promise<void> {
    const readOnly = readonly ? readonly : false;
    return await this.sqliteConnection.closeConnection(database, readOnly);
  }

  async createTable(stmt: string): Promise<any> {
    try {
      const retValues = (await this.sqliteDBConnection.query(stmt)).values;
      const ret = retValues!.length > 0 ? retValues! : null;
      return ret;
    } catch (err: any) {
      const msg = err.message ? err.message : err;
      return Promise.reject(`create table err: ${msg}`);
    }
  }

  async executeQuery(query: string): Promise<any> {
    try {
      const retValues = (await this.sqliteDBConnection.query(query)).values;
      const ret = retValues!.length > 0 ? retValues! : null;
      return ret;
    } catch (err: any) {
      const msg = err.message ? err.message : err;
      return Promise.reject(`select table err: ${msg}`);
    }
  }

  async executeSet(capSqlSet: capSQLiteSet[]): Promise<any> {
    try {
      const result = await this.sqliteDBConnection.executeSet(capSqlSet);
      return result;
    } catch (err: any) {
      const msg = err.message ? err.message : err;
      return Promise.reject(`create table err: ${msg}`);
    }
  }

  async readDbData(stmt: string, where?: any, orderBy?: string): Promise<any> {
    try {
      if (where) {
        const key: string = Object.keys(where)[0];
        const q: string = `${stmt} WHERE ${key}='${where[key]}' ${orderBy ? orderBy : ''}`;
        const retValues = (await this.sqliteDBConnection.query(q)).values;
        const ret = retValues!.length > 0 ? retValues! : null;
        return ret;
      } else {
        const retValues = (await this.sqliteDBConnection.query(stmt)).values;
        const ret = retValues!.length > 0 ? retValues! : null;
        return ret;
      }
    } catch (err: any) {
      const msg = err.message ? err.message : err;
      return Promise.reject(`readDbData err: ${msg}`);
    }
  }

  async save(query: string, mObj: any, where?: any): Promise<void> {
    const isUpdate: boolean = where ? true : false;
    const keys: string[] = Object.keys(mObj);
    let stmt: string = '';
    let values: any[] = [];
    for (const key of keys) {
      values.push(mObj[key]);
    }
    let ret;
    if (!isUpdate) {
      // INSERT
      const qMarks: string[] = [];
      for (const key of keys) {
        qMarks.push('?');
      }
      stmt = `${query} (${keys.toString()}) VALUES (${qMarks.toString()});`;
      ret = await this.sqliteDBConnection.run(stmt, values);
      if (ret.changes!.changes != 1) {
        return Promise.reject(`save: insert changes != 1`);
      }
    } else {
      // UPDATE
      const wKey: string = Object.keys(where)[0];

      const setString: string = await this.setNameForUpdate(keys, values);
      if (setString.length === 0) {
        return Promise.reject(`save: update no SET`);
      }

      stmt = `${query} ${setString} WHERE ${this.getWhereStatement(where)}`;
      const result = await this.sqliteDBConnection.query(stmt);
    }
  
    return;
  }

  // delete data from table
  async remove(query: string, where: any): Promise<any> {
    const key: string = Object.keys(where)[0];
    const stmt: string = `${query} WHERE ${this.getWhereStatement(where)};`
    const ret = (await this.sqliteDBConnection.run(stmt)).changes;
    return ret;
  }

  private getWhereStatement(whereCondition: any): string {
    let condition = ''
    const wKey: string[] = Object.keys(whereCondition)
    for (let i = 0; i < wKey.length; i++) {
      condition += `${wKey[i]}='${whereCondition[wKey[i]]}'`;
      if (i < wKey.length - 1) {
        condition += 'AND '
      }
    }
    return condition
  }
  /**
   * SetNameForUpdate
   * @param names
   */
  private async setNameForUpdate(names: string[], values: any[]): Promise<string> {
    let retString = '';
    for (let i = 0; i < names.length; i++) {
      if (typeof values[i] === "string") {
        retString += `${names[i]} = '${values[i]}' ,`;
      } else {
        retString += `${names[i]} = ${values[i]} ,`;
      }
    }

    if (retString.length > 1) {
      retString = retString.slice(0, -1);
      return retString;
    } else {
      return Promise.reject('SetNameForUpdate: length = 0');
    }
  }
}

