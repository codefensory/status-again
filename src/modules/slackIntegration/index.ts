import { Incident } from "@prisma/client";
import { ChatPostMessageResponse, WebClient } from "@slack/web-api";
import { incidentEvent } from "../shared/events/incidentEvent";
import debug from "debug";
import { getBeatIncidentTemplate } from "./templates";

const logger = debug("api:modules:slackIntegration:SlackIntegrationImpl");

export class SlackIntegration {
  private channelID: string = process.env.SLACK_CHANNEL ?? "";

  private incidentSend: {
    [key: string]: Promise<ChatPostMessageResponse | undefined> | undefined;
  } = {};

  constructor(private api: WebClient) {}

  init() {
    logger("SlackIntegration system started");

    incidentEvent.createIncidentSubject.subscribe((incident) => this.sendIncident(incident));

    incidentEvent.updateIncidentSubject.subscribe((incident) => this.updateIncident(incident));
  }

  async sendIncident(incident: Incident) {
    const newIncidentPromise = new Promise<ChatPostMessageResponse | undefined>(async (resolve) => {
      const result = await this.api.chat.postMessage({
        ...getBeatIncidentTemplate(incident),
        channel: this.channelID,
      });

      if (incident.active) {
        return resolve(result);
      }

      resolve(undefined);
    });

    this.incidentSend[incident.id] = newIncidentPromise;

    await newIncidentPromise;

    logger("Message sent successfully");
  }

  async updateIncident(incident: Incident) {
    const incidentSended = await this.incidentSend[incident.id];

    if (!incidentSended) {
      return;
    }

    await this.api.chat.update({
      ...getBeatIncidentTemplate(incident),
      channel: incidentSended.channel,
      ts: incidentSended.ts,
    });

    if (!incident.active) {
      delete this.incidentSend[incident.id];
    }

    logger("Message update successfully");
  }
}
