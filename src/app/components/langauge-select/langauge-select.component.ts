import { Component, OnInit } from '@angular/core';
import { ModalController, NavParams } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { StorageService } from 'src/app/services';
import { LanguageService } from './language.service';

@Component({
  selector: 'app-langauge-select',
  templateUrl: './langauge-select.component.html',
  styleUrls: ['./langauge-select.component.scss'],
})
export class LangaugeSelectComponent  implements OnInit {
  selectedLanguage: string = "";
  languages!: Array<any>;
  constructor(private translateService: TranslateService,
    private navParams: NavParams,
    private modalCtrl: ModalController,
    private languageService: LanguageService,
    private storage: StorageService) { }

  async ngOnInit() {
    this.languages = [];
    this.languages = this.navParams.get('languages');
    let currentLang: any = await this.storage.getData('lang');
    console.log('current lang ', currentLang);
    this.selectedLanguage = currentLang;
  }

  languageSelected(ev: any) {
    let val = ev.detail.value;
    console.log('Current value:', JSON.stringify(val));
    this.storage.setData('lang', val);
    // if(val !== 'hi') {
    //   this.translateService.use('en');
    // } else {
      this.translateService.use(val);
    // }
    this.selectedLanguage = val;
    this.languageService.setLanguage(val)
    this.dismissModal();
  }

  dismissModal() {
    this.modalCtrl.dismiss();
  }
}
