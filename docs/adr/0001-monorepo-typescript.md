# 0001 — Monorepo TypeScript avec moteur de règles partagé

- Statut : Proposée
- Date : 2026-11-23

## Contexte

Le produit comprend un serveur, un client web (vues MJ et joueurs) et une application mobile.
Le sujet exige que l'application mobile crée les personnages « avec le même moteur de règles
que le web », et que le serveur fasse autorité sur les dés et le combat.

## Options envisagées

1. Monorepo TypeScript : serveur Node, web React, mobile React Native, moteur partagé.
2. Serveur et web en TypeScript, mobile natif en Kotlin : moteur à réécrire ou à partager via
   Kotlin Multiplatform.
3. Dépôts séparés par application.

## Décision

Option 1. Le moteur de règles, l'analyseur de dés et la ligne de vue vivent dans le paquet
`@epiquest/rules`, en TypeScript pur, sans dépendance d'interface. Le dépôt est géré avec pnpm
workspaces et Turborepo.

## Conséquences

- Une seule implémentation des règles, testée une fois, utilisée partout.
- Une seule commande pour lancer tous les tests (`pnpm test`).
- L'équipe travaille dans un seul langage, ce qui facilite les relectures croisées.
- L'application mobile dépend de React Native : rendu natif, conforme à l'interdiction des sites
  emballés, mais à justifier dans la documentation technique.
