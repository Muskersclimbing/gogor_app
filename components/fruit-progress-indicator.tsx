import React from "react";
import { View, StyleSheet } from "react-native";

interface FruitProgressIndicatorProps {
  collected: number;
  goal: number;
}

/**
 * Indicador visual de progreso con fresas pixel art
 * Muestra hasta 4 fresas en el top center
 */
export function FruitProgressIndicator({
  collected,
  goal,
}: FruitProgressIndicatorProps) {
  // Calcular cuántas fresas mostrar (máximo 4)
  const progress = Math.min(collected / goal, 1);
  const strawberriesToShow = Math.floor(progress * 4);

  return (
    <View style={styles.container}>
      {[0, 1, 2, 3].map((index) => (
        <View
          key={index}
          style={[
            styles.strawberry,
            {
              opacity: index < strawberriesToShow ? 1 : 0.3,
            },
          ]}
        >
          {/* Fresa pixel art simple */}
          <View style={styles.strawberryBody}>
            <View style={styles.strawberryLeaf} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  strawberry: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  strawberryBody: {
    width: 24,
    height: 24,
    backgroundColor: "#FF4757",
    borderRadius: 12,
    position: "relative",
    borderWidth: 2,
    borderColor: "#C23616",
  },
  strawberryLeaf: {
    position: "absolute",
    top: -6,
    left: 6,
    width: 12,
    height: 8,
    backgroundColor: "#27AE60",
    borderRadius: 4,
  },
});
