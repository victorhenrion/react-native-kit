import ReactNativeKit
import SwiftUI

struct ContentView: NSViewRepresentable {
    let bundleUrl = URL(
        string: "http://localhost:8081/index.bundle?platform=macos&dev=true&minify=false")!
    let moduleName = "Hello"

    func makeNSView(context _: Context) -> NSView {
        return makeReactView(
            bundleURL: bundleUrl,
            moduleName: moduleName,
            initialProperties: [:])
    }

    func updateNSView(_: NSView, context _: Context) {}
}
