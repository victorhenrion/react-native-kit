import ReactNativeKit
import SwiftUI

class AppDelegate: UIResponder, UIApplicationDelegate {
    var window: UIWindow?
}

@main
struct ExampleApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate

    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}

struct ContentView: UIViewRepresentable {
    let bundleUrl = URL(
        string: "http://localhost:8081/index.bundle?platform=ios&dev=true&minify=false")!
    let moduleName = "App"

    func makeUIView(context _: Context) -> UIView {
        return makeReactView(
            bundleURL: bundleUrl,
            moduleName: moduleName,
            initialProperties: [:])
    }

    func updateUIView(_: UIView, context _: Context) {}
}
