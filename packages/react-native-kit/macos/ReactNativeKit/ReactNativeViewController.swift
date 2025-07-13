import AppKit
internal import React

@objc public class ReactNativeViewController: NSViewController {
  private var moduleName: String
  private var initialProperties: [String: Any]?

  @objc public init(moduleName: String, initialProperties: [String: Any]? = nil) {
    self.moduleName = moduleName
    self.initialProperties = initialProperties
    super.init(nibName: nil, bundle: nil)
  }

  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  public override func viewDidLoad() {
    super.viewDidLoad()

    if !moduleName.isEmpty {
      view =
        ReactNativeBrownfield.shared.view(
          moduleName: moduleName,
          initialProps: initialProperties,
          launchOptions: nil
        ) ?? NSView()
    }
  }
}
