import { NowRequestHandler } from "fastify-now";
import { CreateAppcrashIncidentApplication, CreateAppcrashIncidentDTO } from "../../../application";
import { incidentPrismaRepository } from "../../repository/incidentPrismaRepository";

export const POST: NowRequestHandler<{
  Body: CreateAppcrashIncidentDTO;
}> = async (req, _reply) => {
  const createAppcrashIncidentApplication = new CreateAppcrashIncidentApplication(
    incidentPrismaRepository
  );

  const incidentResult = await createAppcrashIncidentApplication.execute(req.body);

  if (incidentResult.isErr()) {
    return incidentResult.unwrapErr();
  }

  return incidentResult.unwrap();
};

POST.opts = {
  schema: {
    body: {
      type: "object",
      properties: {
        title: {
          type: "string",
        },
        error: {
          type: "string",
        },
        stats: {
          type: "array",
          default: [],
        },
        attempt: {
          type: "number",
        },
        monitorId: {
          type: "number",
        },
      },
      required: ["title", "error", "stats", "attempt", "monitorId"],
    },
  },
};
