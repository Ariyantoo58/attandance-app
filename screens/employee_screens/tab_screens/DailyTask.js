import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Alert, RefreshControl, FlatList } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather, Ionicons, MaterialCommunityIcons, AntDesign } from '@expo/vector-icons';
import { apiService } from '../../../services/api';
import { useSelector, useDispatch } from 'react-redux';
import { fetchEmployeeTasks } from '../../../auth/dataSlice';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSocket } from '../../../context/SocketContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DrawerActions } from '@react-navigation/native';
import moment from 'moment';

const DailyTask = () => {
  const [filter, setFilter] = useState('All');
  const [refreshing, setRefreshing] = useState(false);
  const dispatch = useDispatch();
  
  const tasks = useSelector(state => state.data.employeeData.tasks);
  const loading = useSelector(state => state.data.employeeData.loading);
  const navigation = useNavigation();
  const employeeId = useSelector(state => state.auth.user?.user?.employeeId);
  const { socket } = useSocket();

  const onRefresh = useCallback(async () => {
    if (employeeId) {
      setRefreshing(true);
      await dispatch(fetchEmployeeTasks(employeeId));
      setRefreshing(false);
    }
  }, [employeeId, dispatch]);

  useFocusEffect(
    useCallback(() => {
      if (employeeId) {
        dispatch(fetchEmployeeTasks(employeeId));
      }
    }, [employeeId, dispatch])
  );

  const filteredTasks = tasks.filter(task =>
    filter === 'All' ? true : task.status.toUpperCase() === filter.toUpperCase()
  );

  const handleUpdateStatus = async (taskId, currentStatus) => {
    const nextStatusMap = {
      'PENDING': 'IN_PROGRESS',
      'IN_PROGRESS': 'COMPLETE',
      'COMPLETE': 'PENDING'
    };

    const nextStatus = nextStatusMap[currentStatus.toUpperCase()] || 'PENDING';

    Alert.alert(
      "Update Task Status",
      `Mark as ${nextStatus.replace('_', ' ')}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Update", 
          onPress: async () => {
            try {
              await apiService.updateTaskStatus(taskId, nextStatus);
            } catch (error) {
              console.error('Failed to update status:', error);
              Alert.alert("Error", "Failed to update task status.");
            }
          } 
        }
      ]
    );
  };

  const statusConfig = {
    PENDING: { bg: '#FFFBEB', color: '#F59E0B', label: 'PENDING', dot: '#F59E0B' },
    IN_PROGRESS: { bg: '#EBF8FF', color: '#3B82F6', label: 'IN PROGRESS', dot: '#3B82F6' },
    COMPLETE: { bg: '#F0FDF4', color: '#10B981', label: 'COMPLETE', dot: '#10B981' },
    DEFAULT: { bg: '#F8FAFC', color: '#64748B', label: 'UNKNOWN', dot: '#64748B' }
  };

  const getStatusConfig = (status) => {
    const s = status ? status.toUpperCase() : 'DEFAULT';
    return statusConfig[s] || statusConfig.DEFAULT;
  };

  const renderTask = ({ item }) => {
    const config = getStatusConfig(item.status);
    return (
      <TouchableOpacity
        key={item.id} 
        onPress={() => navigation.navigate('TaskDetail', { task: item })}
        style={styles.requestCard}
        activeOpacity={0.8}
      >
        <View style={[styles.statusIndicator, { backgroundColor: config.color }]} />
        <View style={styles.cardMain}>
          <View style={styles.cardHeader}>
            <View style={styles.titleArea}>
              <Text style={styles.requestTitle} numberOfLines={1}>{item.title}</Text>
              <View style={styles.metaRow}>
                <View style={styles.dateBadge}>
                  <Feather name="calendar" size={12} color="#64748B" />
                  <Text style={styles.dateText}>
                    {moment(item.date).format('DD MMM YYYY')}
                  </Text>
                </View>
                <View style={styles.priorityBadge}>
                   <View style={[styles.priorityDot, { backgroundColor: item.priority === 'HIGH' ? '#EF4444' : '#3B82F6' }]} />
                   <Text style={[styles.priorityText, { color: item.priority === 'HIGH' ? '#EF4444' : '#3B82F6' }]}>{item.priority}</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity 
               onPress={() => handleUpdateStatus(item.id, item.status)}
               style={[styles.statusBadge, { backgroundColor: config.bg }]}
            >
              <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
            </TouchableOpacity>
          </View>
          
          <Text style={styles.description} numberOfLines={2}>
            {item.description || "No description provided."}
          </Text>

          <View style={styles.cardFooter}>
            <View style={styles.footerInfo}>
               {item.teamId && (
                  <View style={styles.teamBadge}>
                    <AntDesign name="team" size={12} color="#2563EB" />
                    <Text style={styles.teamText}>TEAM</Text>
                  </View>
               )}
            </View>
            <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity 
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
            style={styles.menuSmallBtn}
          >
            <Ionicons name="menu" size={24} color="#1E293B" />
          </TouchableOpacity>
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.headerTitle}>Harian Task</Text>
            <Text style={styles.headerSubtitle}>Tugas harian Anda</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => navigation.navigate('TaskCreation', { initialEmployeeId: employeeId })}
          activeOpacity={0.8}
        >
          <AntDesign name="plus" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {['All', 'PENDING', 'IN_PROGRESS', 'COMPLETE'].map(status => (
            <TouchableOpacity
              key={status}
              onPress={() => setFilter(status)}
              style={[
                styles.filterCard,
                filter === status && styles.filterCardActive
              ]}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.filterText,
                filter === status && styles.filterTextActive
              ]}>
                {status === 'All' ? 'Semua' : status.replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredTasks}
        renderItem={renderTask}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />}
        ListEmptyComponent={
          <View style={styles.emptyArea}>
            <View style={styles.emptyCircle}>
              <Feather name="check-square" size={40} color="#CBD5E1" />
            </View>
            <Text style={styles.emptyTitle}>Tidak Ada Tugas</Text>
            <Text style={styles.emptyDesc}>Belum ada tugas yang ditugaskan hari ini.</Text>
          </View>
        }
        ListFooterComponent={<View style={{ height: 100 }} />}
      />
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
  menuSmallBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: { 
    width: 48, 
    height: 48, 
    borderRadius: 16, 
    backgroundColor: '#2563EB', 
    alignItems: 'center', 
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOpacity: 0.3,
    elevation: 4,
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
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  dateBadge: { flexDirection: 'row', alignItems: 'center' },
  dateText: { fontSize: 11, color: '#64748B', marginLeft: 6, fontWeight: '600' },
  priorityBadge: { flexDirection: 'row', alignItems: 'center', marginLeft: 12, backgroundColor: '#F8FAFC', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  priorityDot: { width: 6, height: 6, borderRadius: 3, marginRight: 5 },
  priorityText: { fontSize: 10, fontWeight: '800' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  statusText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  description: { fontSize: 12, color: '#64748B', marginTop: 12, lineHeight: 18 },
  cardFooter: { marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerInfo: { flexDirection: 'row' },
  teamBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E0F2FE', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  teamText: { fontSize: 9, fontWeight: '900', color: '#2563EB', marginLeft: 4 },
  emptyArea: { alignItems: 'center', marginTop: 60, paddingHorizontal: 40 },
  emptyCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginBottom: 8 },
  emptyDesc: { fontSize: 13, color: '#94A3B8', textAlign: 'center', lineHeight: 20 },
});

export default DailyTask;