FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci || npm install

COPY . .

EXPOSE 5173

# API proxy target is configurable so the same image works against a
# separate backend container (docker compose) or a host backend.
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
