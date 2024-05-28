import { CUSTOM_ELEMENTS_SCHEMA, NgModule, isDevMode, APP_INITIALIZER } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { ComponentsModule } from './components/components.module';
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { StorageService } from './services/storage.service';
import { DbService } from './services/db/db.service';
import { AppInitializeService } from './services/appInitialize.service';
import { TelemetryService } from './services/telemetry/telemetry.service';
import { AppHeaderService } from './services/app-header.service';
import { UtilService } from './services/util.service';
import { ContentService } from './services/content/content.service';
import { PlaylistService } from './services/playlist/playlist.service';
import { ConfigService } from './services/config.service';
import { ApiService, BotApiService, LocalNotificationService, RecordingService, SearchService } from './services';
import { Diagnostic } from '@awesome-cordova-plugins/diagnostic/ngx'
import { TelemetryAutoSyncService } from './services/telemetry/telemetry.auto.sync.service';
import { DikshaPreprocessorService, PreprocessorService, SunbirdPreprocessorService } from './services';
import { CachingService } from './services/caching.service';
import { TelemetryDecorator } from './services/telemetry/models/telemetry.decorator';
import { TelemetryGeneratorService } from './services/telemetry/telemetry.generator.service';
import { ScannerService } from './services/scan/scanner.service';
import { PermissionsService } from './services/scan/permissions.service';
import { TabsService } from './services/tabs.service';
import { DirectivesModule } from './directives/directives.module';
import { DownlaodContentService } from './services/downlaod-content.service';
import { AppUpdateService } from './services/app-update/app-update.service';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../../configuration/environment.prod';
import { SwUpdate } from '@angular/service-worker';

export function translateHttpLoaderFactory(httpClient: HttpClient) {
  return new TranslateHttpLoader(httpClient, './assets/i18n/', '.json');
}

export function initializeFactory(init: DbService) {
  return () => init.initializePlugin();
}

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule, 
    IonicModule.forRoot(), 
    AppRoutingModule,
    HttpClientModule,
    TranslateModule.forRoot({
      loader: {
          provide: TranslateLoader,
          useFactory: (translateHttpLoaderFactory),
          deps: [HttpClient]
      }
    }),
    ComponentsModule,
    DirectivesModule,
    // ServiceWorkerModule.register('ngsw-worker.js', {
    //   enabled: !isDevMode(),
    //   // Register the ServiceWorker as soon as the application is stable
    //   // or after 30 seconds (whichever comes first).
    //   registrationStrategy: 'registerWhenStable:30000'
    // })
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production }),
  ],
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    StorageService,
    DbService,
    AppInitializeService,
    TelemetryService,
    TelemetryAutoSyncService,
    AppHeaderService,
    UtilService,
    ContentService,
    PlaylistService,
    ApiService,
    ConfigService,
    PreprocessorService,
    SunbirdPreprocessorService,
    DikshaPreprocessorService,
    CachingService,
    RecordingService,
    TelemetryDecorator,
    TelemetryGeneratorService,
    ScannerService,
    PermissionsService,
    Diagnostic,
    SearchService,
    TabsService,
    BotApiService,
    DownlaodContentService,
    LocalNotificationService,
    AppUpdateService,
    SwUpdate,
    {
      provide: APP_INITIALIZER,
      useFactory: initializeFactory,
      deps: [DbService],
      multi: true
      }
  ],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class AppModule {
  constructor(private translate: TranslateService) {
    this.setDefaultLanguage();
  }

  private setDefaultLanguage() {
    this.translate.setDefaultLang('hi');
    this.translate.use("hi");
  }
}
