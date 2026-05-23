import "../global.css";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { StyleSheet } from "react-native";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 2,
    },
  },
});

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="dark" backgroundColor="#FFFFFF" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="product/[id]"
              options={{
                headerShown: true,
                headerTransparent: true,
                headerTitle: "",
                headerBackTitle: "",
                presentation: "card",
              }}
            />
            <Stack.Screen
              name="cart"
              options={{
                headerShown: true,
                headerTitle: "My Cart",
                headerTitleStyle: { fontSize: 17, fontWeight: "700" as const },
                presentation: "card",
              }}
            />
            <Stack.Screen
              name="checkout"
              options={{
                headerShown: true,
                headerTitle: "Checkout",
                headerTitleStyle: { fontSize: 17, fontWeight: "700" as const },
              }}
            />
            <Stack.Screen
              name="order-tracking"
              options={{
                headerShown: false,
                presentation: "fullScreenModal",
              }}
            />
            <Stack.Screen
              name="search"
              options={{
                headerShown: false,
                animation: "fade",
              }}
            />
          </Stack>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ flex: { flex: 1 } });
