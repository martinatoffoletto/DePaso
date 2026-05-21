# DePaso - Monolito modular

Repositorio base para prototipo funcional de logistica urbana colaborativa para AMBA.

## Carpetas

- `depaso_rest`: backend FastAPI por capas, modular por dominio.
- `depaso_web`: app mobile (React Native + Expo).

## Principios de arquitectura

- Monolito modular orientado a dominio.
- Separacion por capas: API, Application, Domain, Infrastructure.
- Contratos estables entre modulos para facilitar futura extraccion a microservicios.
- Persistencia prevista en PostgreSQL + PostGIS (SQLAlchemy ORM).

## Modulos de negocio contemplados

- Usuarios
- Transportistas multimodales
- Envios (dedicado/colaborativo)
- Matching inteligente por scoring
- Impacto ambiental (CO2)
- Vision computacional para clasificacion de carga
