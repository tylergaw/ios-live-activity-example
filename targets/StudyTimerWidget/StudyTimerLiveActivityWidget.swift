import ActivityKit
import AppIntents
import WidgetKit
import SwiftUI

struct StudyTimerLiveActivityWidget: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: StudyTimerAttributes.self) { context in
      LockScreenView(context: context)
    } dynamicIsland: { context in
      DynamicIsland {
        DynamicIslandExpandedRegion(.leading) {
          VStack(alignment: .leading, spacing: 4) {
            Label(context.attributes.sessionName, systemImage: "book.fill")
              .font(.caption)
              .lineLimit(1)
            Text(context.state.isPaused ? "Paused" : "Studying...")
              .font(.caption2)
              .foregroundColor(context.state.isPaused ? .orange : .secondary)
          }
        }
        DynamicIslandExpandedRegion(.trailing) {
          TimerTextView(state: context.state)
            .font(.title2)
            .fontWeight(.bold)
            .monospacedDigit()
        }
        DynamicIslandExpandedRegion(.bottom) {
          TimerButtonsView(state: context.state)
            .padding(.top, 4)
        }
      } compactLeading: {
        Label {
          Text(context.attributes.sessionName)
            .lineLimit(1)
        } icon: {
          Image(systemName: "book.fill")
        }
        .font(.caption)
      } compactTrailing: {
        TimerTextView(state: context.state)
          .font(.caption)
          .monospacedDigit()
      } minimal: {
        TimerTextView(state: context.state)
          .font(.caption2)
          .monospacedDigit()
      }
    }
  }
}

// MARK: - Timer Text View

struct TimerTextView: View {
  let state: StudyTimerAttributes.ContentState

  var body: some View {
    Group {
      if state.isPaused {
        // Paused is a static value, so format it ourselves — matched to the
        // `.timer` style below (no zero-padded hours) so the two states look
        // identical.
        Text(stopwatchString(state.pausedElapsed))
          .foregroundColor(.orange)
      } else {
        // Count up from startDate with a bounded end. This renders real ticking
        // digits on the lock screen. (`.timer` style renders as coarse relative
        // text — "2 minutes" — in this iOS build; `Date.distantFuture` as the
        // end makes the seconds show as "--".)
        Text(
          timerInterval: state.startDate...state.startDate.addingTimeInterval(24 * 60 * 60),
          countsDown: false
        )
        .foregroundColor(.green)
      }
    }
    .multilineTextAlignment(.trailing)
  }
}

// MARK: - Timer Buttons

struct TimerButtonsView: View {
  let state: StudyTimerAttributes.ContentState

  var body: some View {
    HStack(spacing: 12) {
      if state.isPaused {
        Button(intent: ResumeTimerIntent()) {
          Label("Resume", systemImage: "play.fill")
            .font(.caption)
            .frame(maxWidth: .infinity)
        }
        .tint(.green)
      } else {
        Button(intent: PauseTimerIntent()) {
          Label("Pause", systemImage: "pause.fill")
            .font(.caption)
            .frame(maxWidth: .infinity)
        }
        .tint(.orange)
      }

      Button(intent: StopTimerIntent()) {
        Label("Stop", systemImage: "stop.fill")
          .font(.caption)
          .frame(maxWidth: .infinity)
      }
      .tint(.red)
    }
  }
}

// MARK: - Lock Screen View

struct LockScreenView: View {
  let context: ActivityViewContext<StudyTimerAttributes>

  var body: some View {
    VStack(spacing: 12) {
      HStack {
        Image(systemName: "book.fill")
          .font(.title3)
          .foregroundColor(.blue)

        VStack(alignment: .leading, spacing: 2) {
          Text(context.attributes.sessionName)
            .font(.headline)
            .lineLimit(1)
          Text(context.state.isPaused ? "Paused" : "Studying...")
            .font(.caption)
            .foregroundColor(context.state.isPaused ? .orange : .secondary)
        }

        Spacer()

        TimerTextView(state: context.state)
          .font(.title2)
          .fontWeight(.bold)
          .monospacedDigit()
      }

      TimerButtonsView(state: context.state)
    }
    .padding()
    .activityBackgroundTint(.black.opacity(0.7))
  }
}

// MARK: - Helpers

/// Formats elapsed seconds to match SwiftUI's `.timer` text style: no
/// zero-padded hours, hours shown only once the timer passes an hour
/// (e.g. "0:16", "2:26", "1:02:26"). Used for the paused (static) value so it
/// matches the running (`.timer`) value exactly.
func stopwatchString(_ totalSeconds: Int) -> String {
  let s = max(0, totalSeconds)
  let hours = s / 3600
  let minutes = (s % 3600) / 60
  let seconds = s % 60
  if hours > 0 {
    return String(format: "%d:%02d:%02d", hours, minutes, seconds)
  }
  return String(format: "%d:%02d", minutes, seconds)
}

// MARK: - Previews

#Preview("Lock Screen", as: .content, using: StudyTimerAttributes(sessionName: "Chapter 7 Review")) {
  StudyTimerLiveActivityWidget()
} contentStates: {
  StudyTimerAttributes.ContentState(startDate: .now, pausedElapsed: 0, isPaused: false)
  StudyTimerAttributes.ContentState(startDate: .now.addingTimeInterval(-95), pausedElapsed: 0, isPaused: false)
  StudyTimerAttributes.ContentState(startDate: .now, pausedElapsed: 100, isPaused: true)
}

#Preview("Dynamic Island", as: .dynamicIsland(.expanded), using: StudyTimerAttributes(sessionName: "Chapter 5 Review")) {
  StudyTimerLiveActivityWidget()
} contentStates: {
  StudyTimerAttributes.ContentState(startDate: .now.addingTimeInterval(-95), pausedElapsed: 0, isPaused: false)
  StudyTimerAttributes.ContentState(startDate: .now, pausedElapsed: 100, isPaused: true)
}
