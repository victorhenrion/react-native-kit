require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "SpeedLibProtocol"
  s.version      = package["version"]
  s.platforms    = { :ios => "16.0", :macos => "11.0"}

  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]
  s.source       = { :git => "https://github.com/victorhenrion/react-native-kit.git", :tag => "#{s.version}" }

  s.source_files = [
    "Sources/**/*.{swift}",
  ]
end
