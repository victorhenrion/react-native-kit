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
            path: "./ReactNative/ios/kit/Debug/ReactNativeKit.xcframework"
        ),
        .binaryTarget(
            name: "hermes",
            path: "./ReactNative/ios/kit/Debug/hermes.xcframework"
        ),
        .binaryTarget(
            name: "ReactBrownfield",
            path: "./ReactNative/ios/kit/Debug/ReactBrownfield.xcframework"
        ),
        .binaryTarget(
            name: "SpeedLib",
            path: "./ReactNative/ios/kit/Debug/SpeedLib.xcframework"
        ),
        .target(
            name: "Example",
            dependencies: [
                "ReactNativeKit",
                "hermes",
                "ReactBrownfield",
                "SpeedLib",
            ],
        ),
    ]
)
