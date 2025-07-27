import Foundation
import SpeedLibProtocol

final class HybridSpeedLib: HybridSpeedLibSpec {
    private let provider: SpeedLibProtocol

    override init() {
        guard
            let bundleName = Bundle.main.infoDictionary?["CFBundleName"],
            let providerClass = NSClassFromString("\(bundleName).SpeedLibProvider") as? SpeedLibProtocol.Type
        else {
            fatalError("Could not find SpeedLibProvider class implementing SpeedLib protocol.")
        }

        self.provider = providerClass.init()
    }

    func multiply(a: Double, b: Double) throws -> Double {
        return try provider.multiply(a: a, b: b)
    }
}
