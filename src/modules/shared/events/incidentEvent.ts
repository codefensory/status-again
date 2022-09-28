import { Incident } from "@prisma/client";
import { Subject } from "rxjs";
import debug from "debug";

const logger = debug("events:HeartbeatEvent");

class IncidentEvent {
  public createIncidentSubject = new Subject<Incident>();

  public updateIncidentSubject = new Subject<Incident>();

  createIncident(incident: Incident) {
    logger("run createIncident event");

    this.createIncidentSubject.next(incident);
  }

  updateIncident(incident: Incident) {
    logger("run createIncident event");

    this.updateIncidentSubject.next(incident);
  }
}

export const incidentEvent = new IncidentEvent();
