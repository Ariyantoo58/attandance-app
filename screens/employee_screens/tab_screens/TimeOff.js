import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiService } from '../../../services/api';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { useSocket } from '../../../context/SocketContext';

const TimeOff = () => {
  const navigate = useNavigation();
  const [filter, setFilter] = useState('All');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const employeeId = useSelector(state => state.auth.user?.user?.employeeId);
  const { socket } = useSocket();

  const loadTimeOff = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await apiService.getTimeOffRequests(employeeId);
      setTasks(data);
    } catch (error) {
      console.error('Failed to load timeoff:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      if (employeeId) {
        loadTimeOff(tasks.length > 0); 
      }
    }, [employeeId, tasks.length])
  );

  useEffect(() => {
    if (socket && employeeId) {
      const handleNewRequest = (newRequest) => {
        if (newRequest.employeeId === employeeId) {
          setTasks(prev => {
            const exists = prev.find(t => t.id === newRequest.id);
            if (exists) return prev;
            return [newRequest, ...prev];
          });
        }
      };

      const handleStatusChange = (updatedRequest) => {
        if (updatedRequest.employeeId === employeeId) {
          setTasks(prev => prev.map(t => 
            t.id === updatedRequest.id ? { ...t, ...updatedRequest } : t
          ));
        }
      };

      socket.on('time_off:requested', handleNewRequest);
      socket.on('time_off:changed', handleStatusChange);

      return () => {
        socket.off('time_off:requested', handleNewRequest);
        socket.off('time_off:changed', handleStatusChange);
      };
    }
  }, [socket, employeeId]);

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
    SUBMITTED: { bg: '#EBF8FF', color: '#2B6CB0', label: 'SUBMITTED', stripe: '#2B6CB0' },
    ACCEPTED: { bg: '#F0FFF4', color: '#2F855A', label: 'APPROVED', stripe: '#2F855A' },
    REJECTED: { bg: '#FFF5F5', color: '#C53030', label: 'REJECTED', stripe: '#C53030' },
    PENDING: { bg: '#FFFBEB', color: '#B45309', label: 'PENDING', stripe: '#B45309' },
    DEFAULT: { bg: '#F7FAFC', color: '#4A5568', label: 'UNKNOWN', stripe: '#4A5568' }
  };

  const getStatusConfig = (status) => {
    const normalized = status?.toUpperCase() || 'DEFAULT';
    return statusConfig[normalized] || statusConfig.DEFAULT;
  };

  const filteredTasks = tasks.filter(task =>
    filter === 'All' ? true : task.status === filter
  );

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: '#eff6ff' }}>
      <View className="px-5 py-4 flex-row items-center justify-between">
        <Text className="text-[24px] font-bold text-slate-800">Time Off</Text>
        <TouchableOpacity 
          className="bg-white h-10 w-10 rounded-full items-center justify-center shadow-sm" 
          onPress={() => navigate.navigate("Send_Timeoff_Form")}
        >
          <Ionicons name="add" size={26} color="#00a2e4" />
        </TouchableOpacity>
      </View>

      <View className="px-5 mb-4">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 5 }}>
          {['All', 'SUBMITTED', 'ACCEPTED', 'REJECTED'].map(status => (
            <TouchableOpacity
              key={status}
              onPress={() => setFilter(status)}
              className={`rounded-full px-5 py-2 mr-3 shadow-sm ${filter === status ? 'bg-[#00a2e4]' : 'bg-white'}`}
            >
              <Text className={`font-semibold text-[13px] ${filter === status ? 'text-white' : 'text-slate-500'}`}>
                {status === 'SUBMITTED' ? 'Sent' : status === 'ACCEPTED' ? 'Approved' : status === 'REJECTED' ? 'Rejected' : 'All Requests'}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}>
        {loading ? (
          <ActivityIndicator size="large" color="#00a2e4" style={{ marginTop: 20 }} />
        ) : filteredTasks.length > 0 ? (
          <View className="space-y-4">
            {filteredTasks.map((item) => {
              const config = getStatusConfig(item.status);
              return (
                <View key={item.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 flex-row">
                  <View style={{ width: 6, backgroundColor: config.stripe }} />
                  <View className="flex-1 p-4 flex-row items-center justify-between">
                    <View className="flex-1 pr-4">
                      <Text className="text-[16px] font-bold text-slate-800" numberOfLines={1}>
                        {item.title}
                      </Text>
                      <View className="flex-row items-center mt-1">
                        <Feather name="calendar" size={11} color="#94a3b8" />
                        <Text className="text-[11px] text-slate-500 ml-1.5 font-medium">
                          {formatDate(item.fromdate)} - {formatDate(item.todate)}
                        </Text>
                      </View>
                      {item.description && (
                        <Text className="text-[12px] text-slate-400 mt-2 italic" numberOfLines={2}>
                          "{item.description}"
                        </Text>
                      )}
                    </View>
                    <View style={{ backgroundColor: config.bg }} className="px-3 py-1.5 rounded-lg">
                      <Text style={{ color: config.color }} className="text-[11px] font-bold">
                        {config.label}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View className="items-center justify-center mt-20">
            <Ionicons name="document-text-outline" size={60} color="#cbd5e1" />
            <Text className="text-slate-400 mt-4 font-semibold text-lg">No requests found</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default TimeOff;