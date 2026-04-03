import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, FlatList, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { OverviewAllSections as StaticOverview } from '@/services/hrservices/OverviewObj';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { EmployeesAttendance as StaticAttendance } from '@/services/hrservices/EmployeeAttendanceObj';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '@/auth/authSlice';
import { apiService } from '@/services/api';

const ManagerHomeScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  
  const [summary, setSummary] = useState(null);
  const [recentLeaves, setRecentLeaves] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [summaryData, leavesData] = await Promise.all([
        apiService.getHrSummary(),
        apiService.getRecentLeaves()
      ]);
      setSummary(summaryData);
      setRecentLeaves(leavesData);
    } catch (error) {
      console.error('Failed to load HR dashboard:', error);
    } finally {
      setLoading(false);
    }
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
    <TouchableOpacity style={[styles.itemContainer]} onPress={() => navigation.navigate(`${item.link}`)}>
      <View style={[styles.iconContainer, getColorById(item.id)]}>
        {item.icon}
      </View>
      <View>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemCount}>{item.count}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
            <MaterialCommunityIcons name="menu" size={36} color="white" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate("NotificationHR")}>
            <Ionicons name="notifications-circle-outline" size={38} color="white" style={styles.relative} />
            <Text style={styles.notificationBadge}>3</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerText}>Hi {user?.user?.name || 'Admin'}</Text>
          <Text style={styles.headerText}>Good Morning</Text>
        </View>
      </View>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>
        <View style={styles.overviewHeader}>
          <Text style={styles.overviewTitle}>Overview</Text>
          <Text style={styles.date}>{new Date().toLocaleDateString()}</Text>
        </View>
        
        {loading ? (
          <ActivityIndicator size="large" color="#4A5568" style={{ marginVertical: 30 }} />
        ) : (
          <FlatList
            data={overviewItems}
            style={styles.flatList}
            scrollEnabled={false}
            numColumns={3}
            renderItem={renderFlatListItem}
            keyExtractor={(item) => item.id.toString()}
          />
        )}

        <View style={styles.recentLeaveApplicationsContainer}>
          <View style={styles.recentLeaveHeader}>
            <Text style={styles.recentLeaveTitle}>Recent Leave Applications</Text>
            <TouchableOpacity onPress={() => navigation.navigate("LeaveApplications")}>
              <Text className="font-medium" style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
             <ActivityIndicator size="small" color="#4A5568" style={{ marginVertical: 10 }} />
          ) : recentLeaves.length > 0 ? (
            recentLeaves.map((item) => (
              <View style={styles.leaveApplicationItem} key={item.id}>
                <View style={styles.leaveApplicationInfo}>
                  <Image
                    source={{ uri: item.employee?.avatarUrl || 'https://img.freepik.com/free-photo/young-bearded-man-with-striped-shirt_273609-5677.jpg' }}
                    style={styles.leaveApplicationImage}
                  />
                  <View style={styles.leaveApplicationText}>
                    <Text style={styles.leaveApplicantName}>{item.employee?.name}</Text>
                    <Text style={styles.leaveDates}>{new Date(item.fromdate).toLocaleDateString()} - {new Date(item.todate).toLocaleDateString()}</Text>
                    <Text style={styles.leaveType}>{item.title}</Text>
                  </View>
                </View>
                <View style={styles.leaveActions}>
                  <TouchableOpacity style={styles.approveButton} onPress={() => {/* Handle Approve */}}>
                    <Text style={styles.approveButtonText}>Approve</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <Text style={{ textAlign: 'center', marginVertical: 10, color: 'gray' }}>No pending requests</Text>
          )}
        </View>

        <TouchableOpacity 
          style={{ backgroundColor: '#10B981', padding: 15, marginHorizontal: 8, marginTop: 15, borderRadius: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}
          onPress={() => navigation.navigate("FaceRecognition", { mode: 'attendance' })}
        >
          <Ionicons name="camera-outline" size={24} color="white" style={{ marginRight: 10 }} />
          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Start Face Attendance</Text>
        </TouchableOpacity>

        <View style={styles.attendanceContainer} >
          <Text style={styles.attendanceTitle}>Total Attendance (Today)</Text>
          <View style={styles.attendanceList}>
            {overviewItems.slice(0, 3).map((list) => (
              <View style={styles.attendanceItem} key={list.id}>
                <View className={`h-16 w-16 flex-row items-center justify-center ${list.count > 0 ? 'bg-green-100' : 'bg-gray-100'} mx-auto rounded-full`}>
                  <Text className={`text-[17px] ${list.count > 0 ? 'text-green-600' : 'text-gray-400'} font-medium`}>
                    {list.count}
                  </Text>
                </View>
                <Text style={styles.attendanceItemTitle} >{list.title}</Text>
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
    backgroundColor: '#2D3748',
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  relative: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    backgroundColor: 'white',
    color: 'black',
    borderRadius: 50,
    height: 16,
    width: 16,
    textAlign: 'center',
    fontSize: 10,
    left: 25,
  },
  headerTextContainer: {
    paddingVertical: 8,
  },
  headerText: {
    color: 'white',
    fontSize: 23,
    fontWeight: '600',
  },
  contentContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 12,
    flex: 1,
    paddingBottom: 100,
  },
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  overviewTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  date: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    fontSize: 12,
    fontWeight: '500',
    borderRadius: 20,
    backgroundColor: '#CBD5E0',
  },
  flatList: {
    marginLeft: -8,
    marginTop: -4,
  },
  itemContainer: {
    backgroundColor: 'white',
    paddingVertical: 12,
    marginLeft: 12,
    marginTop: 12,
    paddingHorizontal: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    width: '30%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    borderRadius: 50,
    marginBottom: 8,
    alignSelf: 'center',
    height: 60,
    width: 60,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitle: {
    textAlign: 'center',
    fontWeight: '500',
  },
  itemCount: {
    textAlign: 'center',
    color: '#38A169',
    fontWeight: '600'
  },
  recentLeaveApplicationsContainer: {
    paddingHorizontal: 8,
    marginTop: 20,
  },
  recentLeaveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  recentLeaveTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  seeAll: {
    fontSize: 13,
    color: '#3182CE',
  },
  leaveApplicationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    marginTop: 8,
  },
  leaveApplicationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leaveApplicationImage: {
    height: 64,
    width: 64,
    borderRadius: 32,
  },
  leaveApplicationText: {
    marginLeft: 8,
    justifyContent: 'center',
  },
  leaveApplicantName: {
    fontSize: 16,
    fontWeight: '600',
  },
  leaveDates: {
    fontSize: 12,
    color: '#E53E3E',
    fontWeight: '500',
  },
  leaveType: {
    fontSize: 12,
    color: '#A0AEC0',
    fontWeight: '500',
  },
  leaveActions: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#FED7D7',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 30,
    marginBottom: 8,
  },
  cancelButtonText: {
    color: '#E53E3E',
    fontSize: 13,
    fontWeight: '500',
  },
  approveButton: {
    backgroundColor: '#C6F6D5',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 27,
  },
  approveButtonText: {
    color: '#38A169',
    fontSize: 13,
    fontWeight: '500',
  },
  attendanceContainer: {
    paddingHorizontal: 8,
    paddingTop: 22,
    paddingBottom: 20,
  },
  attendanceTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  attendanceList: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  attendanceItem: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    width: '30%',
    padding: 12,
    marginTop: 10,
  },
  attendanceIconContainer: {
    height: 64,
    width: 64,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 32,
    alignSelf: 'center',
  },
  attendanceCount: {
    fontSize: 17,
    fontWeight: '500',
  },
  attendanceItemTitle: {
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
  },
  bgGreen: {
    backgroundColor: '#1fce0f',
  },
  bgOrange: {
    backgroundColor: '#e09021',
  },
  bgRed: {
    backgroundColor: '#ef4646',
  },
  bgBlue: {
    backgroundColor: '#5dddf4',
  },
  bgIndigo: {
    backgroundColor: '#9c84f5',
  },
  bgYellow: {
    backgroundColor: '#f5e025',
  },
  bgGray: {
    backgroundColor: '#EDF2F7',
  },
  textGreen: {
    color: '#38A169',
  },
  textOrange: {
    color: '#DD6B20',
  },
  textRed: {
    color: '#E53E3E',
  },
});

export default ManagerHomeScreen;