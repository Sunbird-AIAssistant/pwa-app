import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ModalController, NavParams } from '@ionic/angular';
import { ToastController, LoadingController, Platform } from '@ionic/angular';
import jsQR from 'jsqr';

@Component({
  selector: 'app-qrcode-popup',
  templateUrl: './qrcode-popup.component.html',
  styleUrls: ['./qrcode-popup.component.scss'],
})
export class QrcodePopupComponent  implements OnInit {
  scanText: string = '';
  isValidURL: boolean = false;
  @ViewChild('video', { static: false }) video!: ElementRef;
  @ViewChild('canvas', { static: false }) canvas!: ElementRef;
  @ViewChild('fileinput', { static: false }) fileinput!: ElementRef;
  canvasElement: any;
  videoElement: any;
  canvasContext: any;
  scanActive = false;
  scanResult: string | null = null;
  loading: HTMLIonLoadingElement | null = null;
  constructor(
    private navParams: NavParams,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController,
    private plt: Platform
  ) {
    const isInStandaloneMode = () =>
      'standalone' in window.navigator && window.navigator['standalone'];
    if (this.plt.is('ios') && isInStandaloneMode()) {
      console.log('I am a an iOS PWA!');
      // E.g. hide the scan functionality!
    }
  }

  ngOnInit() {
    this.scanText = this.navParams.get('scannedData');
    this.isValidURL = this.isValidUrl();
  }

  openLink() {
    this.close();
    window.open(this.scanText)
  }

  close() {
    this.modalCtrl.dismiss();
  }

  isValidUrl() {
    try {
      const newUrl = new URL(this.scanText);
      return newUrl.protocol === 'http:' || newUrl.protocol === 'https:';
    } catch (err) {
      return false;
    }
   }

  ngAfterViewInit() {
    this.canvasElement = this.canvas.nativeElement;
    this.canvasContext = this.canvasElement.getContext('2d');
    this.videoElement = this.video.nativeElement;
  }

  // Helper functions
  async showQrToast() {
    const toast = await this.toastCtrl.create({
      message: `Open ${this.scanResult}?`,
      position: 'top',
      buttons: [
        {
          text: 'Open',
          handler: () => {
            if (this.scanResult) {
              window.open(this.scanResult, '_system', 'location=yes');
            } else {
                // Handle the case where this.scanResult is null
            }
          }
        }
      ]
    });
    toast.present();
  }

  reset() {
    this.scanResult = null;
  }

  async startScan() {
    // Not working on iOS standalone mode!
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' }
    });
  
    this.videoElement.srcObject = stream;
    // Required for Safari
    this.videoElement.setAttribute('playsinline', true);
  
    this.loading = await this.loadingCtrl.create({});
    await this.loading.present();
  
    this.videoElement.play();
    requestAnimationFrame(this.scan.bind(this));
  }

   stopScan() {
    this.scanActive = false;

    const stream = this.videoElement.srcObject;
    if (stream) {
        const tracks = stream.getTracks();
        tracks.forEach(function(track: MediaStreamTrack) {
            track.stop();
        });
        this.videoElement.srcObject = null;
    }
    }
  
  async scan() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (this.videoElement.readyState === this.videoElement.HAVE_ENOUGH_DATA) {
        if (this.loading) {
          await this.loading.dismiss();
          this.loading = null;
          this.scanActive = true;
        }
    
        this.canvasElement.height = this.videoElement.videoHeight;
        this.canvasElement.width = this.videoElement.videoWidth;
    
        this.canvasContext.drawImage(
          this.videoElement,
          0,
          0,
          this.canvasElement.width,
          this.canvasElement.height
        );
        const imageData = this.canvasContext.getImageData(
          0,
          0,
          this.canvasElement.width,
          this.canvasElement.height
        );
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'dontInvert'
        });
    
        if (code?.data) {
          this.scanActive = false;
          this.scanResult = code.data;
          this.stopScan();
          this.showQrToast();
        } else {
          if (this.scanActive) {
            requestAnimationFrame(this.scan.bind(this));
          }
        }
      } else {
        requestAnimationFrame(this.scan.bind(this));
      }
    } catch (error) {
      // Handle permission denied or other errors
      console.error('Error accessing camera:', error);
    }
  }

  captureImage() {
    this.fileinput.nativeElement.click();
  }

  handleFile(event: Event) {
    const inputElement = (event.target as HTMLInputElement);
    if (inputElement instanceof HTMLInputElement && inputElement.files && inputElement.files.length > 0) {
        const file = inputElement.files[0];
        var img = new Image();
        img.onload = () => {
          this.canvasContext.drawImage(img, 0, 0, this.canvasElement.width, this.canvasElement.height);
          const imageData = this.canvasContext.getImageData(
            0,
            0,
            this.canvasElement.width,
            this.canvasElement.height
          );
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert'
          });

          if (code) {
            this.scanResult = code.data;
            this.showQrToast();
          }
        };
      img.src = URL.createObjectURL(file);
    }
  }
}
