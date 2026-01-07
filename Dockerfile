#wbl-frontend\Dockerfile
# ---------- Build stage ----------
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

# ---------- Run stage ----------
FROM node:18-alpine

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

COPY --from=builder /app ./

EXPOSE 8080

CMD ["npm", "start", "--", "-p", "8080"]
