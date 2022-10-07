import { Incident } from "@prisma/client";
import { WebClient } from "@slack/web-api";
import { incidentEvent } from "../shared/events/incidentEvent";
import debug from "debug";

const logger = debug("api:modules:slackIntegration:SlackIntegrationImpl");

export class SlackIntegration {
  private channelID = "C04684YANE4";

  constructor(private api: WebClient) {}

  init() {
    logger("SlackIntegration system started");

    incidentEvent.createIncidentSubject.subscribe((incident) => this.sendIncident(incident));
  }

  async sendIncident(incident: Incident) {
    await this.api.chat.postMessage({
      text: incident.title,
      channel: this.channelID,
    });

    logger("Message sent successfully");
  }
}
