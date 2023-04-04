# syntax = docker/dockerfile:1.2

FROM node:16.2-alpine

EXPOSE 8081
WORKDIR /app
COPY web .
RUN npm install

RUN ---mount=type=secret,id=_env,dst=/etc/secrets/.env cp /etc/secrets/env .env

RUN cd frontend && npm install && npm run build
CMD ["npm", "run", "serve"]
