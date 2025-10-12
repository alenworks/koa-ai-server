# Dockerfile for Koa API - testing environment
FROM node:18-alpine

# set working dir
WORKDIR /usr/src/app

# set environment for testing
ENV NODE_ENV=testing
ENV PORT=3001

# install dependencies (prefer package-lock for reproducible installs)
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci --silent; else npm install --silent; fi

# copy app sources
COPY . .

# create non-root user and switch
RUN addgroup -S app && adduser -S -G app app \
    && chown -R app:app /usr/src/app
USER app

# expose port (override via -e PORT=...)
EXPOSE ${PORT}

# default command (expects a "start" script in package.json)
CMD ["npm", "run", "start"]