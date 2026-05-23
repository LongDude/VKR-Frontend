FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci \
    && mkdir -p /opt/node_modules \
    && cp -a node_modules/. /opt/node_modules/

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev"]
