import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/HomeScreen';
import EditorScreen from '../screens/EditorScreen';
import SplashScreen from '../screens/SplashScreen';
import LandingScreen from '../screens/LandingScreen';
import PresetLibraryScreen from '../screens/PresetLibraryScreen';
import AIStyleScreen from '../screens/AIStyleScreen';
import ExportScreen from '../screens/ExportScreen';
import HelpScreen from '../screens/HelpScreen';
import UpscaleScreen from '../screens/UpscaleScreen';

export type RootStackParamList = {
  Splash: undefined;
  Landing: undefined;
  Home: undefined;
  Editor: { imageUri: string; projectId?: string };
  PresetLibrary: undefined;
  AIStyle: undefined;
  Export: undefined;
  Help: undefined;
  Upscale: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#131313' },
      }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Landing" component={LandingScreen} />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Editor" component={EditorScreen} />
      <Stack.Screen name="PresetLibrary" component={PresetLibraryScreen} />
      <Stack.Screen name="AIStyle" component={AIStyleScreen} />
      <Stack.Screen name="Export" component={ExportScreen} />
      <Stack.Screen name="Help" component={HelpScreen} />
      <Stack.Screen name="Upscale" component={UpscaleScreen} />
    </Stack.Navigator>
  );
}
