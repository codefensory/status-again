import { Incident } from "@prisma/client";
import { Result } from "oxide.ts";
import { ToCreate } from "../../shared/utils/types";

export interface IncidentRepository {
  createIncident(
    incident: ToCreate<Incident>
  ): Promise<Result<Incident, Error>>;
}
