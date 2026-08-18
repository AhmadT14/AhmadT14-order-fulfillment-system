# Order Fulfillment System

A backend system demonstrating event-driven microservices architecture: authentication, order processing, inventory management, and notifications, built as independently deployable services communicating via REST and Redis pub/sub.

## Architecture

- **Main app** (auth + orders) publishes an `order.created` event to **Redis** after creating an order, and calls the **Inventory service** directly over REST to check real-time product price and stock before doing so.
- **Redis** (pub/sub) broadcasts the `order.created` event to any subscribed services, independently and without waiting for a response.
- **Inventory service** (owns products + stock) subscribes to `order.created` and decrements stock accordingly. It also exposes a REST API for product reads/writes, backed by Redis-cached reads.
- **Notification service** independently subscribes to the same `order.created` event and logs a simulated notification, fully decoupled from inventory's success or failure.
- **PostgreSQL** is shared across the main app and inventory service; each service only queries the tables it owns.

### Services

- **Main app** — user auth (JWT), order creation and retrieval. Never queries product data directly; calls the inventory service over HTTP for real-time price/stock, since order creation needs that data to proceed before it can respond.
- **Inventory service** — owns all product data. Exposes a REST API for reads/writes, and independently subscribes to `order.created` events to decrement stock asynchronously. Caches product reads in Redis.
- **Notification service** — subscribes to `order.created` and logs a simulated notification. Fully decoupled: no database, no knowledge of the other services, no exposed port.

### Why two communication patterns?

- **Synchronous HTTP** is used where the caller needs an answer before it can proceed. The order service must know a product's real price and current stock before it can calculate a total and create an order, so it calls inventory directly and waits.
- **Asynchronous events (Redis pub/sub)** are used for side effects the caller doesn't need to wait on. Reducing stock and sending a notification both happen _because_ an order was placed, but the order service doesn't need either to complete before it can respond to the client. Publishing an event lets both inventory and notification react independently, in parallel, without knowing about each other or blocking the original request.

### Known tradeoffs

- **Stock reduction is fire-and-forget.** Basic Redis pub/sub has no delivery guarantee or retry. If the inventory service is down when an `order.created` event is published, that stock update is lost. A production system would use a message queue with acknowledgment (RabbitMQ, Redis Streams) or a compensating `order.failed` event so the order service could react to a downstream failure after the fact.
- **Database is currently shared.** All services connect to one PostgreSQL instance. Each service only queries the tables it owns, enforced at the code/API level, not yet at the database level. This is a deliberate first step: the service boundaries (who's allowed to touch what) are already in place, so physically splitting into separate databases later is a small, low-risk change rather than a redesign.
- **No reservation/locking on stock checks.** Two simultaneous orders could both read the same "in stock" quantity and both succeed, a classic race condition in distributed systems. Solving this properly needs reservation holds or optimistic locking, out of scope for this project but worth naming.

## Tech stack

- **Runtime:** Node.js, TypeScript
- **Framework:** Express
- **Database:** PostgreSQL, Drizzle ORM
- **Messaging / Cache:** Redis (pub/sub + read caching)
- **Auth:** JWT, bcrypt
- **Containerization:** Docker, Docker Compose (bind mounts + watch mode for live reload in dev)
- **CI:** GitHub Actions — lint and type-check on every push, run independently per service

## Running locally

Requires only Docker Desktop. No local Node.js or PostgreSQL installation needed, everything runs inside containers.

```bash
git clone <your-repo-url>
cd order-fulfillment-system
cp .env.example .env
```

Open `.env` and set your own `JWT_SECRET` (a long random string).

```bash
docker compose up --build
docker compose run app npx drizzle-kit push   # first time only — creates tables
```

- Main app: `http://localhost:3000`
- Inventory service: `http://localhost:3001`

### Development notes

- Code changes are picked up live via bind mounts + `tsx watch`, no rebuild needed for editing `.ts` files.
- Adding or removing a dependency in any `package.json` requires a full rebuild, since Docker caches installed dependencies as an image layer:
  ```bash
  docker compose down -v
  docker compose up --build
  ```
- Each service (`services/inventory`, `services/notification`) is a fully independent project: its own `package.json`, `node_modules`, and `Dockerfile`. Neither depends on the main app's dependencies.

## API overview

### Main app (`localhost:3000`)

| Method | Route         | Description                                                                                                                                               |
| ------ | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| POST   | `/register`   | Create a user                                                                                                                                             |
| POST   | `/login`      | Authenticate, returns a JWT                                                                                                                               |
| GET    | `/me`         | Get current user (auth required)                                                                                                                          |
| POST   | `/orders`     | Create an order (auth required). Body: `{ items: [{ productId, quantity }] }`. Price and total are calculated server-side, never trusted from the client. |
| GET    | `/orders/:id` | Get a single order (auth required, owner only)                                                                                                            |
| GET    | `/orders`     | List the current user's orders (auth required)                                                                                                            |

### Inventory service (`localhost:3001`)

| Method | Route           | Description                                                           |
| ------ | --------------- | --------------------------------------------------------------------- |
| POST   | `/products`     | Create a product. Body: `{ name, price, stock }`                      |
| GET    | `/products/:id` | Get a product (Redis-cached, 1 hour TTL, invalidated on stock change) |

## Environment variables

See `.env.example` for the full list. Summary:

| Variable                                              | Used by                           | Notes                                                                                                            |
| ----------------------------------------------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                                        | main app, inventory               | Postgres connection string. `localhost` for local commands, `postgres` (the compose service name) inside Docker. |
| `JWT_SECRET`                                          | main app                          | Signs and verifies auth tokens.                                                                                  |
| `REDIS_URL`                                           | main app, inventory, notification | `localhost:6379` locally, `redis:6379` inside Docker.                                                            |
| `PORT`                                                | main app, inventory               | Defaults to 3000 / 3001.                                                                                         |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | postgres container                | Used to build `DATABASE_URL` inside `docker-compose.yml`.                                                        |

Real secrets live only in `.env`, which is gitignored. `.env.example` contains placeholders only and is safe to commit.

## Roadmap

- [x] Auth (JWT, bcrypt, protected routes)
- [x] Orders with server-calculated totals and stock validation
- [x] Dockerized, multi-container setup with live reload
- [x] Inventory service — independent codebase, owns product data, HTTP API
- [x] Event-driven stock updates via Redis pub/sub
- [x] Notification service — independent subscriber to the same event
- [x] Redis caching on product reads, with invalidation on stock change
- [x] CI — lint and type-check per service on every push
