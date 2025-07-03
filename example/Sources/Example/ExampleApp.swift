import ReactNativeKit
import SwiftUI

@main
struct ExampleApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate

    init() {
    }

    private let eventEmitter = EventEmitter<ExampleEvent>()

    var body: some Scene {
        WindowGroup {
            VStack {
                Button("Send Event") {
                    Task {
                        await eventEmitter.emitEvent(
                            .buttonClicked, payload: ["message": "Hello from native"])
                    }
                }
                ContentView()
            }
        }
    }
}

enum ExampleEvent: String, SupportedEvent {
    case buttonClicked
}
