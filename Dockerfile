# Build context must be the `frontend/` directory (so package.json is the Vite app).
# Example: docker build -f Dockerfile -t topcoach-frontend .
#
# .dockerignore excludes host node_modules so COPY does not poison the image.
#
FROM node:20-alpine AS build
WORKDIR /app

# Copy sources + lockfiles first (host node_modules is ignored via .dockerignore)
COPY . .

RUN yarn cache clean || true
RUN yarn install --network-timeout 300000 --frozen-lockfile || \
    (yarn cache clean && yarn install --network-timeout 300000 --frozen-lockfile)

RUN chmod +x ./node_modules/.bin/* || true
RUN yarn build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
