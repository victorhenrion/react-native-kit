# react-native-kit

Use React Native in your iOS & macOS apps in just one command, no Xcode required.

> This is an experiment with the goal of making React Native really easy to install and integrate in existing apps, especially those that don't use Xcode (using Swift Package Manager directly or alongside new initiatives such as [Xtool](https://github.com/xtool-org/xtool)).\
> As such, the developer experience is not far from optimal and it hasn't been tested for production use. I am still exploring potential pathways for DX, including an SPM plugin.

## Installation

`react-native-kit` is not yet available on NPM (the existing package is a homonym).

## Usage

Here's how you can run the example:

```bash
# Clone this repository
git clone https://github.com/victorhenrion/react-native-kit.git

# Install & build
yarn install
yarn workspaces foreach --all run build

# Compile framework
cd examples/ios-react
yarn ios

# Compile app & run in Simulator
brew install xtool-org/tap/xtool
xtool setup
cd examples/ios
open -a Simulator.app
xtool dev -s

# Start Metro
cd examples/ios-react
yarn start

# Open "Example" app in Simulator, you should see "Hello from React Native"
```

## Tips

Always use `--clean` when updating `react-native-kit` or anything other than Pods.

## Notes

This project is inspired and builds upon the [ios-rn-prebuilt](https://github.com/wafflestudio/ios-rn-prebuilt) repository by @wafflestudio, thanks to them!

## Nitro

I'm trying to import my example Nitro module "SpeedLib" inside my iOS example app.

I'm currently stuck with this error:

```
examples/ios-react/ios/kit/temp/Debug/iphonesimulator/DerivedData/Build/Intermediates.noindex/ArchiveIntermediates/ReactNativeKit/BuildProductsPath/Debug-iphonesimulator/React-runtimescheduler/React_runtimescheduler.framework/Headers/react/renderer/runtimescheduler/SchedulerPriorityUtils.h:16:39: error: missing '#include "ReactCommon/SchedulerPriority.h"'; 'SchedulerPriority' must be declared before it is used
static constexpr std::underlying_type<SchedulerPriority>::type serialize(
```
