import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, StyleSheet, Image, ActivityIndicator, Alert } from 'react-native';
import moment from 'moment';
import { apiService } from '../../../services/api';

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
       // Refresh history for selected month
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
    return [...Array(daysInMonth).keys()].map(day => {
      const dateStr = moment().month(month).date(day + 1).format('YYYY-MM-DD');
      const log = history.find(l => moment(l.date).format('YYYY-MM-DD') === dateStr);
      
      let color = '#EDF2F7'; // Default gray
      if (log) {
        if (log.status === 'PRESENT') color = '#38A169'; // Green
        else if (log.status === 'LATE') color = '#DD6B20'; // Orange
      }

      return (
        <View key={day} style={[styles.daySquare, { backgroundColor: color }]}>
          <Text style={styles.dayText}>{day + 1}</Text>
        </View>
      );
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Daily Attendance ({moment().format('DD MMM YYYY')})</Text>
      {loading ? (
          <ActivityIndicator size="large" color="#007bff" style={{ marginTop: 50 }} />
      ) : (
        <ScrollView style={styles.employeeList}>
          {dailyLogs.length > 0 ? dailyLogs.map(log => (
            <View key={log.id} style={styles.employeeCard}>
              <Image 
                source={{ uri: log.employee?.avatarUrl || 'https://img.freepik.com/free-photo/front-view-man-posing_23-2148364843.jpg' }} 
                style={styles.employeeImage} 
              />
              <View style={styles.employeeInfo}>
                <Text style={styles.employeeName}>{log.employee?.name}</Text>
                <Text style={styles.employeeDesignation}>
                    In: {log.clockIn ? moment(log.clockIn).format('HH:mm') : '-'} | 
                    Out: {log.clockOut ? moment(log.clockOut).format('HH:mm') : '-'}
                </Text>
              </View>
              <TouchableOpacity style={styles.historyButton} onPress={() => toggleHistoryModal(log.employee)}>
                <Text style={styles.historyButtonText}>History</Text>
              </TouchableOpacity>
            </View>
          )) : (
            <Text style={{ textAlign: 'center', marginTop: 20 }}>No logs for today</Text>
          )}
        </ScrollView>
      )}
      <Modal
        visible={showHistoryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => toggleHistoryModal(null)}
      >
        <View style={styles.modalContainer}>
          <Text style={styles.historyHeader}>History</Text>
          {selectedEmployee && (
            <>
              <Text style={styles.employeeHistoryName}>{selectedEmployee.name}</Text>
              <ScrollView horizontal style={styles.monthScroll}>
                {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(month => (
                  <TouchableOpacity key={month} style={[styles.monthButton, selectedMonth === month && styles.selectedMonthButton]} onPress={() => handleMonthPress(month)}>
                    <Text style={[styles.monthButtonText, selectedMonth === month && styles.selectedMonthButtonText]}>{month}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <View style={styles.calendarContainer}>
                {renderCalendarDays(selectedMonth)}
              </View>
            </>
          )}
        </View>
      </Modal>
    </View>
  );
};

const getStatusColor = (status) => {
  switch (status) {
    case 'present':
      return '#4CAF50';
    case 'half-day':
      return '#FFC107';
    case 'absent':
      return '#F44336';
    default:
      return 'gray';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  employeeList: {
    marginBottom: 20,
  },
  employeeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    backgroundColor: '#f9f9f9',
  },
  employeeImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  employeeDesignation: {
    fontSize: 14,
    color: '#666',
  },
  historyButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
  },
  historyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    marginTop: 50,
  },
  historyHeader: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  employeeHistoryName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  monthScroll: {
    marginBottom: 20,
  },
  monthButton: {
    marginRight: 10,
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
  selectedMonthButton: {
    borderBottomWidth: 2,
    borderBottomColor: '#007bff',
  },
  monthButtonText: {
    fontSize: 16,
    color: '#333',
  },
  selectedMonthButtonText: {
    color: '#007bff',
    fontWeight: 'bold',
  },
  calendarContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 5,
  },
  daySquare: {
    width: '13%', // Adjusted to fit 7 columns with spacing
    aspectRatio: 1, // Make square
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
    borderRadius: 5,
    margin: 2,
    backgroundColor: '#e0e0e0', // Default background color
  },
  dayText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default Attendance;
