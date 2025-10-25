import { configure } from '@vendia/serverless-express';
import app from './src/server.js';

// Create the serverless express wrapper
const serverlessExpressInstance = configure({ app });

// Node.js 24 compatible async handler
export const handler = async (event: any, context: any) => {
  return await serverlessExpressInstance(event, context);
};