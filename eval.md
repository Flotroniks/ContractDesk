# TP : Projet fil rouge

## Objectifs

Créer une application de bureau avec Electron. **Le sujet est libre**. L'application peut utiliser une API (custom ou publique) mais doit impérativement inclure une persistance locale des données.

Exemples d'applications possibles :

- Pokedex
- Budget personnel
- Gestionnaire de mots de passe
- Livre de recettes avec planificateur de repas et liste de courses
- ERP pour club sportif
- Gestionnaire de tâches avec intégration avancée dans l'OS
- Messagerie temps réel

## Temps alloué

Environ 20h durant le cours.

## Livrables

Les livrables sont attendus sur un dépôt GitHub/Gitlab public :

- Le code source de l'application Electron.
- Un fichier `README.md` décrivant l'application (description et contexte) et comment contribuer au projet.
- Un répertoire `docs` contenant la conception technique de l'application.
  - Use cases : définition des fonctionnalités principales
  - Modèles de données : description des entités et de leurs relations (UML, Mermaid, ou autre)
  - Diagrammes d'architecture : pour comprendre les composants de l'application et leurs interactions
- Une CI/CD basique qui construit l'application à chaque push sur la branche principale.

## Features requises

- Une interface utilisateur avec ou sans framework
- Une persistance des données pour au moins 2 entités dans une base de données relationnelle locale (ex SQLite)
- Des tests unitaires présents et fonctionnels sur au moins une partie du code
