# Gokce Invoice - Monorepo Structure

This repository contains three main applications:

## 📁 Project Structure

```
gokceinvoice/
├── client/          # React web application
├── server/          # Express backend API
├── mobile/          # React Native mobile app (Expo)
├── shared/          # Shared TypeScript types and schemas
└── ...
```

## 🚀 Quick Start

### Web Application
```bash
npm install
npm run dev
```

### Mobile Application
```bash
cd mobile
npm install
npm start
```

### Backend API
The backend runs automatically with `npm run dev` in the root directory.

## 📱 Mobile App

The mobile app is located in the `mobile/` directory and is completely independent:
- Separate `package.json` and dependencies
- Own build configuration
- Can be developed/deployed independently

See [mobile/README.md](./mobile/README.md) for mobile-specific documentation.

## 🔗 Shared Code

The `shared/` directory contains:
- Database schema definitions
- TypeScript types used by both web and mobile
- Common validation schemas

## 💡 Development Workflow

1. **Web development**: Work in `client/` directory
2. **Mobile development**: Work in `mobile/` directory  
3. **Backend changes**: Work in `server/` directory
4. **Shared types**: Update `shared/schema.ts` when database changes

## 📦 Deployment

Each application can be deployed independently:
- **Web**: Deploy `client/` build output
- **Mobile**: Build with Expo EAS or React Native CLI
- **Backend**: Deploy `server/` directory

## 🧹 Cleaning

To clean all dependencies:
```bash
# Root dependencies
rm -rf node_modules package-lock.json

# Mobile dependencies
cd mobile && rm -rf node_modules package-lock.json && cd ..
```

## 📝 Notes

- The mobile app connects to the same backend API as the web app
- Both apps share the same database schema defined in `shared/schema.ts`
- Authentication supports both session (web) and JWT token (mobile) methods

