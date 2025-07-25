import Foundation

final class HybridSpeedLib: HybridSpeedLibSpec {
    private let provider: SpeedLib

    init() {
        guard
            let bundleName = Bundle.main.infoDictionary?["CFBundleName"],
            let providerClass = NSClassFromString("\(bundleName).SpeedLibProvider") as? SpeedLib.Type
        else {
            fatalError("Could not find SpeedLibProvider class implementing SpeedLib protocol.")
        }

        self.provider = providerClass.init()
    }

    func multiply(a: Double, b: Double) throws -> Double {
        return try provider.multiply(a: a, b: b)
    }
}
