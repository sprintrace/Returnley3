import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * Props for the Header component.
 */
interface HeaderProps {
  // No props needed now
}

/**
 * The main application header component.
 * Displays the app title.
 */
export const Header: React.FC<HeaderProps> = React.memo(() => {
  return (
    <View style={styles.header}>
      <View style={styles.container}>
        <Text style={styles.title}>
          Returnley
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#1F2937', // bg-gray-800
    shadowColor: '#000', // shadow-lg
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    paddingVertical: 16, // py-4
    alignItems: 'center', // Center content horizontally
  },
  container: {
    paddingHorizontal: 16, // px-4 (md:px-6 is not directly translatable without responsive logic)
    maxWidth: 960, // approximate container width
    width: '100%', // Ensure it takes full width within header
    alignItems: 'center', // Center title text
  },
  title: {
    fontSize: 24, // md:text-2xl (text-xl is 20, text-2xl is 24)
    fontWeight: 'bold', // font-bold
    color: 'transparent', // This will need a gradient overlay component or similar for full effect
    color: '#A78BFA', // from-purple-400
    flexShrink: 1, // Allow the title to shrink if necessary
    marginBottom: 0, // No margin needed, as no buttons below
  },
});
