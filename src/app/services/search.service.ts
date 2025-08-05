import { Injectable } from '@angular/core';
import { catchError, lastValueFrom, map } from 'rxjs';
import { config } from 'configuration/environment.prod';
import { ApiService } from './api/api.service';
import { ApiHttpRequestType, ApiRequest } from './api/model/api.request';
import { ApiResponse } from './api/model/api.response';
import { ConfigVariables } from "../config";

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  configVariables: any;

  constructor(
    private apiService: ApiService
  ) { 
    ConfigVariables.then(config => {
      this.configVariables = config;
      // Use the config data as needed
    }).catch(error => {
      console.error('Failed to load configuration:', error);
    });
  }

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
          filters: this.configVariables.defaultContentFilter[0]
          // fields: ["mimetype", "identifier","keywords","name",  "thumbnail", "media", "agegroup", "language", "sourceorg", "url", "domain", "category"]

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
          filters: this.configVariables.defaultContentFilter[0]
          // fields: ["mimetype", "identifier","keywords","name",  "thumbnail", "media", "agegroup", "language", "sourceorg", "url", "domain", "category"]
        }
      }
    }
    let body = JSON.stringify(requestBody)
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
    // Map the language code to the language name used in the API
    const languageMap: { [key: string]: string } = {
      'kn': 'Kannada',
      'hi': 'Hindi'
    };

    let requestBody = {
      name: data?.name,
      category: data?.category,
      language: lang,
      request: {
        orderBy: {
          "mimetype": "video/x-youtube"
        },
        filters: {
          ...this.configVariables.defaultContentFilter[0],
          language: [languageMap[lang]] // Only include the selected language
        }
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
