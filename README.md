# RNMapbox - Farm Management Tool

A React Native application for farm boundary mapping, paddock management, and livestock tracking using Mapbox GL.

## 🎥 Demo Video

Watch the application in action: [**View Demo**](https://www.loom.com/share/edef5944ee92414b995bbdd728e3d4ef)

## 🚀 Features

### Core Mapping Features
- **Farm Boundary Drawing**: Create and edit farm boundaries by tapping points on the map
- **Paddock Management**: Draw paddocks within farm boundaries with validation
- **Interactive Editing**: Drag vertices to resize polygons with haptic feedback
- **Geospatial Validation**: Ensures paddocks are contained within farm boundaries

### Livestock Management
- **Livestock Annotations**: Add and manage livestock markers (cattle, sheep)
- **Status Tracking**: Track livestock health status with color-coded indicators
- **Count Management**: Monitor livestock counts per paddock

### Data Visualization
- **Heatmap View**: Visualize data density across farm areas
- **Legend Integration**: Interactive legends for heatmap interpretation
- **Multi-layered Display**: Toggle between different view modes

### Data Persistence
- **MMKV Storage**: Fast, secure local data storage
- **Auto-save**: Automatic saving of all changes

## 🛠️ Tech Stack

- **React Native** - Cross-platform mobile development
- **TypeScript** - Type-safe JavaScript
- **Mapbox GL** - Advanced mapping and geospatial features
- **MMKV** - High-performance key-value storage
- **React Native Config** - Environment configuration
- **GeoJSON** - Geospatial data format

## 📱 Prerequisites

- Node.js (v16 or higher)
- React Native CLI
- Xcode (for iOS development)
- Android Studio (for Android development)
- CocoaPods (for iOS dependencies)

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd RNMapbox
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Mapbox Access Token**
   - Create a `.env` file in the root directory
   - Add your Mapbox access token:
     ```
     MAPBOX_ACCESS_TOKEN=your_mapbox_token_here
     ```

4. **iOS Setup**
   ```bash
   cd ios && pod install && cd ..
   ```

5. **Android Setup**
   - Ensure Android SDK is configured
   - Update local.properties if needed

## 🚀 Running the Application

### Development Mode

**iOS:**
```bash
npx react-native run-ios
```

**Android:**
```bash
npx react-native run-android
```

### Building for Production

**iOS:**
```bash
cd ios
xcodebuild -workspace RNMapbox.xcworkspace -scheme RNMapbox -configuration Release
```

**Android:**
```bash
cd android
./gradlew assembleRelease
```

## 📖 Usage Guide

### Getting Started

1. **Create Farm Boundary**
   - Launch the app and tap "Draw Farm Boundary"
   - Tap on the map to create boundary points
   - Tap "Complete Farm" when finished

2. **Add Paddocks**
   - After creating a farm, use the floating menu
   - Select "Add Paddock" mode
   - Draw paddocks within the farm boundary
   - Paddocks must be completely within farm boundaries

3. **Livestock Management**
   - Switch to "Livestock" mode
   - Add livestock markers with counts and status
   - Track different livestock types (cattle, sheep)

4. **View Heatmap**
   - Switch to "Heatmap" mode
   - View data density visualization
   - Use the legend to interpret values

### Editing Mode

- Tap "Edit" to modify existing polygons
- Drag vertex handles to resize shapes
- Haptic feedback confirms vertex manipulation
- Tap "Done Editing" to save changes

## 🔧 Configuration

## 📱 Platform Support

- **iOS**: 11.0+
- **Android**: API 21+

---

**Built with ❤️ using React Native and Mapbox GL**
