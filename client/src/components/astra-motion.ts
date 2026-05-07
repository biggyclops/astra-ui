export const ASTRA_PRESENCE_MOTION = {
  login: {
    wrapper: 9.6,
    image: 7.2,
    scan: 10.5,
    edge: 10,
    sweep: 12,
    particles: 9,
    voice: 6.8,
    gpu: 8.4,
    security: 7.2,
    robotics: 10.8,
    transfer: 12.5,
  },
  dashboard: {
    wrapper: 13.5,
    image: 8.8,
    scan: 14,
    edge: 13,
    sweep: 12,
    particles: 13,
    voice: 6.8,
    gpu: 8.4,
    security: 7.2,
    robotics: 10.8,
    transfer: 12.5,
  },
} as const;

export const ASTRA_VISUAL_PANEL_MOTION = {
  portrait: 37,
  image: 31,
  pulse: 24,
  grain: 19,
  scan: 27,
  shimmer: 26,
  badge: 17,
  cardBase: 18,
  cardStep: 4,
  signal: 21,
  telemetry: 23,
} as const;

export const ASTRA_PRESENCE_LOW_POWER_INTENSITY = 0.36;
export const ASTRA_PRESENCE_MIN_INTENSITY = 0.22;
export const ASTRA_PRESENCE_REACTIVE_INTENSITY = 0.3;
