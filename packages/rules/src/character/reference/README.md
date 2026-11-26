# Personnages de référence

Quatre fiches calculées à la main, qui servent de tests de non-régression du moteur (`reference-characters.test.ts`). Toute valeur de la fiche est comparée à la sortie de `deriveStatistics`, aux niveaux 1 et 5.

| Fichier                         | Personnage                            | Particularités testées                           |
| ------------------------------- | ------------------------------------- | ------------------------------------------------ |
| `human-fighter.json`            | Humain guerrier, acolyte              | Armure lourde, bouclier, style de combat Défense |
| `high-elf-wizard.json`          | Haut-elfe magicien, acolyte           | Lanceur complet (Int), sans armure               |
| `hill-dwarf-cleric.json`        | Nain des collines clerc, acolyte      | Robustesse naine, armure intermédiaire et Dex -1 |
| `lightfoot-halfling-rogue.json` | Halfelin pied-léger roublard, acolyte | Expertise, armure légère                         |

Les PV au-delà du niveau 1 utilisent la moyenne du dé de vie. Chaque personnage prend son augmentation de caractéristique du niveau 4 sur sa caractéristique principale.

## Format

```json
{
  "id": "human-fighter",
  "name": "Humain guerrier (acolyte)",
  "levels": {
    "1": { "build": {}, "handCalculation": ["…"], "expected": {} },
    "5": { "build": {}, "handCalculation": ["…"], "expected": {} }
  }
}
```

- `build` : entrée du moteur (`CharacterBuild`).
- `handCalculation` : le détail du calcul à la main, ligne par ligne.
- `expected` : la fiche attendue (`DerivedStatistics`), comparée en entier.

Modifier une fiche demande une relecture par l'autre membre (TEST-11) : on corrige d'abord le calcul à la main, puis la valeur attendue.
