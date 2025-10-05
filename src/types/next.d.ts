import { NextRequest as OriginalNextRequest } from 'next/server';

declare module 'next/server' {
  interface NextRequest {
    ip?: string;
  }
}
