import ReactNativeKit
import SwiftUI

// Debug releases don't work, this hack allows us to use dev bundle in Release
class DevBundle: Bundle, @unchecked Sendable {
    override func url(forResource name: String?, withExtension ext: String?) -> URL? {
        return URL(string: "http://localhost:8081/index.bundle?platform=macos")!
    }
}

@main
struct MyApp: App {
    init() {
        ExpoBootstrap.registerModules()
        ReactNativeBrownfield.shared.bundle = DevBundle()
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
