import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { AntDesign } from '@expo/vector-icons';
import { apiService } from '../../../services/api';
import { useSelector } from 'react-redux';

const Notification = () => {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const employeeId = useSelector(state => state.auth.user?.user?.employeeId);

  useEffect(() => {
    if (employeeId) {
      loadNotifications();
    }
  }, [employeeId]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await apiService.getNotifications(employeeId);
      setNotifications(data);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollViewContent} className="px-3 bg-blue-50">
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <AntDesign name="left" size={18} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Notifications</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#3B82F6" className="mt-10" />
      ) : (
        notifications && notifications.map(notification => (
          <View key={notification.id} style={styles.notificationCard}>
            <Text style={styles.notificationTitle}>{notification.title}</Text>
            <Text style={styles.notificationDate}>
              {new Date(notification.createdAt).toLocaleDateString()} at {new Date(notification.createdAt).toLocaleTimeString()}
            </Text>
            <Text style={styles.notificationMessage}>{notification.message}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollViewContent: {
    paddingTop: 40,
    paddingHorizontal: 5,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    padding: 6,
    backgroundColor: '#3B82F6',
    width: 32,
    borderRadius: 8,
    alignItems: 'center',
  },
  headerText: {
    textAlign: 'center',
    width: '85%',
    fontWeight: '600',
    fontSize: 18,
    color: '#1F2937',
  },
  notificationCard: {
    marginBottom: 16,
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderLeftWidth: 5,
    borderLeftColor: '#3B82F6',
  },
  notificationTitle: {
    fontWeight: '700',
    fontSize: 18,
    color: '#1D4ED8',
  },
  notificationDate: {
    color: '#6B7280',
    marginTop: 4,
  },
  notificationMessage: {
    marginTop: 8,
    color: '#374151',
  },
});

export default Notification;
