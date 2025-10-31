FROM oven/bun:1
WORKDIR /app

COPY package.json ./
RUN bun install

COPY frontend ./frontend
RUN cd frontend && bun install && bun run build

COPY server ./server
RUN mkdir -p server/public && cp -r frontend/dist/* server/public/

ENV NODE_ENV=production
EXPOSE 3000
CMD ["bun", "run", "server/index.ts"]
