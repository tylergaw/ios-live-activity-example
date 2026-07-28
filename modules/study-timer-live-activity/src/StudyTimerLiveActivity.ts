import { requireNativeModule } from "expo-modules-core";

const StudyTimerLiveActivityModule = requireNativeModule(
  "StudyTimerLiveActivity",
);

export async function startLiveActivity(
  sessionName: string,
  startTimestamp: number,
): Promise<string> {
  return await StudyTimerLiveActivityModule.startLiveActivity(
    sessionName,
    startTimestamp,
  );
}

export async function pauseLiveActivity(
  activityId: string,
  elapsedSeconds: number,
): Promise<void> {
  return await StudyTimerLiveActivityModule.pauseLiveActivity(
    activityId,
    elapsedSeconds,
  );
}

export async function resumeLiveActivity(
  activityId: string,
  elapsedSeconds: number,
): Promise<void> {
  return await StudyTimerLiveActivityModule.resumeLiveActivity(
    activityId,
    elapsedSeconds,
  );
}

export async function stopLiveActivity(activityId: string): Promise<void> {
  return await StudyTimerLiveActivityModule.stopLiveActivity(activityId);
}

export async function stopAllLiveActivities(): Promise<void> {
  return await StudyTimerLiveActivityModule.stopAllLiveActivities();
}

export function getWidgetAction(): {
  action: string;
  elapsed: number;
  /** Epoch seconds; the running anchor for "resume" (0 for pause/stop). */
  startDate: number;
} | null {
  return StudyTimerLiveActivityModule.getWidgetAction();
}

export function clearWidgetAction(): void {
  return StudyTimerLiveActivityModule.clearWidgetAction();
}
