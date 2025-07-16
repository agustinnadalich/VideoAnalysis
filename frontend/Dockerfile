FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

ENV NODE_OPTIONS=--openssl-legacy-provider

EXPOSE 3000

CMD ["npm", "run", "dev"]