FROM node:20-alpine AS builder
WORKDIR /app

# We assume docker build context is the root dir (school-bus-tracker)
COPY shared-types/ ./shared-types/
RUN cd shared-types && npm install && npm run build

COPY backend/package*.json ./backend/
RUN cd backend && npm install

COPY backend/ ./backend/
RUN cd backend && npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/shared-types ./shared-types
COPY --from=builder /app/backend/node_modules ./backend/node_modules
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/package*.json ./backend/

WORKDIR /app/backend
CMD ["npm", "run", "start:prod"]
EXPOSE 3000
