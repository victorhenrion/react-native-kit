// swift-tools-version: 6.0

import PackageDescription

let package = Package(
    name: "Example",
    platforms: [
        .macOS(.v11)
    ],
    products: [
        .executable(
            name: "Example",
            targets: ["Example"]
        )
    ],
    dependencies: [],
    targets: [
        .binaryTarget(
            name: "ReactNativeKit",
            path: "./ReactNative/macos/output/Debug/ReactNativeKit.xcframework"
        ),
        .binaryTarget(
            name: "hermes",
            path: "./ReactNative/macos/output/Debug/hermes.xcframework"
        ),
        .executableTarget(
            name: "Example",
            dependencies: [
                "ReactNativeKit",
                "hermes",
            ],
        ),
    ],
)
