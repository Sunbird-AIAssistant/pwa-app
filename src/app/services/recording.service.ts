import { Injectable, OnInit } from '@angular/core';
import { GestureController } from '@ionic/angular';
import { RecordingData, VoiceRecorder } from 'capacitor-voice-recorder';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Subject } from 'rxjs/internal/Subject';

@Injectable({
  providedIn: 'root'
})
export class RecordingService implements OnInit {
  private searchEvent = new Subject<any>();
  searchEventRecorded$ = this.searchEvent.asObservable();

  private botEvent = new Subject<any>();
  botEventRecorded$ = this.botEvent.asObservable();

  private recordEvent = new Subject<any>();
  startEndEvent$ = this.recordEvent.asObservable();
  
  recording = false;
  cancelRecording = false;
  duration = 0;
  durationDisplay = '';
  constructor(private gestureCtrl: GestureController) {}

  ngOnInit() {}

  gestureControl(ele: any) {
    const swipeLeft = this.gestureCtrl.create({
      el: ele.nativeElement,
      threshold: 250,
      gestureName: 'swipe',
      direction: 'x',
      onStart: (ev) => { 
        Haptics.impact({style: ImpactStyle.Light});
      },
      onMove: (ev) => { 
        Haptics.impact({style: ImpactStyle.Light});
        this.recordEvent.next(false);
        this.cancelRecording = true;
      },
      onEnd: ev => {
        Haptics.impact({style: ImpactStyle.Light});
        this.recording = false;
        this.recordEvent.next(false);
      }
    }, true);
    swipeLeft.enable();
  }

  async startRecognition(type: string) {
    this.cancelRecording = false;
    VoiceRecorder.startRecording();
    Haptics.impact({style: ImpactStyle.Light});
    if(this.recording) {
      return
    }
    this.recording = true;
    this.calculation(type);
    this.recordEvent.next(true);
  }

  calculation(type: string) {
    if(!this.recording) {
      this.duration = 0;
      this.durationDisplay = '';
      return;
    }

    this.duration += 1;
    const min = Math.floor(this.duration / 60);
    const sec = (this.duration %60).toString().padStart(2, '0');
    this.durationDisplay = `${min}:${sec}`;
    setTimeout(() => {
      this.calculation(type);
    }, 1000);
  }

  async stopRecognition(type: string): Promise<any> {
    Haptics.impact({style: ImpactStyle.Light});
    this.recordEvent.next(false);
    if(!this.recording) {return;}
    return await VoiceRecorder.stopRecording().then(async (result: RecordingData) => {
      this.recording = false;
      if(this.cancelRecording) {
        return;
      } else {
        if(type == 'search') {
          return result.value.recordDataBase64;
        } else {
          return result;
        }
      }
    })
  }
}
