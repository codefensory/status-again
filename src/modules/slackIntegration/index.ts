import { Incident, SlackIncident } from "@prisma/client";
import { WebClient } from "@slack/web-api";
import { incidentEvent } from "../shared/events/incidentEvent";
import debug from "debug";
import { getBeatIncidentTemplate } from "./templates";
import { prisma } from "../shared/database";

const logger = debug("api:modules:slackIntegration:SlackIntegrationImpl");

export class SlackIntegration {
  private channelID: string = process.env.SLACK_CHANNEL ?? "";

  private incidentSend: {
    [key: string]: Promise<SlackIncident | undefined> | undefined;
  } = {};

  constructor(private api: WebClient) {}

  async init() {
    logger("SlackIntegration system started");

    const incidentsActive = await prisma.incident.findMany({
      where: { active: true },
      select: { slackIncident: true },
    });

    for (let incidentActive of incidentsActive) {
      if (incidentActive.slackIncident) {
        this.incidentSend[incidentActive.slackIncident.incidentId] = Promise.resolve(
          incidentActive.slackIncident
        );
      }
    }

    incidentEvent.createIncidentSubject.subscribe((incident) => this.sendIncident(incident));

    incidentEvent.updateIncidentSubject.subscribe((incident) => this.updateIncident(incident));
  }

  async sendIncident(incident: Incident) {
    const newIncidentPromise = new Promise<SlackIncident | undefined>(async (resolve) => {
      const result = await this.api.chat.postMessage({
        ...getBeatIncidentTemplate(incident),
        channel: this.channelID,
      });

      if (incident.active && result.ts && result.channel) {
        const slackIncident = await prisma.slackIncident.create({
          data: {
            ts: result.ts,
            channel: result.channel,
            incidentId: incident.id,
          },
        });

        return resolve(slackIncident);
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
