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
            path: "../macos-react/macos/kit/Debug/ReactNativeKit.xcframework"
        ),
        .binaryTarget(
            name: "hermes",
            path: "../macos-react/macos/kit/Debug/hermes.xcframework"
        ),
        .binaryTarget(
            name: "ReactBrownfield",
            path: "../macos-react/macos/kit/Debug/ReactBrownfield.xcframework"
        ),
        .binaryTarget(
            name: "SpeedLib",
            path: "../macos-react/macos/kit/Debug/SpeedLib.xcframework"
        ),
        .executableTarget(
            name: "Example",
            dependencies: [
                "ReactNativeKit",
                "hermes",
                "ReactBrownfield",
                "SpeedLib",
            ],
            linkerSettings: [
                .unsafeFlags([
                    "-Xlinker", "-sectcreate",
                    "-Xlinker", "__TEXT",
                    "-Xlinker", "__info_plist",
                    "-Xlinker", "Sources/Example/Info.plist",
                ])
            ]
        ),
    ],
    swiftLanguageModes: [.v5]
)
