import app from '../src/app';

export default function handler(req: any, res: any) {
  // Get the original URL from Vercel
  let path = req.url || '/';
  
  // Clean up any query parameters that Vercel adds
  if (path.includes('?')) {
    path = path.split('?')[0];
  }
  
  // If we have route parameters from [...route], reconstruct the path
  if (req.query && req.query['[...route]']) {
    const routeParams = Array.isArray(req.query['[...route]']) 
      ? req.query['[...route]'] 
      : [req.query['[...route]']];
    path = '/api/' + routeParams.join('/');
  }
  
  // Update the request object
  req.url = path;
  req.originalUrl = path;
  
  // Pass to Express
  return (app as any)(req, res);
}
