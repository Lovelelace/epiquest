# 06 — Sécurité

## Le serveur fait autorité

- **SEC-01** — Le client n'est jamais digne de confiance. Toute action est revalidée par le serveur : droits, cohérence avec l'état de la partie, valeurs autorisées.
- **SEC-02** — L'aléatoire qui affecte la partie est tiré **côté serveur**, avec un générateur cryptographiquement sûr (`crypto.randomInt`). `Math.random` est interdit pour cet usage.
- **SEC-03** — Le client NE DOIT JAMAIS envoyer un résultat calculé (dégâts, total d'un jet) que le serveur accepterait tel quel. Il envoie une intention, le serveur calcule.

## Authentification et sessions

- **SEC-04** — Les mots de passe sont hachés avec un algorithme dédié (argon2id ou bcrypt). Jamais stockés en clair ni réversibles.
- **SEC-05** — Les sessions utilisent des cookies `HttpOnly`, `Secure` et `SameSite`, ou des jetons de courte durée. Pas de jeton dans `localStorage`.
- **SEC-06** — Les routes d'authentification ont une limitation du nombre de tentatives.

## Permissions

- **SEC-07** — Chaque route et chaque événement temps réel vérifie, **côté serveur**, que l'utilisateur a le droit d'agir sur la ressource visée (appartenance à la campagne, rôle MJ ou joueur, propriété du personnage). Masquer un bouton dans l'interface n'est pas une protection.

## Informations cachées

- **SEC-08** — Une information qu'un utilisateur ne doit pas voir NE DOIT JAMAIS lui être envoyée, même si l'interface ne l'affiche pas. Cela vaut pour les réponses HTTP, les messages WebSocket, les métadonnées et les messages d'erreur.
- **SEC-09** — Le filtrage se fait au serveur, dans une fonction unique par type de destinataire, testée (voir `TEST-07`). On NE DOIT PAS filtrer côté client.
- **SEC-10** — Par défaut, une donnée est **cachée**. Rendre une donnée visible aux joueurs est un choix explicite dans le code.

## Secrets et configuration

- **SEC-11** — Aucun secret dans le code, les tests, les fichiers de configuration commités ou l'historique Git. Les secrets passent par des variables d'environnement.
- **SEC-12** — `.env.example` liste toutes les variables nécessaires, avec un commentaire et une valeur d'exemple sans danger.
- **SEC-13** — Les secrets de la CI et du déploiement sont stockés dans les secrets GitHub.

## Protection contre les risques courants (OWASP Top 10)

- **SEC-14** — Requêtes en base uniquement par l'ORM ou des requêtes paramétrées. Jamais de SQL construit par concaténation.
- **SEC-15** — Tout contenu saisi par un utilisateur (notes, noms, descriptions) est échappé à l'affichage. Pas de `dangerouslySetInnerHTML` sans assainissement (DOMPurify).
- **SEC-16** — Les fichiers envoyés par les utilisateurs (images de cartes, documents) sont limités en taille et en type. Leur type est vérifié par leur contenu, pas par leur extension.
- **SEC-17** — Les en-têtes de sécurité sont activés (helmet ou équivalent), et le CORS est restreint aux origines connues.
- **SEC-18** — Les dépendances sont surveillées (Dependabot) et les alertes critiques sont traitées en priorité.
