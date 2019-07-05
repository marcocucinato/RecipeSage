import { Component } from '@angular/core';
import { NavController, ModalController, ToastController } from '@ionic/angular';

import { LoadingService } from '@/services/loading.service';
import { MessagingService } from '@/services/messaging.service';
import { MealPlanService } from '@/services/meal-plan.service';
import { UtilService } from '@/services/util.service';

@Component({
  selector: 'page-new-meal-plan-modal',
  templateUrl: 'new-meal-plan-modal.page.html',
  styleUrls: ['new-meal-plan-modal.page.scss']
})
export class NewMealPlanModalPage {

  mealPlanTitle: string = '';

  selectedThreads: any = [];

  constructor(
    public navCtrl: NavController,
    public modalCtrl: ModalController,
    public loadingService: LoadingService,
    public mealPlanService: MealPlanService,
    public messagingService: MessagingService,
    public utilService: UtilService,
    public toastCtrl: ToastController) {

  }

  save() {
    var loading = this.loadingService.start();

    this.mealPlanService.create({
      title: this.mealPlanTitle,
      collaborators: this.selectedThreads
    }).then(response => {
      loading.dismiss();
      this.modalCtrl.dismiss({
        destination: 'MealPlanPage',
        routingData: {
          mealPlanId: response.id
        },
        setRoot: false
      });
    }).catch(async err => {
      loading.dismiss();
      switch (err.status) {
        case 0:
          let offlineToast = await this.toastCtrl.create({
            message: this.utilService.standardMessages.offlinePushMessage,
            duration: 5000
          });
          offlineToast.present();
          break;
        case 401:
          this.modalCtrl.dismiss({
            destination: 'LoginPage',
            setRoot: true
          });
          break;
        default:
          let errorToast = await this.toastCtrl.create({
            message: this.utilService.standardMessages.unexpectedError,
            duration: 30000
          });
          errorToast.present();
          break;
      }
    });
  }

  cancel() {
    this.modalCtrl.dismiss({
      destination: false
    });
  }
}