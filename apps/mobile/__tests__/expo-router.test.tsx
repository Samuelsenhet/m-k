import { renderRouter, screen } from "expo-router/testing-library";
import { Text, View } from "react-native";

describe("expo-router testing-library", () => {
  it("uses initialUrl with inline mock filesystem", () => {
    const MockComponent = jest.fn(() => (
      <View>
        <Text testID="route">ok</Text>
      </View>
    ));

    renderRouter(
      {
        index: MockComponent,
        "directory/a": MockComponent,
        "(group)/b": MockComponent,
      },
      { initialUrl: "/directory/a" }
    );

    expect(screen).toHavePathname("/directory/a");
    expect(screen.getByTestId("route")).toBeTruthy();
  });

  it("creates null routes from string array", () => {
    renderRouter(["index", "directory/a", "(group)/b"], {
      initialUrl: "/directory/a",
    });

    expect(screen).toHavePathname("/directory/a");
  });
});
