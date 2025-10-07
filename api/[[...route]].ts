import app from '../src/app';

export default function handler(req: any, res: any) {
  // Debug: Log the original request details
  console.log('Original URL:', req.url);
  console.log('Original pathname:', req.pathname);
  console.log('Query params:', req.query);
  
  // Handle the route parameters from Vercel's [...route] syntax
  let path = req.url || '/';
  
  // Clean up any query parameters that Vercel adds
  if (path.includes('?')) {
    path = path.split('?')[0];
  }
  
  // If we have route parameters, reconstruct the path
  if (req.query && req.query['[...route]']) {
    const routeParams = Array.isArray(req.query['[...route]']) 
      ? req.query['[...route]'] 
      : [req.query['[...route]']];
    path = '/' + routeParams.join('/');
  }
  
  // Clean up the path and add /api prefix
  if (!path.startsWith('/api')) {
    path = '/api' + path;
  }
  
  // Update the request object with clean URL
  req.url = path;
  req.originalUrl = path;
  
  console.log('Final path:', path);
  
  return (app as any)(req, res);
}


