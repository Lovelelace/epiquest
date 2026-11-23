# 07 — Accessibilité

Le référentiel est le niveau **AA des WCAG 2.2** (RGAA en France), sur le web et sur le mobile. L'accessibilité se construit avec chaque écran : on ne l'ajoute pas à la fin.

## Web — structure

- **A11Y-01** — On utilise le HTML sémantique avant ARIA : `<button>` pour une action, `<a>` pour une navigation, `<nav>`, `<main>`, `<header>`, listes et tableaux réels.
- **A11Y-02** — Chaque page a un `<title>` unique, un seul `<h1>` et des titres hiérarchisés sans saut de niveau.
- **A11Y-03** — Chaque champ de formulaire a un libellé visible associé (`<label for>`). Les erreurs de saisie sont liées au champ (`aria-describedby`) et annoncées.
- **A11Y-04** — Toute image porteuse de sens a un texte alternatif. Une image décorative a `alt=""`.

## Web — clavier

- **A11Y-05** — Toute fonctionnalité est utilisable **au clavier seul**, y compris ce qui se fait à la souris (glisser-déposer, dessin, déplacement sur une carte). Il existe toujours une alternative au clavier.
- **A11Y-06** — L'ordre de tabulation suit l'ordre visuel et logique. Pas de `tabindex` positif.
- **A11Y-07** — Le focus est **toujours visible**. On NE DOIT JAMAIS écrire `outline: none` sans style de remplacement.
- **A11Y-08** — Une modale piège le focus tant qu'elle est ouverte, se ferme avec `Échap` et rend le focus à l'élément qui l'a ouverte.
- **A11Y-09** — Les raccourcis clavier sont documentés et ne bloquent pas les raccourcis des lecteurs d'écran.

## Web — contenu dynamique et visuel

- **A11Y-10** — Un contenu qui change sans action de l'utilisateur (événement de partie, résultat d'un jet, tour suivant) est annoncé par une zone `aria-live`.
- **A11Y-11** — Tout contenu dessiné en canvas ou en SVG a une **alternative textuelle équivalente** et navigable.
- **A11Y-12** — Contraste d'au moins **4,5:1** pour le texte courant et 3:1 pour le grand texte et les composants d'interface.
- **A11Y-13** — Une information n'est **jamais portée par la seule couleur** : on ajoute une icône, un motif ou un texte (PV bas, états, alliés et ennemis).
- **A11Y-14** — Le contenu reste utilisable avec un zoom à **200 %**, sans perte d'information ni défilement horizontal pour le texte.
- **A11Y-15** — Les animations respectent `prefers-reduced-motion` et peuvent être désactivées dans l'interface.
- **A11Y-16** — Les zones cliquables mesurent au moins 24 × 24 px.

## Mobile

- **A11Y-17** — Chaque élément interactif a un libellé lu par TalkBack (`accessibilityLabel`) et un rôle (`accessibilityRole`).
- **A11Y-18** — Les tailles de texte suivent le réglage du système (taille dynamique), sans texte coupé.
- **A11Y-19** — Les zones tactiles mesurent au moins **48 × 48 dp**.
- **A11Y-20** — Les règles de contraste, de couleur et d'animation du web s'appliquent aussi au mobile.

## Vérification

- **A11Y-21** — Chaque PR qui modifie une interface est testée **au clavier** par son auteur. Un nouvel écran est aussi testé au **lecteur d'écran** (NVDA ou VoiceOver sur le web, TalkBack sur le mobile).
- **A11Y-22** — Les tests de composants incluent un contrôle axe automatique (voir `TEST-08`).
- **A11Y-23** — Une limite d'accessibilité connue et non corrigée est notée dans la déclaration d'accessibilité, avec une issue ouverte.
