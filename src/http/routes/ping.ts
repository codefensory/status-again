import { NowRequestHandler } from "fastify-now";

export const GET: NowRequestHandler = () => {
  return "pong";
};
