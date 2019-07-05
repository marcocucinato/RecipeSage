import { Component } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';
import { RecipeService, Ingredient } from '@/services/recipe.service';
import { LoadingService } from '@/services/loading.service';
import { UtilService } from '@/services/util.service';

@Component({
  selector: 'page-new-shopping-list-item-modal',
  templateUrl: 'new-shopping-list-item-modal.page.html',
  styleUrls: ['new-shopping-list-item-modal.page.scss']
})
export class NewShoppingListItemModalPage {

  inputType: string = 'items';

  itemFields: any = [{}];

  selectedRecipe: any;
  selectedIngredients: Ingredient[];

  constructor(
    public modalCtrl: ModalController,
    public utilService: UtilService,
    public recipeService: RecipeService,
    public loadingService: LoadingService,
    public toastCtrl: ToastController) {

  }

  addOrRemoveTextFields() {
    if ((this.itemFields[this.itemFields.length - 1].title || '').length > 0) {
      this.itemFields.push({});
    }
  }

  isFormValid() {
    if (this.inputType === 'recipe' && this.selectedRecipe && this.selectedRecipe.id) {
      return (this.selectedIngredients || []).length > 0;
    }
    if (this.inputType === 'items') {
      for (var i = 0; i < this.itemFields.length; i++) {
        if (this.itemFields[i].title) return true;
      }
    }
    return false;
  }

  save() {
    var items;
    if (this.inputType === 'recipe') {
      items = this.selectedIngredients.map(ingredient => ({
        title: ingredient.originalContent,
        recipeId: this.selectedRecipe.id
      }));
    } else {
      // Redundant for now. Kept for sterilization
      items = this.itemFields.filter(e => {
        return (e.title || '').length > 0;
      }).map(e => {
        return {
          title: e.title
        };
      });
    }

    this.modalCtrl.dismiss({
      destination: false,
      items: items
    });
  }

  cancel() {
    this.modalCtrl.dismiss({
      destination: false
    });
  }
}