# 08 — Documentation

## Principes

- **DOC-01** — La documentation fait partie du produit. Elle est écrite **en même temps que le code**, dans la même PR, et non en fin de projet.
- **DOC-02** — Toute la documentation est versionnée dans `docs/`, en Markdown, et rédigée dans une seule langue pour tout le projet.
- **DOC-03** — Une PR qui change un comportement visible met à jour la documentation utilisateur. Une PR qui change un fonctionnement interne met à jour la documentation technique.

## Organisation de `docs/`

```
docs/
├── utilisateur/   guides pour le MJ et les joueurs, aide-mémoire, FAQ, accessibilité
├── technique/     architecture, modèle de données, une page par module, exploitation
├── adr/           journal des décisions d'architecture
└── glossaire.md   termes du jeu et du projet, avec leur nom dans le code
```

## Documentation utilisateur

- **DOC-04** — Elle s'adresse à une personne non technique : pas de jargon de développeur, des phrases courtes, des étapes numérotées.
- **DOC-05** — Chaque parcours est illustré par des captures d'écran à jour. Chaque image a un texte alternatif.

## Documentation technique

- **DOC-06** — Chaque module a une page qui explique : son rôle, son interface publique, ses choix d'implémentation, comment le tester.
- **DOC-07** — Les schémas (architecture, flux, modèle de données) sont écrits en texte (Mermaid) pour être versionnés et relus en PR.
- **DOC-08** — Le code s'explique par ses noms. Un commentaire explique le **pourquoi**, jamais le **quoi**. Les fonctions exportées des packages ont une description TSDoc.

## ADR (Architecture Decision Records)

- **DOC-09** — Toute décision structurante (voir `ARCH-17`) est consignée dans un ADR numéroté : `docs/adr/NNN-titre-court.md`.
- **DOC-10** — Un ADR n'est jamais modifié après acceptation. Pour changer une décision, on écrit un nouvel ADR qui **remplace** l'ancien, et on met à jour le statut de l'ancien.

Modèle d'ADR :

```markdown
# ADR-NNN — Titre

- Statut : proposé | accepté | remplacé par ADR-XXX
- Date : AAAA-MM-JJ
- Auteurs :

## Contexte
Le problème à résoudre et les contraintes.

## Options envisagées
1. Option A — avantages / inconvénients
2. Option B — avantages / inconvénients

## Décision
L'option retenue, en une ou deux phrases.

## Conséquences
Ce que la décision facilite, ce qu'elle complique, ce qu'il faudra surveiller.
```

## Fichiers à la racine

- **DOC-11** — Le `README.md` permet à un nouveau développeur de lancer le produit et les tests en **moins de 15 minutes**. Toute PR qui change l'installation le met à jour.
- **DOC-12** — `CHANGELOG.md` suit le format *Keep a Changelog* et est mis à jour à chaque changement visible.
