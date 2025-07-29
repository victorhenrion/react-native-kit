import Foundation
import SpeedLibProtocol

final class HybridSpeedLib: HybridSpeedLibSpec {
    private lazy var provider: SpeedLibProtocol = {
        guard
            let bundleName = Bundle.main.infoDictionary?["CFBundleName"],
            let providerClass = NSClassFromString("\(bundleName).SpeedLibProvider") as? SpeedLibProtocol.Type
        else {
            fatalError("Could not find SpeedLibProvider class implementing SpeedLibProtocol.")
        }

        return providerClass.init()
    }()

    func multiply(a: Double, b: Double) throws -> Double {
        return try provider.multiply(a: a, b: b)
    }
}
