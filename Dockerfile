FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm install

COPY . .

RUN npx tsc

RUN cp -R src/public dist/public

EXPOSE ${PORT}

CMD ["node", "dist/server.js"]
