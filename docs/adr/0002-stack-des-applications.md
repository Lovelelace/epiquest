# 0002 — Stack des applications et rangement du code par feature

- Statut : Proposée
- Date : 2026-11-23

## Contexte

L'ADR 0001 fixe un monorepo TypeScript avec un moteur de règles partagé. Il reste à choisir les
outils de chaque application et la façon de ranger le code, pour que deux développeurs puissent
travailler en parallèle, feature par feature, sans modifier les mêmes fichiers.

Contraintes du sujet : serveur qui fait autorité, deux vues synchronisées en direct (MJ et
joueurs), application mobile native sur une seule plateforme, données de règles importées en
base et rejouables, accessibilité WCAG 2.2 AA.

## Options envisagées

| Sujet                  | Options étudiées                                         |
| ---------------------- | -------------------------------------------------------- |
| Serveur                | NestJS, Fastify, Express, Hono                           |
| Temps réel             | Socket.IO, WebSocket natif (ws)                          |
| Accès à la base        | Drizzle, Prisma, Kysely                                  |
| Emplacement de la base | `packages/db`, dans `apps/server`, `apps/db`             |
| Web                    | Next.js, Vite + React                                    |
| Routes Next.js         | App Router, Pages Router                                 |
| Style web              | Tailwind CSS, CSS Modules                                |
| Mobile                 | Expo (Android ou iOS), React Native CLI                  |
| Navigation mobile      | Expo Router, React Navigation                            |
| Tests                  | Vitest + jest-expo, Jest partout, défauts des frameworks |
| Rangement du code      | Par feature, par couche technique, hybride               |

## Décision

- **Serveur** : NestJS 12 (ESM). Un module NestJS par feature.
- **Temps réel** : Socket.IO, via l'adaptateur officiel de NestJS.
- **Base** : PostgreSQL avec Drizzle, dans `apps/db` (schéma, migrations, seed, import du SRD).
  Le schéma est découpé en un fichier par feature, ce qui limite les conflits à deux.
- **Web** : Next.js avec App Router et Tailwind CSS. Next.js ne contient aucune logique serveur
  (ni route handler, ni server action) : toutes les données passent par l'API NestJS. Les vues
  MJ et joueurs sont des routes de la même application.
- **Mobile** : Expo avec Expo Router, cible Android.
- **Contrats** : paquet `packages/schemas` (zod), séparé du moteur `packages/rules`.
- **Tests** : Vitest pour le serveur, le web, la base et les paquets ; jest-expo pour le mobile.
- **Rangement** : dans chaque application, un dossier `src/features/<feature>/` par feature et
  un dossier `src/shared/` pour le transverse.

## Conséquences

- Chaque développeur travaille dans les dossiers de ses features ; les conflits se limitent à
  `shared/`, aux modules racines et aux contrats.
- `apps/server` importe `apps/db`, ce que la règle ARCH-06 interdisait : une exception est
  ajoutée à la règle, limitée à ce cas.
- NestJS et Next.js ont chacun une couche serveur : il faut veiller à ne mettre aucune logique
  dans Next.js, sous peine de contourner l'autorité du serveur.
- Expo Router considère chaque fichier de `src/app/` comme une route : les écrans vivent dans
  les features, et `src/app/` ne contient que des réexportations.
- Les tests NestJS passent par SWC (`unplugin-swc`) pour conserver les métadonnées des
  décorateurs nécessaires à l'injection de dépendances.
- Le build de l'APK en CI reste à mettre en place.
