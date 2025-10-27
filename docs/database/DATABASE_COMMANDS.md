# Database Commands Reference

## Docker Commands (Command Line)

### Connect to Database
```bash
docker exec -it gokceinvoice-db psql -U postgres -d invoicedb
```

### List All Tables
```bash
docker exec Centipoise-db psql -U postgres -d invoicedb -c "\dt"
```

### View Table Structure
```bash
docker exec gokceinvoice-db psql -U postgres -d invoicedb -c "\d users"
docker exec gokceinvoice-db psql -U postgres -d invoicedb -c "\d invoices"
docker exec gokceinvoice-db psql -U postgres -d invoicedb -c "\d clients"
```

### Query Data

**Users:**
```bash
docker exec gokceinvoice-db psql -U postgres -d invoicedb -c "SELECT * FROM users;"
```

**Clients:**
```bash
docker exec gokceinvoice-db psql -U postgres -d invoicedb -c "SELECT * FROM clients;"
```

**Invoices:**
```bash
docker exec gokceinvoice-db psql -U postgres -d invoicedb -c "SELECT * FROM invoices;"
```

**Services:**
```bash
docker exec gokceinvoice-db psql -U postgres -d invoicedb -c "SELECT * FROM services;"
```

**Line Items:**
```bash
docker exec gokceinvoice-db psql -U postgres -d invoicedb -c "SELECT * FROM line_items;"
```

### Count Records
```bash
docker exec gokceinvoice-db psql -U postgres -d invoicedb -c "SELECT 
  (SELECT COUNT(*) FROM users) as users,
  (SELECT COUNT(*) FROM clients) as clients,
  (SELECT COUNT(*) FROM invoices) as invoices,
  (SELECT COUNT(*) FROM services) as services;"
```

### Delete All Data (Reset Database)
```bash
docker exec gokceinvoice-db psql -U postgres -d invoicedb -c "
  TRUNCATE TABLE line_items CASCADE;
  TRUNCATE TABLE invoices CASCADE;
  TRUNCATE TABLE clients CASCADE;
  TRUNCATE TABLE services CASCADE;
  TRUNCATE TABLE users CASCADE;
"
```

---

## GUI Database Tools

If you prefer a visual interface, here are popular options:

### 1. pgAdmin (Free, Full-featured)
**Via Docker:**
```bash
docker run -p 5050:80 \
  -e PGADMIN_DEFAULT_EMAIL=admin@example.com \
  -e PGADMIN_DEFAULT_PASSWORD=admin \
  -d dpage/pgadmin4
```
Then open http://localhost:5050 and connect:
- Host: host.docker.internal
- Port: 5433
- Username: postgres
- Password: postgres

### 2. TablePlus (Mac/Windows, $89 one-time)
- Download: https://tableplus.com/
- Beautiful, fast UI
- Native app (not web-based)

### 3. DBeaver (Free, Cross-platform)
- Download: https://dbeaver.io/download/
- Open source, very powerful
- Can connect to many databases

### 4. Postico (Mac only, $49 one-time)
- Download: https://eggerapps.at/postico/
- Mac-native, very elegant
- Simpler than pgAdmin

### 5. DataGrip (JetBrains, $199/year)
- Part of JetBrains suite
- Very powerful for developers
- Has free trial

---

## Connection Settings for GUI Tools

When connecting via GUI tools:

```
Host: localhost
Port: 5433
Database: invoicedb
Username: postgres
Password: postgres
```

Note: Port 5433 because Docker maps container port 5432 to host port 5433

---

## Quick Reference Commands

```bash
# List all databases
docker exec gokceinvoice-db psql -U postgres -l

# Switch to invoicedb
docker exec gokceinvoice-db psql -U postgres -d invoicedb

# List all schemas
docker exec gokceinvoice-db psql -U postgres -d invoicedb -c "\dn"

# Show current database
docker exec gokceinvoice-db psql -U postgres -d invoicedb -c "SELECT current_database();"

# Backup database
docker exec gokceinvoice-db pg_dump -U postgres invoicedb > backup.sql

# Restore database
docker exec -i gokceinvoice-db psql -U postgres -d invoicedb < backup.sql
```

