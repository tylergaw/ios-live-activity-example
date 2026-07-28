import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  Platform,
  AppState,
  AppStateStatus,
  useColorScheme,
} from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { palettes, space, radius, font, type Palette } from "./theme";
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
  // `useColorScheme` subscribes to appearance changes and updates live. Its
  // type also admits "unspecified"/null (the docs note "unspecified" is never
  // actually returned), so anything that isn't "light" falls back to dark.
  const scheme = useColorScheme() === "light" ? "light" : "dark";
  const c = palettes[scheme];
  const styles = useMemo(() => makeStyles(c), [c]);

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
        <StatusBar style="auto" />

        <View style={styles.content}>
          {timerState === "idle" ? (
            <>
              <Text style={styles.title}>Study Timer</Text>

              <TextInput
                style={styles.input}
                placeholder="Session name (e.g. Chapter 5 Review)"
                placeholderTextColor={c.textMuted}
                value={sessionName}
                onChangeText={setSessionName}
                returnKeyType="done"
              />

              <Pressable
                style={({ pressed }) => [
                  styles.startButton,
                  pressed && styles.pressed,
                ]}
                onPress={startTimer}
              >
                <Text style={styles.startButtonText}>Start</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.sessionName}>
                {sessionName.trim() || "Study Session"}
              </Text>

              <View style={styles.timerContainer}>
                <Text
                  style={styles.timerText}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  maxFontSizeMultiplier={1.4}
                >
                  {formatTime(elapsedSeconds)}
                </Text>
              </View>

              <View style={styles.controls}>
                <Pressable
                  style={({ pressed }) => [
                    styles.controlButton,
                    styles.stopButton,
                    pressed && styles.pressed,
                  ]}
                  onPress={stopTimer}
                >
                  <Text
                    style={[styles.controlButtonText, styles.stopButtonText]}
                  >
                    Stop
                  </Text>
                </Pressable>

                {timerState === "running" ? (
                  <Pressable
                    style={({ pressed }) => [
                      styles.controlButton,
                      styles.pauseButton,
                      pressed && styles.pressed,
                    ]}
                    onPress={pauseTimer}
                  >
                    <Text
                      style={[styles.controlButtonText, styles.pauseButtonText]}
                    >
                      Pause
                    </Text>
                  </Pressable>
                ) : (
                  <Pressable
                    style={({ pressed }) => [
                      styles.controlButton,
                      styles.resumeButton,
                      pressed && styles.pressed,
                    ]}
                    onPress={resumeTimer}
                  >
                    <Text
                      style={[
                        styles.controlButtonText,
                        styles.resumeButtonText,
                      ]}
                    >
                      Resume
                    </Text>
                  </Pressable>
                )}
              </View>
            </>
          )}
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.bg,
    },
    content: {
      flex: 1,
      justifyContent: "center",
      paddingHorizontal: space.lg,
    },
    title: {
      fontSize: font.size.xl,
      fontWeight: font.weight.light,
      color: c.text,
      marginBottom: space.xxl,
    },
    input: {
      width: "100%",
      borderRadius: radius.md,
      padding: space.md,
      fontSize: font.size.sm,
      color: c.text,
      marginBottom: space.md,
      borderWidth: 1,
      borderColor: c.border,
    },
    startButton: {
      backgroundColor: c.accent,
      paddingVertical: space.md,
      paddingHorizontal: space.xxl,
      borderRadius: radius.md,
      width: "100%",
      alignItems: "center",
    },
    startButtonText: {
      color: c.bg,
      fontSize: font.size.md,
      fontWeight: font.weight.semibold,
    },
    sessionName: {
      fontSize: font.size.md,
      color: c.text,
      width: "100%",
    },
    timerContainer: {
      marginBottom: space.md,
      width: "100%",
    },
    timerText: {
      fontSize: font.size.timer,
      fontWeight: font.weight.light,
      color: c.text,
      fontVariant: ["tabular-nums"],
    },
    controls: {
      justifyContent: "space-between",
      flexDirection: "row",
      gap: space.md,
      marginTop: space.xl,
      width: "100%",
    },
    controlButton: {
      borderRadius: radius.pill,
      height: 80,
      width: 80,
      alignItems: "center",
      justifyContent: "center",
    },
    controlButtonText: {
      fontSize: font.size.sm,
      fontWeight: font.weight.medium,
    },
    stopButton: {
      backgroundColor: c.button.default.bg,
    },
    stopButtonText: {
      color: c.button.default.text,
    },
    pauseButton: {
      backgroundColor: c.button.pause.bg,
    },
    pauseButtonText: {
      color: c.button.pause.text,
    },
    resumeButton: {
      backgroundColor: c.button.resume.bg,
    },
    resumeButtonText: {
      color: c.button.resume.text,
    },
    // Instant press feedback shared by all buttons — replaces
    // TouchableOpacity's lingering release fade. Applied via Pressable's
    // `pressed` state, so it flips on/off immediately.
    pressed: {
      opacity: 0.6,
    },
  });
