// swift-tools-version: 6.0

import PackageDescription

let package = Package(
    name: "Example",
    defaultLocalization: "en",
    platforms: [
        .iOS(.v16)
    ],
    products: [
        .library(
            name: "Example",
            targets: ["Example"]
        )
    ],
    dependencies: [],
    targets: [
        .binaryTarget(
            name: "ReactNativeKit",
            path: "../ios-react/ios/kit/Debug/ReactNativeKit.xcframework"
        ),
        .binaryTarget(
            name: "hermes",
            path: "../ios-react/ios/kit/Debug/hermes.xcframework"
        ),
        .binaryTarget(
            name: "ReactBrownfield",
            path: "../ios-react/ios/kit/Debug/ReactBrownfield.xcframework"
        ),
        .binaryTarget(
            name: "SpeedLibProtocol",
            path: "../ios-react/ios/kit/Debug/SpeedLibProtocol.xcframework"
        ),
        .target(
            name: "Example",
            dependencies: [
                "ReactNativeKit",
                "hermes",
                "ReactBrownfield",
                "SpeedLibProtocol",
            ],
        ),
    ]
)
