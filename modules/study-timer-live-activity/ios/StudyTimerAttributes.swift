import ActivityKit
import Foundation

public struct StudyTimerAttributes: ActivityAttributes {
  public struct ContentState: Codable, Hashable {
    /// When running: the Date the current run segment started, offset so
    /// Date().timeIntervalSince(startDate) equals total elapsed time.
    /// When paused: ignored.
    var startDate: Date
    /// When paused: total seconds elapsed before the pause.
    /// When running: 0 (unused, startDate drives the display).
    var pausedElapsed: Int
    var isPaused: Bool
  }

  var sessionName: String
}
