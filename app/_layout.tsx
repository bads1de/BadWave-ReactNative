import { Stack } from "expo-router";
import { View } from "react-native";
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#000',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            color: '#fff',
          },
          contentStyle: {
            backgroundColor: '#000',
          },
        }}
      />
    </View>
  );
}
