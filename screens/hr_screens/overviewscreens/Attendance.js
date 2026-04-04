import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, StyleSheet, Image, ActivityIndicator, Alert, Dimensions, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import MapView, { Marker, Polyline } from 'react-native-maps';
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
  const [showMapModal, setShowMapModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedHistoryDay, setSelectedHistoryDay] = useState(moment().format('YYYY-MM-DD'));

  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  const [region, setRegion] = useState({
    latitude: -6.200000, 
    longitude: 106.816666, 
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    loadDaily(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    if (dailyLogs.length > 0) {
      const logsWithLoc = dailyLogs.filter(l => (l.clockInLat && l.clockInLng) || (l.clockOutLat && l.clockOutLng));
      if (logsWithLoc.length > 0) {
        const firstLoc = logsWithLoc[0];
        setRegion({
          ...region,
          latitude: firstLoc.clockInLat || firstLoc.clockOutLat,
          longitude: firstLoc.clockInLng || firstLoc.clockOutLng,
        });
      }
    }
  }, [dailyLogs]);

  const loadDaily = async (date) => {
    try {
      setLoading(true);
      const formattedDate = moment(date).format('YYYY-MM-DD');
      const data = await apiService.getDailyAttendance(formattedDate);
      setDailyLogs(data);
    } catch (error) {
      console.error('Failed to load attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (event, date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) {
      setSelectedDate(date);
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
        <TouchableOpacity 
          key={day} 
          style={[
            styles.daySquare, 
            { backgroundColor: color },
            selectedHistoryDay === dateStr && styles.selectedDayBorder
          ]}
          onPress={() => setSelectedHistoryDay(dateStr)}
        >
          <Text style={[styles.dayText, { color: textColor }]}>{day + 1}</Text>
        </TouchableOpacity>
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
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.header}>Daily Attendance</Text>
            <TouchableOpacity 
              style={styles.dateSelectorBtn} 
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateSubheader}>{moment(selectedDate).format('DD MMM YYYY')}</Text>
              <Ionicons name="chevron-down" size={14} color="#6B7280" style={{ marginLeft: 5 }} />
            </TouchableOpacity>
          </View>
          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="default"
              onChange={onDateChange}
              maximumDate={new Date()} // Optional: restrict to past and today
            />
          )}
          <View style={styles.tabsContainer}>
            <TouchableOpacity 
                style={[styles.tabBtn, viewMode === 'list' && styles.activeTabBtn]} 
                onPress={() => setViewMode('list')}
            >
                <Ionicons name="list" size={20} color={viewMode === 'list' ? '#FFFFFF' : '#6B7280'} />
            </TouchableOpacity>
            <TouchableOpacity 
                style={[styles.tabBtn, viewMode === 'map' && styles.activeTabBtn]} 
                onPress={() => setViewMode('map')}
            >
                <Ionicons name="map" size={20} color={viewMode === 'map' ? '#FFFFFF' : '#6B7280'} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#3B82F6" />
          </View>
      ) : viewMode === 'map' ? (
        <View style={styles.fullMapContainer}>
          <MapView
            style={styles.fullMap}
            region={region}
          >
            {dailyLogs.map(log => {
                const results = [];
                const isSame = log.clockInLat === log.clockOutLat && log.clockInLng === log.clockOutLng;
                
                if (log.clockInLat && log.clockOutLat) {
                    results.push(
                        <Polyline 
                            key={`${log.id}-path`}
                            coordinates={[
                                { latitude: log.clockInLat, longitude: log.clockInLng },
                                { latitude: log.clockOutLat + (isSame ? 0.0001 : 0), longitude: log.clockOutLng + (isSame ? 0.0001 : 0) }
                            ]}
                            strokeColor="#3B82F6"
                            strokeWidth={2}
                            lineDashPattern={[5, 5]}
                        />
                    );
                }

                if (log.clockInLat && log.clockInLng) {
                    results.push(
                        <Marker
                            key={`${log.id}-in`}
                            coordinate={{ latitude: log.clockInLat, longitude: log.clockInLng }}
                            title={`${log.employee?.name} (In)`}
                            description={`Time: ${moment(log.clockIn).format('HH:mm')}`}
                            zIndex={1}
                        >
                            <View style={styles.customMarker}>
                                <Image source={{ uri: log.employee?.avatarUrl || 'https://i.pravatar.cc/150?u=' + log.employee?.id }} style={[styles.markerImage, { borderColor: '#10B981' }]} />
                                <View style={[styles.markerPointer, { borderTopColor: '#10B981' }]} />
                            </View>
                        </Marker>
                    );
                }

                if (log.clockOutLat && log.clockOutLng) {
                    results.push(
                        <Marker
                            key={`${log.id}-out`}
                            coordinate={{ 
                                latitude: log.clockOutLat + (isSame ? 0.0002 : 0), 
                                longitude: log.clockOutLng + (isSame ? 0.0002 : 0) 
                            }}
                            title={`${log.employee?.name} (Out)`}
                            description={`Time: ${moment(log.clockOut).format('HH:mm')}`}
                            zIndex={2}
                        >
                            <View style={styles.customMarker}>
                                <Image source={{ uri: log.employee?.avatarUrl || 'https://i.pravatar.cc/150?u=' + log.employee?.id }} style={[styles.markerImage, { borderColor: '#EF4444' }]} />
                                <View style={[styles.markerPointer, { borderTopColor: '#EF4444' }]} />
                            </View>
                        </Marker>
                    );
                }
                return results;
            })}
          </MapView>
          
          <View style={styles.mapStatsBtn}>
             <Ionicons name="people" size={16} color="#3B82F6" />
             <Text style={styles.mapStatsText}>{dailyLogs.filter(l => (l.clockInLat || l.clockOutLat)).length} People Tracked</Text>
          </View>
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
                <View style={styles.cardHeader}>
                    <Text style={styles.employeeName} numberOfLines={1}>{log.employee?.name}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: log.clockIn ? '#D1FAE5' : '#FEE2E2' }]}>
                        <Text style={[styles.statusText, { color: log.clockIn ? '#059669' : '#DC2626' }]}>
                            {log.clockIn ? 'Present' : 'Absent'}
                        </Text>
                    </View>
                </View>
                
                <View style={styles.locationInfo}>
                    <Ionicons name="location-outline" size={12} color="#6B7280" />
                    <Text style={styles.locationLabelText} numberOfLines={1} ellipsizeMode="tail"> 
                      {log.clockInLocation || 'No data'} {log.clockOutLocation ? `• ${log.clockOutLocation}` : ''}
                    </Text>
                </View>

                <View style={styles.timeRow}>
                    <View style={styles.timePill}>
                         <MaterialCommunityIcons name="clock-in" size={12} color="#10B981" />
                         <Text style={styles.timeText}> {log.clockIn ? moment(log.clockIn).format('HH:mm') : '--:--'}</Text>
                    </View>
                    <View style={styles.timePillSeparator} />
                    <View style={styles.timePill}>
                         <MaterialCommunityIcons name="clock-out" size={12} color="#EF4444" />
                         <Text style={styles.timeText}> {log.clockOut ? moment(log.clockOut).format('HH:mm') : '--:--'}</Text>
                    </View>
                </View>
              </View>
            </TouchableOpacity>
          )) : (
            <View style={styles.emptyContainer}>
                <Ionicons name="calendar-outline" size={64} color="#D1D5DB" />
                <Text style={styles.emptyText}>No attendance logs for {moment(selectedDate).format('DD MMM YYYY')}</Text>
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

              <View style={styles.historyMapSection}>
                <Text style={styles.activityTitle}>Location Details - {moment(selectedHistoryDay).format('DD MMM')}</Text>
                <View style={styles.detailMapContainer}>
                   {(() => {
                      const dayLog = history.find(l => moment(l.date).format('YYYY-MM-DD') === selectedHistoryDay);
                      if (dayLog && (dayLog.clockInLat || dayLog.clockOutLat)) {
                        return (
                          <MapView
                            style={styles.detailMap}
                            initialRegion={{
                              latitude: dayLog.clockInLat || dayLog.clockOutLat,
                              longitude: dayLog.clockInLng || dayLog.clockOutLng,
                              latitudeDelta: 0.01,
                              longitudeDelta: 0.01,
                            }}
                          >
                             {(() => {
                               const isSameHPoint = dayLog.clockInLat === dayLog.clockOutLat && dayLog.clockInLng === dayLog.clockOutLng;
                               if (dayLog.clockInLat && dayLog.clockOutLat) {
                                 return (
                                   <Polyline 
                                     coordinates={[
                                       { latitude: dayLog.clockInLat, longitude: dayLog.clockInLng },
                                       { latitude: dayLog.clockOutLat + (isSameHPoint ? 0.0001 : 0), longitude: dayLog.clockOutLng + (isSameHPoint ? 0.0001 : 0) }
                                     ]}
                                     strokeColor="#3B82F6"
                                     strokeWidth={3}
                                     lineDashPattern={[5, 10]}
                                   />
                                 );
                               }
                               return null;
                             })()}
                              {dayLog.clockInLat && (
                                <Marker
                                  coordinate={{ latitude: dayLog.clockInLat, longitude: dayLog.clockInLng }}
                                  title="Clock In"
                                  description={moment(dayLog.clockIn).format('HH:mm')}
                                  zIndex={1}
                                >
                                  <View style={styles.customMarker}>
                                      <Image source={{ uri: selectedEmployee?.avatarUrl || 'https://i.pravatar.cc/150?u=' + selectedEmployee?.id }} style={[styles.markerImage, { borderColor: '#10B981' }]} />
                                      <View style={[styles.markerPointer, { borderTopColor: '#10B981' }]} />
                                  </View>
                                </Marker>
                             )}
                             {dayLog.clockOutLat && (
                                <Marker
                                  coordinate={{ 
                                    latitude: dayLog.clockOutLat + (dayLog.clockInLat === dayLog.clockOutLat ? 0.0001 : 0), 
                                    longitude: dayLog.clockOutLng + (dayLog.clockInLng === dayLog.clockOutLng ? 0.0001 : 0) 
                                  }}
                                  title="Clock Out"
                                  description={moment(dayLog.clockOut).format('HH:mm')}
                                  zIndex={2}
                                >
                                  <View style={styles.customMarker}>
                                      <Image source={{ uri: selectedEmployee?.avatarUrl || 'https://i.pravatar.cc/150?u=' + selectedEmployee?.id }} style={[styles.markerImage, { borderColor: '#EF4444' }]} />
                                      <View style={[styles.markerPointer, { borderTopColor: '#EF4444' }]} />
                                  </View>
                                </Marker>
                             )}
                          </MapView>
                        );
                      }
                      return (
                        <View style={styles.noMapData}>
                          <Ionicons name="map-outline" size={40} color="#D1D5DB" />
                          <Text style={styles.noMapDataText}>No location data for this day</Text>
                        </View>
                      );
                   })()}
                </View>
              </View>
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>

      <Modal
        visible={showMapModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowMapModal(false)}
      >
        <View style={styles.mapModalOverlay}>
          <View style={styles.mapModalContent}>
            <View style={styles.mapModalHeader}>
              <View>
                <Text style={styles.mapModalTitle}>Attendance Location</Text>
                <Text style={styles.mapModalSubtitle}>{selectedLocation?.employeeName} at {selectedLocation?.time}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowMapModal(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#4B5563" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.mapContainer}>
              {selectedLocation && (
                <MapView
                  style={styles.map}
                  initialRegion={{
                    latitude: selectedLocation.clockInLat || selectedLocation.clockOutLat,
                    longitude: selectedLocation.clockInLng || selectedLocation.clockOutLng,
                    latitudeDelta: 0.015,
                    longitudeDelta: 0.015,
                  }}
                >
                  {selectedLocation.clockInLat && (
                    <Marker
                      coordinate={{
                        latitude: selectedLocation.clockInLat,
                        longitude: selectedLocation.clockInLng,
                      }}
                      title={`${selectedLocation.employeeName} (Clock In)`}
                      description={`In at ${selectedLocation.clockInTime}`}
                    >
                      <View style={styles.customMarker}>
                          <Image source={{ uri: selectedLocation?.avatarUrl || 'https://i.pravatar.cc/150?u=' + selectedLocation?.employeeId }} style={[styles.markerImage, { borderColor: '#10B981' }]} />
                          <View style={[styles.markerPointer, { borderTopColor: '#10B981' }]} />
                      </View>
                    </Marker>
                  )}
                  {selectedLocation.clockOutLat && (
                    <Marker
                      coordinate={{
                        latitude: selectedLocation.clockOutLat,
                        longitude: selectedLocation.clockOutLng,
                      }}
                      title={`${selectedLocation.employeeName} (Clock Out)`}
                      description={`Out at ${selectedLocation.clockOutTime}`}
                    >
                      <View style={styles.customMarker}>
                          <Image source={{ uri: selectedLocation?.avatarUrl || 'https://i.pravatar.cc/150?u=' + selectedLocation?.employeeId }} style={[styles.markerImage, { borderColor: '#EF4444' }]} />
                          <View style={[styles.markerPointer, { borderTopColor: '#EF4444' }]} />
                      </View>
                    </Marker>
                  )}
                </MapView>
              )}
            </View>
            
            <TouchableOpacity style={styles.doneButton} onPress={() => setShowMapModal(false)}>
                <Text style={styles.doneButtonText}>Selesai</Text>
            </TouchableOpacity>
          </View>
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 2,
  },
  tabBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeTabBtn: {
    backgroundColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  header: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },
  dateSubheader: {
    fontSize: 14,
    color: '#6B7280',
  },
  dateSelectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    paddingVertical: 2,
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
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
    justifyContent: 'center',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
    marginRight: 8,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    opacity: 0.8,
  },
  locationLabelText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
    marginLeft: 4,
    flex: 1,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timeText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
  },
  timePillSeparator: {
    width: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    minWidth: 65,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
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
    paddingVertical: 12,
    marginBottom: 5,
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
    marginBottom: 15,
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
    marginBottom: 15,
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
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 12,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  daySquare: {
    width: (width - 70) / 7.5,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
    borderRadius: 10,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '700',
  },
  selectedDayBorder: {
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
    paddingTop: 8,
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
  historyListSection: {
    marginTop: 10,
    paddingBottom: 40,
  },
  activityTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 10,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },
  activityDate: {
    width: 50,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
    paddingRight: 10,
    marginRight: 15,
  },
  activityDay: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  activityMonth: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  activityInfo: {
    flex: 1,
  },
  historyMapSection: {
    marginTop: 0,
    marginBottom: 30,
  },
  detailMapContainer: {
    height: 200,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  detailMap: {
    ...StyleSheet.absoluteFillObject,
  },
  noMapData: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noMapDataText: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 8,
  },
  noHistoryText: {
    textAlign: 'center',
    color: '#9CA3AF',
    marginTop: 20,
    fontStyle: 'italic',
  },
  mapIconBtn: {
    marginLeft: 10,
    padding: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
  },
  mapModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  mapModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '100%',
    height: '70%',
    padding: 20,
    overflow: 'hidden',
  },
  mapModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  mapModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  mapModalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  mapContainer: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
    marginBottom: 20,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  doneButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  fullMapContainer: {
    flex: 1,
    width: '100%',
  },
  fullMap: {
    ...StyleSheet.absoluteFillObject,
  },
  customMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerImage: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: '#3B82F6',
    backgroundColor: '#FFFFFF',
  },
  markerPointer: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#3B82F6',
    marginTop: -4,
    alignSelf: 'center',
  },
  mapStatsBtn: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  mapStatsText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginLeft: 8,
  },
});

export default Attendance;

