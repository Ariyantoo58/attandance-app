import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Alert, StatusBar, RefreshControl, FlatList } from 'react-native';
import { AntDesign, Feather, MaterialCommunityIcons, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { apiService } from '../../../services/api';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { useSocket } from '../../../context/SocketContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import moment from 'moment';

const MyCorrectionList = () => {
  const navigation = useNavigation();
  const [filter, setFilter] = useState('All');
  const [corrections, setCorrections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const authState = useSelector(state => state.auth.user);
  const employeeId = authState?.employeeId || authState?.user?.employeeId;
  const { socket } = useSocket();

  const loadCorrections = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await apiService.getMyAttendanceCorrections(employeeId);
      setCorrections(data);
    } catch (error) {
      console.error('Failed to load corrections:', error);
      if (!silent) Alert.alert('Error', 'Failed to load correction history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (employeeId) {
        loadCorrections(corrections.length > 0);
      }
    }, [employeeId])
  );

  useEffect(() => {
    if (socket && employeeId) {
      const handleNewCorrection = (newReq) => {
        if (newReq.employeeId === employeeId) {
          setCorrections(prev => {
            if (prev.find(c => c.id === newReq.id)) return prev;
            return [newReq, ...prev];
          });
        }
      };

      const handleCorrectionUpdate = (updatedReq) => {
        if (updatedReq.employeeId === employeeId) {
          setCorrections(prev => prev.map(c => 
            c.id === updatedReq.id ? { ...c, ...updatedReq } : c
          ));
        }
      };

      socket.on('correction:requested', handleNewCorrection);
      socket.on('correction:changed', handleCorrectionUpdate);

      return () => {
        socket.off('correction:requested', handleNewCorrection);
        socket.off('correction:changed', handleCorrectionUpdate);
      };
    }
  }, [socket, employeeId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadCorrections(true);
  };

  const filteredCorrections = corrections.filter(item =>
    filter === 'All' ? true : item.status === filter
  );

  const statusConfig = {
    APPROVED: { bg: '#F0FDF4', color: '#10B981', label: 'DISETUJUI' },
    REJECTED: { bg: '#FFF5F5', color: '#EF4444', label: 'DITOLAK' },
    PENDING: { bg: '#FFFBEB', color: '#F59E0B', label: 'WAITING' },
    DEFAULT: { bg: '#F8FAFC', color: '#64748B', label: 'UNKNOWN' }
  };

  const renderItem = ({ item }) => {
    const config = statusConfig[item.status] || statusConfig.DEFAULT;
    return (
      <View style={styles.requestCard} key={item.id}>
        <View style={[styles.statusIndicator, { backgroundColor: config.color }]} />
        <View style={styles.cardMain}>
          <View style={styles.cardHeader}>
            <View style={styles.titleArea}>
              <Text style={styles.requestTitle}>{moment(item.requestedDate).format('DD MMMM YYYY')}</Text>
              <View style={styles.dateBadge}>
                <Feather name="clock" size={12} color="#64748B" />
                <Text style={styles.dateText}>
                  {item.requestedClockIn ? moment(item.requestedClockIn).format('HH:mm') : '--:--'} - {item.requestedClockOut ? moment(item.requestedClockOut).format('HH:mm') : '--:--'}
                </Text>
              </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
              <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
            </View>
          </View>
          
          <Text style={styles.description} numberOfLines={2}>
            {item.reason}
          </Text>

          {item.adminNote && (
            <View style={styles.adminNoteBox}>
              <View style={styles.noteHeader}>
                <Ionicons name="chatbubble-ellipses-outline" size={12} color="#64748B" />
                <Text style={styles.noteTitle}>CATATAN HRD</Text>
              </View>
              <Text style={styles.adminNoteText}>{item.adminNote}</Text>
            </View>
          )}

          <View style={styles.cardFooter}>
            <View style={styles.footerInfo}>
              <MaterialCommunityIcons name="update" size={14} color="#94A3B8" />
              <Text style={styles.footerText}>ID: #{item.id.substring(0, 8).toUpperCase()}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity style={styles.backSmallBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.headerTitle}>Koreksi Absen</Text>
            <Text style={styles.headerSubtitle}>Riwayat perbaikan absensi</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => navigation.navigate("AttendanceCorrectionRequest")}
          activeOpacity={0.8}
        >
          <AntDesign name="plus" size={26} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {['All', 'PENDING', 'APPROVED', 'REJECTED'].map(status => (
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
                {status === 'All' ? 'Semua' : status === 'PENDING' ? 'Waiting' : status === 'APPROVED' ? 'Approved' : 'Rejected'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredCorrections}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />}
        ListEmptyComponent={
          <View style={styles.emptyArea}>
            <View style={styles.emptyCircle}>
              <MaterialCommunityIcons name="clipboard-edit-outline" size={40} color="#CBD5E1" />
            </View>
            <Text style={styles.emptyTitle}>Belum Ada Koreksi</Text>
            <Text style={styles.emptyDesc}>Daftar request perbaikan absen akan muncul di sini.</Text>
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
  backSmallBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#1E293B' },
  headerSubtitle: { fontSize: 12, color: '#64748B', marginTop: 1, fontWeight: '500' },
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
  dateBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  dateText: { fontSize: 11, color: '#64748B', marginLeft: 6, fontWeight: '600' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  statusText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  description: { fontSize: 12, color: '#64748B', marginTop: 12, lineHeight: 18, fontWeight: '400', fontStyle: 'italic' },
  adminNoteBox: { marginTop: 12, padding: 12, backgroundColor: '#F8FAFC', borderRadius: 12, borderLeftWidth: 3, borderLeftColor: '#CBD5E1' },
  noteHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  noteTitle: { fontSize: 9, fontWeight: '900', color: '#94A3B8', marginLeft: 6, letterSpacing: 0.5 },
  adminNoteText: { fontSize: 12, color: '#475569', fontWeight: '500' },
  cardFooter: { marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerInfo: { flexDirection: 'row', alignItems: 'center' },
  footerText: { fontSize: 10, color: '#94A3B8', marginLeft: 6, fontWeight: '500' },
  emptyArea: { alignItems: 'center', marginTop: 60, paddingHorizontal: 40 },
  emptyCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginBottom: 8 },
  emptyDesc: { fontSize: 13, color: '#94A3B8', textAlign: 'center', lineHeight: 20 },
});

export default MyCorrectionList;
