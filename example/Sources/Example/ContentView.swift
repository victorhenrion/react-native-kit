import ReactNativeKit
import SwiftUI

struct ContentView: UIViewRepresentable {
    let bundleUrl = URL(
        string: "http://localhost:8081/index.bundle?platform=ios&dev=true&minify=false")!
    let moduleName = "Hello"

    func makeUIView(context _: Context) -> UIView {
        return makeReactView(
            bundleURL: bundleUrl,
            moduleName: moduleName,
            initialProperties: [:])
    }

    func updateUIView(_: UIView, context _: Context) {}
}
