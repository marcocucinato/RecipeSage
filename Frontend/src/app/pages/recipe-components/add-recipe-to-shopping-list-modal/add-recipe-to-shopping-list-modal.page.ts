import { Component, Input } from '@angular/core';
import { NavController, ToastController, ModalController, AlertController } from '@ionic/angular';
import { ShoppingListService } from '@/services/shopping-list.service';
import { LoadingService } from '@/services/loading.service';
import { RecipeService, Ingredient } from '@/services/recipe.service';
import { UtilService } from '@/services/util.service';

@Component({
  selector: 'page-add-recipe-to-shopping-list-modal',
  templateUrl: 'add-recipe-to-shopping-list-modal.page.html',
  styleUrls: ['add-recipe-to-shopping-list-modal.page.scss']
})
export class AddRecipeToShoppingListModalPage {

  @Input() recipe: any;
  @Input() scale: any = 1;
  selectedIngredients: Ingredient[] = [];

  shoppingLists: any;

  destinationShoppingList: any;

  @Input() reference: any;

  constructor(
    public navCtrl: NavController,
    public shoppingListService: ShoppingListService,
    public recipeService: RecipeService,
    public loadingService: LoadingService,
    public utilService: UtilService,
    public toastCtrl: ToastController,
    public alertCtrl: AlertController,
    public modalCtrl: ModalController
  ) {
    this.scale = this.scale || 1;
  }

  ionViewWillEnter() {
    var loading = this.loadingService.start();
    this.loadLists().then(() => {
      loading.dismiss();
    }, () => {
      loading.dismiss();
    });
  }

  selectLastUsedShoppingList() {
    let lastUsedShoppingListId = localStorage.getItem('lastUsedShoppingListId');
    let matchingLists = this.shoppingLists.filter(shoppingList => shoppingList.id === lastUsedShoppingListId);
    if (matchingLists.length > 0 || this.shoppingLists.length === 1) {
      this.destinationShoppingList = this.shoppingLists[0];
    }
  }

  saveLastUsedShoppingList() {
    localStorage.setItem('lastUsedShoppingListId', this.destinationShoppingList.id);
  }

  loadLists() {
    return new Promise((resolve, reject) => {
      this.shoppingListService.fetch().then(response => {
        this.shoppingLists = response;

        this.selectLastUsedShoppingList();

        resolve();
      }).catch(async err => {
        reject();

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
          default:
            let errorToast = await this.toastCtrl.create({
              message: this.utilService.standardMessages.unexpectedError,
              duration: 30000
            });
            errorToast.present();
            break;
        }
      });
    });
  }

  isFormValid() {
    if (!this.destinationShoppingList) return false;

    return this.selectedIngredients && this.selectedIngredients.length > 0;
  }

  save() {
    var loading = this.loadingService.start();

    this.saveLastUsedShoppingList();

    this.shoppingListService.addItems({
      id: this.destinationShoppingList.id,
      items: this.selectedIngredients.map(ingredient => ({
        title: ingredient.originalContent,
        recipeId: this.recipe.id,
        reference: this.reference
      }))
    }).then(response => {
      loading.dismiss();

      this.modalCtrl.dismiss();
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

  async createShoppingList() {
    let modal = await this.modalCtrl.create({
      component: 'NewShoppingListModalPage'
    });
    modal.present();
    modal.onDidDismiss().then(({ data }) => {
      if (!data || !data.destination) return;

      if (data.setRoot) {
        // Ignore
      } else {
        // Ignore
      }

      // Check for new lists
      this.loadLists().then(async () => {
        if (this.shoppingLists.length == 1) {
          this.destinationShoppingList = this.shoppingLists[0];
        } else {
          (await this.toastCtrl.create({
            message: 'Excellent! Now select the list you just created.',
            duration: 6000
          })).present();
        }
      });
    });
  }

  cancel() {
    this.modalCtrl.dismiss();
  }
}