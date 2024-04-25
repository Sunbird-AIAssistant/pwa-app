import { Injectable } from "@angular/core";
import { CapacitorHttp, HttpResponse } from "@capacitor/core";
import { Observable, Subject } from "rxjs";
import { HttpClient } from "./http.client";
import { ApiHttpRequestType, ApiRequest } from "./model/api.request";
import { ApiResponse } from "./model/api.response";
import searchBody from '../../../assets/mock/onSearch.json';

// Define ContentMetaData interface outside the service class
interface ContentMetaData {
    identifier: string;
    name: string;
    thumbnail: string;
    description: string;
    mimetype: string;
    url: string;
    domain: string;
    curriculargoal: null;
    competencies: null;
    language: string;
    category: string;
    audience: Array<any>;
    focus: string;
    keyword: any;
    status: string;
    createdon: string;
    lastupdatedon: string;
    media?: Array<any>;
    isLiked?: boolean;
}

interface SearchContentMetaData {
    id: string;
    unique_id: string;
    item_id: string;
    provider_id: string;
    provider_name: null;
    bpp_id: string;
    bpp_uri: string;
    title: string;
    description: string;
    image_url: string;
    code: string;
    competency: string;
    contentType: string;
    domain: string;
    goal: string;
    language: string;
    link: string;
    sourceOrganisation: string;
    themes: string;
    minAge: string;
    maxAge: string;
    author: string;
    learningOutcomes: string;
    category: string;
    persona: string;
    license: null;
    conditions: string;
    urlType: string;
    mimetype: string;
}

@Injectable({
    providedIn: 'root'
})
export class HttpCapacitorAdapter implements HttpClient {
    // Move mappedContent inside the methods where it's used
    private http = CapacitorHttp;

    constructor() {}

    get(baseUrl: string, path: string, headers: any, parameters: { [key: string]: string }): Observable<ApiResponse> {
        return this.invokeRequest(ApiHttpRequestType.GET, baseUrl + path, parameters, headers);
    }

    patch(baseUrl: string, path: string, headers: any, body: {}): Observable<ApiResponse> {
        return this.invokeRequest(ApiHttpRequestType.PATCH, baseUrl + path, body, headers);
    }

    post(baseUrl: string, path: string, headers: any, body: {}): Observable<ApiResponse> {
        return this.invokeRequest(ApiHttpRequestType.POST, baseUrl + path, body, headers);
    }

    private invokeRequest(type: ApiHttpRequestType, url: string, parametersOrData: any,
                          headers: { [key: string]: string }): Observable<ApiResponse> {
        const observable = new Subject<ApiResponse>();

        const requestOptions: any = {
            url: url,
            method: type.toLowerCase(),
            headers: headers,
        };

        if (
          type === ApiHttpRequestType.POST ||
          type === ApiHttpRequestType.PATCH
        ) {
            requestOptions['data'] = parametersOrData;
        } else if (
          type === ApiHttpRequestType.GET ||
          type === ApiHttpRequestType.DELETE
        ) {
            requestOptions['params']  = parametersOrData;
        }
        console.log('requestOptions', requestOptions);
        
        this.http.request(requestOptions).then((response: HttpResponse) => {
            response.data = response.data.data.kahani_cache;

            // Move mappedContent inside the response handling block
            const mappedContent: SearchContentMetaData[] = [];

            response.data.forEach((item : any) => {

                // Traverse through the items array of each provider
                const content: SearchContentMetaData = {
                    id: item.id,
                    unique_id: item.unique_id,
                    item_id: item.item_id,
                    provider_id: item.provider_id,
                    provider_name: item.provider_name,
                    bpp_id: item.bpp_id,
                    bpp_uri: item.bpp_uri,
                    title: item.title,
                    description: item.description,
                    image_url: item.image_url,
                    code: item.code,
                    competency: item.competency,
                    contentType: item.contentType,
                    domain: item.domain,
                    goal: item.goal,
                    language: item.language,
                    link: item.link,
                    sourceOrganisation: item.sourceOrganisation,
                    themes: item.themes,
                    minAge: item.minAge,
                    maxAge: item.maxAge,
                    author: item.author,
                    learningOutcomes: item.learningOutcomes,
                    category: item.category,
                    persona: item.persona,
                    license: item.license,
                    conditions: item.conditions,
                    urlType: item.urlType,
                    mimetype: 'video/x-youtube'
                };
                // Push the mapped object into the array
                mappedContent.push(content);
            });

            // response.data.forEach((provider : any) => {
            //     // Traverse through the items array of each provider
            //     provider.items.forEach((item: any) => {
            //         console.log("1");
            //         // Map item properties to ContentMetaData interface format
            //         const content: SearchContentMetaData = {
            //             bpp_id: item.bpp_id,
            //             bpp_uri: item.bpp_uri,
            //             provider_id: item.provider_id,
            //             provider_name: item.provider_name,
            //             unique_id: item.unique_id,
            //             id: item.id,
            //             item_id: item.item_id,
            //             title: item.title,
            //             image_url: item?.image_url.length ? (item?.descriptor?.images[0].url.split("/"))[0] : '', // You can populate this based on item properties
            //             description: item.description.long_desc || item.description.short_desc || ''
            //         };
            //         // Push the mapped object into the array
            //         mappedContent.push(content);
            //         console.log(mappedContent);
            //     });
            // });
            
            if(mappedContent){
            const apiResponse: ApiResponse = {
                body: {
                    "result" : mappedContent},// response.data,
                responseCode : 200,//response.status,
                errorMesg : '',
                headers : response.headers,
                requestHeaders: requestOptions.headers
            }
            console.log('apiResponse', apiResponse);
            observable.next(apiResponse);
            observable.complete();
        }
        }).catch((response) => {
            console.error('error', response);
            const apiResponse: ApiResponse = {
                body: {},
                responseCode : response.status,
                errorMesg : 'SERVER_ERROR',
                headers : response.headers,
                requestHeaders: requestOptions.headers
            }
            try {
                try {
                    response.body = JSON.parse(response.error!);
                } catch (e) {
                    apiResponse.body = response.error;
                    if (response.status <= 0) {
                      throw e;
                    }
                }
                if (response.responseCode >= 400 && response.responseCode <= 499) {
                    observable.error(new Error());
                } else {
                    observable.error(new Error());
                }
            } catch (e) {
                observable.error(new Error());
                observable.complete();
            }
        })

        return observable;
    }
}
