export default function handler(req: any, res: any) {
  res.status(200).json({ status: 'OK', runtime: 'vercel-serverless', timestamp: new Date().toISOString() });
}


