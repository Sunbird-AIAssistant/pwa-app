import { Injectable } from '@angular/core';
import { DbService } from '../db/db.service';
import { StorageService } from '../storage.service';
import { UtilService } from '../util.service';
import { TelemetryConfigEntry } from '../db/telemetrySchema';
import { defer, from, mergeMap, Observable, of, zip } from 'rxjs';
import { Device } from '@capacitor/device';
import { TelemetrySyncHandler } from './utils/telemetry.sync.handler';
import { TelemetryEndRequest, TelemetryImpressionRequest, TelemetryInteractRequest, TelemetryStartRequest, TelemetySearchRequest } from './models/telemetry.request';
import { DJPTelemetry } from './models/telemetry';
import { TelemetryDecorator } from './models/telemetry.decorator';
import { v4 as uuidv4 } from "uuid";
import { ApiService } from '../api/api.service';

declare const window: any;

@Injectable({
    providedIn: 'root'
})
export class TelemetryService {
    deviceId: string = '';
    constructor(
        private dbService: DbService,
        private storageService: StorageService,
        private utilService: UtilService,
        private apiService: ApiService,
        private decorator: TelemetryDecorator
    ) {
        Device.getId().then(response => {
            this.deviceId = response.identifier
            return this.deviceId
        })
    }

    start({
        type, deviceSpecification, loc, mode, duration, pageId, env,
        objId, objType, objVer, rollup, correlationData
    }: TelemetryStartRequest): Observable<boolean> {
        const start = new DJPTelemetry.Start(type, deviceSpecification, loc, mode, duration, pageId, env, objId,
            objType, objVer, rollup, correlationData);
        return this.decorateAndPersist(start);
    }
    end({
        type, mode, duration, pageId, summaryList, env,
        objId, objType, objVer, rollup, correlationData
    }: TelemetryEndRequest): Observable<boolean> {
        const end = new DJPTelemetry.End(type, mode, duration, pageId, summaryList, env, objId,
            objType, objVer, rollup, correlationData);
        return this.decorateAndPersist(end);
    }

    interact({
        type, subType, id, pageId, pos, env, rollup,
        valueMap, correlationData, objId, objType, objVer
    }: TelemetryInteractRequest): Observable<boolean> {
        const interact = new DJPTelemetry.Interact(type!, subType!, id, pageId, pos, valueMap, env!, objId,
            objType, objVer, rollup, correlationData);
        return this.decorateAndPersist(interact);
    }

    impression({
        type, subType, pageId, env, objId,
        objType, objVer, rollup, correlationData
    }: TelemetryImpressionRequest): Observable<boolean> {
        const impression = new DJPTelemetry.Impression(type, subType, pageId, [], env, objId,
            objType, objVer, rollup!, correlationData);
        return this.decorateAndPersist(impression);
    }

    search({
        type, query, filters, sort, correlationid, size, env, correlationData
    }: TelemetySearchRequest): Observable<boolean> {
        const interact = new DJPTelemetry.Search(type!, query!,
            filters, sort, env, correlationid, size, correlationData);
        return this.decorateAndPersist(interact);
    }

    private decorateAndPersist(telemetry: DJPTelemetry.Telemetry): Observable<any> {
        let channelName: string = '';
        const subDomain = localStorage.getItem('subDomain');

        channelName = subDomain ?? (new URL(document.baseURI)).hostname;
        return zip(
            from(this.utilService.getAppInfo()),
            from(this.utilService.getDeviceId())
        ).pipe(
            mergeMap((ids) => {
                const version = ids[0].version;
                const did = ids[1];
                return from(this.storageService.getData('sid')).pipe(
                    mergeMap((sid: string | undefined) => {
                        const telemetrySchema = this.decorator.prepare(this.decorator.decorate(
                            telemetry, sid ?? '', did, uuidv4(),
                            version, channelName, []
                        ), 1);

                        return this.dbService.save(TelemetryConfigEntry.insertData(), telemetrySchema)
                    })
                )
            })
        );
    }

    saveTelemetry(request: string): Observable<boolean> {
        return defer(() => {
            try {
                const telemetry: DJPTelemetry.Telemetry = JSON.parse(request);
                return this.decorateAndPersist(telemetry);
            } catch (e) {
                console.error(e);
                return of(false);
            }
        });
    }

    sync(): Observable<boolean> {
        return new TelemetrySyncHandler(this.dbService, this.apiService).handle(this.deviceId);
    }
}   
