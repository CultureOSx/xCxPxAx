import WidgetKit
import SwiftUI

/// Bacon `widget` target — **not** the Expo home-screen widgets (those live in `ExpoWidgetsTarget`).
/// The old `widget()` entry was the Xcode “Time + Favorite Emoji” template; it is removed so users
/// don’t confuse it with real CulturePass widgets. Add widgets from the **ExpoWidgetsTarget** extension
/// after a native rebuild (`eas build` / `expo prebuild`).
@main
struct exportWidgets: WidgetBundle {
    var body: some Widget {
        widgetControl()
        WidgetLiveActivity()
    }
}
