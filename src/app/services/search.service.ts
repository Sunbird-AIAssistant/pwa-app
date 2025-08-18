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
    let requestBody: any = {};
    let initialFilteredContent: any[] = [];
    let allUnfilteredContent: any[] = [];
    let lang = data.currentLang;

    // Construct the base request body
    if (audio) {
      requestBody = {
        audio: data.text,
        language: data.currentLang,
        request: {
          orderBy: {
            "mimetype": "video/x-youtube"
          },
          filters: {
            ...this.configVariables.defaultContentFilter[0]
          }
        }
      }
    } else {
      requestBody = {
        name: data.text,
        language: lang,
        request: {
          orderBy: {
            "mimetype": "video/x-youtube"
          },
          filters: {
            ...this.configVariables.defaultContentFilter[0]
          }
        }
      }
    }

    // First call: All data for the search context, filtered by sitename
    if (localStorage.getItem("sitename")) {
      const filteredReq = { ...requestBody, request: { ...requestBody.request, filters: { ...requestBody.request.filters, sourceorg: localStorage.getItem("sitename") } } };
      initialFilteredContent = await lastValueFrom(this.apiService.fetch(new ApiRequest.Builder()
        .withHost(config.api.BASE_URL)
        .withPath(config.api.CONTENT_SEARCH_API)
        .withType(ApiHttpRequestType.POST)
        .withBody(JSON.stringify(filteredReq))
        .withBearerToken(true)
        .withLanguge(lang)
        .build()).pipe(map((response: ApiResponse<any>) => response.body.result)));
    }

    // Second call: All data for the search context, without sourceorg filter
    const unfilteredReq = { ...requestBody, request: { ...requestBody.request, filters: { ...requestBody.request.filters } } };
    delete unfilteredReq.request.filters.sourceorg; // Ensure no sourceorg filter for this call

    allUnfilteredContent = await lastValueFrom(this.apiService.fetch(new ApiRequest.Builder()
      .withHost(config.api.BASE_URL)
      .withPath(config.api.CONTENT_SEARCH_API)
      .withType(ApiHttpRequestType.POST)
      .withBody(JSON.stringify(unfilteredReq))
      .withBearerToken(true)
      .withLanguge(lang)
      .build()).pipe(map((response: ApiResponse<any>) => response.body.result)));

    const mergedContent = new Map();

    // Add initial filtered content (if any), prioritizing it
    initialFilteredContent.forEach((content: any) => {
      // Items returned by the API are flat objects; use `identifier` directly
      mergedContent.set(content.identifier, content);
    });

    // Add all unfiltered content, avoiding duplicates
    allUnfilteredContent.forEach((content: any) => {
      if (!mergedContent.has(content.identifier)) {
        mergedContent.set(content.identifier, content);
      }
    });

    return Array.from(mergedContent.values());
  }

  async postContentSearch(data: any, lang: any, applySourceOrgFilter: boolean = false): Promise<any> {
    let filteredContent: any[] = [];
    let unfilteredContent: any[] = [];
    let currentSitename = localStorage.getItem("sitename");
    const languageMap: { [key: string]: string } = {
      'kn': 'Kannada',
      'hi': 'Hindi'
    };
    const selectedLanguageName = languageMap[lang] || lang;


    // First API call: Filtered by localStorage.sitename
    if (currentSitename) {
      let filters: any = {
        ...this.configVariables.defaultContentFilter[0],
        sourceorg: currentSitename
      };
    
      if (currentSitename === "Prajayatna") {
        filters.language = [selectedLanguageName];
      }
      let filteredRequestBody: any = {
        name:  data?.name,
        category: data?.category,
        language: lang,
        request: {
          orderBy: {
            "mimetype": "video/x-youtube"
          },
          filters

        }
      };
      filteredContent = await lastValueFrom(this.apiService.fetch(new ApiRequest.Builder()
        .withHost(config.api.BASE_URL)
        .withPath(config.api.CONTENT_SEARCH_API)
        .withType(ApiHttpRequestType.POST)
        .withBody(JSON.stringify(filteredRequestBody))
        .withBearerToken(true)
        .withLanguge(lang)
        .build()).pipe(map((response: ApiResponse<any>) => response.body.result)));
    }

    // Second API call: Unfiltered by sourceorg
    let filters: any = {
      ...this.configVariables.defaultContentFilter[0],
    };
    if (currentSitename === "Prajayatna") {
      filters.language = [selectedLanguageName];
    }
    let unfilteredRequestBody: any = {
      name:  data?.name,
      category: data?.category,
      language: lang,
      request: {
        orderBy: {
          "mimetype": "video/x-youtube"
        },
        filters
      }
    };
    unfilteredContent = await lastValueFrom(this.apiService.fetch(new ApiRequest.Builder()
      .withHost(config.api.BASE_URL)
      .withPath(config.api.CONTENT_SEARCH_API)
      .withType(ApiHttpRequestType.POST)
      .withBody(JSON.stringify(unfilteredRequestBody))
      .withBearerToken(true)
      .withLanguge(lang)
      .build()).pipe(map((response: ApiResponse<any>) => response.body.result)));

    // Merge results
    const mergedContent = new Map<string, any>();

    filteredContent.forEach((content: any) => {
      // Items are flat objects; use `identifier`
      mergedContent.set(content.identifier, content);
    });

    unfilteredContent.forEach((content: any) => {
      if (!mergedContent.has(content.identifier)) {
        mergedContent.set(content.identifier, content);
      }
    });

    return Array.from(mergedContent.values());
  }
}