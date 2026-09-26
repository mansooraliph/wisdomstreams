export function getThumbnailUrl(playbackId: string, time = 0): string {
  return `https://image.mux.com/${playbackId}/thumbnail.jpg?time=${time}`;
}

export function getAnimatedPreviewUrl(playbackId: string): string {
  return `https://image.mux.com/${playbackId}/animated.gif`;
}
