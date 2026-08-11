FROM node:20-alpine

WORKDIR /app
EXPOSE 3001
COPY package*.json ./
RUN npm install

COPY . .

CMD ["npx", "tsx", "watch", "src/index.ts"]