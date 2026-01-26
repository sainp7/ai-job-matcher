############################
# 1️⃣ Build Stage
############################
FROM node:20-alpine AS builder

WORKDIR /app

# Copy only dependency files first (better caching)
COPY package.json package-lock.json ./
RUN npm ci

# Copy rest of the frontend source
COPY . .

# Build for production
RUN npm run build


############################
# 2️⃣ Production Runtime
############################
FROM nginx:alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built static files
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
