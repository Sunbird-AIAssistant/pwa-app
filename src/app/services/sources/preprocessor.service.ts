import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/internal/Subject';

@Injectable({
  providedIn: 'root'
})
export class PreprocessorService {
  contentConfig!: Array<any>;
  constructor() { }

  private sourceEvent = new Subject<any>();
  sourceProcessEmitted$ = this.sourceEvent.asObservable();

  sunbirdSrcProcess(config: Array<any>) {
    this.contentConfig = [];
    config.forEach(obj => {
      this.contentConfig.push(obj);
    })
    this.sourceEvent.next(this.contentConfig);
  }
}
