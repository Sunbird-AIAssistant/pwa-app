import { Injectable } from '@angular/core';
import { capSQLiteSet } from '@capacitor-community/sqlite';
import { Content } from './models/content';
import { ContentEntry } from './db/content.schema';
import { RecentlyViewedContentEntry } from './db/recently.viewed.content.schema';
import { ContentMapper } from './util/content.entry.mapper';
import { RecentlyViewedContentMapper } from './util/recently.viewed.content.mapper';
import { RecentlyViewedContent } from './models/recently.viewed.content';
import { ContentRVCEntry } from './db/content.rvc';
import { ContentRVCMixMapper } from './util/content.rvc.mix.entry.mapper';
import { v4 as uuidv4 } from "uuid";
import { SearchContentMetaData, MimeType } from 'src/app/appConstants';
import { ApiHttpRequestType, ApiRequest } from '../api/model/api.request';
import { ApiService } from '../api/api.service';
import { DbService } from '..';
import { lastValueFrom } from 'rxjs';
import { ApiResponse } from '../api/model/api.response';
import { ContentReactionsEntry } from './db/content.reactions.schema';
@Injectable({
  providedIn: 'root'
})
export class ContentService {
  public results: Array<any> = [];

  constructor(
    private readonly dbService: DbService,
    private readonly apiService: ApiService
  ) { }

  deleteAllContents(): Promise<any> {
    return this.dbService.remove(ContentEntry.deleteQuery(), { 'source': 'djp' });
  }
  saveContents(contentList: Array<Content>): Promise<any> {
    const capSQLiteSet: capSQLiteSet[] = [];
    contentList.map((content) => {
      capSQLiteSet.push({ statement: ContentEntry.insertQuery(), values: ContentMapper.mapContentToValues(content) })
    });
    return this.dbService.executeSet(capSQLiteSet)
  }

  async getRecentlyViewedContent(uid: string): Promise<Array<RecentlyViewedContent>> {
    const query = `SELECT rvc.* ,c.*, cr.content_identifier as reaction_identifier
    FROM ${RecentlyViewedContentEntry.TABLE_NAME} rvc
    LEFT JOIN ${ContentEntry.TABLE_NAME} c ON rvc.content_identifier=c.identifier 
    LEFT JOIN ${ContentReactionsEntry.TABLE_NAME} cr ON rvc.content_identifier = reaction_identifier 
    where rvc.uid='${uid}' ORDER BY rvc.ts DESC`;
    const result: ContentRVCEntry.ContentRVCMixedSchemaMap[] = await this.dbService.executeQuery(query);
    const recentlyViewedContent: Array<RecentlyViewedContent> = []
    result?.map((contentRVC: ContentRVCEntry.ContentRVCMixedSchemaMap) => {
      recentlyViewedContent.push(ContentRVCMixMapper.mapContentRVCtoRecentlyViedContent(contentRVC, uuidv4()))
    })
    return Promise.resolve(recentlyViewedContent)
  }

  async getAllContent(): Promise<Array<SearchContentMetaData>> {
    const query = `SELECT c.*, cr.content_identifier from ${ContentEntry.TABLE_NAME} c LEFT JOIN ${ContentReactionsEntry.TABLE_NAME} cr ON c.identifier = cr.content_identifier WHERE ${ContentEntry.COLUMN_NAME_SOURCE} NOT IN ('local', 'dialcode') ORDER BY ${ContentEntry.COLUMN_NAME_TIME_STAMP}`;
    const contentList: Array<SearchContentMetaData> = []
    return this.dbService.readDbData(query).then((content: Array<any>) => {
      content.map((element) => {
        const metaData = JSON.parse(element['metadata']) as SearchContentMetaData;
        // metaData.isLiked = !!element['content_identifier'];
        element.metaData = metaData;
        contentList.push(element);
      })
      return Promise.resolve(contentList);
    })
  }

  async likeContent(content: Content, uid: string, isLiked: boolean): Promise<void> {
    if (isLiked) {
      return this.dbService.readDbData(ContentReactionsEntry.readQuery(), { 'content_identifier': content.metaData.identifier }).then((result) => {
        const query = (result) ? ContentReactionsEntry.updateQuery() : ContentReactionsEntry.insertQuery();
        const whereCondition = (result) ? { 'content_identifier': content.metaData.identifier, 'uid': uid } : undefined
        return this.dbService.save(query, ContentMapper.mapContentReactionEntry(content.metaData.identifier, 'guest'), whereCondition)
      })
    } else {
      return this.dbService.remove(ContentReactionsEntry.deleteQuery(), { 'content_identifier': content.metaData.identifier, 'uid': uid })
    }
  }

  async markContentAsViewed(content: Content): Promise<void> {
    const contentResult = await this.dbService.readDbData(ContentEntry.readQuery(), { 'identifier': content.metaData.identifier });
    if (!contentResult) {
      await this.dbService.executeSet([{ statement: ContentEntry.insertQuery(), values: ContentMapper.mapContentToValues(content) }]);
    }
    return this.dbService.readDbData(RecentlyViewedContentEntry.readQuery(), { 'content_identifier': content.metaData.identifier }).then((result) => {
      const query = (result) ? RecentlyViewedContentEntry.updateQuery() : RecentlyViewedContentEntry.insertQuery();
      const whereCondition = (result) ? { 'identifier': content.metaData.identifier } : undefined
      return this.dbService.save(query, RecentlyViewedContentMapper.mapContentToRecentlyViewedContentEntry(content, 'guest', uuidv4()), whereCondition)
    })

  }

  public searchContentInDiksha(query: string) {
    let body = {
      "request": {
        "filters": {
          "channel": "",
          "primaryCategory": [
            "Collection",
            "Resource",
            "Content Playlist",
            "Course",
            "Course Assessment",
            "Digital Textbook",
            "eTextbook",
            "Explanation Content",
            "Learning Resource",
            "Practice Question Set",
            "Teacher Resource",
            "Textbook Unit",
            "LessonPlan",
            "FocusSpot",
            "Learning Outcome Definition",
            "Curiosity Questions",
            "MarkingSchemeRubric",
            "ExplanationResource",
            "ExperientialResource",
            "Practice Resource",
            "TVLesson",
            "Question paper"
          ],
          "visibility": [
            "Default",
            "Parent"
          ]
        },
        "limit": 100,
        "query": query,
        "sort_by": {
          "lastPublishedOn": "desc"
        },
        "fields": [
          "name",
          "appIcon",
          "mimeType",
          "gradeLevel",
          "identifier",
          "medium",
          "pkgVersion",
          "board",
          "subject",
          "resourceType",
          "primaryCategory",
          "contentType",
          "channel",
          "organisation",
          "trackable"
        ],
        "softConstraints": {
          "badgeAssertions": 98,
          "channel": 100
        },
        "mode": "soft",
        "facets": [
          "se_boards",
          "se_gradeLevels",
          "se_subjects",
          "se_mediums",
          "primaryCategory"
        ],
        "offset": 0
      }
    }
    const apiRequest = new ApiRequest.Builder()
      .withHost('https://diksha.gov.in/')
      .withPath('api/content/v1/search')
      .withType(ApiHttpRequestType.POST)
      .withBody(body)
      .build()
    return lastValueFrom(this.apiService.fetch(apiRequest));
  }

  public getCollectionHierarchy(identifier: string) {
    const apiRequest = new ApiRequest.Builder()
      .withHost('https://diksha.gov.in/action/content/v3/hierarchy/')
      .withPath(`${identifier}`)
      .withType(ApiHttpRequestType.GET)
      .build()
    return lastValueFrom(this.apiService.fetch(apiRequest));
  }

  public getContents(query: string): Promise<Array<Content>> {
    return this.searchContentInDiksha(query)
      .then((response: ApiResponse) => {
        if (response.body.result?.content?.length) {
          return this.getCollectionHierarchy(
            response.body.result.content[0].identifier
          );
        } else {
          return '' as any;
        }
      })
      .then((hierarchyResponse: ApiResponse) => {
        this.results = [];
        const contentList: Array<Content> = []
        if (hierarchyResponse) {
          this.showAllChild(hierarchyResponse.body.result.content)
          this.results.map((content: any) => {
            contentList.push({
              source: 'dialcode',
              sourceType: 'Diksha',
              metaData: {
                identifier: content?.identifier,
                name: content?.name,
                thumbnail: content?.posterImage,
                description: content?.name,
                mimetype: content?.mimetype || content?.mimeType,
                url: content?.streamingUrl,
                focus: content?.focus,
                keyword: content?.keyword,
                domain: content?.domain,
                curriculargoal: content?.curriculargoal,
                competencies: content?.competencies,
                language: content?.language,
                category: content?.category,
                audience: content?.audience,
                status: content?.status,
                createdon: content?.createdOn,
                lastupdatedon: content?.lastupdatedon || content?.lastUpdatedOn,
                artifactUrl: content?.artifactUrl
              }
            })
          })
        }
        return contentList;
      })
      .catch((error) => {
        console.error(error);
        throw error;
      });
  }

  private showAllChild(content: any) {
    let supportedMimeType = MimeType.VIDEOS;
    if (!(supportedMimeType.indexOf(MimeType.PDF) > -1)) {
      supportedMimeType.push(MimeType.PDF)
    }
    if (content.children === undefined || !content.children.length) {
      if (supportedMimeType.indexOf(content.mimeType) > -1) {
        this.results.push(content);
      }
      return;
    }
    content.children.forEach((child: any) => {
      this.showAllChild(child);
    });
    console.log('Results', this.results);
  }

  public readDikshaContents(identifier: string) {
    const apiRequest = new ApiRequest.Builder()
      .withHost('https://diksha.gov.in/api/content/v1/read/')
      .withPath(`${identifier}`)
      .withType(ApiHttpRequestType.GET)
      .build()
    return lastValueFrom(this.apiService.fetch(apiRequest));
  }
}

