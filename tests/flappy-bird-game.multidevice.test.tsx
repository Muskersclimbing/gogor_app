import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  FlappyBirdGame,
  type GamePlayer,
} from "../components/flappy-bird-game";

vi.mock("react-native", () => ({
  Dimensions: { get: () => ({ width: 375, height: 800 }) },
  View: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Text: ({ children }: { children?: React.ReactNode }) => (
    <span>{children}</span>
  ),
  Image: () => <img alt="sprite" />,
}));
vi.mock("expo-audio", () => ({
  setAudioModeAsync: vi.fn(),
  useAudioPlayer: () => ({ play: vi.fn(), seekTo: vi.fn() }),
}));
vi.mock("react-native-reanimated", () => ({
  default: {
    View: ({
      children,
      testID,
    }: {
      children?: React.ReactNode;
      testID?: string;
    }) => <div data-testid={testID}>{children}</div>,
  },
  useSharedValue: (value: unknown) => ({ get: () => value, set: vi.fn() }),
  useAnimatedStyle: (callback: () => unknown) => callback(),
  useAnimatedReaction: vi.fn(),
  cancelAnimation: vi.fn(),
  withTiming: (value: number) => value,
}));

const players: GamePlayer[] = [
  { id: "tindeq-a", currentForce: 10, highZone: 20, color: "#fbbf24" },
  { id: "frez-b", currentForce: 30, highZone: 40, color: "#38bdf8" },
];

describe("birds for connected players", () => {
  it("renders a separate numbered bird for each device", () => {
    const markup = renderToStaticMarkup(
      <FlappyBirdGame players={players} isPaused={false} />,
    );
    expect(markup).toContain('data-testid="bird-tindeq-a"');
    expect(markup).toContain('data-testid="bird-frez-b"');
    expect(markup.match(/data-testid="bird-/g)).toHaveLength(2);
    expect(markup).toContain("<span>1</span>");
    expect(markup).toContain("<span>2</span>");
  });
  it("keeps the single-device game to one bird without a player badge", () => {
    const markup = renderToStaticMarkup(
      <FlappyBirdGame players={[players[0]]} isPaused={false} />,
    );
    expect(markup.match(/data-testid="bird-/g)).toHaveLength(1);
    expect(markup).not.toContain("<span>1</span>");
  });
});
