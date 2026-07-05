FROM node:20-alpine AS build
WORKDIR /app

# Copy full tree; .dockerignore excludes node_modules/dist so install is clean.
COPY . .

RUN yarn cache clean || true
RUN yarn install --network-timeout 300000 --frozen-lockfile || \
    (yarn cache clean && yarn install --network-timeout 300000 --frozen-lockfile)

RUN chmod +x ./node_modules/.bin/* || true

# Vite inlines VITE_* vars into the bundle at BUILD time — runtime env on the
# server can't affect the static files nginx serves. Pass them as build args
# from CI (GitHub Actions repo variables). The PostHog key is a public
# client-side token, safe to bake into the bundle.
ARG VITE_PUBLIC_POSTHOG_KEY
ARG VITE_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
ENV VITE_PUBLIC_POSTHOG_KEY=$VITE_PUBLIC_POSTHOG_KEY \
    VITE_PUBLIC_POSTHOG_HOST=$VITE_PUBLIC_POSTHOG_HOST

RUN yarn build

# Use Nginx to serve the built app
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
