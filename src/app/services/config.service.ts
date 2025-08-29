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
      if (res?.body.result) {
        return res?.body.result;
      }
    }).catch((err: any) => {
      console.log('err ', err);
    })
  }

  async getAllContent(req: any, lang: any): Promise<any> {
    let defaultFilters = { ...(this.configVariables.defaultContentFilter?.[0] || {}) } as any;
    
    // Note: We don't add sourceorg filter here to ensure we get ALL content
    // Instead, we'll sort the results to prioritize Prajayatna content first
    
    let requestBody = {
      language: lang,
      request: {
        orderBy: {
          "mimetype": "video/x-youtube"
        },
        filters: defaultFilters,
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
      map((apiResponse) => {
        // If siteName is "Prajayatna", prioritize Prajayatna content first
        if (this.configVariables?.siteName === "Prajayatna" && apiResponse.body?.result) {
          const results = apiResponse.body.result;
          
          console.log('[ConfigService] Original results count:', results.length);
          
          // Separate Prajayatna content from other content using rest operator
          const prajayatnaContent = results.filter((item: any) => 
            item.sourceorg === "Prajayatna" || 
            item.sourceOrganisation === "Prajayatna" ||
            item.source_org === "Prajayatna" ||
            item.organisation === "Prajayatna" ||
            item.org === "Prajayatna"
          );
          
          const otherContent = results.filter((item: any) => 
            !(item.sourceorg === "Prajayatna" || 
              item.sourceOrganisation === "Prajayatna" ||
              item.source_org === "Prajayatna" ||
              item.organisation === "Prajayatna" ||
              item.org === "Prajayatna")
          );
          
          // Combine: Prajayatna content first, then other content
          const reorderedResults = [...prajayatnaContent, ...otherContent];
          
          return reorderedResults;
        }
        return apiResponse.body.result;
      }),
      catchError((err) => {
        throw err;
      })
    ));
  }
}