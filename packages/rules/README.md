# @epiquest/rules

Moteur de règles partagé par le serveur, le web et le mobile. Uniquement des fonctions pures : pas de réseau, de base de données, d'horloge ni d'aléatoire (voir `specs/01-architecture.md`, ARCH-08 à ARCH-10).

## API publique

Tout passe par `src/index.ts`.

- **Caractéristiques** : `abilityModifier`, `proficiencyBonus`.
- **Personnage** (`src/character/`) : `deriveStatistics(build)` calcule toutes les statistiques dérivées d'un personnage dont les choix sont déjà résolus avec les données SRD (`CharacterBuild`). Chaque statistique a aussi sa propre fonction : `finalAbilityScores`, `abilityModifiers`, `savingThrows`, `skillModifiers`, `armorClass`, `hitPointMaximum`, `averageHitDieGain`, `spellSlots`, `spellcastingStatistics`, `carryingStatus`, `speed`.

Le serveur traduit les données SRD de la base en `ClassData`, `SpeciesData` et `ArmorData` avant d'appeler le moteur. Le moteur ne connaît pas la base.

## Règles appliquées

| Statistique         | Règle                                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------------------- |
| Classe d'armure     | Meilleure formule de base (sans armure, armure, défense sans armure), puis bouclier +2 et bonus         |
| Armure              | Légère : toute la Dex. Intermédiaire : Dex plafonnée. Lourde : Dex ignorée, -10 pieds sans la Force     |
| Points de vie       | Dé maximal au niveau 1, puis jet ou moyenne (`d/2 + 1`), + Con et bonus d'espèce à chaque niveau        |
| Emplacements        | Table du lanceur complet ; demi-lanceur à `ceil(niveau / 2)` dès le niveau 2 ; magie de pacte à part    |
| Encombrement        | Règle optionnelle : > 5 × For encombré (-10), > 10 × For lourdement (-20), > 15 × For vitesse à 5 pieds |
| DD et attaque sorts | 8 + maîtrise + modificateur, et maîtrise + modificateur                                                 |

## Tests

```sh
pnpm --filter @epiquest/rules test
```
