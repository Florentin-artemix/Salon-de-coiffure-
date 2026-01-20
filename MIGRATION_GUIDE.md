# Guide de Migration - King and Queen Salon

Ce guide vous permet d'héberger l'application King and Queen Salon sur n'importe quelle plateforme d'hébergement, indépendamment de Replit.

## Table des matières

1. [Prérequis](#prérequis)
2. [Structure du projet](#structure-du-projet)
3. [Variables d'environnement](#variables-denvironnement)
4. [Base de données PostgreSQL](#base-de-données-postgresql)
5. [Stockage des fichiers](#stockage-des-fichiers)
6. [Firebase Authentication](#firebase-authentication)
7. [Déploiement sur VPS](#déploiement-sur-vps)
8. [Déploiement sur plateformes cloud](#déploiement-sur-plateformes-cloud)
9. [CI/CD avec GitHub Actions](#cicd-avec-github-actions)
10. [Checklist de production](#checklist-de-production)

---

## Prérequis

- Node.js v20+ (recommandé: v22)
- npm ou yarn
- PostgreSQL 14+
- Un compte Firebase (pour l'authentification)
- Un service de stockage cloud (Cloudflare R2, AWS S3, ou similaire)

---

## Structure du projet

```
king-queen-salon/
├── client/                 # Frontend React + Vite
│   ├── src/
│   │   ├── components/     # Composants UI réutilisables
│   │   ├── pages/          # Pages de l'application
│   │   ├── hooks/          # Hooks React personnalisés
│   │   └── lib/            # Utilitaires et constantes
│   ├── public/             # Fichiers statiques (logo, etc.)
│   └── index.html
├── server/                 # Backend Express.js
│   ├── routes.ts           # Endpoints API
│   ├── storage.ts          # Couche d'accès aux données
│   ├── db.ts               # Connexion PostgreSQL
│   ├── seed.ts             # Données initiales
│   ├── firebase-admin.ts   # Firebase Admin SDK
│   └── firebase-auth.ts    # Middleware d'authentification
├── shared/
│   └── schema.ts           # Schéma Drizzle ORM
├── dist/                   # Build de production (généré)
├── package.json
├── vite.config.ts
└── drizzle.config.ts
```

---

## Variables d'environnement

Créez un fichier `.env` à la racine du projet :

```env
# Base de données PostgreSQL
DATABASE_URL=postgresql://user:password@host:5432/database_name

# Firebase Admin SDK (contenu JSON sur une ligne)
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"..."}

# Session Express
SESSION_SECRET=votre_secret_de_session_tres_long_et_aleatoire

# Stockage (si vous utilisez Cloudflare R2)
R2_ACCOUNT_ID=votre_account_id
R2_ACCESS_KEY_ID=votre_access_key
R2_SECRET_ACCESS_KEY=votre_secret_key
R2_BUCKET_NAME=nom_du_bucket
R2_PUBLIC_URL=https://votre-bucket.r2.dev

# Port du serveur
PORT=5000

# Environnement
NODE_ENV=production
```

### Variables frontend (.env pour Vite)

Créez `client/.env` :

```env
VITE_FIREBASE_API_KEY=votre_api_key
VITE_FIREBASE_AUTH_DOMAIN=votre_projet.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=votre_projet_id
VITE_FIREBASE_STORAGE_BUCKET=votre_projet.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

---

## Base de données PostgreSQL

### Option 1: Service cloud PostgreSQL

Fournisseurs recommandés :
- **Neon** (gratuit jusqu'à 500MB) - https://neon.tech
- **Supabase** (gratuit jusqu'à 500MB) - https://supabase.com
- **Railway** - https://railway.app
- **Render** - https://render.com/docs/databases

### Option 2: PostgreSQL sur VPS

```bash
# Installation sur Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# Créer un utilisateur et une base de données
sudo -u postgres psql
CREATE USER salon_user WITH PASSWORD 'votre_mot_de_passe';
CREATE DATABASE king_queen_salon OWNER salon_user;
GRANT ALL PRIVILEGES ON DATABASE king_queen_salon TO salon_user;
\q
```

### Initialisation du schéma

```bash
# Installer les dépendances
npm install

# Pousser le schéma vers la base de données
npm run db:push

# Ou forcer si nécessaire
npm run db:push --force
```

### Schéma de la base de données

Les tables principales sont :
- `user_profiles` - Profils utilisateurs avec rôles
- `services` - Services du salon
- `team_members` - Membres de l'équipe
- `appointments` - Rendez-vous
- `time_slots` - Créneaux horaires
- `events` - Promotions et événements
- `gallery_images` - Galerie photos
- `notifications` - Notifications internes

---

## Stockage des fichiers

L'application utilise le stockage cloud pour les photos de profil. Voici comment migrer vers Cloudflare R2 (alternative à Replit Object Storage).

### Configuration Cloudflare R2

1. Créez un bucket R2 dans le dashboard Cloudflare
2. Créez des clés d'accès API (R2 -> Manage R2 API Tokens)
3. Configurez les variables d'environnement

### Modification du code pour R2

Créez `server/r2-storage.ts` :

```typescript
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function getUploadUrl(key: string, contentType: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(r2Client, command, { expiresIn: 3600 });
}

export async function deleteFile(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
  });
  await r2Client.send(command);
}

export function getPublicUrl(key: string): string {
  return `${process.env.R2_PUBLIC_URL}/${key}`;
}
```

### Installation des dépendances S3

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

### Mise à jour des routes d'upload

Modifiez `server/routes.ts` pour utiliser R2 :

```typescript
import { getUploadUrl, getPublicUrl } from "./r2-storage";

// Route pour demander une URL d'upload
app.post("/api/uploads/request-url", firebaseAuth, async (req, res) => {
  try {
    const { filename, contentType } = req.body;
    const key = `uploads/${Date.now()}-${filename}`;
    const uploadUrl = await getUploadUrl(key, contentType);
    const publicUrl = getPublicUrl(key);
    
    res.json({ uploadUrl, publicUrl, key });
  } catch (error) {
    res.status(500).json({ message: "Failed to generate upload URL" });
  }
});
```

---

## Firebase Authentication

### Configuration Firebase

1. Créez un projet Firebase : https://console.firebase.google.com
2. Activez Email/Password dans Authentication > Sign-in method
3. Téléchargez la clé de service :
   - Project Settings > Service accounts > Generate new private key
   - Copiez le contenu JSON dans `FIREBASE_SERVICE_ACCOUNT_KEY`

### Configuration frontend

Dans `client/src/lib/firebase.ts`, les valeurs sont lues depuis les variables d'environnement Vite :

```typescript
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
```

---

## Déploiement sur VPS

### Étape 1: Préparation du serveur (Ubuntu 22.04)

```bash
# Mise à jour du système
sudo apt update && sudo apt upgrade -y

# Installation de Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Installation de PM2 (gestionnaire de processus)
sudo npm install -g pm2

# Installation de Nginx (reverse proxy)
sudo apt install nginx -y

# Installation de Certbot (SSL)
sudo apt install certbot python3-certbot-nginx -y

# Configuration du firewall
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### Étape 2: Clonage et build

```bash
# Créer le répertoire
sudo mkdir -p /var/www/king-queen-salon
sudo chown $USER:$USER /var/www/king-queen-salon

# Cloner le projet
cd /var/www/king-queen-salon
git clone https://github.com/votre-username/king-queen-salon.git .

# Installer les dépendances
npm install

# Créer le fichier .env avec vos variables
nano .env

# Build du frontend
npm run build

# Initialiser la base de données
npm run db:push
```

### Étape 3: Configurer PM2

Créez `ecosystem.config.js` :

```javascript
module.exports = {
  apps: [{
    name: 'king-queen-salon',
    script: 'npm',
    args: 'run start',
    cwd: '/var/www/king-queen-salon',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
  }]
};
```

```bash
# Démarrer l'application
pm2 start ecosystem.config.js

# Sauvegarder la configuration
pm2 save

# Configurer le démarrage automatique
pm2 startup
```

### Étape 4: Configurer Nginx

Créez `/etc/nginx/sites-available/king-queen-salon` :

```nginx
server {
    listen 80;
    server_name votre-domaine.com www.votre-domaine.com;

    # Taille maximale des uploads
    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Activer le site
sudo ln -s /etc/nginx/sites-available/king-queen-salon /etc/nginx/sites-enabled/

# Tester la configuration
sudo nginx -t

# Redémarrer Nginx
sudo systemctl restart nginx

# Configurer SSL avec Let's Encrypt
sudo certbot --nginx -d votre-domaine.com -d www.votre-domaine.com
```

### Étape 5: Script de mise à jour

Créez `deploy.sh` :

```bash
#!/bin/bash
cd /var/www/king-queen-salon

# Récupérer les dernières modifications
git pull origin main

# Installer les nouvelles dépendances
npm install

# Rebuild
npm run build

# Appliquer les migrations
npm run db:push

# Redémarrer l'application
pm2 restart king-queen-salon

echo "Déploiement terminé!"
```

```bash
chmod +x deploy.sh
```

---

## Déploiement sur plateformes cloud

### Render

1. Connectez votre repo GitHub à Render
2. Créez un "Web Service"
3. Configurez :
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
4. Ajoutez les variables d'environnement
5. Créez une base PostgreSQL dans Render

### Railway

1. Connectez votre repo GitHub
2. Railway détecte automatiquement Node.js
3. Ajoutez un service PostgreSQL
4. Configurez les variables d'environnement

### DigitalOcean App Platform

1. Créez une App depuis votre repo GitHub
2. Ajoutez un composant Database (PostgreSQL)
3. Configurez les variables d'environnement
4. Déployez

---

## CI/CD avec GitHub Actions

Créez `.github/workflows/deploy.yml` :

```yaml
name: Deploy to VPS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /var/www/king-queen-salon
            git pull origin main
            npm install
            npm run build
            npm run db:push
            pm2 restart king-queen-salon
```

### Secrets GitHub à configurer

- `VPS_HOST`: IP de votre serveur
- `VPS_USER`: Utilisateur SSH (ex: root ou deploy)
- `VPS_SSH_KEY`: Clé privée SSH

---

## Checklist de production

### Sécurité

- [ ] Toutes les variables sensibles sont dans `.env` (non commité)
- [ ] HTTPS activé avec certificat SSL valide
- [ ] Headers de sécurité configurés (CORS, CSP, etc.)
- [ ] Rate limiting activé sur les routes sensibles
- [ ] Firebase Admin SDK correctement configuré

### Performance

- [ ] Build de production (`npm run build`)
- [ ] Compression gzip activée (Nginx)
- [ ] Assets statiques mis en cache
- [ ] Images optimisées

### Base de données

- [ ] Sauvegardes automatiques configurées
- [ ] Connexions SSL activées
- [ ] Pool de connexions optimisé

### Monitoring

- [ ] PM2 ou équivalent pour la gestion des processus
- [ ] Logs centralisés
- [ ] Alertes en cas d'erreur

### Scripts package.json pour production

```json
{
  "scripts": {
    "dev": "NODE_ENV=development tsx server/index.ts",
    "build": "vite build",
    "start": "NODE_ENV=production node dist/server/index.js",
    "db:push": "drizzle-kit push",
    "db:push:force": "drizzle-kit push --force"
  }
}
```

---

## Support

Pour toute question sur la migration, référez-vous à :

- Documentation Drizzle ORM: https://orm.drizzle.team
- Documentation Firebase: https://firebase.google.com/docs
- Documentation Vite: https://vitejs.dev
- Documentation Express: https://expressjs.com

---

**Bon déploiement !** 🚀
