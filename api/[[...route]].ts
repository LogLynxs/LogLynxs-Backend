import app from '../src/app';

export default function handler(req: any, res: any) {
  // Vercel strips the /api prefix, so we need to add it back for Express routes
  if (typeof req.url === 'string') {
    // If the URL doesn't start with /api, add it
    if (!req.url.startsWith('/api')) {
      req.url = '/api' + req.url;
    }
    // Also update originalUrl for Express
    req.originalUrl = req.url;
  }
  return (app as any)(req, res);
}


