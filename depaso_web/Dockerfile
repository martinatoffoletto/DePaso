# DePaso — panel web (Vite + React) — build estático servido por nginx
# Stage 1: build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# La URL de la API se hornea en tiempo de build (Vite). Por defecto apunta al
# backend publicado en localhost:8000 (el navegador corre en el host).
ARG VITE_API_URL=http://localhost:8000/api/v1
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Stage 2: runtime — nginx sirviendo los archivos estáticos
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s \
    CMD wget -q --spider http://localhost/ || exit 1
