import { StyleSheet, Platform, StatusBar } from 'react-native';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: '#111827',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0
  },
  scrollView: {
    flex: 1,
  },
  mainContainer: {
    padding: 16,
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingMessage: {
    color: 'white',
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    backgroundColor: 'rgba(127, 29, 29, 0.4)',
    borderColor: '#DC2626',
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorTitle: {
    color: '#FECACA',
    fontWeight: 'bold',
  },
  errorMessage: {
    color: '#FECACA',
  },
  tabContainer: {
    marginBottom: 24,
  },
  tabNav: {
    borderBottomWidth: 1,
    borderColor: '#374151',
  },
  tabButton: {
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 2,
    borderColor: 'transparent',
    marginRight: 24,
  },
  tabButtonActive: {
    borderColor: '#A78BFA',
  },
  tabButtonActiveWins: {
    borderColor: '#60A5FA',
  },
  tabButtonActiveShame: {
    borderColor: '#F87171',
  },
  tabButtonActiveLeaderboard: {
    borderColor: '#FBBF24',
  },
  tabButtonActiveLearn: {
    borderColor: '#34D399',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  tabTextActive: {
    color: '#A78BFA',
  },
  tabTextActiveWins: {
    color: '#60A5FA',
  },
  tabTextActiveShame: {
    color: '#F87171',
  },
  tabTextActiveLeaderboard: {
    color: '#FBBF24',
  },
  tabTextActiveLearn: {
    color: '#34D399',
  },
  badgeContainer: {
    marginLeft: 8,
    backgroundColor: '#1E40AF',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeContainerShame: {
    marginLeft: 8,
    backgroundColor: '#991B1B',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#DBEAFE',
    fontSize: 10,
    fontWeight: 'bold',
  },
  totalSavedCard: {
    backgroundColor: 'rgba(31, 41, 55, 0.5)',
    borderRadius: 8,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
  },
  totalSavedTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#D1D5DB',
  },
  totalSavedAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#34D399',
    marginTop: 8,
  },
  totalSavedSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  topTitleContainer: {
    backgroundColor: '#1F2937',
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  topTitleText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#A78BFA',
  },
  bottomNavBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderColor: '#374151',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  bottomNavButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 5,
  },
  bottomNavButtonText: {
    color: 'white',
    fontSize: 12,
    marginTop: 4,
  },
});
