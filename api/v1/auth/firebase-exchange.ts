import app from '../../../src/app';

export default function handler(req: any, res: any) {
  if (typeof req.url === 'string' && !req.url.startsWith('/api')) {
    req.url = '/api' + req.url;
  }
  return (app as any)(req, res);
}
