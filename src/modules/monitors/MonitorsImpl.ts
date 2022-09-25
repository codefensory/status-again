import { prisma } from "../shared/database";
import { heartbeatEvent } from "../shared/events/heartbeatEvent";
import { sleep } from "../shared/utils/await";
import debug from "debug";

const logger = debug("api:modules:MonitorsImpl");

export class MonitorsImpl {
  static async init() {
    logger("---- Start initMonitors ----");

    const monitors = await prisma.monitor.findMany();

    for (let monitor of monitors) {
      logger("-> Initalize monitor:", monitor.name);

      heartbeatEvent.initializeNewBeatLoop(monitor);

      await sleep(600 + Math.random() * 1000);
    }
  }
}
