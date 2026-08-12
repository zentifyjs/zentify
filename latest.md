# Benchmark Report

Generated at: 2026-08-11T09:35:25.040Z

## Environment

| Key | Value |
| --- | --- |
| Node.js | v22.22.0 |
| npm | 10.9.4 |
| OS | win32 10.0.26200 |
| Architecture | x64 |
| CPU | AMD Ryzen 5 7520U with Radeon Graphics          |
| CPU cores | 8 |
| RAM | 13.83 GB |
| Zentify version | 1.0.0 |
| Express version | 5.2.1 |
| NestJS (@nestjs/core) version | 11.1.29 |
| Fastify version | 5.11.3 |
| Zentify git commit | 9cb6acb42a405a69dfadf5da384239eb69aa51c1 |
| Zentify working tree clean | yes |
| Workspace git commit | n/a |
| Workspace working tree clean | n/a |
| Benchmark duration | 10s |
| Warmup duration | 5s |
| Repetitions (runs) | 1 |
| Concurrency levels | 1, 10, 100 |

## Notes

- Results shown are the **median** of all runs for each framework/scenario/concurrency combination. RPS column and P99 are the median across runs; Avg/P50/P95 shown come from the same summary run.
- Raw per-run autocannon results are preserved in `results/raw/`.

### Fairness & deviations

- All frameworks run on the same machine and the same Node.js binary (spawned via the same process.execPath).
- All frameworks expose the identical endpoints and return equivalent JSON.
- Keep-alive is enabled (autocannon default) and the same client (autocannon) is used for every framework.
- No database access, external network, artificial delay, authentication, ORM or compression middleware was added to any framework.
- Logging: NestJS runs with logger: false (default request logging disabled). Zentify logs startup lines to stdout (not configurable without modifying its source); them are streamed to log files only.
- Body parsing: Zentify uses its built-in JSON parser; Express uses express.json(); NestJS uses the default JSON body parser of the HTTP platform adapter; Fastify parses JSON with its built-in body parser (secure-json-parse under the hood). Responses are serialized to JSON by each framework's default serializer (Fastify does not use a response schema so it stays on the plain JSON.stringify path). All four have equivalent behavior for the workloads used here.
- Zentify route handlers are plain functions; NestJS uses a minimal controller with @Controller/@Get/@Post/@Param/@Query/@Body; Fastify uses async handlers. No Guards, Pipes, Interceptors, hooks or validation were added.
- A bug in Zentify's router (double slash in parameterized route paths, e.g. /users//:id) was fixed so the parameterized scenarios could run. See the README.

### Scope of results

These results are specific to this hardware, this Node.js version, this set of framework versions, this benchmark implementation, this workload and this configuration. They do not imply that any one framework is universally faster or slower.

## Static route

`GET /hello`

| Framework | Connections | RPS | Avg | P50 | P95 | P99 |
| --------- | ----------: | --: | --: | --: | --: | --: |
| zentify | 1 | 5,742 | 0.17 | 0.14 | 0.38 | 0.66 |
| fastify | 1 | 3,965 | 0.24 | 0.18 | 0.52 | 0.89 |
| zentify | 10 | 10,335 | 0.96 | 0.69 | 2.04 | 3.96 |
| fastify | 10 | 8,552 | 1.16 | 0.97 | 2.36 | 4.97 |
| zentify | 100 | 10,981 | 9.10 | 8.16 | 14.00 | 27.02 |
| fastify | 100 | 6,213 | 16.12 | 12.68 | 37.45 | 74.82 |

## Dynamic route

`GET /users/:id`

| Framework | Connections | RPS | Avg | P50 | P95 | P99 |
| --------- | ----------: | --: | --: | --: | --: | --: |
| zentify | 1 | 6,078 | 0.16 | 0.11 | 0.42 | 0.72 |
| fastify | 1 | 5,061 | 0.19 | 0.13 | 0.49 | 0.83 |
| zentify | 10 | 12,962 | 0.77 | 0.64 | 1.43 | 2.33 |
| fastify | 10 | 7,113 | 1.40 | 1.12 | 3.06 | 6.96 |
| zentify | 100 | 11,023 | 9.07 | 8.35 | 13.45 | 21.69 |
| fastify | 100 | 6,797 | 14.73 | 13.17 | 23.85 | 44.91 |

## Multi-param route

`GET /users/:id/posts/:postId`

| Framework | Connections | RPS | Avg | P50 | P95 | P99 |
| --------- | ----------: | --: | --: | --: | --: | --: |
| zentify | 1 | 6,683 | 0.15 | 0.10 | 0.36 | 0.64 |
| fastify | 1 | 3,271 | 0.29 | 0.18 | 0.77 | 1.45 |
| zentify | 10 | 11,107 | 0.90 | 0.68 | 1.91 | 3.54 |
| fastify | 10 | 7,970 | 1.25 | 1.01 | 2.86 | 5.16 |
| zentify | 100 | 8,048 | 12.42 | 10.22 | 22.91 | 49.49 |
| fastify | 100 | 7,917 | 12.68 | 10.94 | 21.42 | 55.36 |

## Query

`GET /users?name=john`

| Framework | Connections | RPS | Avg | P50 | P95 | P99 |
| --------- | ----------: | --: | --: | --: | --: | --: |
| zentify | 1 | 7,739 | 0.13 | 0.10 | 0.24 | 0.47 |
| fastify | 1 | 5,853 | 0.16 | 0.11 | 0.43 | 0.84 |
| zentify | 10 | 12,064 | 0.83 | 0.68 | 1.59 | 2.81 |
| fastify | 10 | 11,409 | 0.87 | 0.60 | 1.99 | 3.93 |
| zentify | 100 | 10,868 | 9.14 | 8.45 | 12.65 | 19.07 |
| fastify | 100 | 8,637 | 11.66 | 10.08 | 21.40 | 42.43 |

## JSON body

`POST /users`

| Framework | Connections | RPS | Avg | P50 | P95 | P99 |
| --------- | ----------: | --: | --: | --: | --: | --: |
| zentify | 1 | 3,469 | 0.28 | 0.21 | 0.71 | 1.11 |
| fastify | 1 | 2,180 | 0.45 | 0.33 | 0.93 | 1.50 |
| zentify | 10 | 6,405 | 1.56 | 1.12 | 3.35 | 5.72 |
| fastify | 10 | 5,126 | 1.95 | 1.64 | 3.40 | 6.20 |
| zentify | 100 | 5,252 | 19.03 | 16.37 | 38.60 | 63.90 |
| fastify | 100 | 3,414 | 29.31 | 25.08 | 62.90 | 86.66 |

