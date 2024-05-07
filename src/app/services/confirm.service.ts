import { Injectable } from '@angular/core';
import { catchError, lastValueFrom, map } from 'rxjs';
import { config } from 'configuration/environment.prod';
import { ApiService } from './api/api.service';
import { ApiHttpRequestType, ApiRequest } from './api/model/api.request';
import { ApiResponse } from './api/model/api.response';
import { v4 as uuidv4 } from 'uuid';

@Injectable({
  providedIn: 'root'
})
export class ConfirmService {
  transaction_id: string;
  message_id: string;

  constructor(private apiService: ApiService) {
    this.transaction_id = uuidv4();
    this.message_id = uuidv4();

   }

  async onConfirmContent(data: any) {
    let request = {};
    if (data) {
      request = {
        "context": {
          "domain": "onest:learning-experiences",
          "action": "confirm",
          "version": "1.1.0",
          "bap_id": "13.201.4.186:6002",
          "bap_uri": "http://13.201.4.186:6002/",
          "bpp_id": data.bpp_id,
          "bpp_uri": data.bpp_uri,
          "transaction_id": this.transaction_id,
          "message_id": this.message_id,
          "timestamp": new Date().toISOString()
        },
        "message": {
          "order": {
            "items": [
              {
                "id": data.id
              }
            ],
            "fulfillments": [
              {
                "customer": {
                  "person": {
                    "name": "",
                    "age": ""
                  },
                  "contact": {
                    "phone": "",
                    "email": ""
                  }
                }
              }
            ]
          }
        }
      }
    }
    let body = JSON.stringify(request)
    const apiRequest = new ApiRequest.Builder()
      .withHost(config.api.BASE_URL)
      .withPath(config.api.CONFIRM_API)
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
}
