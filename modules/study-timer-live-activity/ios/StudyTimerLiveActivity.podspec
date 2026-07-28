Pod::Spec.new do |s|
  s.name           = 'StudyTimerLiveActivity'
  s.version        = '1.0.0'
  s.summary        = 'Expo module bridging ActivityKit Live Activities'
  s.homepage       = 'https://github.com/example'
  s.license        = 'MIT'
  s.author         = 'Study Timer'
  s.platform       = :ios, '16.1'
  s.source         = { git: '' }
  s.swift_version  = '5.9'
  s.source_files   = '**/*.swift'
  s.framework      = 'ActivityKit'
  s.dependency 'ExpoModulesCore'
end
