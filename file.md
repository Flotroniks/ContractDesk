

# 🏠 ContractDesk

**Application de gestion locative multi-utilisateur – 100% locale (Electron + React + SQLite)**

---

## ✨ Description

**ContractDesk** est une application de bureau développée avec **Electron, React, Tailwind et SQLite**, permettant de :

* gérer plusieurs utilisateurs localement
* administrer des biens immobiliers
* créer et suivre des locataires
* établir des contrats de location
* générer automatiquement des échéances de loyers
* **enregistrer les mensualités de crédits immobiliers**
* **calculer la rentabilité mensuelle (positif ou négatif)**
* suivre les encaissements mensuels
* afficher un prévisionnel simple sur le mois courant

L’application fonctionne **offline**, toutes les données sont stockées en **local** dans une base SQLite.
Aucune donnée n’est envoyée sur Internet.

---

## 🎯 Objectif pédagogique (TP Electron)

Démontrer la capacité à réaliser une application desktop moderne avec :

* persistance locale via SQLite
* interactions entre process **main** et **renderer** via IPC sécurisé
* interface utilisateur réactive (React + Tailwind)
* modularité du code (repositories + services métiers)
* tests unitaires
* CI GitHub Actions (build + test)

---

## 🧑‍💻 Stack technique

| Composant       | Technologie                        |
| --------------- | ---------------------------------- |
| Desktop App     | Electron                           |
| UI              | React + Tailwind + Vite            |
| Base de données | SQLite (better-sqlite3)            |
| IPC             | contextBridge + handlers sécurisés |
| Tests           | Vitest / Jest                      |
| CI              | GitHub Actions (build + tests)     |

---

# 🚀 Fonctionnalités (V0 – Version livrée)

---

## 🔐 Multi-utilisateur (offline)

* Écran de connexion local
* Création de comptes utilisateurs
* Chaque utilisateur voit uniquement **ses propres données**
* Toutes les entités métier sont associées à `userId`

---

## 🏘 Gestion des biens immobiliers

* Création / modification / archivage
* Informations :

  * nom, adresse, type de bien, surface
  * charges et **loyer de base conseillé**
* Association d’un bien à un ou plusieurs contrats de location

---

## 👤 Gestion des locataires

* Création / modification
* Coordonnées (email, téléphone…)
* Type (particulier ou société)
* Notes / remarques libres

---

## 📄 Gestion des contrats (baux)

* Lien entre **bien + locataire**
* Dates : début + fin optionnelle
* Dépôt, fréquence, montant du loyer et charges
* Statut : `actif`, `terminé`, `résilié`

---

## 💰 Échéances de loyers (Due)

* Génération automatique sur **12 mois** à partir d’un contrat
* Statuts : `pending`, `paid`, `overdue`
* Marquage d’un loyer comme payé avec date de paiement
* Filtrage par mois en cours

---

# 🆕 💸 Gestion des crédits immobiliers (V0)

### ✨ Objectif

Associer à chaque bien une mensualité de crédit, afin de calculer la **rentabilité réelle** du portefeuille locatif.

### 📄 Fonctionnalités

* Création de mensualités de crédit par bien :

  * `monthlyAmount`
  * associée à `propertyId`
  * associée à `userId`
* Possibilité d’activer/désactiver un crédit (ex : remboursé)

### 🧮 Calcul automatique de rentabilité mensuelle

```
Résultat du mois = Loyers encaissés – Mensualités de crédits
```

👉 Affiché directement dans le tableau de bord du mois courant :

* **positif** (profit)
* **négatif** (déficit)

Avec un code couleur (ex : vert / rouge).

---

# 📊 Tableau de bord (V0)

Le Dashboard affiche :

* Loyers attendus ce mois-ci
* Loyers encaissés
* Loyers en retard
* **Mensualités de crédits appliquées au mois en cours**
* **Résultat du mois (positif ou négatif)**

👍 **C’est un prévisionnel local réel**, très utile pour un propriétaire.

---

# 📈 Roadmap – V1 (évolution offline)

🎯 L’objectif de V1 est d’ajouter une **couche analytique locale**, toujours offline, sans serveur.

## 📊 Nouveaux graphiques V1

### 1️⃣ Cashflow mensuel (prévu vs encaissé)

Suivi sur 6 ou 12 mois :

* loyers prévus
* loyers réellement encaissés
* écarts de paiement

---

### 2️⃣ Répartition des revenus par bien

Graphique de performance locative par bien :

* encaissements réellement perçus
* comparaison visuelle entre biens

---

### 3️⃣ Fiabilité des paiements

Pour chaque mois :

* % loyers payés à l’heure
* % loyers payés en retard

---

### 4️⃣ (optionnel) Occupation / vacance locative

Timeline ou bar chart montrant :

* périodes louées
* périodes vacantes

---

## 🔧 Impacts techniques V1

* Création d’un **analyticsService** (côté main)
* Calculs dérivés des tables :

  * `Property`, `Lease`, `Due`, `Credit`, `User`
* Pas de modification du modèle SQLite
* Visualisation en React via Chart.js / Recharts

---

# 🗺 Roadmap long terme (V2 / V3)

## **V2 – Multi-poste + synchronisation**

* Serveur HTTPS léger
* Comptes multi-appareils
* Sync offline-first
* Consolidation multi-portefeuille
* Graphiques globaux issus de données synchronisées

---

## **V3 – Version PRO**

* Génération automatique de quittances PDF
* Rappels automatiques (notifications locales ou mails)
* Simulation de scénarios locatifs (rendement, vacance…)
* Automatisation des échéances non locatives (assurance, entretien)

---

# 🏛 Architecture (V0)

```
Electron Main
   └── SQLite (better-sqlite3)
   └── IPC handlers (CRUD + génération échéances)
       └── Preload (contextBridge)
           └── Renderer React (UI)
```

---

# 📂 Structure du projet

```
contractdesk/
├─ electron/
│  ├─ main.cjs
│  ├─ preload.cjs
│  └─ db/
│      ├─ database.cjs
│      ├─ migrations.cjs
│      ├─ propertyRepo.cjs
│      ├─ tenantRepo.cjs
│      ├─ leaseRepo.cjs
│      ├─ dueRepo.cjs
│      └─ creditRepo.cjs
├─ src/ (React + Tailwind + Vite)
│  ├─ pages/
│  ├─ components/
│  ├─ styles.css
│  └─ main.tsx
├─ tests/
│  ├─ leaseService.test.ts
│  ├─ dueStatus.test.ts
│  └─ creditForecast.test.ts (optionnel)
├─ docs/
│  ├─ use_cases.md
│  ├─ modeles_donnees.md
│  ├─ analytics_v1.md
│  └─ architecture.md
├─ .github/workflows/ci.yml
└─ package.json
```

---

# 🧪 Tests unitaires

* Tests sur la génération d’échéances (`leaseService`)
* Tests sur le calcul des statuts (`dueStatus`)
* **Test sur le résultat mensuel (V0)**

  * revenu encaissé – mensualités de crédits
* Pas de tests UI
* Lancement automatique via GitHub Actions

---

# ⚙️ Installation & exécution

```bash
git clone https://github.com/xxxxx/contractdesk
cd contractdesk
npm install
npm run dev
```

> `npm run dev` lance simultanément :
>
> * Vite (UI React)
> * Electron (fenêtre desktop)

---

# 🤝 Contribution

Idées de contributions futures :

* optimisation UI
* services métier supplémentaires
* nouveaux graphiques analytics
* internationalisation
* synchronisation serveur (V2)

---

# 📝 Licence

Au choix : MIT, GPL, ou propriétaire — selon votre usage.

---

# ⭐ Ce que le V0 démontre

* Multi-utilisateur local
* Gestion complète immobilière
* Prévisionnel intelligent
* **Rentabilité réelle (profit / déficit) grâce au suivi des crédits**
* Architecture propre, testable, scalable
* Vision produit claire (V1 / V2 / V3)

---

Si tu veux, je peux maintenant **ajouter :**

* un **diagramme Mermaid des entités incluant Credit**
* ou une **capture d’écran maquette du Dashboard**
* ou un **diagramme d’architecture future V1**

Dis-moi 🔥
