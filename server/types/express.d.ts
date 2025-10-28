import 'express-session';
import { Request } from 'express';

declare module 'express' {
  interface Request {
    file?: Express.Multer.File;
    files?: Express.Multer.File[];
  }
}

declare module 'express-session' {
  interface SessionData {
    userId?: string;
    csrfSecret?: string;
  }
}

