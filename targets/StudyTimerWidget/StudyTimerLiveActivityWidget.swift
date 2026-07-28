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
    if state.isPaused {
      Text(formatTime(state.pausedElapsed))
        .foregroundColor(.orange)
    } else {
      Text(
        timerInterval: state.startDate...Date.distantFuture,
        countsDown: false
      )
      .foregroundColor(.green)
    }
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

func formatTime(_ totalSeconds: Int) -> String {
  let hours = totalSeconds / 3600
  let minutes = (totalSeconds % 3600) / 60
  let seconds = totalSeconds % 60
  return String(format: "%02d:%02d:%02d", hours, minutes, seconds)
}
