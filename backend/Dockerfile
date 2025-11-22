# Multi-stage Docker build for Express backend with React frontend static files

# Stage 1: Build the React frontend
FROM node:25-alpine AS frontend-build

WORKDIR /app/frontend

# Copy frontend source
COPY ./frontend/package*.json ./
RUN npm install

# Copy frontend source code
COPY ./frontend/ ./

# Build the frontend
RUN npm run build

# Stage 2: Build the backend
FROM node:25-alpine

# Install SQLite and build dependencies for better-sqlite3
RUN apk add --no-cache sqlite python3 make g++ py3-setuptools

# Set working directory
WORKDIR /app

# Copy backend package files
COPY ./backend/package*.json ./

# Install backend dependencies (including dev deps for build, then remove)
RUN npm install

# Copy backend source
COPY ./backend/ .

# Copy built frontend to backend public directory
COPY --from=frontend-build /app/frontend/dist ./public

# Create data directory
RUN mkdir -p /app/data

# Set proper permissions
RUN chown -R node:node /app
USER node

# Expose port
EXPOSE 3001

# Start the application
CMD ["npm", "start"]
