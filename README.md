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

## SQL Playground

The `MSSQL Execute` node includes a built-in SQL Playground, allowing you to write and run SQL queries interactively.

## Example Flow: Full Data Type Coverage

The included `example.json` demonstrates a complete flow that includes:

1. Simulating input using an `inject` node
2. Executing CREATE, INSERT, SELECT, and DROP operations with the `MSSQL Execute` node
3. In streaming mode, use the `MSSQL Control` node to request the next batch.
4. Observing results with a `debug` node

Refer to the `example.json` file to load and explore the complete flow.
```
[{"id":"84d53f75e7029a9e","type":"MSSQL Execute","z":"dda5777ca70ca457","name":"","connection":"9ecc17c92e0eb62c","querySource":"auto","command":"INSERT INTO Users (Name, Email) VALUES ('John', N'john@example.com');\n","deliveryMethod":"direct","maxbatchrecords":"100","outputPropType":"msg","outputProp":"payload","x":360,"y":440,"wires":[["28b5c876aa683789"]]},{"id":"7175de3d245e8f73","type":"MSSQL Execute","z":"dda5777ca70ca457","name":"","connection":"9ecc17c92e0eb62c","querySource":"auto","command":"SELECT * FROM Users;","deliveryMethod":"direct","maxbatchrecords":"100","outputPropType":"msg","outputProp":"payload","x":360,"y":600,"wires":[["235be49af2ffb72b"]]},{"id":"70eba4faf4898e40","type":"inject","z":"dda5777ca70ca457","name":"","props":[],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","x":170,"y":600,"wires":[["7175de3d245e8f73"]]},{"id":"235be49af2ffb72b","type":"debug","z":"dda5777ca70ca457","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"false","statusVal":"","statusType":"auto","x":590,"y":600,"wires":[]},{"id":"2e15ec855de77891","type":"inject","z":"dda5777ca70ca457","name":"","props":[],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","x":170,"y":440,"wires":[["84d53f75e7029a9e"]]},{"id":"28b5c876aa683789","type":"debug","z":"dda5777ca70ca457","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"false","statusVal":"","statusType":"auto","x":590,"y":440,"wires":[]},{"id":"807710a20af36f9c","type":"comment","z":"dda5777ca70ca457","name":"Insert","info":"","x":170,"y":400,"wires":[]},{"id":"e2f369d6d32bedae","type":"comment","z":"dda5777ca70ca457","name":"Query","info":"","x":170,"y":560,"wires":[]},{"id":"ceb757652cc01d17","type":"MSSQL Execute","z":"dda5777ca70ca457","name":"","connection":"9ecc17c92e0eb62c","querySource":"auto","command":"CREATE TABLE Users (\n    ID INT IDENTITY(1,1) PRIMARY KEY,\n    Name NVARCHAR(50),\n    Email NVARCHAR(100),\n    CreatedAt DATETIME DEFAULT GETDATE()\n);","deliveryMethod":"direct","maxbatchrecords":"100","outputPropType":"msg","outputProp":"payload","x":360,"y":280,"wires":[["82b010587df95c29"]]},{"id":"b7362f2eeaf88863","type":"inject","z":"dda5777ca70ca457","name":"","props":[],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","x":170,"y":280,"wires":[["ceb757652cc01d17"]]},{"id":"82b010587df95c29","type":"debug","z":"dda5777ca70ca457","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"false","statusVal":"","statusType":"auto","x":590,"y":280,"wires":[]},{"id":"c292b795b50ebaa5","type":"comment","z":"dda5777ca70ca457","name":"Create table","info":"","x":190,"y":240,"wires":[]},{"id":"ebefbbe0a1300cfc","type":"MSSQL Execute","z":"dda5777ca70ca457","name":"Streaming Out","connection":"9ecc17c92e0eb62c","querySource":"auto","command":"SELECT * FROM Users;","deliveryMethod":"streaming","maxbatchrecords":"2","outputPropType":"msg","outputProp":"payload","x":360,"y":760,"wires":[["68eec76c44a4cf13","08ec6ac1787f2122"]]},{"id":"a8374b6b5b7289ba","type":"inject","z":"dda5777ca70ca457","name":"","props":[],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","x":170,"y":760,"wires":[["ebefbbe0a1300cfc"]]},{"id":"68eec76c44a4cf13","type":"debug","z":"dda5777ca70ca457","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"false","statusVal":"","statusType":"auto","x":590,"y":760,"wires":[]},{"id":"1242a4fd3b92d75b","type":"comment","z":"dda5777ca70ca457","name":"Query with streaming","info":"","x":220,"y":720,"wires":[]},{"id":"08ec6ac1787f2122","type":"MSSQL Control","z":"dda5777ca70ca457","name":"","targetNodeId":"","selectMode":"specific","selectedNodes":["ebefbbe0a1300cfc"],"action":"continue","x":600,"y":800,"wires":[]},{"id":"72f94ba48e088df0","type":"MSSQL Execute","z":"dda5777ca70ca457","name":"","connection":"9ecc17c92e0eb62c","querySource":"auto","command":"DROP TABLE Users;","deliveryMethod":"direct","maxbatchrecords":"100","outputPropType":"msg","outputProp":"payload","x":360,"y":920,"wires":[["c9f381bfa5cc178f"]]},{"id":"248ef8b4fea52e8b","type":"inject","z":"dda5777ca70ca457","name":"","props":[],"repeat":"","crontab":"","once":false,"onceDelay":0.1,"topic":"","x":170,"y":920,"wires":[["72f94ba48e088df0"]]},{"id":"c9f381bfa5cc178f","type":"debug","z":"dda5777ca70ca457","name":"","active":true,"tosidebar":true,"console":false,"tostatus":false,"complete":"false","statusVal":"","statusType":"auto","x":590,"y":920,"wires":[]},{"id":"64ff1fcb66278a32","type":"comment","z":"dda5777ca70ca457","name":"Drop table","info":"","x":180,"y":880,"wires":[]},{"id":"9ecc17c92e0eb62c","type":"MSSQL Connection","name":"","server":"127.0.0.1","port":"1433","authType":"default","domain":"","database":"example","appName":"atomic","encryption":true,"trustServerCertificate":true,"poolMin":1,"poolMax":10,"poolIdleTimeoutMillis":30000,"requestTimeout":15000,"connectionTimeout":15000,"connectionRetryInterval":3000}]
```

## Commercial Support

Brobridge provides the customer service which contains comprehensive technical and commercial support for the module.

## License

This module is licensed under the Apache License.

## Authors

Copyright(c) 2025 Fred Chien <<fred@brobridge.com>>