import { useState, useRef, useCallback, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Platform,
  AppState,
  AppStateStatus,
} from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import {
  startLiveActivity,
  pauseLiveActivity,
  resumeLiveActivity,
  stopLiveActivity,
  stopAllLiveActivities,
  getWidgetAction,
  clearWidgetAction,
} from "./modules/study-timer-live-activity";

type TimerState = "idle" | "running" | "paused";

export default function App() {
  const [sessionName, setSessionName] = useState("");
  const [timerState, setTimerState] = useState<TimerState>("idle");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [activityId, setActivityId] = useState<string | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedElapsedRef = useRef<number>(0);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const clearInterval_ = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const startInterval = () => {
    intervalRef.current = setInterval(() => {
      const elapsed =
        pausedElapsedRef.current +
        Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsedSeconds(elapsed);
    }, 1000);
  };

  // Clean up zombie activities on mount
  useEffect(() => {
    if (Platform.OS === "ios") {
      stopAllLiveActivities().catch(() => {});
    }
  }, []);

  // Sync with widget actions when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (appStateRef.current !== "active" && nextState === "active") {
        // Stop any stale JS interval immediately to prevent time jumps
        clearInterval_();

        // Check for widget-initiated actions
        if (Platform.OS === "ios" && timerState !== "idle") {
          const widgetAction = getWidgetAction();
          if (widgetAction) {
            clearWidgetAction();
            switch (widgetAction.action) {
              case "pause":
                pausedElapsedRef.current = widgetAction.elapsed;
                setElapsedSeconds(widgetAction.elapsed);
                setTimerState("paused");
                break;
              case "resume":
                startTimeRef.current = Date.now();
                pausedElapsedRef.current = widgetAction.elapsed;
                setElapsedSeconds(widgetAction.elapsed);
                setTimerState("running");
                startInterval();
                break;
              case "stop":
                pausedElapsedRef.current = 0;
                setElapsedSeconds(0);
                setTimerState("idle");
                setActivityId(null);
                break;
            }
            appStateRef.current = nextState;
            return;
          }
        }

        // No widget action, recalculate elapsed time and restart interval
        if (timerState === "running") {
          const now = Date.now();
          const elapsed =
            pausedElapsedRef.current +
            Math.floor((now - startTimeRef.current) / 1000);
          setElapsedSeconds(elapsed);
          startInterval();
        }
      }
      appStateRef.current = nextState;
    });

    return () => subscription.remove();
  }, [timerState]);

  const startTimer = useCallback(async () => {
    const name = sessionName.trim() || "Study Session";
    const now = Date.now();
    startTimeRef.current = now;
    pausedElapsedRef.current = 0;

    setTimerState("running");
    setElapsedSeconds(0);

    if (Platform.OS === "ios") {
      try {
        const id = await startLiveActivity(name, now / 1000);
        setActivityId(id);
      } catch (e) {
        console.warn("Failed to start Live Activity:", e);
      }
    }

    startInterval();
  }, [sessionName]);

  const pauseTimer = useCallback(async () => {
    clearInterval_();

    const elapsed =
      pausedElapsedRef.current +
      Math.floor((Date.now() - startTimeRef.current) / 1000);
    pausedElapsedRef.current = elapsed;
    setElapsedSeconds(elapsed);
    setTimerState("paused");

    if (Platform.OS === "ios" && activityId) {
      try {
        await pauseLiveActivity(activityId, elapsed);
      } catch (e) {
        console.warn("Failed to pause Live Activity:", e);
      }
    }
  }, [activityId]);

  const resumeTimer = useCallback(async () => {
    startTimeRef.current = Date.now();
    setTimerState("running");

    if (Platform.OS === "ios" && activityId) {
      try {
        await resumeLiveActivity(activityId, pausedElapsedRef.current);
      } catch (e) {
        console.warn("Failed to resume Live Activity:", e);
      }
    }

    startInterval();
  }, [activityId]);

  const stopTimer = useCallback(async () => {
    clearInterval_();

    setTimerState("idle");
    setElapsedSeconds(0);
    pausedElapsedRef.current = 0;

    if (Platform.OS === "ios" && activityId) {
      try {
        await stopLiveActivity(activityId);
      } catch (e) {
        console.warn("Failed to stop Live Activity:", e);
      }
      setActivityId(null);
    }
  }, [activityId]);

  const formatTime = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />

        <View style={styles.content}>
          {timerState === "idle" ? (
            <>
              <Text style={styles.title}>Study Timer</Text>

              <TextInput
                style={styles.input}
                placeholder="Session name (e.g. Chapter 5 Review)"
                placeholderTextColor="#666"
                value={sessionName}
                onChangeText={setSessionName}
                returnKeyType="done"
              />

              <TouchableOpacity style={styles.startButton} onPress={startTimer}>
                <Text style={styles.startButtonText}>Start New Session</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.sessionName}>
                {sessionName.trim() || "Study Session"}
              </Text>

              <View style={styles.timerContainer}>
                <View
                  style={[
                    styles.progressRing,
                    {
                      borderColor:
                        timerState === "paused" ? "#F59E0B" : "#10B981",
                    },
                  ]}
                >
                  <Text style={styles.timerText}>
                    {formatTime(elapsedSeconds)}
                  </Text>
                </View>
              </View>

              {timerState === "paused" && (
                <Text style={styles.pausedLabel}>Paused</Text>
              )}

              <View style={styles.controls}>
                {timerState === "running" ? (
                  <TouchableOpacity
                    style={[styles.controlButton, styles.pauseButton]}
                    onPress={pauseTimer}
                  >
                    <Text style={styles.controlButtonText}>Pause</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.controlButton, styles.resumeButton]}
                    onPress={resumeTimer}
                  >
                    <Text style={styles.controlButtonText}>Resume</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.controlButton, styles.stopButton]}
                  onPress={stopTimer}
                >
                  <Text style={styles.controlButtonText}>Stop</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#F8FAFC",
    marginBottom: 48,
  },
  input: {
    width: "100%",
    backgroundColor: "#1E293B",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#F8FAFC",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#334155",
  },
  startButton: {
    backgroundColor: "#3B82F6",
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
  },
  startButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  sessionName: {
    fontSize: 24,
    fontWeight: "600",
    color: "#F8FAFC",
    marginBottom: 32,
    textAlign: "center",
  },
  timerContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  progressRing: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  timerText: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#F8FAFC",
    fontVariant: ["tabular-nums"],
  },
  pausedLabel: {
    fontSize: 16,
    color: "#F59E0B",
    fontWeight: "600",
    marginBottom: 16,
  },
  controls: {
    flexDirection: "row",
    gap: 16,
    marginTop: 32,
  },
  controlButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    minWidth: 120,
    alignItems: "center",
  },
  pauseButton: {
    backgroundColor: "#F59E0B",
  },
  resumeButton: {
    backgroundColor: "#10B981",
  },
  stopButton: {
    backgroundColor: "#EF4444",
  },
  controlButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
