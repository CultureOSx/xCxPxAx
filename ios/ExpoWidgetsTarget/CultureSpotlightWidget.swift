import WidgetKit
import SwiftUI
internal import ExpoWidgets

struct CultureSpotlightWidget: Widget {
  let name: String = "CultureSpotlightWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: name, provider: WidgetsTimelineProvider(name: name)) { entry in
      WidgetsEntryView(entry: entry)
    }
    .configurationDisplayName("Spotlight")
    .description("Featured cultural pick from CulturePass Discover")
    .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
  }
}