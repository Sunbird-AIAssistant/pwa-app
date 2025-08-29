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
  private readonly LANGUAGE_LABEL_MAP: Record<string, string> = {
    en: 'English',
    hi: 'Hindi',
    kn: 'Kannada',
    as: 'Assamese',
    bn: 'Bengali',
    ur: 'Urdu'
  };

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

  private getLanguageLabelFromCode(languageCode: string, fallbackFilters?: any): string | null {
    try {
      // 1) Prefer explicit map if provided in requirements
      if (this.LANGUAGE_LABEL_MAP[languageCode]) {
        return this.LANGUAGE_LABEL_MAP[languageCode];
      }
      const languages: Array<{ id: string; label: string }>
        = this.configVariables?.languages || [];
      const found = languages.find((l) => l.id === languageCode);
      if (found?.label) {
        return found.label;
      }
      // Fallback: if the provided code is actually a label present in default filters, accept it
      const availableLabels: string[] = fallbackFilters?.language || [];
      if (availableLabels.includes(languageCode)) {
        return languageCode;
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  async postSearchContext(data: any, audio: boolean): Promise<any> {
    let requestBody = {};
    const languageCode = data.currentLang;
    const defaultFilters = { ...(this.configVariables.defaultContentFilter?.[0] || {}) } as any;
    const languageLabel = this.getLanguageLabelFromCode(languageCode, defaultFilters);
    if (languageLabel) {
      defaultFilters.language = [languageLabel];
    }
    // Debug: verify payload language values (safe to keep; remove if noisy)
    try { console.debug('[SearchService] postSearchContext payload language', { languageCode, languageLabel, filtersLanguage: defaultFilters.language }); } catch {}
    if (audio) {
      requestBody = {
        audio: data.text,
        language: languageCode,
        request: {
          orderBy: {
            "mimetype": "video/x-youtube"
          },
          filters: defaultFilters
          // fields: ["mimetype", "identifier","keywords","name",  "thumbnail", "media", "agegroup", "language", "sourceorg", "url", "domain", "category"]

        }
      }
    } else {
      requestBody = {
        name: data.text,
        language: languageCode,
        request: {
          orderBy: {
            "mimetype": "video/x-youtube"
          },
          filters: defaultFilters
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
    const languageCode = lang;
    const defaultFilters = { ...(this.configVariables.defaultContentFilter?.[0] || {}) } as any;
    const languageLabel = this.getLanguageLabelFromCode(languageCode, defaultFilters);
    if (languageLabel) {
      defaultFilters.language = [languageLabel];
    }
    
    // Note: We don't add sourceorg filter here to ensure we get ALL content
    // Instead, we'll sort the results to prioritize Prajayatna content first
    
    // Debug: verify payload language values (safe to keep; remove if noisy)
    try { console.debug('[SearchService] postContentSearch payload language', { languageCode, languageLabel, filtersLanguage: defaultFilters.language, siteName: this.configVariables?.siteName }); } catch {}
    
    let requestBody = {
      name:  data?.name,
      category: data?.category,
      language: languageCode,
      request: {
        orderBy: {
          "mimetype": "video/x-youtube"
        },
        filters: defaultFilters

        // fields: ["mimetype", "identifier","keywords","name",  "thumbnail", "media", "agegroup", "language", "sourceorg", "url", "domain", "category"]

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
        // If siteName is "Prajayatna", prioritize Prajayatna content first
        if (this.configVariables?.siteName === "Prajayatna" && response.body?.result) {
          const results = response.body.result;
          
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
        return response.body.result;
      }),
      catchError((err) => {
        throw err
      })
    ));
  }
}
