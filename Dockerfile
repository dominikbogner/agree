FROM node:22-alpine

WORKDIR /app

# 1. Package.json kopieren
COPY package*.json ./

# 2. Prisma Schema kopieren (NEU)
COPY prisma ./prisma/

# 3. Abhängigkeiten installieren (jetzt findet postinstall das Schema!)
RUN npm install --include=dev

# 4. Restlichen Code kopieren
COPY . .

# 5. App bauen
RUN npm run build

EXPOSE 3000
ENV NODE_ENV=production

CMD sh -c "npx prisma migrate deploy && npm start"
