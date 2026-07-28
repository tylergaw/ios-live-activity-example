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
        // Single-row layout mirroring the lock screen: session name + timer on
        // the leading side, circular controls on the trailing side. The
        // expanded island has rounded corners, so nudge each side off them.
        DynamicIslandExpandedRegion(.leading) {
          VStack(alignment: .leading, spacing: 2) {
            Text(context.attributes.sessionName)
              .font(.caption)
              .foregroundColor(.primary)
              .lineLimit(1)
            TimerTextView(state: context.state)
              .font(.largeTitle)
              .fontWeight(.light)
              .monospacedDigit()
          }
          .padding(.leading, 4)
          // Fill the region's height and center the stack vertically (Alignment
          // .leading = leading horizontally, center vertically).
          .frame(maxHeight: .infinity, alignment: .leading)
        }
        DynamicIslandExpandedRegion(.trailing) {
          TimerButtonsView(state: context.state, controlSize: .regular)
            .padding(.trailing, 4)
            // Push the row down so the leading (Stop) button clears the camera
            // cutout at the top-center of the expanded island.
            .padding(.top, 10)
        }
      } compactLeading: {
        Text(context.attributes.sessionName)
          .font(.caption)
          .lineLimit(1)
      } compactTrailing: {
        TimerTextView(state: context.state)
          .font(.caption)
          .monospacedDigit()
          .multilineTextAlignment(.trailing)
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
      } else {
        // Count up from startDate with a bounded end. This renders real ticking
        // digits on the lock screen. (`.timer` style renders as coarse relative
        // text — "2 minutes" — in this iOS build; `Date.distantFuture` as the
        // end makes the seconds show as "--".)
        Text(
          timerInterval: state.startDate...state.startDate.addingTimeInterval(24 * 60 * 60),
          countsDown: false
        )
      }
    }
    // Neutral in both states — matches the app's timer, which stays `c.text`
    // regardless of running/paused. Pause vs. run is conveyed by the buttons.
    .foregroundColor(.primary)
    // Alignment is intentionally NOT set here. The running `Text(timerInterval:)`
    // reserves a fixed (wider) frame, and the alignment decides where the digits
    // sit within it. Different presentations need different alignment, so each
    // call site sets its own: the stacked layouts rely on the default (leading)
    // to sit flush under the session name; the compact island sets `.trailing`
    // so the time is flush right.
  }
}

// MARK: - Timer Buttons

struct TimerButtonsView: View {
  let state: StudyTimerAttributes.ContentState
  // Defaults to `.large` (lock screen); the expanded island passes `.regular`
  // for slightly smaller circles. Must be a parameter, not a call-site
  // modifier — the `.controlSize` applied inside this view would otherwise win.
  var controlSize: ControlSize = .large

  var body: some View {
    // Circular, icon-only controls: Stop (xmark) on the leading side, the
    // pause/resume toggle (pause.fill / play.fill) on the trailing side.
    HStack(spacing: 12) {
      Button(intent: StopTimerIntent()) {
        Image(systemName: "xmark")
      }
      .tint(.primary)

      if state.isPaused {
        Button(intent: ResumeTimerIntent()) {
          Image(systemName: "play.fill")
        }
        .tint(.green)
      } else {
        Button(intent: PauseTimerIntent()) {
          Image(systemName: "pause.fill")
        }
        .tint(.orange)
      }
    }
    .buttonStyle(.bordered)
    .buttonBorderShape(.circle)
    .controlSize(controlSize)
    .imageScale(.large)
  }
}

// MARK: - Lock Screen View

struct LockScreenView: View {
  let context: ActivityViewContext<StudyTimerAttributes>

  var body: some View {
    // Single row: session name + timer stacked on the leading side, the
    // circular controls on the trailing side.
    HStack {
      VStack(alignment: .leading, spacing: 2) {
        Text(context.attributes.sessionName)
          .font(.body)
          .foregroundColor(.primary)
          .lineLimit(1)

        TimerTextView(state: context.state)
          .font(.largeTitle)
          .fontWeight(.light)
          .monospacedDigit()
      }

      Spacer()

      TimerButtonsView(state: context.state)
    }
    .padding()
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
