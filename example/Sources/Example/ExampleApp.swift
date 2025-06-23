import SwiftUI

@main
struct ExampleApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate

    init() {
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}
