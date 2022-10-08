import { prisma } from "../shared/database";
import { heartbeatEvent } from "../shared/events/heartbeatEvent";
import { sleep } from "../shared/utils/await";
import debug from "debug";

const logger = debug("api:modules:MonitorsImpl");

export class MonitorsImpl {
  static async init() {
    logger("MonitorImpl system started");

    const monitors = await prisma.monitor.findMany();

    for (let monitor of monitors) {
      logger("-> Monitor initialized:", monitor.name);

      heartbeatEvent.initializeNewBeatLoop(monitor);

      await sleep(600 + Math.random() * 1000);
    }
  }
}
