import Foundation
import SpeedLibProtocol

@objc(SpeedLibProvider) public final class SpeedLibProvider: NSObject, SpeedLibProtocol {
    public func multiply(a: Double, b: Double) throws -> Double {
        return a * b
    }
}
