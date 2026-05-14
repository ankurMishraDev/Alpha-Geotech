// import { Provider as PaperProvider, MD3LightTheme } from 'react-native-paper';
// import { SafeAreaProvider } from 'react-native-safe-area-context';
// import AppNavigator from './src/navigation/AppNavigator';



// export default function App() {
//   return (
//     <SafeAreaProvider>
//       <PaperProvider theme={theme}>
//         <AppNavigator />
//       </PaperProvider>
//     </SafeAreaProvider>
//   );
// }

import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { PaperProvider } from "react-native-paper";
import { MD3LightTheme } from "react-native-paper";

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
        <View style={styles.container}>
          <Text style={styles.code}>401</Text>
          <Text style={styles.title}>Unauthorized</Text>
          <Text style={styles.message}>
            Access to this application is restricted.
          </Text>
        </View>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  code: {
    fontSize: 72,
    fontWeight: "bold",
    color: "#d32f2f",
  },
  title: {
    fontSize: 28,
    fontWeight: "600",
    marginTop: 10,
    color: "#333",
  },
  message: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 15,
    color: "#555",
  },
});
