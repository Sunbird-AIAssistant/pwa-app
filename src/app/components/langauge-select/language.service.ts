import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  private languageSubject = new BehaviorSubject<string>(localStorage.getItem('DJPData.lang') || 'en');
  currentLanguage$ = this.languageSubject.asObservable();

  setLanguage(language: string) {
    localStorage.setItem('DJPData.lang', language);
    this.languageSubject.next(language);
  }
}
