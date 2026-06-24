export interface Utilisateur {
  id: string;
  email: string;
  nom_utilisateur: string;
  mot_de_passe_hash?: string;
  actif: boolean;
  cree_le?: Date;
  mis_a_jour_le?: Date;
}