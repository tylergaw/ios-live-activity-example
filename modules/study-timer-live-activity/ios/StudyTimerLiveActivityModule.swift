import ExpoModulesCore
import ActivityKit

public class StudyTimerLiveActivityModule: Module {
  public func definition() -> ModuleDefinition {
    Name("StudyTimerLiveActivity")

    AsyncFunction("startLiveActivity") { (sessionName: String, startTimestamp: Double) -> String in
      guard ActivityAuthorizationInfo().areActivitiesEnabled else {
        throw LiveActivityError.notAvailable
      }

      let startDate = Date(timeIntervalSince1970: startTimestamp)
      let attributes = StudyTimerAttributes(sessionName: sessionName)
      let state = StudyTimerAttributes.ContentState(
        startDate: startDate,
        pausedElapsed: 0,
        isPaused: false
      )

      let content = ActivityContent(state: state, staleDate: nil)
      let activity = try Activity<StudyTimerAttributes>.request(
        attributes: attributes,
        content: content,
        pushType: nil
      )

      // Clear any stale widget actions
      let defaults = UserDefaults.standard
      defaults.removeObject(forKey: "widgetAction")
      defaults.removeObject(forKey: "widgetElapsed")
      defaults.removeObject(forKey: "widgetStartDate")

      return activity.id
    }

    AsyncFunction("pauseLiveActivity") { (activityId: String, elapsedSeconds: Int) in
      let state = StudyTimerAttributes.ContentState(
        startDate: Date(),
        pausedElapsed: elapsedSeconds,
        isPaused: true
      )
      let content = ActivityContent(state: state, staleDate: nil)

      for activity in Activity<StudyTimerAttributes>.activities {
        if activity.id == activityId {
          await activity.update(content)
          return
        }
      }
    }

    AsyncFunction("resumeLiveActivity") { (activityId: String, elapsedSeconds: Int) in
      let startDate = Date().addingTimeInterval(-Double(elapsedSeconds))
      let state = StudyTimerAttributes.ContentState(
        startDate: startDate,
        pausedElapsed: 0,
        isPaused: false
      )
      let content = ActivityContent(state: state, staleDate: nil)

      for activity in Activity<StudyTimerAttributes>.activities {
        if activity.id == activityId {
          await activity.update(content)
          return
        }
      }
    }

    AsyncFunction("stopLiveActivity") { (activityId: String) in
      let state = StudyTimerAttributes.ContentState(
        startDate: Date(),
        pausedElapsed: 0,
        isPaused: true
      )
      let content = ActivityContent(state: state, staleDate: nil)

      for activity in Activity<StudyTimerAttributes>.activities {
        if activity.id == activityId {
          await activity.end(content, dismissalPolicy: .immediate)
          return
        }
      }
    }

    AsyncFunction("stopAllLiveActivities") {
      let state = StudyTimerAttributes.ContentState(
        startDate: Date(),
        pausedElapsed: 0,
        isPaused: true
      )
      let content = ActivityContent(state: state, staleDate: nil)

      for activity in Activity<StudyTimerAttributes>.activities {
        await activity.end(content, dismissalPolicy: .immediate)
      }
    }

    Function("getWidgetAction") { () -> [String: Any]? in
      let defaults = UserDefaults.standard
      guard let action = defaults.string(forKey: "widgetAction") else {
        return nil
      }
      let elapsed = defaults.integer(forKey: "widgetElapsed")
      // Epoch seconds. Set on resume so the app can reconstruct live elapsed as
      // (now - startDate); 0 when unset (pause/stop don't need it).
      let startDate = defaults.double(forKey: "widgetStartDate")
      return ["action": action, "elapsed": elapsed, "startDate": startDate]
    }

    Function("clearWidgetAction") {
      let defaults = UserDefaults.standard
      defaults.removeObject(forKey: "widgetAction")
      defaults.removeObject(forKey: "widgetElapsed")
      defaults.removeObject(forKey: "widgetStartDate")
    }
  }
}

enum LiveActivityError: Error {
  case notAvailable
}
