import { Directive, ElementRef, Input, OnChanges, Renderer2, SimpleChanges } from '@angular/core';
import getYouTubeID from 'get-youtube-id';

@Directive({
  selector: '[appThumbnail]'
})
export class ThumbnailDirective implements OnChanges {
  @Input('appThumbnail') appThumbnail: any; // Input property to receive the image URL

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnChanges(changes: any): void {
    if (changes['appThumbnail']) {
      let id = changes['appThumbnail'].currentValue.identifier;
      // if(id && id.startsWith("do_")) {
      //   id = getYouTubeID(changes.appThumbnail.currentValue.url);
      // }

      const url = changes.appThumbnail.currentValue.url;
       id = this.extractVideoId(url);
      const newSrc = `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
      this.renderer.setAttribute(this.el.nativeElement, 'src', newSrc);

    }
  }

   extractVideoId(url: any) {
    const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const matches = url.match(regex);
    return matches ? matches[1] : null;
  }
  

}
