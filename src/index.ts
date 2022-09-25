import { generateMonitorsData } from "./dates/fakesTestDates";
import { HeartbeatLoop } from "./modules/heartbeat";
import { IncidentsImpl } from "./modules/incidents";
import { MonitorsImpl } from "./modules/monitors";

async function main() {
  //await generateMonitorsData();

  HeartbeatLoop.init();

  await IncidentsImpl.init();

  MonitorsImpl.init();
}

main();
