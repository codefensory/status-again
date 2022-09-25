import { Heartbeat, Monitor } from "@prisma/client";
import debug from "debug";
import { Subject } from "rxjs";

const logger = debug("api:shared:events:HeartbeatEvent");

class HeartbeatEvent {
  public initializeNewBeatLoopSubject = new Subject<Monitor>();

  public hearbeatCreatedSubject = new Subject<{
    beat: Heartbeat;
    previusBeat?: Heartbeat;
  }>();

  initializeNewBeatLoop(monitor: Monitor) {
    logger("run initializeNewBeatLoop event");

    this.initializeNewBeatLoopSubject.next(monitor);
  }

  hearbeatCreated(beat: Heartbeat, previusBeat?: Heartbeat) {
    logger("run hearbeatCreated event");

    this.hearbeatCreatedSubject.next({ beat, previusBeat });
  }
}

export const heartbeatEvent = new HeartbeatEvent();
