FROM node:20-alpine AS build
WORKDIR /app

# Copy full tree; .dockerignore excludes node_modules/dist so install is clean.
COPY . .

RUN yarn cache clean || true
RUN yarn install --network-timeout 300000 --frozen-lockfile || \
    (yarn cache clean && yarn install --network-timeout 300000 --frozen-lockfile)

RUN chmod +x ./node_modules/.bin/* || true
RUN yarn build

# Use Nginx to serve the built app
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
