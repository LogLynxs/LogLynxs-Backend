import app from '../src/app';

export default function handler(req: any, res: any) {
  // Debug: Log the original request details
  console.log('Original URL:', req.url);
  console.log('Query params:', req.query);
  
  let path = req.url || '/';
  
  // Clean up any query parameters that Vercel adds
  if (path.includes('?')) {
    path = path.split('?')[0];
  }
  
  // If we have route parameters from [...route], reconstruct the full path
  if (req.query && req.query['[...route]']) {
    const routeParams = Array.isArray(req.query['[...route]']) 
      ? req.query['[...route]'] 
      : [req.query['[...route]']];
    path = '/api/' + routeParams.join('/');
  }
  
  // Update the request object
  req.url = path;
  req.originalUrl = path;
  
  console.log('Final path:', path);
  
  return (app as any)(req, res);
}


