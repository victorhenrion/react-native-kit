import SwiftUI

/**
 A NSViewControllerRepresentable that bridges ReactNativeViewController to SwiftUI.
 */
struct ReactNativeViewRepresentable: NSViewControllerRepresentable {
  var moduleName: String
  var initialProperties: [String: Any] = [:]

  func makeNSViewController(context: Context) -> NSViewController {
    return ReactNativeViewController(moduleName: moduleName)
  }

  func updateNSViewController(_ nsViewController: NSViewController, context: Context) {}
}

/**
 Exposes React Native view to SwiftUI.
 */
@available(macOS 11.0, *)
public struct ReactNativeView: View {
  var moduleName: String
  var initialProperties: [String: Any] = [:]

  public init(moduleName: String, initialProperties: [String : Any] = [:]) {
    self.moduleName = moduleName
    self.initialProperties = initialProperties
  }

  public var body: some View {
    ReactNativeViewRepresentable(
      moduleName: moduleName,
      initialProperties: initialProperties
    )
    .ignoresSafeArea(.all)
  }
}
