import app from '../src/app';

export default function handler(req: any, res: any) {
  console.log('=== V1 API FUNCTION CALLED ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  
  // Pass the request directly to Express
  return (app as any)(req, res);
}
