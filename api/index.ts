import app from '../src/app';

export default function handler(req: any, res: any) {
  console.log('=== API INDEX FUNCTION CALLED ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Query:', req.query);
  
  // Pass the request directly to Express
  return (app as any)(req, res);
}
