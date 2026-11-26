# Multi-stage build for the Angular frontend (build context = repo root).
#
#   docker build -f deploy/Dockerfile .                                   dev-server image (api-dev.breedly.us)
#   docker build -f deploy/Dockerfile --build-arg NG_CONFIG=prod .        production image (api.breedly.us)
#   docker build -f deploy/Dockerfile --target test -t fe-test . && docker run --rm fe-test   unit tests

FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY . .

# Unit tests (Karma + headless Chromium). Run with `docker run`, not at build time,
# so a test failure is reported as a failed test step rather than a failed build.
FROM deps AS test
RUN apk add --no-cache chromium
ENV CHROME_BIN=/usr/bin/chromium-browser
CMD ["npx", "ng", "test", "--watch=false", "--browsers=ChromeHeadlessCI", "--reporters=dots"]

FROM deps AS builder
# Angular build configuration: `production` (dev server, environment.ts) or `prod` (breedly.us, environment.prod.ts)
ARG NG_CONFIG=production
RUN npm run build -- --configuration ${NG_CONFIG}

# Runtime stage with nginx
FROM nginx:alpine
COPY deploy/nginx.conf /etc/nginx/nginx.conf
COPY deploy/security-headers.conf /etc/nginx/security-headers.conf
COPY --from=builder /app/dist/pets.frontend.dev /usr/share/nginx/html
EXPOSE 80

# 127.0.0.1, not localhost: busybox wget resolves localhost to ::1 and nginx listens on IPv4 only
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
