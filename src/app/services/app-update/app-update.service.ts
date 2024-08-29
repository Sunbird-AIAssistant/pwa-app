import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AppUpdate, AppUpdateAvailability } from '@capawesome/capacitor-app-update';
import { Platform, PopoverController } from '@ionic/angular';
import { AppUpdateComponent } from 'src/app/components/app-update/app-update.component';

@Injectable({
    providedIn: 'root'
})
export class AppUpdateService {
    forDeepLink: boolean = false;
    showListPage: boolean = false;

    constructor(
        public router: Router,
        public platform: Platform,
        private popoverController: PopoverController
    ) { }

    async checkForUpdate() {
        const result = await AppUpdate.getAppUpdateInfo();
        // const result = await this.simulateCheckForUpdate(); // for testing

        if (result.updateAvailability === AppUpdateAvailability.UPDATE_AVAILABLE) {
            if (this.platform.is('android')) {
                if (result.immediateUpdateAllowed) {
                    await AppUpdate.performImmediateUpdate();
                } else if (result.flexibleUpdateAllowed) {
                    await AppUpdate.startFlexibleUpdate();
                    AppUpdate.addListener('onFlexibleUpdateStateChange', async () => {
                        let modal = await this.popoverController.create({
                            component: AppUpdateComponent,
                            cssClass: 'update-modal',
                            translucent: true,
                            dismissOnSelect: true
                        })
                        await modal.present();
                        modal.onDidDismiss().then((res => {
                            if(res.data == "restart") {
                                AppUpdate.completeFlexibleUpdate();
                            }
                        }));
                    });
                } else {
                    // Handle the case where an update is not allowed
                }
            }
        }
    }
    // async simulateCheckForUpdate() {
    //     return {
    //         updateAvailability: AppUpdateAvailability.UPDATE_AVAILABLE,
    //         immediateUpdateAllowed: true,
    //         flexibleUpdateAllowed: true,
    //         currentVersion: '1.0.0',
    //         availableVersion: '2.0.0'
    //     };
    // }
}
