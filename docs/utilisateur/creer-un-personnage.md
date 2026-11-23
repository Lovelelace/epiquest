# Créer un personnage

L'assistant de création se lance depuis l'accueil, avec le lien « Créer un personnage ». Il guide pas à pas et enregistre chaque choix sur le serveur : vous pouvez fermer la page et reprendre plus tard depuis la même adresse.

## Les étapes

1. **Espèce** : choisissez une espèce, puis sa sous-espèce s'il y en a une (par exemple Elfe, puis Haut-elfe). Le détail de l'option choisie s'affiche en dessous : bonus de caractéristique, vitesse, traits.
2. **Classe** : dé de vie, jets de sauvegarde, maîtrises et compétences proposées.
3. **Historique** : compétences et équipement apportés.
4. **Caractéristiques**, avec trois méthodes :
   - _Achat de points_ : chaque valeur va de 8 à 15, le budget est de 27 points ; les points restants sont affichés.
   - _Tableau standard_ : répartissez 15, 14, 13, 12, 10 et 8.
   - _4d6_ : le serveur tire six fois quatre dés et garde les trois meilleurs. Le tirage n'a lieu qu'une fois.
     Les bonus d'espèce sont ajoutés et la valeur finale et le modificateur sont affichés.
5. **Compétences** : seules les compétences proposées par la classe, et pas déjà données par l'espèce ou l'historique, sont cochables. Le roublard choisit aussi son expertise.
6. **Équipement** : l'équipement fourni, puis une option pour chaque choix de la classe et de l'historique.
7. **Sorts** : pour les lanceurs de sorts, les sorts mineurs et les sorts du 1er niveau de la classe.
8. **Récapitulatif** : donnez un nom, choisissez la sous-classe si la classe la prend au niveau 1 (clerc, ensorceleur, occultiste), vérifiez les statistiques calculées et créez le personnage.

Le serveur vérifie toutes les règles avant de créer le personnage. S'il reste un problème, la liste « À corriger » indique quoi changer.

## Monter de niveau

Sur la fiche, la section « Monter de niveau » propose le niveau suivant, jusqu'au niveau 5 :

- **Points de vie** : la moyenne du dé de vie, ou un jet tiré par le serveur ; le modificateur de Constitution s'ajoute dans les deux cas.
- **Sous-classe** : au niveau où la classe la choisit (2 pour le magicien, 3 pour la plupart des classes).
- **Augmentation de caractéristique** au niveau 4 : +2 à une caractéristique, ou +1 à deux caractéristiques (20 au plus).
- **Expertise** (barde au niveau 3), **nouveaux sorts mineurs** et **sorts** : la liste des sorts est complète, cochez ceux que vous gardez.

Le serveur vérifie les choix avec les règles du nouveau niveau ; s'il refuse, le message indique quoi corriger. Les PV perdus restent perdus : la montée ajoute seulement la différence de PV maximum.

## Au clavier

- `Tab` et `Maj + Tab` passent d'un groupe d'options à l'autre ; les flèches changent d'option dans un groupe.
- `Espace` coche une case.
- Après « Suivant » ou « Précédent », le focus se place sur le titre de l'étape, qui annonce « Étape N sur 8 ».

## Limites actuelles

- Le demi-elfe (bonus et compétences au choix) n'est pas encore proposé correctement.
- Il n'y a pas encore de comptes : un brouillon est accessible à toute personne qui a son adresse.
