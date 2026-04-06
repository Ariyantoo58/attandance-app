import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Dimensions, StatusBar } from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiService } from '../../../services/api';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { useSocket } from '../../../context/SocketContext';

const { width } = Dimensions.get('window');

const TimeOff = () => {
  const navigate = useNavigation();
  const [filter, setFilter] = useState('All');
  const timeOff = useSelector(state => state.data.employeeData.timeOff);
  const loading = useSelector(state => state.data.employeeData.loading);
  const { socket } = useSocket();

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const statusConfig = {
    SUBMITTED: { bg: '#EBF8FF', color: '#3182CE', label: 'TERKIRIM', icon: 'send-outline' },
    ACCEPTED: { bg: '#F0FFF4', color: '#38A169', label: 'DISETUJUI', icon: 'checkmark-circle-outline' },
    REJECTED: { bg: '#FFF5F5', color: '#E53E3E', label: 'DITOLAK', icon: 'close-circle-outline' },
    PENDING: { bg: '#FFFBEB', color: '#D69E2E', label: 'PENDING', icon: 'time-outline' },
    DEFAULT: { bg: '#F7FAFC', color: '#718096', label: 'UNKNOWN', icon: 'help-circle-outline' }
  };

  const getStatusConfig = (status) => {
    const normalized = status?.toUpperCase() || 'DEFAULT';
    return statusConfig[normalized] || statusConfig.DEFAULT;
  };

  const filteredTasks = timeOff.filter(task =>
    filter === 'All' ? true : task.status === filter
  );

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Cuti & Izin</Text>
          <Text style={styles.headerSubtitle}>Kelola pengajuan Anda</Text>
        </View>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => navigate.navigate("Send_Timeoff_Form")}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={26} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {['All', 'SUBMITTED', 'ACCEPTED', 'REJECTED'].map(status => (
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
                {status === 'All' ? 'Semua' : 
                 status === 'SUBMITTED' ? 'Terkirim' : 
                 status === 'ACCEPTED' ? 'Disetujui' : 'Ditolak'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView 
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#00a2e4" style={{ marginTop: 40 }} />
        ) : filteredTasks.length > 0 ? (
          filteredTasks.map((item) => {
            const config = getStatusConfig(item.status);
            return (
              <View key={item.id} style={styles.requestCard}>
                <View style={[styles.statusIndicator, { backgroundColor: config.color }]} />
                <View style={styles.cardMain}>
                  <View style={styles.cardHeader}>
                    <View style={styles.titleArea}>
                      <Text style={styles.requestTitle} numberOfLines={1}>{item.title}</Text>
                      <View style={styles.dateBadge}>
                        <Feather name="calendar" size={12} color="#64748B" />
                        <Text style={styles.dateText}>
                          {formatDate(item.fromdate)} - {formatDate(item.todate)}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
                      <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
                    </View>
                  </View>
                  
                  {item.description && (
                    <Text style={styles.description} numberOfLines={2}>
                      {item.description}
                    </Text>
                  )}

                  <View style={styles.cardFooter}>
                    <View style={styles.footerInfo}>
                      <MaterialCommunityIcons name="clock-outline" size={14} color="#94A3B8" />
                      <Text style={styles.footerText}>Diajukan pada {formatDate(item.createdAt)}</Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyArea}>
            <View style={styles.emptyCircle}>
              <Ionicons name="document-text" size={40} color="#CBD5E1" />
            </View>
            <Text style={styles.emptyTitle}>Belum Ada Pengajuan</Text>
            <Text style={styles.emptyDesc}>Klik tombol + di atas untuk membuat pengajuan baru.</Text>
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
    shadowRadius: 10,
    elevation: 3,
  },
  headerTitle: { fontSize: 22, fontWeight: '900', color: '#1E293B' },
  headerSubtitle: { fontSize: 13, color: '#64748B', marginTop: 2, fontWeight: '500' },
  addButton: { 
    width: 48, 
    height: 48, 
    borderRadius: 16, 
    backgroundColor: '#00a2e4', 
    alignItems: 'center', 
    justifyContent: 'center',
    shadowColor: '#00a2e4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  filterSection: { marginVertical: 15 },
  filterScroll: { paddingHorizontal: 20, paddingVertical: 5 },
  filterCard: { 
    paddingHorizontal: 18, 
    paddingVertical: 10, 
    backgroundColor: 'white', 
    borderRadius: 14, 
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
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
    shadowRadius: 12,
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
  description: { fontSize: 12, color: '#64748B', marginTop: 12, lineHeight: 18, fontWeight: '400' },
  cardFooter: { marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  footerInfo: { flexDirection: 'row', alignItems: 'center' },
  footerText: { fontSize: 10, color: '#94A3B8', marginLeft: 6, fontWeight: '500' },
  emptyArea: { alignItems: 'center', marginTop: 60, paddingHorizontal: 40 },
  emptyCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B', marginBottom: 8 },
  emptyDesc: { fontSize: 13, color: '#94A3B8', textAlign: 'center', lineHeight: 20 },
});

export default TimeOff;