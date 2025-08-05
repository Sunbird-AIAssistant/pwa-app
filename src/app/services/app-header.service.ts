import { Injectable } from '@angular/core';
import { Animation, StatusBar, Style } from '@capacitor/status-bar';
import { Subject } from 'rxjs/internal/Subject';
import { HeaderConfig } from '../appConstants';
import { App } from '@capacitor/app';

@Injectable({
  providedIn: 'root'
})
export class AppHeaderService {
  appName: string = ''
  constructor() { 
    App.getInfo().then(info => {this.appName = info.name});
  }
  private headerEvent = new Subject<any>();
  headerEventEmitted$ = this.headerEvent.asObservable();

  private headerConfig = new Subject<any>();
  headerConfigEmitted$ = this.headerConfig.asObservable();

  private deviceBackbtnConfig = new Subject<any>();
  deviceBackbtnEmitted$ = this.deviceBackbtnConfig.asObservable();
  private filterConfig = new Subject<any>();
  filterConfigEmitted$ = this.filterConfig.asObservable();

  private sideMenuItemEvent = new Subject<any>();
  sideMenuItemEventEmitted$ = this.sideMenuItemEvent.asObservable();

  filterEvent(val: any) {
    // When called with defaultFilter, triggers content reload
    this.filterConfig.next(val);
  }

  updateFiltersOnly(val: { filter: any, languages: any }) {
    // Update filters without triggering content reload
    this.headerConfig.next({ 
      ...this.getDefaultPageConfig(),
      filter: val.filter,
      languages: val.languages
    });
  }

  sidebarEvent(event: any) {
    this.headerEvent.next(event.name);
  }

  sideMenuItemEvents($event: any) {
    this.sideMenuItemEvent.next($event?.filter);
  }
  
  updatePageConfig(config: any) {
    this.headerConfig.next(config);
  }

  deviceBackBtnEvent(config: any) {
    this.deviceBackbtnConfig.next(config)
  }

  async hideHeader() {
    const defaultConfig = this.getDefaultPageConfig();
    defaultConfig.showHeader = false;
    this.updatePageConfig(defaultConfig);
  }

  getDefaultPageConfig() {
    const defaultConfig: HeaderConfig = {
      showHeader: true,
      pageTitle: this.appName,
      showbackButton: false,
      actionButtons: [''],
    };
    return defaultConfig;
  }

  async showHeader(pageTitle?: string, backbutton?: boolean, actionButtons?: Array<string>) {
    const defaultConfig = this.getDefaultPageConfig();
    defaultConfig.pageTitle = pageTitle ?? this.appName;
    defaultConfig.showbackButton = backbutton ?? false;
    defaultConfig.actionButtons = actionButtons ?? ['']
    this.updatePageConfig(defaultConfig);
  }

  hideStatusBar() {
    StatusBar.hide();
  }

  showStatusBar(overlay: boolean, color?: string) {
    StatusBar.show({animation: Animation.None});
    StatusBar.setStyle({style: color ? Style.Dark : Style.Light});
    StatusBar.setBackgroundColor({color: color ?? '#FFFAEE'})
    StatusBar.setOverlaysWebView({overlay: overlay})
  }
}
