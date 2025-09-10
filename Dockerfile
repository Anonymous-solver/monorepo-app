# ---------- Build React client ----------
FROM node:18-alpine AS client-build
WORKDIR /app/client
# client has its own lockfile
COPY client/package.json client/yarn.lock ./
RUN yarn install --frozen-lockfile
COPY client/ .
RUN yarn build

# ---------- Install server deps from ROOT (server has no package.json) ----------
FROM node:18-alpine AS deps
WORKDIR /app
# use the ROOT lockfile + package.json
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
# bring in server source
COPY server ./server

# ---------- Final runtime image ----------
FROM node:18-alpine
WORKDIR /app
# node_modules from root install
COPY --from=deps /app/node_modules ./node_modules
# server source
COPY --from=deps /app/server ./server
# # built client -> serve as static files
# COPY --from=client-build /app/client/build ./server/public

# Copy client build into final image
COPY --from=client-build /app/client/build ./client/build

EXPOSE 3000
CMD ["node", "server/server.js"]


# docker build -t monorepo-app .
# docker run -d -p 3000:3000 --name monorepo-app monorepo-app




