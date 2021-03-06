import { Component } from '@angular/core';
import { Platform, NavController, NavParams, AlertController } from 'ionic-angular';
import { Http, Headers, RequestOptions } from '@angular/http';
import { PaymentOptionsPage } from '../payment-options/payment-options';
import { Storage } from '@ionic/storage';
import { Toast } from '@ionic-native/toast';
import { NetworkServiceProvider } from '../../providers/network-service/network-service';
import { GoogleAnalytics } from '@ionic-native/google-analytics';

@Component({
  selector: 'page-personal-assistance',
  templateUrl: 'personal-assistance.html'
})
export class PersonalAssistancePage {

  items: any;
    badge:any
    http:any;
    checkJobs:any
    length:any
    view:boolean = false
    total: number = 0;
    value: number = 1;
    job_id: any;
    hotel_id = [];
    list:any =[];
  constructor(public alertCtrl:AlertController ,
              public navCtrl: NavController, 
              public navParams: NavParams,
              public network: NetworkServiceProvider,
              public ga: GoogleAnalytics,
              public platform: Platform,
              http: Http,
              public storage: Storage,
              public toast: Toast) {
              this.http = http;
              this.loadData()
              
        }
  deleteJob(hotel_id){
    if(this.network.noConnection()){
       this.network.showNetworkAlert()
      }else{
          let index = this.hotel_id.indexOf(this.hotel_id);
          this.hotel_id.splice(index,1)
          this.storage.get("id").then((user_id)=>{
          this.storage.get("Hash").then((hash)=>{
          var applied = false
          let headers = new Headers({
            'Content-Type': 'application/json',
            'Authorization': hash
          });
          let options = new RequestOptions({ headers: headers });
            this.http.delete("http://www.forehotels.com:3000/api/personal_assistance/"+user_id+"/"+hotel_id, options)
                  .subscribe(data =>{
                    if(this.total > 0){             
                    this.total = this.total - 4000
                    this.value--
                  }
                  let alert = this.alertCtrl.create({
                      title: 'Success!',
                      subTitle: 'Job removed from cart.',
                      buttons: ['OK']
                      });
                      alert.present();
                      this.loadData()
                  });
                  err=>{
                    let alert = this.alertCtrl.create({
                      title: err,
                      subTitle: 'Job removed from cart.',
                      buttons: ['OK']
                      });
                      alert.present();
                  }  
          });         
        });
    }
}
   addToCart(id){
    if(this.network.noConnection()){
        this.network.showNetworkAlert()
    }else{
          this.hotel_id.push(id)
          this.storage.get("id").then((user_id)=>{
          this.storage.get("Hash").then((hash)=>{
          var applied = false;
          let body = JSON.stringify({
            usr_id: user_id,
            hotel_id: id,
            });
            let headers = new Headers({
            'Content-Type': 'application/json',
            'Authorization': hash
          });
          let options = new RequestOptions({ headers: headers });
            this.http.get("http://www.forehotels.com:3000/api/personal_assistance/"+user_id, options)
                  .subscribe(data =>{
                  this.checkJobs=JSON.parse(data._body).Jobs;
                  for(let item of this.checkJobs ){
                      if(item.hj_id.equals(id)){
                        let alert = this.alertCtrl.create({
                          title: 'Oops..!!',
                          subTitle: 'Job already added to cart.',
                          buttons: ['OK']
                        });
                        alert.present();
                        applied = true;
                      }
                  }
                  if(applied==false){
                    console.log('in pa post request0');
                    this.http
                    .post('http://localhost:3000/api/pa', body, options)
                    .map(res => res.json())
                    .subscribe(
                      detail => {    
                        this.value++;
                        this.updateTotal(this.value)
                        this.loadData();          
                        let alert = this.alertCtrl.create({
                          title: 'Success!',
                          subTitle: 'Job added to cart.',
                          buttons: ['OK']
                        });
                        alert.present(); 
                      });
                  }
                });
              });
            });
        }
  }
    updateTotal(item){
      this.total = item * 4000;
    }
    personalAssistance(){
      if(this.network.noConnection()){
           this.network.showNetworkAlert()
        }else{ 
          if(this.total > 0){
              this.navCtrl.push(PaymentOptionsPage,{
                  amt: this.total,
                  purpose: 'personal_assistance',
                  hotel_id: this.hotel_id
              });
          }else{
              this.toast.show('Please add Job to Cart to proceed','5000','bottom').subscribe(toast=>{
                console.log(toast)
              });
        }
      }
  }
  loadData(){
    if(this.network.noConnection()){
       this.network.showNetworkAlert()
      }else{ 
        
        this.total = 0
        this.list = [];
          this.storage.get("id").then((id)=>{
          this.storage.get("Hash").then((value)=>{
          this.platform.ready().then(() => {
            
                this.ga.trackEvent("Personal Assistance", "Opened", "New Session Started", id, true)
                this.ga.setAllowIDFACollection(true)
                this.ga.setUserId(id)
                this.ga.trackView("Personal Assistance")
          })
          let headers = new Headers({
          'Content-Type': 'application/json',
          'Authorization': value
        });
        let options = new RequestOptions({ headers: headers });
          this.http.get("http://localhost:3000/api/job_posted/"+id, options)
                .subscribe(data =>{
                  
                this.items=JSON.parse(data._body).Jobs; //Bind data to items object
                console.log(id);
                for(let response of this.items){
                  console.log(response);
                  if(response.paid != 1){                   
                   this.list.push(response)
                   if(response.cart == 1){
                        this.hotel_id.push(response.hj_id);
                        this.total += 4000;
                        this.value++
                      }
                  }
                }         
              },error=>{
              });
            })
        })
    }
} 
}
