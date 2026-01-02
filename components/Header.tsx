import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Using Ionicons for icons

/**
 * Props for the Header component.
 */
interface HeaderProps {
  /** Function to call when the "Add Manually" button is clicked. */
  onAddPurchase: () => void;
  /** Function to call when the "Scan" button is clicked. */
  onScanReceipt: () => void;
  /** Function to call when the "Settings" icon is clicked. */
  onOpenSettings: () => void;
}

/**
 * The main application header component.
 * Displays the app title and primary action buttons.
 */
export const Header: React.FC<HeaderProps> = React.memo(({ onAddPurchase, onScanReceipt, onOpenSettings }) => {
  return (
    <View style={styles.header}>
      <View style={styles.container}>
        <Text style={styles.title}>
          Returnley
        </Text>
        <View style={styles.actionsContainer}>
           <View style={styles.buttonsWrapper}>
              <TouchableOpacity
                onPress={onScanReceipt}
                style={styles.scanButton}
              >
                <Ionicons name="camera-outline" size={20} color="white" />
                <Text style={styles.buttonText}>Scan</Text>
              </TouchableOpacity>
               <TouchableOpacity
                onPress={onAddPurchase}
                style={styles.addButton}
              >
                <Text style={styles.buttonText}>Add Manually</Text>
              </TouchableOpacity>
           </View>
          
          <TouchableOpacity
            onPress={onOpenSettings}
            style={styles.settingsButton}
          >
            <Ionicons name="settings-outline" size={24} color="#CBD5E0" />
          </TouchableOpacity>
        </View>
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
  },
  container: {
    flexDirection: 'row', // flex
    justifyContent: 'space-between', // justify-between
    alignItems: 'center', // items-center
    paddingHorizontal: 16, // px-4 (md:px-6 is not directly translatable without responsive logic)
    marginHorizontal: 'auto', // mx-auto (conceptually, but often handled by parent View flex)
    maxWidth: 960, // approximate container width
  },
  title: {
    fontSize: 24, // md:text-2xl (text-xl is 20, text-2xl is 24)
    fontWeight: 'bold', // font-bold
    color: 'transparent', // This will need a gradient overlay component or similar for full effect
    // For now, we'll just use a solid color or let the gradient text be handled externally.
    // As a placeholder, we'll give it a visible color.
    // Note: React Native Text does not directly support background-clip: text or linear-gradient as text color.
    // A common workaround involves SVG or third-party libraries.
    // For simplicity, using a static color that fits the scheme.
    color: '#A78BFA', // from-purple-400
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    // space-x-2 for outer container
  },
  buttonsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8, // space-x-2 -> 8 units of space
  },
  scanButton: {
    backgroundColor: '#047857', // bg-teal-600
    paddingVertical: 8, // py-2
    paddingHorizontal: 16, // px-4
    borderRadius: 8, // rounded-lg
    flexDirection: 'row', // flex
    alignItems: 'center', // items-center
    marginRight: 8, // space-x-2
    shadowColor: '#000', // shadow-md
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  addButton: {
    backgroundColor: '#8B5CF6', // bg-purple-600
    paddingVertical: 8, // py-2
    paddingHorizontal: 16, // px-4
    borderRadius: 8, // rounded-lg
    shadowColor: '#000', // shadow-md
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  buttonText: {
    color: 'white', // text-white
    fontWeight: 'bold', // font-bold
    fontSize: 14, // text-sm
    marginLeft: 4, // for icon spacing
  },
  settingsButton: {
    padding: 8, // p-2
    borderRadius: 9999, // rounded-full
    // hover:bg-gray-700 hover:text-white (handled by TouchableOpacity feedback)
  },
});
