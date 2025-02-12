import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { Stack } from "expo-router";
import { View } from "react-native";
import { StatusBar } from "expo-status-bar";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 30, // 30分間
      gcTime: 1000 * 60 * 60, // 60分間
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    },
  },
});

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
});

persistQueryClient({
  queryClient,
  persister: persister,
});

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <View style={{ flex: 1, backgroundColor: "#000" }}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        />
      </View>
    </QueryClientProvider>
  );
}
