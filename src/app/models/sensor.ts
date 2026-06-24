export interface Sensor{

id:number;

humidite_sol:number;

temperature:number;

humidite_air:number;

enregistre_le:string;

metric_type?:'all'|'soil'|'air'|'temperature';

metric_value?:number;

}
