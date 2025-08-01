import ReactBrownfield
import ReactNativeKit
import SpeedLib  // the goal is to succesfully import this
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

final class HybridSpeedLibTwo: HybridSpeedLibSpec {  // so that i can do this
    func multiply(a: Double, b: Double) throws -> Double {
        return a * b
    }
}
