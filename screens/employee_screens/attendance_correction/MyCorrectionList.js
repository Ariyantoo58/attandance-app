import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { AntDesign, Feather, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { apiService } from '../../../services/api';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';

const MyCorrectionList = () => {
  const navigation = useNavigation();
  const [filter, setFilter] = useState('All');
  const [corrections, setCorrections] = useState([]);
  const [loading, setLoading] = useState(true);
  const authState = useSelector(state => state.auth.user);
  const employeeId = authState?.employeeId || authState?.user?.employeeId;

  useFocusEffect(
    useCallback(() => {
      if (employeeId) {
        loadCorrections();
      }
    }, [employeeId])
  );

  const loadCorrections = async () => {
    try {
      setLoading(true);
      const data = await apiService.getMyAttendanceCorrections(employeeId);
      setCorrections(data);
    } catch (error) {
      console.error('Failed to load corrections:', error);
      Alert.alert('Error', 'Failed to load correction history');
    } finally {
      setLoading(false);
    }
  };

  const filteredCorrections = corrections.filter(item =>
    filter === 'All' ? true : item.status === filter
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'APPROVED':
        return { backgroundColor: '#def7ec', color: '#03543f' };
      case 'REJECTED':
        return { backgroundColor: '#fde8e8', color: '#9b1c1c' };
      case 'PENDING':
        return { backgroundColor: '#fef3c7', color: '#92400e' };
      default:
        return { backgroundColor: '#f3f4f6', color: '#374151' };
    }
  };

  return (
    <View style={styles.container} className="bg-blue-50 flex-1 pt-12">
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={20} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Corrections</Text>
        <TouchableOpacity onPress={() => navigation.navigate("AttendanceCorrectionRequest")}>
          <Feather name="plus-circle" size={24} color="#00a2e4" />
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        {['All', 'PENDING', 'APPROVED', 'REJECTED'].map(status => (
          <TouchableOpacity
            key={status}
            onPress={() => setFilter(status)}
            style={[styles.filterPill, filter === status && styles.activeFilterPill]}
          >
            <Text style={[styles.filterText, filter === status && styles.activeFilterText]}>
              {status === 'PENDING' ? 'Waiting' : status === 'APPROVED' ? 'Approved' : status === 'REJECTED' ? 'Rejected' : 'All'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}>
        {loading ? (
          <ActivityIndicator size="large" color="#00a2e4" style={{ marginTop: 50 }} />
        ) : filteredCorrections.length > 0 ? (
          filteredCorrections.map((item) => (
            <View style={styles.card} key={item.id}>
              <View style={styles.cardIndicator} sx={getStatusStyle(item.status)} />
              <View style={styles.cardBody}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardDate}>{formatDate(item.requestedDate)}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusStyle(item.status).backgroundColor }]}>
                    <Text style={[styles.statusText, { color: getStatusStyle(item.status).color }]}>{item.status}</Text>
                  </View>
                </View>
                
                <View style={styles.timeInfo}>
                  <MaterialCommunityIcons name="clock-outline" size={14} color="#64748B" />
                  <Text style={styles.timeText}> 
                    Requested: {item.requestedClockIn ? new Date(item.requestedClockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'} - {item.requestedClockOut ? new Date(item.requestedClockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                  </Text>
                </View>

                <Text style={styles.reasonText} numberOfLines={1}>Reason: {item.reason}</Text>
                
                {item.adminNote && (
                  <View style={styles.adminNoteBox}>
                    <Text style={styles.adminNoteText}>Note: {item.adminNote}</Text>
                  </View>
                )}
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="clipboard-text-outline" size={60} color="#CBD5E0" />
            <Text style={styles.emptyText}>No correction requests found</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 20 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  backButton: { backgroundColor: 'white', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  filterRow: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 15, gap: 8 },
  filterPill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: 'white', borderWidth: 1, borderColor: '#E2E8F0' },
  activeFilterPill: { backgroundColor: '#00a2e4', borderColor: '#00a2e4' },
  filterText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  activeFilterText: { color: 'white' },
  card: { flexDirection: 'row', backgroundColor: 'white', borderRadius: 12, marginBottom: 15, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 },
  cardIndicator: { width: 4 },
  cardBody: { flex: 1, padding: 15 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardDate: { fontSize: 16, fontWeight: 'bold', color: '#1E293B' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: 'bold' },
  timeInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  timeText: { fontSize: 13, color: '#64748B' },
  reasonText: { fontSize: 13, color: '#475569', fontStyle: 'italic' },
  adminNoteBox: { marginTop: 10, padding: 8, backgroundColor: '#F8FAFC', borderRadius: 4, borderLeftWidth: 2, borderLeftColor: '#CBD5E0' },
  adminNoteText: { fontSize: 12, color: '#64748B' },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 10, color: '#94A3B8', fontSize: 16 },
});

export default MyCorrectionList;
