# atomic-mssql

MSSQL Module for Brobridge Atomic (Compatible with Node-RED).

## Overview

`@brobridge/atomic-mssql` is a Microsoft SQL Server database module designed specifically for Atomic, fully compatible with the Node-RED development environment. It provides three main nodes:

- **MSSQL Connection**: Connection configuration and pool manager  
- **MSSQL Execute**: Query execution  
- **MSSQL Control**: Control flow node for streaming data


## Installation

```sh
npm install @brobridge/atomic-mssql
```


## Features

- Efficient connection pool support with configurable options  
- Static or dynamic SQL execution via `msg.query`  
- Delivery options:  
  - `direct`: returns all results at once  
  - `streaming`: sends rows in batches  
- SQL Playground UI to test queries interactively  
- Supports `continue` and `break` controls for streaming sessions  

## MSSQL Connection Node

### MSSQL Connection

Manages database configuration and connection pool options.

- Required fields: `server`, `port`, `username`, `password`, `database`
- Configurable: `appName`, timeouts, reconnect interval
- Pool options: `min`, `max`, `idleTimeoutMillis`

Defines a reusable SQL Server connection.
| Setting | Purpose |
|---------|---------|
| `server`, `port`, `database` | Target SQL Server instance |
| `username`, `password` | SQL authentication (or leave blank for other auth types) |
| `appName` | Appears in SQL Server logs |
| **`encrypt`** | Enable TLS; must be `true` for `trustServerCertificate` to take effect |
| **`trustServerCertificate`** | If `true`, skips certificate validation (dev / self‑signed) |
| `connectionTimeout`, `requestTimeout` | Time‑outs in ms |
| `connectionRetryInterval` | Re‑connect delay in ms |
| Pool – `min`, `max`, `idleTimeoutMillis` | Connection‑pool tuning |

### MSSQL Execute

Executes SQL queries with flexible query sources and delivery modes.

- **Query Source**:
  - `auto`: Uses embedded SQL command
  - `dynamic`: Uses `msg.query` as input
- **Delivery Mode**:
  - `direct`: Entire result set is returned
  - `streaming`: Sends rows in batches with session control
- **Output**:
  - Output to `msg.payload` or custom property
- SQL Playground for testing queries interactively in the editor

### MSSQL Control

Controls flow when using `streaming` mode in MSSQL Execute node.

- `continue`: Resume the session
- `break`: Cancel the session
- Supports targeting specific Execute nodes

## Commercial Support

Brobridge provides the customer service which contains comprehensive technical and commercial support for the module.

## License

This module is licensed under the Apache License.

## Authors

Copyright(c) 2025 Fred Chien <<fred@brobridge.com>>