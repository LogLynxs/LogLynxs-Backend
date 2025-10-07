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
  
  // Only add /api prefix if the path doesn't already start with /api
  // and if it's not a root path that should be handled directly
  if (!path.startsWith('/api') && path !== '/' && path !== '/health' && path !== '/api-docs' && path !== '/api-docs.json') {
    path = '/api' + path;
  }
  
  // Update the request object with clean URL
  req.url = path;
  req.originalUrl = path;
  
  console.log('Final path:', path);
  
  return (app as any)(req, res);
}


