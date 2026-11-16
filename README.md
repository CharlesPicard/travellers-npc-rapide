# travellers-npc-rapide

Générateur de PNJ aléatoires pour Traveller (Mongoose 2e), selon la création par packages du *Traveller Companion Update 2024*.

Un clic tire une origine, une carrière, les caractéristiques, les compétences cumulées, les bénéfices et la finalisation, puis ajoute un nom et un court portrait.

## Utilisation

Ouvre `index.html` dans un navigateur. Rien à installer, et l'outil fonctionne hors ligne (seules les polices viennent du web).

- **Générer** : origine et carrière au hasard ou imposées, méthode de caractéristiques, nombre de PNJ, graine pour retrouver un tirage.
- **Gardés** : les fiches mises de côté, conservées dans le navigateur.
- **Données** : toutes les tables sont modifiables (packages, règles, finalisation, catalogue de compétences), avec export et import en JSON.

## Ce que le générateur applique

1. Caractéristiques : 2D × 6 répartis selon la carrière, 2D × 6 dans l'ordre, ou tableau fixe.
2. Package d'origine : modificateurs, compétences, bénéfices. Le PNJ a 22 ans.
3. Package de carrière : modificateurs, compétences, bénéfices, puis 3D années.
4. Finalisation : un choix de carrière, une paire de compétences de Voyageur et un bénéfice, tirés au hasard.

Les niveaux de compétence s'additionnent jusqu'à 4, et les caractéristiques restent entre 1 et 15. Noble exige SOC 10+ : la carrière n'est pas tirée au hasard en dessous, et si elle est imposée, SOC est relevé à 10.

## Fichiers

| Fichier | Rôle |
| --- | --- |
| `index.html` | Page et styles |
| `app.js` | Interface |
| `engine.js` | Moteur de génération, sans dépendance |
| `packages.js` | Tables de règles et habillage (noms, portraits) |
| `test/engine.test.js` | Tests du moteur |

Lancer les tests :

```bash
node test/engine.test.js
```

## Écarts assumés par rapport au livre

- « Profession (any suitable) » (Low-Tech, Barbarian) est remplacé par une liste de métiers adaptés.
- « Pilot (starship) » et « Electronics (computer) » sont ramenés aux spécialités du livre de base, « spacecraft » et « computers ».
- Les caractéristiques prioritaires par carrière, les intitulés de PNJ et les portraits sont des ajouts de l'outil.

## Mentions

Outil de fan non officiel, sans lien avec Mongoose Publishing. Traveller est une marque de Mongoose Publishing. Les tables de packages proviennent du *Traveller Companion Update 2024* ; le livre reste nécessaire pour jouer.
