import { Component, ViewChild } from '@angular/core';
import { NavController, ToastController, ModalController, PopoverController, AlertController } from '@ionic/angular';
import { LoadingService } from '@/services/loading.service';
import { MealPlanService } from '@/services/meal-plan.service';
import { WebsocketService } from '@/services/websocket.service';
import { UtilService } from '@/services/util.service';
import { RecipeService } from '@/services/recipe.service';
import { ShoppingListService } from '@/services/shopping-list.service';

import dayjs, { Dayjs } from 'dayjs'
import { MealCalendarComponent } from '@/components/meal-calendar/meal-calendar.component';

@Component({
  selector: 'page-meal-plan',
  templateUrl: 'meal-plan.page.html',
  styleUrls: ['meal-plan.page.scss']
})
export class MealPlanPage {

  mealPlanId: string; // From nav params
  mealPlan: any = { items: [], collaborators: [] };
  selectedMealGroup: any = [];

  itemsByRecipeId: any = {};
  recipeIds: any = [];

  viewOptions: any = {};

  initialLoadComplete: boolean = false;

  selectedDay: Dayjs = dayjs(new Date());

  reference: number = 0;

  @ViewChild(MealCalendarComponent) mealPlanCalendar: MealCalendarComponent;

  constructor(
    public navCtrl: NavController,
    public loadingService: LoadingService,
    public mealPlanService: MealPlanService,
    public shoppingListService: ShoppingListService,
    public recipeService: RecipeService,
    public websocketService: WebsocketService,
    public utilService: UtilService,
    public toastCtrl: ToastController,
    public modalCtrl: ModalController,
    public popoverCtrl: PopoverController,
    public alertCtrl: AlertController) {

    this.websocketService.register('mealPlan:itemsUpdated', payload => {
      if (payload.mealPlanId === this.mealPlanId && payload.reference !== this.reference) {
        this.loadMealPlan();
      }
    }, this);

    this.loadViewOptions();
  }

  ionViewWillEnter() {
    var loading = this.loadingService.start();

    this.initialLoadComplete = false;
    this.loadMealPlan().then(() => {
      loading.dismiss();
      this.initialLoadComplete = true;
    }, () => {
      loading.dismiss();
      this.initialLoadComplete = true;
    });
  }

  refresh(loader) {
    this.loadMealPlan().then(() => {
      loader.target.complete();
    }, () => {
      loader.target.complete();
    });
  }

  loadMealPlan() {
    return new Promise((resolve, reject) => {
      this.mealPlanService.fetchById(this.mealPlanId).then(response => {
        this.mealPlan = response;

        resolve();
      }).catch(async err => {
        switch (err.status) {
          case 0:
            let offlineToast = await this.toastCtrl.create({
              message: this.utilService.standardMessages.offlineFetchMessage,
              duration: 5000
            });
            offlineToast.present();
            break;
          case 401:
            // this.navCtrl.setRoot('LoginPage', {}, { animate: true, direction: 'forward' });
            break;
          case 404:
            let errorToast = await this.toastCtrl.create({
              message: 'Meal plan not found. Does this meal plan URL exist?',
              duration: 30000,
              // dismissOnPageChange: true
            });
            errorToast.present();

            // this.navCtrl.setRoot('MealPlansPage', {}, { animate: true, direction: 'forward' });
            break;
          default:
            errorToast = await this.toastCtrl.create({
              message: this.utilService.standardMessages.unexpectedError,
              duration: 30000
            });
            errorToast.present();
            break;
        }

        reject();
      });
    });
  }

  async removeItem(item) {
    let alert = await this.alertCtrl.create({
      header: 'Confirm Removal',
      message: 'This will remove "' + (item.recipe || item).title + '" from this meal plan.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Remove',
          handler: () => {
            this._removeItem(item);
          }
        }
      ]
    });
    alert.present();
  }

  _removeItem(item) {
    var loading = this.loadingService.start();

    this.mealPlanService.remove({
      id: this.mealPlanId,
      itemId: item.id
    }).then(response => {
      this.reference = response.reference || 0;

      this.loadMealPlan().then(loading.dismiss);
    }).catch(async err => {
      loading.dismiss();
      switch (err.status) {
        case 0:
          (await this.toastCtrl.create({
            message: this.utilService.standardMessages.offlinePushMessage,
            duration: 5000
          })).present();
          break;
        case 401:
          (await this.toastCtrl.create({
            message: this.utilService.standardMessages.unauthorized,
            duration: 6000
          })).present();
          break;
        default:
          (await this.toastCtrl.create({
            message: this.utilService.standardMessages.unexpectedError,
            duration: 6000
          })).present();
          break;
      }
    });
  }

  _addItem(item) {
    var loading = this.loadingService.start();

    this.mealPlanService.addItem({
      id: this.mealPlanId,
      title: item.title,
      recipeId: item.recipeId || null,
      meal: item.meal,
      scheduled: this.selectedDay.toDate()
    }).then(response => {
      this.reference = response.reference;

      this.loadMealPlan().then(loading.dismiss);
    }).catch(async err => {
      loading.dismiss();
      switch (err.status) {
        case 0:
          (await this.toastCtrl.create({
            message: this.utilService.standardMessages.offlinePushMessage,
            duration: 5000
          })).present();
          break;
        case 401:
          (await this.toastCtrl.create({
            message: this.utilService.standardMessages.unauthorized,
            duration: 6000
          })).present();
          break;
        default:
          (await this.toastCtrl.create({
            message: this.utilService.standardMessages.unexpectedError,
            duration: 6000
          })).present();
          break;
      }
    });
  }

  async newMealPlanItem() {
    let modal = await this.modalCtrl.create({
      component: 'NewMealPlanItemModalPage'
    });
    modal.present();
    modal.onDidDismiss().then(({ data }) => {
      if (!data) return;
      if (data.item) {
        this._addItem(data.item);
      }

      if (!data.destination) return;

      if (data.setRoot) {
        // this.navCtrl.setRoot(data.destination, data.routingData || {}, { animate: true, direction: 'forward' });
      } else {
        // this.navCtrl.push(data.destination, data.routingData);
      }
    });
  }

  formatItemCreationDate(plainTextDate) {
    return this.utilService.formatDate(plainTextDate, { now: true });
  }

  loadViewOptions() {
    var defaults = {
      showAddedBy: false,
      showAddedOn: false,
      startOfWeek: 'monday'
    }

    this.viewOptions.showAddedBy = JSON.parse(localStorage.getItem('mealPlan.showAddedBy'));
    this.viewOptions.showAddedOn = JSON.parse(localStorage.getItem('mealPlan.showAddedOn'));
    this.viewOptions.startOfWeek = localStorage.getItem('mealPlan.startOfWeek') || null;

    for (var key in this.viewOptions) {
      if (this.viewOptions.hasOwnProperty(key)) {
        if (this.viewOptions[key] == null) {
          this.viewOptions[key] = defaults[key];
        }
      }
    }
  }

  openRecipe(recipe) {
    // this.navCtrl.push('RecipePage', {
    //   recipe: recipe,
    //   recipeId: recipe.id
    // });
  }

  addMealPlanItemToShoppingList(mealPlanItem) {
    // Fetch complete recipe (this page is provided with only topical recipe details)
    this.recipeService.fetchById(mealPlanItem.recipe.id).then(async response => {
      let addRecipeToShoppingListModal = await this.modalCtrl.create({
        component: 'AddRecipeToShoppingListModalPage',
        componentProps: {
          recipe: response,
          reference: mealPlanItem.id
        }
      });
      addRecipeToShoppingListModal.present();
    }).catch(async err => {
      switch (err.status) {
        case 0:
          let offlineToast = await this.toastCtrl.create({
            message: this.utilService.standardMessages.offlineFetchMessage,
            duration: 5000
          });
          offlineToast.present();
          break;
        case 401:
          // this.navCtrl.setRoot('LoginPage', {}, { animate: true, direction: 'forward' });
          break;
        case 404:
          let errorToast = await this.toastCtrl.create({
            message: 'Recipe not found. Does this recipe URL exist?',
            duration: 30000,
            // dismissOnPageChange: true
          });
          errorToast.present();
          break;
        default:
          errorToast = await this.toastCtrl.create({
            message: this.utilService.standardMessages.unexpectedError,
            duration: 30000
          });
          errorToast.present();
          break;
      }
    });
  }

  async removeMealPlanItemFromShoppingList(mealPlanItem) {
    let alert = await this.alertCtrl.create({
      header: 'Confirm Removal',
      message: 'This will remove the linked copy of "' + (mealPlanItem.recipe || mealPlanItem).title + '" from your shopping list.',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Remove',
          handler: () => {
            this._removeMealPlanItemFromShoppingList(mealPlanItem);
          }
        }
      ]
    });
    alert.present();
  }

  _removeMealPlanItemFromShoppingList(mealPlanItem) {
    var elIds = mealPlanItem.shoppingListItems.map(el => {
      return el.id;
    });

    var loading = this.loadingService.start();

    this.shoppingListService.remove({
      id: mealPlanItem.shoppingListId,
      items: elIds
    }).then(response => {
      loading.dismiss();

      delete mealPlanItem.shoppingListItems;
      delete mealPlanItem.shoppingListId;
    }).catch(async err => {
      loading.dismiss();
      switch (err.status) {
        case 0:
          (await this.toastCtrl.create({
            message: this.utilService.standardMessages.offlinePushMessage,
            duration: 5000
          })).present();
          break;
        case 401:
          (await this.toastCtrl.create({
            message: this.utilService.standardMessages.unauthorized,
            duration: 6000
          })).present();
          break;
        default:
          (await this.toastCtrl.create({
            message: this.utilService.standardMessages.unexpectedError,
            duration: 6000
          })).present();
          break;
      }
    });
  }

  async presentPopover(event) {
    let popover = await this.popoverCtrl.create({
      component: 'MealPlanPopoverPage',
      componentProps: {
        mealPlanId: this.mealPlanId,
        mealPlan: this.mealPlan,
        viewOptions: this.viewOptions
      },
      event
    });

    popover.onDidDismiss().then(({ data }) => {
      data = data || {};

      if (!data.destination) {
        this.mealPlanCalendar.generateCalendar();
        return;
      }

      if (data.setRoot) {
        // this.navCtrl.setRoot(data.destination, data.routingData || {}, { animate: true, direction: 'forward' });
      } else {
        // this.navCtrl.push(data.destination, data.routingData);
      }
    });

    popover.present();
  }
}