FROM node:20-slim
RUN npm i -g pnpm
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod
COPY . .
EXPOSE 3000
CMD ["node", "index.js"]

