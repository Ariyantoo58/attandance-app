import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { AntDesign, Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { setEmployeeAttendance } from '../../../auth/dataSlice';
import { apiService } from '../../../services/api';
import { LinearGradient } from 'expo-linear-gradient';
import { useSocket } from '../../../context/SocketContext';

const { width } = Dimensions.get('window');

const History = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const reduxAttendance = useSelector(state => state.data.employeeData.attendanceHistory);
  const employeeId = user?.user?.employeeId;

  const { socket } = useSocket();
  const [attendance, setAttendance] = useState(reduxAttendance || []);
  const [hasLoadedInitially, setHasLoadedInitially] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState('All');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 10;

  // Update local state if redux state changes (e.g. initial fetch from App.js)
  React.useEffect(() => {
    if (reduxAttendance?.length > 0 && attendance.length === 0) {
      setAttendance(reduxAttendance);
      setHasLoadedInitially(true);
    }
  }, [reduxAttendance]);

  useFocusEffect(
    useCallback(() => {
      if (employeeId) {
        // Only reset page if it's not the initial focus with existing data
        // or if filter changed (handled by dependency)
        setPage(0);
        fetchHistory(0, true);
      }
    }, [employeeId, filter])
  );

  React.useEffect(() => {
    if (socket) {
      const handleAttendanceUpdate = (data) => {
        console.log('Real-time attendance update received:', data);
        if (data.employeeId === employeeId) {
          setPage(0);
          fetchHistory(0, true);
        }
      };

      socket.on('attendance_updated', handleAttendanceUpdate);

      return () => {
        socket.off('attendance_updated', handleAttendanceUpdate);
      };
    }
  }, [socket, employeeId]);

  const fetchHistory = async (skip = 0, isInitial = false) => {
    // Ensure skip is a number
    const skipVal = typeof skip === 'number' ? skip : 0;
    
    try {
      if (isInitial) {
        // Only show full loading if we have no data and haven't loaded before
        if (attendance.length === 0 && !hasLoadedInitially) {
          setLoading(true);
        }
        setHasMore(true);
      } else {
        setLoadingMore(true);
      }

      const data = await apiService.getAttendanceHistory(employeeId, skipVal, PAGE_SIZE);
      
      if (isInitial) {
        setAttendance(data);
        setHasLoadedInitially(true);
        // Sync first page with Redux for persistence across tab switches
        if (filter === 'All' && skipVal === 0) {
            dispatch(setEmployeeAttendance(data));
        }
      } else {
        // Append unique items only to avoid key duplicates
        setAttendance(prev => {
          const existingIds = new Set(prev.map(item => item.id));
          const newItems = data.filter(item => !existingIds.has(item.id));
          return [...prev, ...newItems];
        });
      }
      
      setHasMore(data.length === PAGE_SIZE);
    } catch (error) {
      console.error('Failed to fetch attendance history:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };


  const loadMore = () => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchHistory(nextPage * PAGE_SIZE, false);
    }
  };

  const filteredAttendance = attendance.filter(item => {
    if (filter === 'All') return true;
    const itemDate = new Date(item.date);
    const now = new Date();
    if (filter === 'Weekly') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return itemDate >= weekAgo;
    }
    if (filter === 'Monthly') {
      return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
    }
    return true;
  });


  const formatTime = (date) => date ? new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';
  const formatDate = (date) => new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const getDayName = (date) => new Date(date).toLocaleDateString('en-US', { weekday: 'short' });

  const calculateHours = (clockIn, clockOut) => {
    if (!clockIn || !clockOut) return '0h';
    const start = new Date(clockIn);
    const end = new Date(clockOut);
    let diff = end - start;
    
    if (diff < 0) return '0h'; // Error safety
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  // Summary stats for current month
  const currentMonthAttendance = attendance.filter(item => {
    const itemDate = new Date(item.date);
    const now = new Date();
    return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
  });

  const totalHours = currentMonthAttendance.reduce((acc, item) => {
    if (item.clockIn && item.clockOut) {
      return acc + (new Date(item.clockOut) - new Date(item.clockIn));
    }
    return acc;
  }, 0);

  const formattedTotalHours = `${Math.floor(totalHours / (1000 * 60 * 60))}h`;
  const presentDays = currentMonthAttendance.length;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#00a2e4', '#007bb0']}
        style={styles.headerGradient}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <MaterialIcons name="arrow-back" size={20} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Attendance History</Text>
            <TouchableOpacity onPress={() => navigation.navigate('MyCorrectionList')}>
              <MaterialCommunityIcons name="clipboard-edit-outline" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => {
              setPage(0);
              fetchHistory(0, true);
            }}>
              <Ionicons name="refresh" size={22} color="white" />
            </TouchableOpacity>
          </View>

          <View style={styles.summaryContainer}>
            <View style={styles.summaryCard}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>This Month</Text>
                <Text style={styles.summaryValue}>{presentDays} <Text style={styles.summarySubLabel}>Days</Text></Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Hours</Text>
                <Text style={styles.summaryValue}>{formattedTotalHours}</Text>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.filterRow}>
          {['All', 'Weekly', 'Monthly'].map(status => (
            <TouchableOpacity
              key={status}
              onPress={() => setFilter(status)}
              style={[styles.filterPill, filter === status && styles.activeFilterPill]}
            >
              <Text style={[styles.filterText, filter === status && styles.activeFilterText]}>{status}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading && attendance.length === 0 ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#00a2e4" />
          </View>
        ) : (
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {filteredAttendance.length > 0 ? (
              <>
                {filteredAttendance.map((item) => (
                  <View key={item.id} style={styles.historyCard}>
                    <View style={styles.cardHeader}>
                      <View style={styles.dateBlock}>
                        <Text style={styles.dayText}>{getDayName(item.date)}</Text>
                        <Text style={styles.dateNumberText}>{new Date(item.date).getDate()}</Text>
                      </View>
                      <View style={styles.infoBlock}>
                        <Text style={styles.monthText}>{new Date(item.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</Text>
                        <View style={styles.locationTag}>
                          <Ionicons name="location" size={12} color="#6B7280" />
                          <Text style={styles.locationText}>{item.clockInLocation || item.clockOutLocation || 'Office'}</Text>
                        </View>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: item.clockOut ? '#def7ec' : '#fef3c7' }]}>
                        <Text style={[styles.statusText, { color: item.clockOut ? '#03543f' : '#92400e' }]}>
                          {item.clockOut ? 'Completed' : 'On Guard'}
                        </Text>
                      </View>
                    </View>

                    {item.isCorrected && (
                      <View style={styles.correctedBadgeRow}>
                        <MaterialIcons name="auto-fix-high" size={12} color="#7C3AED" />
                        <Text style={styles.correctedBadgeText}>Data has been corrected by HR</Text>
                      </View>
                    )}
                    
                    <View style={styles.cardDivider} />
                    
                    <View style={styles.timeRow}>
                      <View style={styles.timeItem}>
                        <View style={[styles.iconBox, { backgroundColor: '#E0F2FE' }]}>
                          <MaterialCommunityIcons name="clock-in" size={20} color="#00a2e4" />
                        </View>
                        <View>
                          <Text style={styles.timeLabel}>Clock In</Text>
                          <Text style={styles.timeValue}>{formatTime(item.clockIn)}</Text>
                        </View>
                      </View>
                      
                      <View style={styles.verticalDivider} />
                      
                      <View style={styles.timeItem}>
                        <View style={[styles.iconBox, { backgroundColor: '#FEF3C7' }]}>
                          <MaterialCommunityIcons name="clock-out" size={20} color="#D97706" />
                        </View>
                        <View>
                          <Text style={styles.timeLabel}>Clock Out</Text>
                          <Text style={styles.timeValue}>{formatTime(item.clockOut)}</Text>
                        </View>
                      </View>
                    </View>

                    {item.clockIn && item.clockOut && (
                      <View style={styles.durationFooter}>
                        <Text style={styles.durationLabel}>Working Hours:</Text>
                        <Text style={styles.durationValue}>{calculateHours(item.clockIn, item.clockOut)}</Text>
                      </View>
                    )}

                    <TouchableOpacity 
                      style={styles.correctionButton}
                      onPress={() => navigation.navigate('AttendanceCorrectionRequest', { 
                        date: item.date,
                        clockIn: item.clockIn,
                        clockOut: item.clockOut
                      })}
                    >
                      <MaterialIcons name="edit" size={14} color="#00a2e4" />
                      <Text style={styles.correctionButtonText}> Request Correction</Text>
                    </TouchableOpacity>
                  </View>
                ))}

                {hasMore && filter === 'All' && (
                  <TouchableOpacity 
                    style={styles.loadMoreButton} 
                    onPress={loadMore}
                    disabled={loadingMore}
                  >
                    {loadingMore ? (
                      <ActivityIndicator size="small" color="#00a2e4" />
                    ) : (
                      <Text style={styles.loadMoreText}>Load More</Text>
                    )}
                  </TouchableOpacity>
                )}
              </>
            ) : (


              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconBg}>
                  <Ionicons name="calendar-outline" size={60} color="#D1D5DB" />
                </View>
                <Text style={styles.emptyText}>No attendance records found</Text>
                <Text style={styles.emptySubText}>Records for your selected filter will appear here.</Text>
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerGradient: {
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: 'white',
    letterSpacing: 0.5,
  },
  summaryContainer: {
    paddingHorizontal: 20,
    marginTop: 10,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '800',
    color: 'white',
  },
  summarySubLabel: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.7)',
  },
  summaryDivider: {
    width: 1,
    height: '80%',
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  content: {
    flex: 1,
    marginTop: -20,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 15,
    zIndex: 10,
  },
  filterPill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: 'white',
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  activeFilterPill: {
    backgroundColor: '#007bb0',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
  },
  activeFilterText: {
    color: 'white',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 5,
  },
  historyCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    width: 50,
    height: 55,
    borderRadius: 12,
    marginRight: 15,
  },
  dayText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  dateNumberText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e293b',
  },
  infoBlock: {
    flex: 1,
  },
  monthText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  locationTag: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 4,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 15,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  timeLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  timeValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  verticalDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#f1f5f9',
    marginHorizontal: 10,
  },
  durationFooter: {
    marginTop: 15,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  durationLabel: {
    fontSize: 12,
    color: '#64748b',
    marginRight: 6,
    fontWeight: '500',
  },
  durationValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#00a2e4',
  },
  correctionButton: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e0f2fe',
    borderRadius: 10,
    backgroundColor: '#f0f9ff',
  },
  correctionButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#007bb0',
  },
  correctedBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  correctedBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7C3AED',
    marginLeft: 5,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    paddingHorizontal: 40,
  },
  emptyIconBg: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
  },
  loadMoreButton: {
    backgroundColor: 'white',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#00a2e4',
  },
});


export default History;