FROM node:22-alpine

# OpenSSL für Prisma installieren (NEU)
RUN apk add --no-cache openssl

WORKDIR /app

# 1. Package.json kopieren
COPY package*.json ./

# 2. Prisma Schema kopieren
COPY prisma ./prisma/

# 3. Abhängigkeiten installieren
RUN npm install --include=dev

# 4. Restlichen Code kopieren
COPY . .

# 5. App bauen
RUN npm run build

EXPOSE 3000
ENV NODE_ENV=production

CMD sh -c "npx prisma migrate deploy && npm start"
