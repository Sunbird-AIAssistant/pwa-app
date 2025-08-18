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

  private prioritizePrajayatnaFirst(contents: any[]): any[] {
    const normalize = (value: any) => (typeof value === 'string' ? value.trim().toLowerCase() : '');
    const prioritized = contents.filter(item => normalize(item?.sourceorg) === 'Prajayatna');
    const others = contents.filter(item => normalize(item?.sourceorg) !== 'Prajayatna');
    return [...prioritized, ...others];
  }

  private ensurePrajayatnaPresenceInTopN(contents: any[], topN: number = 10, minCount: number = 2): any[] {
    if (!Array.isArray(contents) || contents.length === 0) {
      return contents;
    }
    const normalize = (value: any) => (typeof value === 'string' ? value.trim().toLowerCase() : '');
    const limit = Math.min(topN, contents.length);
    const isPrajayatna = (item: any) => normalize(item?.sourceorg) === 'Prajayatna';

    const copy = contents.slice();
    let currentCount = 0;
    for (let i = 0; i < limit; i++) {
      if (isPrajayatna(copy[i])) currentCount++;
    }
    const needed = Math.max(0, minCount - currentCount);
    if (needed === 0) return copy;

    const candidates: number[] = [];
    for (let i = limit; i < copy.length; i++) {
      if (isPrajayatna(copy[i])) candidates.push(i);
    }
    if (candidates.length === 0) return copy;

    const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

    const moves = Math.min(needed, candidates.length);
    for (let m = 0; m < moves; m++) {
      // Pick a Prajayatna index from remaining candidates
      const pickedIdxInCandidates = getRandomInt(0, candidates.length - 1);
      const fromIndex = candidates.splice(pickedIdxInCandidates, 1)[0];
      const [item] = copy.splice(fromIndex, 1);
      // Insert at a random position in the first window
      const toIndex = getRandomInt(0, limit - 1);
      copy.splice(toIndex, 0, item);
      // Adjust candidate indices after removal if needed
      for (let j = 0; j < candidates.length; j++) {
        if (candidates[j] > fromIndex) candidates[j] -= 1;
      }
    }
    return copy;
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

    const result = Array.from(mergedContent.values());
    return this.prioritizePrajayatnaFirst(result);
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

    const result = Array.from(mergedContent.values());
    return this.prioritizePrajayatnaFirst(result);
  }
}