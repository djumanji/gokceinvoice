# pgAdmin Setup Guide

## Access pgAdmin

**URL:** http://localhost:5050

**Login Credentials:**
- Email: `admin@example.com`
- Password: `admin`

---

## Connect to Your Database

Once logged in, follow these steps:

### Step 1: Add New Server
1. Right-click on **"Servers"** in the left panel
2. Select **"Register"** → **"Server"**

### Step 2: General Tab
- **Name:** `InvoiceHub DB` (or any name you prefer)

### Step 3: Connection Tab
Fill in the following details:

- **Host name/address:** `host.docker.internal`
- **Port:** `5433`
- **Maintenance database:** `invoicedb`
- **Username:** `postgres`
- **Password:** `postgres` 
- **Save password:** ✅ Check this box

### Step 4: Click "Save"

---

## Browse Your Database

Once connected, you'll see:

- **Schemas** → **public**
  - `users` - All registered users
  - `clients` - Client records
  - `invoices` - Invoice records
  - `line_items` - Invoice line items
  - `services` - Service catalog

### View Data
1. Navigate to **Schemas** → **public** → **Tables**
2. Right-click any table
3. Select **"View/Edit Data"** → **"All Rows"**

### Run Queries
1. Click the **SQL icon** (document with arrow) in the toolbar
2. Type your query in the editor
3. Press **F5** or click **Execute**

Example queries:
```sql
SELECT * FROM users;
SELECT * FROM clients;
SELECT * FROM invoices;
SELECT COUNT(*) FROM users;
```

---

## Troubleshooting

### Can't connect?
- Make sure both containers are running: `docker ps`
- Check that the database is accessible from host: `docker exec gokceinvoice-db pg_isready -U postgres`

### Forgot password?
You can reset it via Docker:
```bash
docker exec -it pgadmin python /usr/local/bin/setup.py reset-user admin@example.com --password admin
```

---

## Stop/Start Containers

**Stop pgAdmin:**
```bash
docker stop pgadmin
```

**Start pgAdmin:**
```bash
docker start pgadmin
```

**Remove pgAdmin (keeps your database):**
```bash
docker stop pgadmin && docker rm pgadmin
```

