import { Injectable } from '@angular/core';
import {interval, Observable, of} from 'rxjs';
import {catchError, filter, mapTo, tap} from 'rxjs/operators';
import { TelemetryService } from '..';

declare const window: any;

@Injectable({
    providedIn: 'root'
})
export class TelemetryAutoSyncService {
    private shouldSync = false;
    constructor(
        private telemetryService: TelemetryService
    ) { }

    start(intervalTime: number): Observable<undefined> {
        this.shouldSync = true;

        return interval(intervalTime).pipe(
            tap((iteration: number) => {
                const timeCovered = iteration * intervalTime;

                
            }),
            filter(() => this.shouldSync),
            tap(() => this.telemetryService.sync().pipe(
                tap((stat) => {
                }),
                catchError((e) => {
                    console.error(e);
                    return of(undefined);
                })
            ).toPromise()),
            mapTo(undefined)
        );
    }

    pause(): void {
        this.shouldSync = false;
    }

    continue(): void {
        this.shouldSync = true;
    }

}   
