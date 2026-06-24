export interface JournalPompe {

  id:number;

  dispositif_id:string;

  action:'ON' | 'OFF';

  declenche_par:'manuel' | 'automatique';

  declenche_le?:Date;

}