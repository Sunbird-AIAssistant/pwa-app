import { Injectable } from '@angular/core';
import { catchError, lastValueFrom, map } from 'rxjs';
import { config } from 'configuration/environment.prod';
import { ApiService } from './api/api.service';
import { ApiHttpRequestType, ApiRequest } from './api/model/api.request';
import { ApiResponse } from './api/model/api.response';

@Injectable({
  providedIn: 'root'
})
export class SearchService {

  constructor(
    private apiService: ApiService
  ) { }

  async postSearchContext(data: any, audio: boolean): Promise<any> {
    let requestBody = {};
    if (audio) {
      requestBody = {
        audio: data.text,
        language: data.currentLang,
        request: {
          orderBy: {
            "mimetype": "video/x-youtube"
          },
          fields: ["mimetype", "identifier","keywords","name",  "thumbnail", "media", "agegroup", "language", "sourceorg", "url", "domain", "category"]

        }
      }
    } else {
      requestBody = {
        name: data.text,
        language: data.currentLang,
        request: {
          orderBy: {
            "mimetype": "video/x-youtube"
          },
          fields: ["mimetype", "identifier","keywords","name",  "thumbnail", "media", "agegroup", "language", "sourceorg", "url", "domain", "category"]
        }
      }
    }
    let body = JSON.stringify(requestBody)
    console.log("body ", body);
    const apiRequest = new ApiRequest.Builder()
      .withHost(config.api.BASE_URL)
      .withPath(config.api.CONTENT_SEARCH_API)
      .withType(ApiHttpRequestType.POST)
      .withBody(body)
      .withBearerToken(true)
      .withLanguge(data.currentLang)
      .build()
    return lastValueFrom(this.apiService.fetch(apiRequest).pipe(
      map((response: ApiResponse<any>) => {
        return response.body;
      }),
      catchError((err) => {
        throw err;
      })
    ));
  }

  postContentSearch(data: any, lang: any): Promise<any> {
    let requestBody = {
      name:  data?.name,
      category: data?.category,
      language: lang,
      request: {
        orderBy: {
          "mimetype": "video/x-youtube"
        },
        fields: ["mimetype", "identifier","keywords","name",  "thumbnail", "media", "agegroup", "language", "sourceorg", "url", "domain", "category"]

      }
    }
    const apiRequest = new ApiRequest.Builder()
      .withHost(config.api.BASE_URL)
      .withPath(config.api.CONTENT_SEARCH_API)
      .withType(ApiHttpRequestType.POST)
      .withBody(requestBody)
      .withBearerToken(true)
      .withLanguge(lang)
      .build()
    return lastValueFrom(this.apiService.fetch(apiRequest).pipe(
      map((response: ApiResponse) => {
        return response.body.result;
      }),
      catchError((err) => {
        throw err
      })
    ));
  }
}
