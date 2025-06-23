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
            path: "./ReactNative/ios/output/Debug/ReactNativeKit.xcframework"
        ),
        .binaryTarget(
            name: "hermes",
            path: "./ReactNative/ios/output/Debug/hermes.xcframework"
        ),
        .target(
            name: "Example",
            dependencies: [
                "ReactNativeKit",
                "hermes",
            ],
        ),
    ]
)
