import ReactBrownfield
import ReactNativeKit
import SwiftUI

@main
struct ExampleApp: App {
    init() {
        ExpoBootstrap.registerModules()
        ReactNativeBrownfield.shared.startReactNative {
            print("React Native bundle loaded")
        }
    }

    var body: some Scene {
        WindowGroup {
            ReactNativeView(moduleName: "App")
        }
    }
}
