import React from "react";
import { render } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AuthModal from "@/components/modal/AuthModal";

jest.mock("@react-native-google-signin/google-signin", () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(),
    signIn: jest.fn(),
  },
  statusCodes: {
    SIGN_IN_CANCELLED: "SIGN_IN_CANCELLED",
    IN_PROGRESS: "IN_PROGRESS",
    PLAY_SERVICES_NOT_AVAILABLE: "PLAY_SERVICES_NOT_AVAILABLE",
  },
}));

jest.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signInWithIdToken: jest.fn(),
    },
  },
}));

jest.mock("@/providers/AuthProvider", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/hooks/stores/useAuthStore", () => ({
  useAuthStore: jest.fn(),
}));

jest.mock("expo-linear-gradient", () => ({
  LinearGradient: "LinearGradient",
}));

jest.mock("@expo/vector-icons", () => ({
  AntDesign: "AntDesign",
}));

const { useAuth } = require("@/providers/AuthProvider");
const { useAuthStore } = require("@/hooks/stores/useAuthStore");

describe("AuthModal", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    useAuth.mockReturnValue({ session: null, setSession: jest.fn() });
    useAuthStore.mockReturnValue({ showAuthModal: false, setShowAuthModal: jest.fn() });
  });

  const wrapper = ({ children }: any) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("renders without crashing", () => {
    const { UNSAFE_root } = render(<AuthModal />, { wrapper });
    expect(UNSAFE_root).toBeTruthy();
  });
});


