import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Image, FlatList, StyleSheet, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, DrawerActions, useFocusEffect } from '@react-navigation/native';
import { OverviewAllSections as StaticOverview } from '@/services/hrservices/OverviewObj';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { EmployeesAttendance as StaticAttendance } from '@/services/hrservices/EmployeeAttendanceObj';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '@/auth/authSlice';
import { fetchHrDashboard } from '@/auth/dataSlice';
import { apiService } from '@/services/api';
import { useSocket } from '@/context/SocketContext';

const ManagerHomeScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  
  const { summary, recentLeaves, loading } = useSelector(state => state.data.hrDashboard);
  const { socket } = useSocket();

  const loadDashboard = () => {
    dispatch(fetchHrDashboard());
  };

  const overviewItems = StaticOverview.map(item => {
    if (!summary) return item;
    let count = item.count;
    if (item.title === 'Employee List') count = summary.employeeCount;
    if (item.title === 'Leave Requests') count = summary.pendingLeaves;
    if (item.title === 'Attendance') count = summary.todayAttendance;
    if (item.title === 'Project Task') count = summary.activeTasks;
    if (item.title === 'Team') count = summary.teamCount;
    if (item.title === 'PaySlip') count = summary.pendingPayroll;
    if (item.title === 'Correction') count = summary.pendingCorrections;
    return { ...item, count };
  });

  const attendanceItems = StaticAttendance.map(item => {
    if (!summary) return item;
    // Map existing logic or use summary
    return item;
  });

  const getColorById = (id) => {
    switch (id) {
      case 1:
        return styles.bgGreen;
      case 2:
        return styles.bgOrange;
      case 3:
        return styles.bgRed;
      case 4:
        return styles.bgBlue;
      case 5:
        return styles.bgIndigo;
      case 6:
        return styles.bgYellow;
      default:
        return styles.bgGray;
    }
  };

  const renderFlatListItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.itemContainer} 
      onPress={() => navigation.navigate(`${item.link}`)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, getColorById(item.id)]}>
        {React.cloneElement(item.icon, { size: 34, color: 'white' })}
      </View>
      <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
      <Text style={styles.itemCount}>{item.count}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity 
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
            style={styles.menuButton}
          >
            <MaterialCommunityIcons name="menu" size={28} color="#0F172A" />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => navigation.navigate("NotificationHR")}
            style={styles.notificationButton}
          >
            <Ionicons name="notifications-outline" size={26} color="#3B82F6" />
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>3</Text>
            </View>
          </TouchableOpacity>
        </View>
        <View style={styles.headerTextContainer}>
          <Text style={styles.greetingText}>Hi {user?.user?.name || 'Admin'},</Text>
          <Text style={styles.welcomeText}>Good Morning</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>
          <View style={styles.overviewHeader}>
            <Text style={styles.sectionTitle}>Overview</Text>
            <View style={styles.dateBadge}>
              <Text style={styles.dateText}>{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
            </View>
          </View>
          
          {(loading && !summary) ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4A5568" />
            </View>
          ) : (
            <FlatList
              data={overviewItems}
              style={styles.flatList}
              contentContainerStyle={styles.flatListContent}
              scrollEnabled={false}
              numColumns={3}
              renderItem={renderFlatListItem}
              keyExtractor={(item) => item.id.toString()}
            />
          )}

          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Leave Applications</Text>
              <TouchableOpacity onPress={() => navigation.navigate("LeaveApplications")}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>

            {loading ? (
               <ActivityIndicator size="small" color="#4A5568" style={{ marginVertical: 20 }} />
            ) : recentLeaves.length > 0 ? (
              recentLeaves.map((item) => (
                <View style={styles.leaveCard} key={item.id}>
                  <View style={styles.leaveCardMain}>
                    <Image
                      source={{ uri: item.employee?.avatarUrl || 'https://img.freepik.com/free-photo/young-bearded-man-with-striped-shirt_273609-5677.jpg' }}
                      style={styles.leaveAvatar}
                    />
                    <View style={styles.leaveInfo}>
                      <Text style={styles.leaveName} numberOfLines={1}>{item.employee?.name}</Text>
                      <View style={styles.leaveDateRow}>
                        <Ionicons name="calendar-outline" size={12} color="#E53E3E" />
                        <Text style={styles.leaveDateText}>
                          {new Date(item.fromdate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })} - {new Date(item.todate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                        </Text>
                      </View>
                      <View style={styles.leaveTag}>
                        <Text style={styles.leaveTagName}>{item.title}</Text>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.pillApproveButton} onPress={() => {/* Handle Approve */}}>
                    <Text style={styles.pillApproveText}>Approve</Text>
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No pending requests</Text>
              </View>
            )}
          </View>

          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Total Attendance (Today)</Text>
            <View style={styles.statsGrid}>
              {overviewItems.slice(0, 3).map((list) => (
                <View style={styles.statsCard} key={list.id}>
                  <View style={[
                    styles.statsCircle, 
                    { backgroundColor: list.count > 0 ? '#ECFDF5' : '#F9FAFB' }
                  ]}>
                    <Text style={[
                      styles.statsNumber,
                      { color: list.count > 0 ? '#059669' : '#9CA3AF' }
                    ]}>
                      {list.count}
                    </Text>
                  </View>
                  <Text style={styles.statsLabel} numberOfLines={2}>{list.title}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#EFF6FF',
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  notificationBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#EF4444',
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: 'white',
    fontSize: 8,
    fontWeight: 'bold',
  },
  headerTextContainer: {
    marginTop: 5,
  },
  greetingText: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: '500',
  },
  welcomeText: {
    color: '#0F172A',
    fontSize: 28,
    fontWeight: '700',
    marginTop: 2,
  },
  contentContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    padding: 20,
    flex: 1,
    paddingBottom: 100,
    minHeight: Dimensions.get('window').height - 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
  },
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  dateBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  loadingContainer: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flatList: {
    marginHorizontal: -5,
  },
  flatListContent: {
    paddingBottom: 10,
  },
  itemContainer: {
    backgroundColor: 'white',
    padding: 12,
    margin: 5,
    borderRadius: 24,
    width: (Dimensions.get('window').width - 70) / 3,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.4)',
  },
  iconContainer: {
    borderRadius: 20,
    marginBottom: 8,
    height: 60,
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
  },
  itemCount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  sectionContainer: {
    marginTop: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },
  leaveCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  leaveCardMain: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  leaveAvatar: {
    height: 52,
    width: 52,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  leaveInfo: {
    marginLeft: 12,
    flex: 1,
  },
  leaveName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  leaveDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  leaveDateText: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: '600',
    marginLeft: 4,
  },
  leaveTag: {
    marginTop: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  leaveTagName: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  pillApproveButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    marginLeft: 10,
  },
  pillApproveText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  statsCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    width: (Dimensions.get('window').width - 70) / 3,
    paddingVertical: 20,
    paddingHorizontal: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  statsCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statsNumber: {
    fontSize: 18,
    fontWeight: '800',
  },
  statsLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 14,
  },
  bgGreen: { backgroundColor: '#10B981' },
  bgOrange: { backgroundColor: '#F59E0B' },
  bgRed: { backgroundColor: '#EF4444' },
  bgBlue: { backgroundColor: '#3B82F6' },
  bgIndigo: { backgroundColor: '#6366F1' },
  bgYellow: { backgroundColor: '#EAB308' },
  bgGray: { backgroundColor: '#94A3B8' },
});

export default ManagerHomeScreen;