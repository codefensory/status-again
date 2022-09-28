import { Incident } from "@prisma/client";
import { Result, Err, Ok } from "oxide.ts";
import { IncidentRepository } from "../../domain";
import { CreateAppcrashIncidentDTO } from ".";
import { ToCreate } from "../../../shared/utils/types";
import { incidentEvent } from "../../../shared/events/incidentEvent";

export class CreateAppcrashIncidentApplication {
  constructor(private repository: IncidentRepository) {}

  async execute(
    dto: CreateAppcrashIncidentDTO
  ): Promise<Result<Incident, Error>> {
    const newIncident: ToCreate<Incident> = {
      type: "app_crash",
      title: dto.title,
      description: dto.error,
      screenshot_url: null,
      active: false,
      monitorId: dto.monitorId,
      duration: null,
    };

    const incidentResult = await this.repository.createIncident(newIncident);

    if (incidentResult.isErr()) {
      return Err(incidentResult.unwrapErr());
    }

    const incident = incidentResult.unwrap();

    incidentEvent.createIncident(incident);

    return Ok(incident);
  }
}
