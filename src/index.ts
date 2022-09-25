import { generateMonitorsData } from "./dates/fakesTestDates";
import { HeartbeatLoop } from "./modules/heartbeat";
import { MonitorsImpl } from "./modules/monitors";

async function main() {
  await generateMonitorsData();

  HeartbeatLoop.init();

  MonitorsImpl.init();
}

main();
