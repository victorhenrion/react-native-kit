import SwiftUI

@main
struct ExampleApp: App {
    @NSApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate

    init() {
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}
