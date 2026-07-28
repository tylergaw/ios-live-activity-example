import AppIntents
import ActivityKit

private let appGroupId = "group.com.studytimer.app"

struct PauseTimerIntent: LiveActivityIntent {
  static var title: LocalizedStringResource = "Pause Timer"

  @MainActor
  func perform() async throws -> some IntentResult {
    let defaults = UserDefaults(suiteName: appGroupId)
    let activities = Activity<StudyTimerAttributes>.activities

    for activity in activities where !activity.content.state.isPaused {
      let state = activity.content.state
      let elapsed = state.pausedElapsed + Int(Date().timeIntervalSince(state.startDate))
      let updated = StudyTimerAttributes.ContentState(
        startDate: Date(),
        pausedElapsed: elapsed,
        isPaused: true
      )
      await activity.update(ActivityContent(state: updated, staleDate: nil))

      defaults?.set("pause", forKey: "widgetAction")
      defaults?.set(elapsed, forKey: "widgetElapsed")
      defaults?.synchronize()
    }
    return .result()
  }
}

struct ResumeTimerIntent: LiveActivityIntent {
  static var title: LocalizedStringResource = "Resume Timer"

  @MainActor
  func perform() async throws -> some IntentResult {
    let defaults = UserDefaults(suiteName: appGroupId)
    let activities = Activity<StudyTimerAttributes>.activities

    for activity in activities where activity.content.state.isPaused {
      let elapsed = activity.content.state.pausedElapsed
      let startDate = Date().addingTimeInterval(-Double(elapsed))
      let updated = StudyTimerAttributes.ContentState(
        startDate: startDate,
        pausedElapsed: 0,
        isPaused: false
      )
      await activity.update(ActivityContent(state: updated, staleDate: nil))

      defaults?.set("resume", forKey: "widgetAction")
      defaults?.set(elapsed, forKey: "widgetElapsed")
      defaults?.synchronize()
    }
    return .result()
  }
}

struct StopTimerIntent: LiveActivityIntent {
  static var title: LocalizedStringResource = "Stop Timer"

  @MainActor
  func perform() async throws -> some IntentResult {
    let defaults = UserDefaults(suiteName: appGroupId)
    let finalState = StudyTimerAttributes.ContentState(
      startDate: Date(),
      pausedElapsed: 0,
      isPaused: true
    )

    for activity in Activity<StudyTimerAttributes>.activities {
      await activity.end(
        ActivityContent(state: finalState, staleDate: nil),
        dismissalPolicy: .immediate
      )
    }

    defaults?.set("stop", forKey: "widgetAction")
    defaults?.synchronize()
    return .result()
  }
}
