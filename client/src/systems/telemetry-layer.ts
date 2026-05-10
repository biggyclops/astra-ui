import { getTelemetryCards } from "@/config/astra";

export const telemetryLayer = {
  snapshot() {
    return getTelemetryCards();
  },
};
