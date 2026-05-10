export function sliceStream(content: string, count: number) {
  return content.slice(0, Math.max(0, count));
}

export function wrapStreamTick(length: number, step: number) {
  return Math.min(length, step);
}
