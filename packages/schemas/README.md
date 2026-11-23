# @epiquest/schemas

Contrats de données partagés entre le serveur, le web et le mobile (règles DATA-01 à DATA-04).
Chaque schéma est écrit avec [zod](https://zod.dev) ; les types TypeScript en sont déduits avec
`z.infer`, jamais réécrits à la main.

## Organisation

- Un fichier par domaine : `src/<feature>.ts` (par exemple `src/characters.ts`), avec ses tests
  `src/<feature>.test.ts`.
- Tout ce qui est public est réexporté par `src/index.ts`. Les autres paquets et apps
  n'importent que `@epiquest/schemas`.
- Une modification d'un schéma passe par une PR dédiée (DATA-03).

## Commandes

```bash
pnpm --filter @epiquest/schemas test         # tests
pnpm --filter @epiquest/schemas build        # compile vers dist/
```
