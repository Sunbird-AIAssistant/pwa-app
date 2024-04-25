import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AppHeaderService, UtilService } from '../../../app/services';
import { MenuController } from '@ionic/angular';
import { TelemetryGeneratorService } from 'src/app/services/telemetry/telemetry.generator.service';
import { App } from '@capacitor/app';
import { ConfigVariables } from '../../config';

@Component({
  selector: 'app-application-header',
  templateUrl: './application-header.component.html',
  styleUrls: ['./application-header.component.scss'],
})
export class ApplicationHeaderComponent  implements OnInit {
  appInfo: any;
  @Input() headerConfig: any = false;
  @Output() headerEvents = new EventEmitter();
  @Output() sideMenuItemEvent = new EventEmitter();
  isMenuOpen: boolean = false;
  filters: Array<any> = []
  defaultFilter!: any;
  appVersion: string = ''
  appName: string = ""
  configVariables = ConfigVariables;
  constructor(private utilService: UtilService,
    private telemetryGeneratorService: TelemetryGeneratorService,
    public menuCtrl: MenuController,
    public headerService: AppHeaderService
    ) {
      App.getInfo().then(val => {
        this.appVersion = `v${val.version}.${val.build}`
        this.appName = val.name
      })
    }

  async ngOnInit() {
    this.appInfo = await this.utilService.getAppInfo();
    this.defaultFilter = {};
    this.headerService.filterConfigEmitted$.subscribe((val: any) => {
      this.filters = [];
      this.defaultFilter = val.defaultFilter;
      this.filters.push(val.defaultFilter);
      val.filter.forEach((item: any) => {
        this.filters.push(item);
      });
    })
    this.appInfo = await this.utilService.getAppInfo();
  }

  async scan() {
    this.telemetryGeneratorService.generateInteractTelemetry('TOUCH', 'qrscanner-clicked', 'home', 'home');
  }

  async handleSearch(event: Event) {
    this.emitEvent(event, 'search');
  }

  emitEvent(event: Event, name: string) {
    if (name == 'scan') {
      this.scan();
    }
    this.headerEvents.emit({event, name});
  }

  async toggleMenu() {
    await this.menuCtrl.toggle();
    this.isMenuOpen = await this.menuCtrl.isEnabled();
    if (this.isMenuOpen) {
    }
  }

  emitSideMenuItemEvent(event: any, item: string) {
    this.menuCtrl.close().then(() => {
      this.handleFilter(item);
    }).catch((e) => {
      this.handleFilter(item);
    })
  }

  handleFilter(filter: any) {
    this.defaultFilter = filter;
    this.sideMenuItemEvent.emit({ filter });
  }
}
