import ReactNativeKit
import SwiftUI

@main
struct MyApp: App {
    init() {
        ExpoBootstrap.registerModules()
        //ReactNativeBrownfield.shared.bundle = Bundle()
        ReactNativeBrownfield.shared.startReactNative {
            print("React Native bundle loaded")
        }
    }

    var body: some Scene {
        WindowGroup {
            ReactNativeView(moduleName: "Hello")
        }
    }
}
