import { Injectable } from '@angular/core';

import { HttpClient } from '@angular/common/http';

@Injectable({
providedIn:'root'
})

export class AlertService{

api='http://localhost:3000/alerts';

constructor(private http:HttpClient){}

getAll(){

return this.http.get(this.api);

}

resolve(id:number){

return this.http.patch(

`${this.api}/${id}/resolve`,

{}

);

}

}