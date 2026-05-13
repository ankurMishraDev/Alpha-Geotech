import { Provider as PaperProvider, MD3LightTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#0D4F4F', // Deep Teal / Emerald from UI design
    secondary: '#1A7A7A',
    tertiary: '#E6F4F1',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    onPrimary: '#FFFFFF',
    onSurface: '#1E293B',
    elevation: {
      level1: '#F1F5F9',
      level2: '#E2E8F0',
      level3: '#CBD5E1',
      level4: '#94A3B8',
      level5: '#64748B',
    }
  },
  roundness: 2, // 8px (default is 4, 4*2 = 8px)
};

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <AppNavigator />
      </PaperProvider>
    </SafeAreaProvider>
  );
}
