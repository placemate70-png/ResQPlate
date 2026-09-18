// External providers must be connected server-side; no secrets or inferred results in the browser.
export type FoodSuggestions = { food_name?: string; food_type?: 'gravy' | 'dry' | 'rice'; quantity?: number }
export interface ImageInferenceProvider { analyze(photo: File): Promise<FoodSuggestions> }
export interface LocationProvider { locate(rescueId: string): Promise<{ latitude: number; longitude: number; recordedAt: string }> }
export interface ReassignmentProvider { review(rescueId: string): Promise<{ reason: string; reviewedAt: string }> }
export interface PrivateCallProvider { connect(rescueId: string): Promise<{ sessionUrl: string }> }
export const unavailableCapabilities = {
  snapFill: 'SnapFill is unavailable: no image inference provider is connected. Enter and confirm food details manually.',
  liveTrack: 'GPS, maps and ETA are unavailable. Progress below records confirmed user actions only.',
  smartReassign: 'SmartReassign is unavailable: no verified progress monitoring or stall detection provider is connected.',
  safeCall: 'SafeCall is unavailable: no private calling provider is connected. Contact details are not shared.',
}
