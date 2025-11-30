import { configure } from '@vendia/serverless-express';
import app from './src/server.js';

const serverlessExpressInstance = configure({ app });

export const handler = async (event: any, context: any) => {
  return await serverlessExpressInstance(event, context);
};