import { Component } from '@angular/core';
import { ToastController, AlertController, NavController } from '@ionic/angular';

import { UserService } from '@/services/user.service';
import { LoadingService } from '@/services/loading.service';
import { UtilService } from '@/services/util.service';
import { RecipeService } from '@/services/recipe.service';

@Component({
  selector: 'page-account',
  templateUrl: 'account.page.html',
  styleUrls: ['account.page.scss']
})
export class AccountPage {

  account: any = {
    password: "123456"
  };

  nameChanged: boolean = false;
  emailChanged: boolean = false;
  passwordChanged: boolean = false;

  constructor(
    public navCtrl: NavController,
    public toastCtrl: ToastController,
    public alertCtrl: AlertController,
    public utilService: UtilService,
    public loadingService: LoadingService,
    public recipeService: RecipeService,
    public userService: UserService) {

    var loading = this.loadingService.start();

    this.userService.me().then(response => {
      loading.dismiss();

      this.account = response;
    }).catch(async err => {
      loading.dismiss();
      switch(err.status) {
        case 0:
          (await this.toastCtrl.create({
            message: this.utilService.standardMessages.offlinePushMessage,
            duration: 5000
          })).present();
          break;
        case 401:
          // this.navCtrl.setRoot('LoginPage', {}, {animate: true, direction: 'forward'});
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


  async saveName() {
    if (!this.account.name || this.account.name.length === 0) {
      const errorToast = await this.toastCtrl.create({
        message: "Name/nickname must not be blank.",
        duration: 5000
      });
      errorToast.present();
      return;
    }

    var loading = this.loadingService.start();

    this.userService.update({
      name: this.account.name
    }).then(async response => {
      loading.dismiss();

      this.account.name = response.name;
      this.nameChanged = false;

      let tst = await this.toastCtrl.create({
        message: 'Profile name was updated.',
        duration: 5000
      });
      tst.present();
    }).catch(async err => {
      loading.dismiss();
      switch(err.status) {
        case 0:
          (await this.toastCtrl.create({
            message: this.utilService.standardMessages.offlinePushMessage,
            duration: 5000
          })).present();
          break;
        case 401:
          // this.navCtrl.setRoot('LoginPage', {}, {animate: true, direction: 'forward'});
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

  async saveEmail() {
    if (!this.account.email || this.account.email.length === 0) {
      (await this.toastCtrl.create({
        message: "Email must not be blank.",
        duration: 5000
      })).present();
      return;
    }

    var loading = this.loadingService.start();

    this.userService.update({
      email: this.account.email
    }).then(async response => {
      loading.dismiss();

      this.account.email = response.email;
      this.emailChanged = false;

      let tst = await this.toastCtrl.create({
        message: 'Email address was updated.',
        duration: 5000
      });
      tst.present();
    }).catch(async err => {
      loading.dismiss();
      switch(err.status) {
        case 0:
          (await this.toastCtrl.create({
            message: this.utilService.standardMessages.offlinePushMessage,
            duration: 5000
          })).present();
          break;
        case 401:
          // this.navCtrl.setRoot('LoginPage', {}, {animate: true, direction: 'forward'});
          break;
        case 406:
          (await this.toastCtrl.create({
            message: 'Sorry, an account with that email address already exists.',
            duration: 5000
          })).present();
          break;
        case 412:
          (await this.toastCtrl.create({
            message: 'Please enter a valid email address.',
            duration: 5000
          })).present();
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

  async _logout() {
    localStorage.removeItem('token');

    let alert = await this.alertCtrl.create({
      header: 'Password Updated',
      message: 'Your password has been updated. You will need to log back in on any devices that use this account.',
      buttons: [
        {
          text: 'Okay',
          handler: () => {
            // this.navCtrl.setRoot('LoginPage', {});
          }
        }
      ]
    });
    alert.present();
  }

  async savePassword() {
    if (this.account.password !== this.account.confirmPassword) {
      let tst = await this.toastCtrl.create({
        message: 'Passwords do not match.',
        duration: 5000
      });
      tst.present();
      return;
    }

    var loading = this.loadingService.start();

    this.userService.update({
      password: this.account.password
    }).then(response => {
      loading.dismiss();

      this.account.password = '*'.repeat(this.account.password.length);
      this.passwordChanged = false;

      this._logout();
    }).catch(async err => {
      loading.dismiss();
      switch(err.status) {
        case 0:
          (await this.toastCtrl.create({
            message: this.utilService.standardMessages.offlinePushMessage,
            duration: 5000
          })).present();
          break;
        case 401:
          // this.navCtrl.setRoot('LoginPage', {}, {animate: true, direction: 'forward'});
          break;
        case 412:
          (await this.toastCtrl.create({
            message: 'Invalid password - Passwords must be 6 characters or longer.',
            duration: 5000
          })).present();
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

  async deleteAllRecipes() {
    let alert = await this.alertCtrl.create({
      header: 'Warning - You\'re about to delete all of your recipes!',
      message: `This action is PERMANENT.<br /><br />All of your recipes and associated labels will be removed from the Recipe Sage system.`,
      buttons: [
        {
          text: 'Yes, continue',
          handler: () => {
            let loading = this.loadingService.start();

            this.recipeService.removeAll().then(async () => {
              loading.dismiss();

              (await this.toastCtrl.create({
                message: 'Your recipe data has been deleted.',
                duration: 5000
              })).present();
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
                    message: 'It looks like your session has expired. Please login and try again.',
                    duration: 5000
                  })).present();
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
            })
          }
        },
        {
          text: 'Cancel',
          handler: () => {}
        }
      ]
    });
    alert.present();
  }
}