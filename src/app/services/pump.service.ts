import { Injectable } from '@angular/core';

import { HttpClient } from '@angular/common/http';

@Injectable({
providedIn:'root'
})

export class PumpService{

api='http://localhost:3000/pump';

constructor(private http:HttpClient){}

turnOn(deviceId:string){

return this.http.post(
`${this.api}/on`,
{deviceId}
);

}

turnOff(deviceId:string){

return this.http.post(
`${this.api}/off`,
{deviceId}
);

}

history(deviceId:string){

return this.http.get(
`${this.api}/history/${deviceId}`
);

}

}