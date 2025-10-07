export default function handler(req: any, res: any) {
  // Simple test - just return a response to see if this function is being called
  console.log('=== CATCH-ALL FUNCTION CALLED ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Query:', req.query);
  console.log('Headers:', req.headers);
  
  res.status(200).json({
    message: 'Catch-all function is working!',
    method: req.method,
    url: req.url,
    query: req.query,
    timestamp: new Date().toISOString()
  });
}


