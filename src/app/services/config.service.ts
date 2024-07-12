import { Injectable } from '@angular/core';
import { Config } from './config/models/config';
import { config } from 'configuration/environment.prod';
import { ApiService } from './api/api.service';
import { ApiHttpRequestType, ApiRequest } from './api/model/api.request';
import { catchError, lastValueFrom, map } from 'rxjs';
import { ConfigVariables } from "../config";

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  configVariables : any;

  constructor(private apiService: ApiService) {
    ConfigVariables.then(config => {
      console.log('Configuration:', config);
      this.configVariables = config;
      // Use the config data as needed
    }).catch(error => {
      console.error('Failed to load configuration:', error);
    });
   }

  async getConfigMeta(): Promise<Config> {
    const apiRequest = new ApiRequest.Builder()
      .withHost(config.api.BASE_URL)
      .withPath(config.api.CONFIG)
      .withType(ApiHttpRequestType.GET)
      .withBearerToken(true)
      .build();
    return lastValueFrom(this.apiService.fetch(apiRequest)).then((res: any) => {
      console.log("res in config file ", res?.body.result);
      if (res?.body.result) {
        return res?.body.result;
      }
    }).catch((err: any) => {
      console.log('err ', err);
    })
  }

  async getAllContent(req: any, lang: any): Promise<any> {
    let requestBody = {
      language: lang,
      request: {
        orderBy: {
          "mimetype": "video/x-youtube"
        },
        filters: 
          this.configVariables.defaultContentFilter[0]
        ,
        // fields: ["mimetype", "identifier","keywords","name",  "thumbnail", "media", "agegroup", "language", "sourceorg", "url", "domain", "category"]

      }
    }
    const apiRequest = new ApiRequest.Builder()
      .withHost(config.api.BASE_URL)
      .withPath(config.api.PAGE_SEARCH_API)
      .withType(ApiHttpRequestType.POST)
      .withBearerToken(true)
      .withBody(requestBody)
      .withLanguge(lang)
      .build()
    return lastValueFrom(this.apiService.fetch(apiRequest).pipe(
      map((apiResponse) => apiResponse.body.result),
      catchError((err) => {
        throw err;
      })
    ));
  }
}