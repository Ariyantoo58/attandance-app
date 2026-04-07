import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Dimensions, RefreshControl } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { AntDesign, Ionicons, MaterialCommunityIcons, MaterialIcons, Feather } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { setEmployeeAttendance } from '../../../auth/dataSlice';
import { apiService } from '../../../services/api';
import { LinearGradient } from 'expo-linear-gradient';
import { useSocket } from '../../../context/SocketContext';
import { DrawerActions } from '@react-navigation/native';
import moment from 'moment';

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
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('All');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 10;

  // Update local state if redux state changes
  React.useEffect(() => {
    if (reduxAttendance?.length > 0 && attendance.length === 0) {
      setAttendance(reduxAttendance);
      setHasLoadedInitially(true);
    }
  }, [reduxAttendance]);

  useFocusEffect(
    useCallback(() => {
      if (employeeId) {
        setPage(0);
        fetchHistory(0, true);
      }
    }, [employeeId, filter])
  );

  React.useEffect(() => {
    if (socket) {
      const handleAttendanceUpdate = (data) => {
        if (data.employeeId === employeeId) {
          setPage(0);
          fetchHistory(0, true);
        }
      };
      socket.on('attendance_updated', handleAttendanceUpdate);
      return () => socket.off('attendance_updated', handleAttendanceUpdate);
    }
  }, [socket, employeeId]);

  const fetchHistory = async (skip = 0, isInitial = false) => {
    const skipVal = typeof skip === 'number' ? skip : 0;
    try {
      if (isInitial) {
        if (attendance.length === 0 && !hasLoadedInitially) setLoading(true);
        setHasMore(true);
      }
      const data = await apiService.getAttendanceHistory(employeeId, skipVal, PAGE_SIZE);
      if (isInitial) {
        setAttendance(data);
        setHasLoadedInitially(true);
        if (filter === 'All' && skipVal === 0) dispatch(setEmployeeAttendance(data));
      } else {
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
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    setPage(0);
    fetchHistory(0, true);
  };

  const filteredAttendance = attendance.filter(item => {
    if (filter === 'All') return true;
    const itemDate = moment(item.date);
    const now = moment();
    if (filter === 'Weekly') return itemDate.isAfter(now.subtract(7, 'days'));
    if (filter === 'Monthly') return itemDate.isSame(now, 'month');
    return true;
  });

  const formatTime = (date) => date ? moment(date).format('HH:mm') : '--:--';
  const calculateHours = (clockIn, clockOut) => {
    if (!clockIn || !clockOut) return '0h';
    const start = moment(clockIn);
    const end = moment(clockOut);
    const duration = moment.duration(end.diff(start));
    return `${Math.floor(duration.asHours())}h ${duration.minutes()}m`;
  };

  // Summary stats for current month
  const currentMonthAttendance = attendance.filter(item => moment(item.date).isSame(moment(), 'month'));
  const totalHours = currentMonthAttendance.reduce((acc, item) => {
    if (item.clockIn && item.clockOut) return acc + (moment(item.clockOut).diff(moment(item.clockIn)));
    return acc;
  }, 0);
  const formattedTotalHours = `${Math.floor(moment.duration(totalHours).asHours())}h`;

  const renderCard = (item) => {
    const isCompleted = !!item.clockOut;
    const statusColor = isCompleted ? '#10B981' : '#F59E0B';
    const statusBg = isCompleted ? '#F0FDF4' : '#FFFBEB';

    return (
      <View key={item.id} style={styles.requestCard}>
        <View style={[styles.statusIndicator, { backgroundColor: statusColor }]} />
        <View style={styles.cardMain}>
          <View style={styles.cardHeader}>
            <View style={styles.titleArea}>
              <Text style={styles.requestTitle}>{moment(item.date).format('DD MMMM YYYY')}</Text>
              <View style={styles.dateBadge}>
                <Feather name="map-pin" size={12} color="#64748B" />
                <Text style={styles.dateText}>{item.clockInLocation || 'Office'}</Text>
              </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {isCompleted ? 'COMPLETED' : 'ON GUARD'}
              </Text>
            </View>
          </View>

          <View style={styles.timeRow}>
            <View style={styles.timeItem}>
              <MaterialCommunityIcons name="clock-in" size={16} color="#2563EB" />
              <View style={styles.timeInfo}>
                <Text style={styles.timeLabel}>In</Text>
                <Text style={styles.timeValue}>{formatTime(item.clockIn)}</Text>
              </View>
            </View>
            <View style={styles.timeItem}>
              <MaterialCommunityIcons name="clock-out" size={16} color="#F59E0B" />
              <View style={styles.timeInfo}>
                <Text style={styles.timeLabel}>Out</Text>
                <Text style={styles.timeValue}>{formatTime(item.clockOut)}</Text>
              </View>
            </View>
            <View style={styles.timeItem}>
              <MaterialCommunityIcons name="timer-outline" size={16} color="#64748B" />
              <View style={styles.timeInfo}>
                <Text style={styles.timeLabel}>Work</Text>
                <Text style={styles.timeValue}>{calculateHours(item.clockIn, item.clockOut)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.cardFooter}>
             <TouchableOpacity 
                style={styles.correctionBtn}
                onPress={() => navigation.navigate('AttendanceCorrectionRequest', { 
                  date: item.date,
                  clockIn: item.clockIn,
                  clockOut: item.clockOut
                })}
              >
                <Text style={styles.correctionBtnText}>Koreksi Absen</Text>
                <Ionicons name="chevron-forward" size={14} color="#2563EB" />
             </TouchableOpacity>
             {item.isCorrected && (
               <View style={styles.correctedBadge}>
                 <MaterialIcons name="auto-fix-high" size={12} color="#7C3AED" />
                 <Text style={styles.correctedText}>Corrected</Text>
               </View>
             )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity 
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
            style={styles.menuBtn}
          >
            <Ionicons name="menu" size={24} color="#1E293B" />
          </TouchableOpacity>
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.headerTitle}>Riwayat Absensi</Text>
            <Text style={styles.headerSubtitle}>{currentMonthAttendance.length} hari hadir bulan ini</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.headerIconBtn} 
          onPress={() => navigation.navigate('MyCorrectionList')}
        >
          <MaterialCommunityIcons name="clipboard-text-clock-outline" size={24} color="#1E293B" />
        </TouchableOpacity>
      </View>

      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {['All', 'Weekly', 'Monthly'].map(s => (
            <TouchableOpacity
              key={s}
              onPress={() => setFilter(s)}
              style={[styles.filterCard, filter === s && styles.filterCardActive]}
            >
              <Text style={[styles.filterText, filter === s && styles.filterTextActive]}>
                {s === 'All' ? 'Semua' : s === 'Weekly' ? 'Mingguan' : 'Bulanan'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView 
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 40 }} />
        ) : filteredAttendance.length > 0 ? (
          filteredAttendance.map(renderCard)
        ) : (
          <View style={styles.emptyArea}>
            <View style={styles.emptyCircle}>
              <Ionicons name="calendar" size={40} color="#CBD5E1" />
            </View>
            <Text style={styles.emptyTitle}>Belum Ada Absensi</Text>
            <Text style={styles.emptyDesc}>Riwayat kehadiran Anda akan muncul di sini.</Text>
          </View>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    elevation: 3,
  },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#1E293B' },
  headerSubtitle: { fontSize: 13, color: '#64748B', marginTop: 2, fontWeight: '500' },
  headerIconBtn: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  menuBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterSection: { marginVertical: 15 },
  filterScroll: { paddingHorizontal: 20 },
  filterCard: { paddingHorizontal: 18, paddingVertical: 10, backgroundColor: 'white', borderRadius: 14, marginRight: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  filterCardActive: { backgroundColor: '#1E293B', borderColor: '#1E293B' },
  filterText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
  filterTextActive: { color: 'white' },
  listContent: { paddingHorizontal: 20 },
  requestCard: { 
    backgroundColor: 'white', 
    borderRadius: 24, 
    marginBottom: 16, 
    flexDirection: 'row', 
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.4)',
  },
  statusIndicator: { width: 6 },
  cardMain: { flex: 1, padding: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  titleArea: { flex: 1, marginRight: 10 },
  requestTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B' },
  dateBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  dateText: { fontSize: 11, color: '#64748B', marginLeft: 6, fontWeight: '600' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  statusText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  timeItem: { flexDirection: 'row', alignItems: 'center' },
  timeInfo: { marginLeft: 8 },
  timeLabel: { fontSize: 10, color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase' },
  timeValue: { fontSize: 13, fontWeight: '800', color: '#1E293B' },
  cardFooter: { marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  correctionBtn: { flexDirection: 'row', alignItems: 'center' },
  correctionBtnText: { fontSize: 12, fontWeight: '800', color: '#2563EB', marginRight: 4 },
  correctedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F3FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  correctedText: { fontSize: 10, fontWeight: '700', color: '#7C3AED', marginLeft: 4 },
  emptyArea: { alignItems: 'center', marginTop: 60, paddingHorizontal: 40 },
  emptyCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginBottom: 8 },
  emptyDesc: { fontSize: 13, color: '#94A3B8', textAlign: 'center', lineHeight: 20 },
});

export default History;