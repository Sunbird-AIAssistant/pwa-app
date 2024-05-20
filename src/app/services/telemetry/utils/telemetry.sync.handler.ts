
import { EMPTY, from, Observable, of } from 'rxjs';
import { catchError, expand, map, mapTo, mergeMap, reduce } from 'rxjs/operators';
import { DbService } from '../..';
import * as dayjs from 'dayjs';
import { TelemetryConfigEntry } from '../../db/telemetrySchema';
import { TelemetryProcessedEntry } from '../db/telemetry.processed.schema';
import { TelemetrySyncStat } from '../models/telemetry.sync.stat';
import { v4 as uuidv4 } from "uuid";
import { TelemetrySyncPreprocessor } from '../models/telemetry-sync-preprocessor';
import { TelemetryEntriesToStringPreprocessor } from './telemetry.string.preprocessor';
import { config } from 'configuration/environment.prod';
import { ApiService } from '../../api/api.service';
import { ApiHttpRequestType, ApiRequest } from '../../api/model/api.request';

interface ProcessedEventsMeta {
    processedEvents?: string;
    processedEventsSize: number;
    messageId?: string;
}

export class TelemetrySyncHandler {
    private readonly preprocessors: TelemetrySyncPreprocessor[] = [];

    constructor(
        private dbService: DbService,
        private apiService: ApiService
    ) {
        this.preprocessors = [new TelemetryEntriesToStringPreprocessor()]
    }


    handle(devicecId: string): Observable<any> {
        return this.hasTelemetryThresholdCrossed().pipe(
            mergeMap((hasTelemetryThresholdCrossed: boolean) => {
                if (hasTelemetryThresholdCrossed) {
                    return this.processEventsBatch(devicecId).pipe(
                        expand((processedEventsCount: number) =>
                            processedEventsCount ? this.processEventsBatch(devicecId) : EMPTY
                        ),
                        reduce(() => undefined, undefined),
                        mergeMap(() => this.handleProcessedEventsBatch()),
                        expand((syncStat: TelemetrySyncStat) =>
                            syncStat.syncedEventCount ? this.handleProcessedEventsBatch() : EMPTY
                        ),
                        reduce<TelemetrySyncStat, TelemetrySyncStat>((acc: TelemetrySyncStat, currentStat: TelemetrySyncStat) => {
                            return ({
                                syncedEventCount: acc.syncedEventCount + currentStat.syncedEventCount,
                                syncTime: Date.now(),
                                syncedFileSize: acc.syncedFileSize + currentStat.syncedFileSize,
                                error: (currentStat.error ? currentStat.error : acc.error)
                            });
                        }, {
                            syncedEventCount: 0,
                            syncTime: Date.now(),
                            syncedFileSize: 0
                        })
                    );
                }

                return of({
                    syncedEventCount: 0,
                    syncTime: Date.now(),
                    syncedFileSize: 0
                });
            })
        );
    }

    public processEventsBatch(deviceId: string): Observable<number> {
        return this.fetchEvents().pipe(
            mergeMap((events) => {
                if (events) {
                    return this.processEvents(events, deviceId).pipe(
                        mergeMap((processedEventsMeta) =>
                            this.persistProcessedEvents(processedEventsMeta, processedEventsMeta.processedEventsSize).pipe(
                                mergeMap(() => this.deleteEvents(events)),
                                mapTo(events.length)
                            )
                        )
                    )
                } else {
                    return of(0)
                }

            })
        );
    }


    private hasTelemetryThresholdCrossed(): Observable<boolean> {
        return from(this.dbService.executeQuery(`
            SELECT count(*) as COUNT FROM ${TelemetryConfigEntry.TABLE_NAME}`
        )).pipe(
            map((result) => {
                return true;
                // return (result && result[0] && (result[0]['COUNT'] >= 3)) 
            })
        );
    }

    private fetchEvents(): Observable<TelemetryConfigEntry.SchemaMap[]> {
        return from(this.dbService.executeQuery(`
            SELECT * FROM ${TelemetryConfigEntry.TABLE_NAME}
            WHERE ${TelemetryConfigEntry.COLUMN_PRIORITY} = (SELECT MIN (${TelemetryConfigEntry.COLUMN_PRIORITY})
            FROM ${TelemetryConfigEntry.TABLE_NAME})
            ORDER BY ${TelemetryConfigEntry.COLUMN_TIMESTAMP}
            LIMIT 200`
        ));
    }

    private processEvents(events: TelemetryConfigEntry.SchemaMap[], deviceId: string): Observable<ProcessedEventsMeta> {
        if (!events) {
            return of({
                processedEventsSize: 0
            });
        }

        const messageId = uuidv4();
        return of({
            processedEvents: this.preprocessors.reduce<any>((acc, current) => {
                return current.process(acc);
            }, {
                id: 'ekstep.telemetry',
                ver: '1.0',
                ts: dayjs().format('YYYY-MM-DDTHH:mm:ss[Z]'),
                events: events.map((e) => JSON.parse(e[TelemetryConfigEntry.COLUMN_EVENT])),
                params: {
                    did: deviceId,
                    msgid: messageId,
                    key: '',
                    requesterId: ''
                }
            }),
            processedEventsSize: events.length,
            messageId
        });
    }

    private persistProcessedEvents({ processedEvents, messageId }: ProcessedEventsMeta, eventsCount: number): Observable<undefined> {
        if (!processedEvents) {
            return of(undefined);
        }

        return from(this.dbService.save(TelemetryProcessedEntry.insertQuery(), {
            [TelemetryProcessedEntry.COLUMN_NAME_MSG_ID]: messageId,
            [TelemetryProcessedEntry.COLUMN_NAME_NUMBER_OF_EVENTS]: eventsCount,
            [TelemetryProcessedEntry.COLUMN_NAME_PRIORITY]: 1,
            [TelemetryProcessedEntry.COLUMN_NAME_DATA]: processedEvents
        })).pipe(
            mapTo(undefined)
        );
    }

    private deleteEvents(events: TelemetryConfigEntry.SchemaMap[]): Observable<undefined> {
        if (!events.length) {
            return of(undefined);
        }

        return from(this.dbService.executeQuery(`
            DELETE FROM ${TelemetryConfigEntry.TABLE_NAME}
            WHERE ${TelemetryConfigEntry._ID} IN (${events.map((event) => event[TelemetryConfigEntry._ID as keyof TelemetryConfigEntry.SchemaMap]).join(',')})
        `));
    }

    private handleProcessedEventsBatch(ignoreAutoSyncMode?: boolean): Observable<TelemetrySyncStat> {
        return this.fetchProcessedEventsBatch().pipe(
            mergeMap(processedEventsBatchEntry => {
                return this.syncProcessedEvent(processedEventsBatchEntry).pipe(
                    mergeMap((syncStat?: TelemetrySyncStat | undefined) =>
                        this.deleteProcessedEvent(processedEventsBatchEntry).pipe(
                            mapTo(syncStat || {
                                syncedEventCount: 0,
                                syncTime: Date.now(),
                                syncedFileSize: 0
                            })
                        )
                    )
                );
            })
        ).pipe(


        );
    }

    private fetchProcessedEventsBatch(): Observable<TelemetryProcessedEntry.SchemaMap | undefined> {
        return from(this.dbService.executeQuery(`SELECT * FROM ${TelemetryProcessedEntry.TABLE_NAME} LIMIT 1`)).pipe(
            map((r: TelemetryProcessedEntry.SchemaMap[]) => r && r[0])
        );
    }

    private syncProcessedEvent(processedEventsBatchEntry?: TelemetryProcessedEntry.SchemaMap): Observable<TelemetrySyncStat | undefined> {
        if (!processedEventsBatchEntry) {
            return of(undefined);
        }
        const apiRequest = new ApiRequest.Builder()
            .withHost(config.api.TELEMETRY_BASE_URL)
            .withPath(config.api.TELEMETRY_SYNC)
            .withType(ApiHttpRequestType.POST)
            .withBearerToken(true)
            .withBody(JSON.parse(processedEventsBatchEntry[TelemetryProcessedEntry.COLUMN_NAME_DATA]))
            .build()
        return this.apiService.fetch(apiRequest).pipe(
            map(() => ({
                syncedEventCount: processedEventsBatchEntry[TelemetryProcessedEntry.COLUMN_NAME_NUMBER_OF_EVENTS],
                syncTime: Date.now(),
                syncedFileSize: 0
            })),
            catchError((e) => {
                return of({
                    syncedEventCount: 0,
                    syncTime: Date.now(),
                    syncedFileSize: 0,
                    error: e
                });
            })
        );
        // return of(undefined);
        // const gzippedCharData = processedEventsBatchEntry[TelemetryProcessedEntry.COLUMN_NAME_DATA].split('').map((c) => {
        //     return c.charCodeAt(0);
        // });
        // const body = new Uint8Array(gzippedCharData);

        // // const body = JSON.parse(pako.ungzip(processedEventsBatchEntry[TelemetryProcessedEntry.COLUMN_NAME_DATA], {to: 'string'}));

        // const apiRequest: Request = new Request.Builder()
        //     .withHost(this.telemetryConfig.host!)
        //     .withType(HttpRequestType.POST)
        //     .withPath(this.telemetryConfig.apiPath + TelemetrySyncHandler.TELEMETRY_ENDPOINT)
        //     .withBody(body)
        //     .withApiToken(true)
        //     .build();

        // return this.apiService!.fetch(apiRequest).pipe(
        //     tap(async (res) => {
        //         const lastSyncDeviceRegisterIsSuccessful =
        //             await this.keyValueStore!.getValue(TelemetrySyncHandler.LAST_SYNCED_DEVICE_REGISTER_IS_SUCCESSFUL_KEY).toPromise();

        //         if (lastSyncDeviceRegisterIsSuccessful === 'false') {
        //             const serverTime = new Date(res.body.ets).getTime();
        //             const now = Date.now();
        //             const currentOffset = serverTime - now;
        //             const allowedOffset =
        //                 Math.abs(currentOffset) > this.telemetryConfig.telemetryLogMinAllowedOffset ? currentOffset : 0;
        //             if (allowedOffset) {
        //                 await this.keyValueStore!
        //                     .setValue(TelemetrySyncHandler.TELEMETRY_LOG_MIN_ALLOWED_OFFSET_KEY, allowedOffset + '').toPromise();
        //             }
        //         }
        //     }),
        //     map(() => ({
        //         syncedEventCount: processedEventsBatchEntry[TelemetryProcessedEntry.COLUMN_NAME_NUMBER_OF_EVENTS],
        //         syncTime: Date.now(),
        //         syncedFileSize: new TextEncoder().encode(processedEventsBatchEntry[TelemetryProcessedEntry.COLUMN_NAME_DATA]).length
        //     })),
        //     catchError((e) => {
        //         if (e instanceof HttpClientError && e.response.responseCode === ResponseCode.HTTP_BAD_REQUEST) {
        //             return of({
        //                 syncedEventCount: 0,
        //                 syncTime: Date.now(),
        //                 syncedFileSize: 0,
        //                 error: e
        //             });
        //         }

        //         throw e;
        //     })
        // );
    }

    private deleteProcessedEvent(processedEventsBatchEntry?: TelemetryProcessedEntry.SchemaMap): Observable<undefined> {
        if (!processedEventsBatchEntry) {
            return of(undefined);
        }
        return from(this.dbService.executeQuery(`DELETE FROM ${TelemetryProcessedEntry.TABLE_NAME} WHERE ${TelemetryProcessedEntry._ID}='${processedEventsBatchEntry[TelemetryProcessedEntry._ID]}'`));

    }
}