import WidgetKit
import SwiftUI
internal import ExpoWidgets

struct CultureNearYouWidget: Widget {
  let name: String = "CultureNearYouWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: name, provider: WidgetsTimelineProvider(name: name)) { entry in
      WidgetsEntryView(entry: entry)
    }
    .configurationDisplayName("Near You")
    .description("Upcoming events near your city")
    .supportedFamilies([.systemMedium, .systemLarge])
  }
}