import { WebClient } from "@slack/web-api";
import debug from "debug";
import fastify from "fastify";
import fastifyNow from "fastify-now";
import path from "path";
import { HeartbeatLoop } from "./modules/heartbeat";
import { IncidentsByBeatImpl } from "./modules/incidents/application";
import { MonitorsImpl } from "./modules/monitors";
import { SlackIntegration } from "./modules/slackIntegration";
import cors from "@fastify/cors";

//import { generateMonitorsData } from "./dates/fakesTestDates";

const logger = debug("api:main");

const server = fastify({});

async function main() {
  //await generateMonitorsData();

  HeartbeatLoop.init();

  if (process.env.SLACK_TOKEN && process.env.SLACK_CHANNEL) {
    const api = new WebClient(process.env.SLACK_TOKEN);

    const slackIntegration = new SlackIntegration(api);

    await slackIntegration.init();
  }

  const incidentsByBeatImpl = new IncidentsByBeatImpl();

  await incidentsByBeatImpl.init();

  MonitorsImpl.init();

  startServer();
}

async function startServer() {
  await server.register(cors, {
    origin: "*",
  });

  server.register(fastifyNow, {
    routesFolder: path.join(__dirname, "./http/routes"),
  });

  server.register(fastifyNow, {
    routesFolder: path.join(__dirname, "./modules/incidents/infrastructure/http/routes"),
    pathPrefix: "/incidents",
  });

  const port = Number(process.env.PORT) || 5000;

  server.listen({ port }).then(() => {
    logger("Server started in port", port);
  });
}

main();
