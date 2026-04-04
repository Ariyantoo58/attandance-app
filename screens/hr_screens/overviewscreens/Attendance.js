import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, StyleSheet, Image, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import moment from 'moment';
import { apiService } from '../../../services/api';

const { width } = Dimensions.get('window');

const Attendance = () => {
  const [dailyLogs, setDailyLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(moment().format('MMMM'));
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    loadDaily();
  }, []);

  const loadDaily = async () => {
    try {
      setLoading(true);
      const data = await apiService.getDailyAttendance();
      setDailyLogs(data);
    } catch (error) {
      console.error('Failed to load attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleHistoryModal = async (employee) => {
    if (employee) {
      try {
        const h = await apiService.getAttendanceHistory(employee.id);
        const monthData = h.filter(log => moment(log.date).format('MMMM') === selectedMonth);
        setHistory(monthData);
        setSelectedEmployee(employee);
        setShowHistoryModal(true);
      } catch (error) {
        Alert.alert('Error', 'Failed to load history');
      }
    } else {
      setShowHistoryModal(false);
      setSelectedEmployee(null);
    }
  };

  const handleMonthPress = (month) => {
    setSelectedMonth(month);
    if (selectedEmployee) {
       apiService.getAttendanceHistory(selectedEmployee.id).then(h => {
         setHistory(h.filter(log => moment(log.date).format('MMMM') === month));
       });
    }
  };

  const getDaysInMonth = (month) => {
    const year = moment().year();
    const monthNumber = moment().month(month).format('MM');
    return moment(`${year}-${monthNumber}-01`).daysInMonth();
  };

  const renderCalendarDays = (month) => {
    const daysInMonth = getDaysInMonth(month);
    const days = [];
    
    for (let day = 0; day < daysInMonth; day++) {
      const dateStr = moment().month(month).date(day + 1).format('YYYY-MM-DD');
      const log = history.find(l => moment(l.date).format('YYYY-MM-DD') === dateStr);
      
      let color = '#F3F4F6'; 
      let textColor = '#4B5563';
      if (log) {
        if (log.status === 'PRESENT') {
            color = '#10B981';
            textColor = '#FFFFFF';
        }
        else if (log.status === 'LATE') {
            color = '#F59E0B';
            textColor = '#FFFFFF';
        }
      }

      days.push(
        <View key={day} style={[styles.daySquare, { backgroundColor: color }]}>
          <Text style={[styles.dayText, { color: textColor }]}>{day + 1}</Text>
        </View>
      );
    }
    return days;
  };

  const stats = {
    present: history.filter(l => l.status === 'PRESENT').length,
    late: history.filter(l => l.status === 'LATE').length,
    total: getDaysInMonth(selectedMonth)
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Daily Attendance</Text>
        <Text style={styles.dateSubheader}>{moment().format('DD MMM YYYY')}</Text>
      </View>

      {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#3B82F6" />
          </View>
      ) : (
        <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
        >
          {dailyLogs.length > 0 ? dailyLogs.map(log => (
            <TouchableOpacity 
                key={log.id} 
                style={styles.employeeCard}
                onPress={() => toggleHistoryModal(log.employee)}
            >
              <Image 
                source={{ uri: log.employee?.avatarUrl || 'https://i.pravatar.cc/150?u=' + log.employee?.id }} 
                style={styles.employeeImage} 
              />
              <View style={styles.employeeInfo}>
                <Text style={styles.employeeName}>{log.employee?.name}</Text>
                <View style={styles.timeRow}>
                    <MaterialCommunityIcons name="clock-in" size={14} color="#10B981" />
                    <Text style={styles.timeText}> {log.clockIn ? moment(log.clockIn).format('HH:mm') : '--:--'}</Text>
                    <Text style={styles.timeSeparator}> | </Text>
                    <MaterialCommunityIcons name="clock-out" size={14} color="#EF4444" />
                    <Text style={styles.timeText}> {log.clockOut ? moment(log.clockOut).format('HH:mm') : '--:--'}</Text>
                </View>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: log.clockIn ? '#D1FAE5' : '#FEE2E2' }]}>
                <Text style={[styles.statusText, { color: log.clockIn ? '#059669' : '#DC2626' }]}>
                    {log.clockIn ? 'Present' : 'Absent'}
                </Text>
              </View>
            </TouchableOpacity>
          )) : (
            <View style={styles.emptyContainer}>
                <Ionicons name="calendar-outline" size={64} color="#D1D5DB" />
                <Text style={styles.emptyText}>No attendance logs for today</Text>
            </View>
          )}
        </ScrollView>
      )}

      <Modal
        visible={showHistoryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => toggleHistoryModal(null)}
      >
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Attendance History</Text>
                <Text style={styles.modalEmployeeName}>{selectedEmployee?.name}</Text>
              </View>
              <TouchableOpacity onPress={() => toggleHistoryModal(null)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#4B5563" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.statsRow}>
                <View style={[styles.statItem, { backgroundColor: '#ECFDF5' }]}>
                    <Text style={[styles.statValue, { color: '#059669' }]}>{stats.present}</Text>
                    <Text style={styles.statLabel}>Present</Text>
                </View>
                <View style={[styles.statItem, { backgroundColor: '#FFFBEB' }]}>
                    <Text style={[styles.statValue, { color: '#D97706' }]}>{stats.late}</Text>
                    <Text style={styles.statLabel}>Late</Text>
                </View>
                <View style={[styles.statItem, { backgroundColor: '#F3F4F6' }]}>
                    <Text style={[styles.statValue, { color: '#4B5563' }]}>{stats.total - stats.present - stats.late}</Text>
                    <Text style={styles.statLabel}>Absent</Text>
                </View>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.monthSelector}>
                {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(month => (
                  <TouchableOpacity 
                    key={month} 
                    style={[styles.monthPill, selectedMonth === month && styles.selectedMonthPill]} 
                    onPress={() => handleMonthPress(month)}
                  >
                    <Text style={[styles.monthPillText, selectedMonth === month && styles.selectedMonthPillText]}>{month}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.calendarCard}>
                <View style={styles.calendarGrid}>
                    {renderCalendarDays(selectedMonth)}
                </View>
                <View style={styles.legendRow}>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
                        <Text style={styles.legendText}>Present</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
                        <Text style={styles.legendText}>Late</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: '#F3F4F6' }]} />
                        <Text style={styles.legendText}>No Data</Text>
                    </View>
                </View>
              </View>
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  header: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },
  dateSubheader: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  employeeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  employeeImage: {
    width: 54,
    height: 54,
    borderRadius: 27,
    marginRight: 15,
    backgroundColor: '#E5E7EB',
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  timeSeparator: {
    color: '#D1D5DB',
    marginHorizontal: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
  },
  emptyText: {
    marginTop: 15,
    fontSize: 16,
    color: '#9CA3AF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    height: '92%',
    paddingHorizontal: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
  },
  modalEmployeeName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  closeButton: {
    backgroundColor: '#F3F4F6',
    padding: 8,
    borderRadius: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    padding: 15,
    borderRadius: 20,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 2,
  },
  monthSelector: {
    marginBottom: 24,
  },
  monthPill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 100,
    backgroundColor: '#F3F4F6',
    marginRight: 10,
  },
  selectedMonthPill: {
    backgroundColor: '#3B82F6',
  },
  monthPillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  selectedMonthPillText: {
    color: '#FFFFFF',
  },
  calendarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 15,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 30,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  daySquare: {
    width: (width - 70) / 7,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 3,
    borderRadius: 12,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '700',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
});

export default Attendance;

