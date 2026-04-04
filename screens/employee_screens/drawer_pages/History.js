import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { AntDesign, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AttendanceData } from '../../../services/AttendanceObj';

const History = () => {
  const navigation = useNavigation();
  const [filter, setFilter] = useState('All');

  const filteredTasks = AttendanceData.filter(task =>
    filter === 'All' ? true : task.att === filter
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <AntDesign name="left" size={18} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Attendance</Text>
        <View style={{ width: 32 }} /> 
      </View>

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

      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Attendance For</Text>
          <Text style={styles.summaryValue}>February</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Hours</Text>
          <Text style={styles.summaryValue}>410h</Text>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filteredTasks && filteredTasks.map((list) => (
          <TouchableOpacity key={list.id} style={styles.historyCard}>
            <View style={styles.cardLeft}>
              <View style={styles.iconBox}>
                <MaterialCommunityIcons name="clock-check-outline" size={24} color="#3B82F6" />
              </View>
              <View>
                <Text style={styles.shiftType}>{list.shifttype}</Text>
                <Text style={styles.dateText}>{list.date}</Text>
              </View>
            </View>
            <View style={styles.cardRight}>
              <Text style={styles.timeText}>{list.time}</Text>
              <View style={[styles.statusBadge, { backgroundColor: list.status === 'Present' ? '#D1FAE5' : '#FEE2E2' }]}>
                <Text style={[styles.statusText, { color: list.status === 'Present' ? '#059669' : '#DC2626' }]}>
                    {list.status}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
        {(!filteredTasks || filteredTasks.length === 0) && (
            <View style={styles.emptyContainer}>
                <Ionicons name="document-text-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyText}>No records found</Text>
            </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
    backgroundColor: '#3B82F6',
    borderRadius: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: '#FFFFFF',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activeFilterPill: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeFilterText: {
    color: '#FFFFFF',
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#3B82F6',
  },
  summaryDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#F3F4F6',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  shiftType: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  dateText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  cardRight: {
    alignItems: 'flex-end',
  },
  timeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 50,
  },
  emptyText: {
    marginTop: 10,
    color: '#9CA3AF',
    fontSize: 16,
  },
});

export default History;