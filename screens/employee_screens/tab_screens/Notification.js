import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, StatusBar, Modal, Pressable } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { AntDesign, MaterialCommunityIcons } from '@expo/vector-icons';
import { apiService } from '../../../services/api';
import { useSelector } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSocket } from '../../../context/SocketContext';

const Notification = () => {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotif, setSelectedNotif] = useState(null);
  const employeeId = useSelector(state => state.auth.user?.user?.employeeId);

  const { socket } = useSocket();

  useEffect(() => {
    if (employeeId) {
      loadNotifications();
    }
  }, [employeeId]);

  useEffect(() => {
    if (socket) {
      socket.on('notification', (data) => {
        console.log('Real-time notification received:', data);
        loadNotifications();
      });

      return () => {
        socket.off('notification');
      };
    }
  }, [socket]);

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

  const handleMarkAsRead = async (id) => {
    const notif = notifications.find(n => n.id === id);
    setSelectedNotif(notif);
    
    if (!notif.isRead) {
      try {
        await apiService.markNotificationRead(id);
        setNotifications(prev => prev.map(n => 
          n.id === id ? { ...n, isRead: true } : n
        ));
      } catch (error) {
        console.error('Failed to mark as read:', error);
      }
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconBackground}>
        <MaterialCommunityIcons name="bell-outline" size={40} color="#94A3B8" />
      </View>
      <Text style={styles.emptyTitle}>Nothing to show</Text>
      <Text style={styles.emptySubtitle}>You're all caught up with your notifications.</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <AntDesign name="left" size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={() => loadNotifications()} style={styles.actionButton}>
          <MaterialCommunityIcons name="refresh" size={22} color="#64748B" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="small" color="#0F172A" />
        </View>
      ) : (
        <ScrollView 
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
        >
          {notifications && notifications.length > 0 ? (
            notifications.map((notification, index) => (
              <TouchableOpacity 
                key={notification.id || index} 
                style={[
                  styles.notificationItem,
                  !notification.isRead && styles.unreadItem
                ]}
                activeOpacity={0.6}
                onPress={() => handleMarkAsRead(notification.id)}
              >
                <View style={styles.mainContent}>
                  <View style={styles.topRow}>
                    <View style={styles.titleArea}>
                      {!notification.isRead && <View style={styles.statusDot} />}
                      <Text style={[
                        styles.titleText,
                        notification.isRead && styles.readText
                      ]} numberOfLines={1}>
                        {notification.title}
                      </Text>
                    </View>
                    <Text style={styles.timeText}>
                      {new Date(notification.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </Text>
                  </View>
                  
                  <Text style={[
                    styles.messageText,
                    notification.isRead && styles.readText
                  ]} numberOfLines={2}>
                    {notification.message}
                  </Text>
                  
                  <View style={styles.bottomRow}>
                    <Text style={styles.subTimeText}>
                      {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                    {!notification.isRead && (
                      <View style={styles.newBadge}>
                        <Text style={styles.newBadgeText}>NEW</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            renderEmptyState()
          )}
        </ScrollView>
      )}

      {/* DETAIL MODAL */}
      <Modal
        visible={!!selectedNotif}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedNotif(null)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setSelectedNotif(null)}
        >
          <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHandle} />
              <TouchableOpacity 
                onPress={() => setSelectedNotif(null)}
                style={styles.closeButton}
              >
                <MaterialCommunityIcons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <View style={styles.modalTag}>
                <MaterialCommunityIcons name="bell-ring-outline" size={16} color="#3B82F6" />
                <Text style={styles.modalTagText}>Notification Details</Text>
              </View>
              
              <Text style={styles.modalTitle}>{selectedNotif?.title}</Text>
              
              <Text style={styles.modalDate}>
                {selectedNotif && new Date(selectedNotif.createdAt).toLocaleDateString(undefined, { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
              
              <View style={styles.divider} />
              
              <ScrollView showsVerticalScrollIndicator={false} style={styles.messageScroll}>
                <Text style={styles.modalMessage}>{selectedNotif?.message}</Text>
              </ScrollView>
              
              <TouchableOpacity 
                style={styles.dismissButton}
                onPress={() => setSelectedNotif(null)}
              >
                <Text style={styles.dismissButtonText}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  actionButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollViewContent: {
    paddingBottom: 40,
  },
  notificationItem: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  unreadItem: {
    backgroundColor: '#F8FAFF',
  },
  mainContent: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  titleArea: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3B82F6',
    marginRight: 8,
  },
  titleText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  timeText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  messageText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 8,
  },
  readText: {
    color: '#94A3B8',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subTimeText: {
    fontSize: 11,
    color: '#CBD5E1',
    fontWeight: '500',
  },
  newBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  newBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#3B82F6',
    letterSpacing: 0.5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 120,
    paddingHorizontal: 40,
  },
  emptyIconBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: '40%',
    maxHeight: '80%',
    paddingBottom: 40,
  },
  modalHeader: {
    alignItems: 'center',
    paddingVertical: 12,
    position: 'relative',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
  },
  closeButton: {
    position: 'absolute',
    right: 20,
    top: 15,
  },
  modalBody: {
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  modalTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  modalTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3B82F6',
    marginLeft: 6,
    textTransform: 'uppercase',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 28,
    marginBottom: 8,
  },
  modalDate: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 20,
  },
  messageScroll: {
    maxHeight: 300,
    marginBottom: 30,
  },
  modalMessage: {
    fontSize: 16,
    color: '#334155',
    lineHeight: 26,
  },
  dismissButton: {
    backgroundColor: '#0F172A',
    height: 54,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dismissButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default Notification;

