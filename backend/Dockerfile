# Stage 1: Build frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY ./frontend/package*.json ./
# Use --silent for cleaner logs
RUN npm install --silent
COPY ./frontend/ ./
RUN npm run build

# Stage 2: Build and Run Backend
FROM node:20-alpine

# Install build dependencies for sqlite3 (python3, make, g++) and the runtime sqlite library/headers
RUN apk add --no-cache sqlite-libs sqlite sqlite-dev python3 make g++

WORKDIR /app

COPY ./backend/package*.json ./

RUN npm install --unsafe-perm && npm rebuild sqlite3

COPY ./backend/ ./
# Copy the built frontend assets to the backend's public directory
COPY --from=frontend-build /app/frontend/dist ./public

# Setup data directory and permissions
RUN mkdir -p /app/backend/data
RUN chown -R node:node /app

USER node

EXPOSE 3001
CMD ["npm", "start"]
