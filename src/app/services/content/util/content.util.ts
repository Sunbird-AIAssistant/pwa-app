import { ContentType, MimeType, TrackingEnabled } from "src/app/appConstants";

export class ContentUtil {

  public static isTrackable(content: any) {
    content = !content.trackable ? ((content.contentData && content.contentData.trackable) ? content.contentData : content) : content;
    // -1 - content, 0 - collection, 1 - enrolled (Trackable)
    if (content.trackable && content.trackable.enabled) {
      if (content.trackable.enabled === TrackingEnabled.YES) {
        // Trackable
        // if istrackable is defined, and true
        return 1;
      } else if (content.mimeType === MimeType.COLLECTION) {
        // Collection
        return 0;
      } else {
        // Content
        return -1;
      }
    } else {
      if (content.contentType && content.contentType.toLowerCase() === ContentType.COURSE.toLowerCase()) {
        // Trackable
        return 1;
      } else if (content.mimeType === MimeType.COLLECTION) {
        // Collection
        return 0;
      } else {
        // Content
        return -1;
      }
    }
  }

  public static getMimeType(fileName: string): string {
    const extension = fileName.split('.').pop();
    let mimeType = ''
    switch (extension?.toLowerCase()) {
      case 'mp4':
        mimeType = MimeType.VIDEO
        break;
      case 'pdf':
        mimeType = MimeType.PDF
        break;
        case 'mp3':
        mimeType = MimeType.AUDIOS
        break;
        case 'm4a':
          mimeType = MimeType.AUDIOS
          break;
        case 'wav':
        mimeType = MimeType.RECOEDED_AUDIO
        break;
      case 'youtube':
        mimeType = MimeType.YOUTUBE      
        break;
        case 'link':
          mimeType = MimeType.LINK      
          break;
      default:
        break;
    }
    return mimeType;
  }

  public static getImagePath(type: any): string{
    let mimeType = type.split('/').pop();
    let mimeTypes: any = {
      mp3: '/assets/images/Audio.png',
      mp4: '/assets/images/Video.png',
      webm: '/assets/images/Video.png',
      pdf: '/assets/images/PDF.png',
      link: '/assets/images/LINK.png'
    }
    return mimeTypes[mimeType];
  }
}
