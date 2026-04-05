import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { EvilIcons, AntDesign } from '@expo/vector-icons';
import { apiService } from '../../../services/api';
import { useSelector } from 'react-redux';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSocket } from '../../../context/SocketContext';

const DailyTask = () => {
  const [filter, setFilter] = useState('All');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const employeeId = useSelector(state => state.auth.user?.user?.employeeId);
  const { socket } = useSocket();

  const loadTasks = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      
      const data = await apiService.getTasks(employeeId);
      setTasks(data);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      if (employeeId) {
        console.log('DailyTask focused, refreshing... Current count:', tasks.length);
        loadTasks(tasks.length > 0);
      }
    }, [employeeId, tasks.length])
  );

  useEffect(() => {
    if (socket && employeeId) {
      const handleTaskCreated = (data) => {
        console.log('Received task:created event:', data.title);
        // If this employee is in the list of assigned employees
        if (data.employeeIds?.includes(employeeId)) {
          loadTasks(true); // Silent refresh to get full objects
        }
      };

      const handleTaskUpdated = (updatedTask) => {
        console.log('Received task:updated event:', updatedTask.id);
        if (updatedTask.employeeId === employeeId) {
          setTasks(prev => prev.map(t => 
            t.id === updatedTask.id ? { ...t, ...updatedTask } : t
          ));
        }
      };

      socket.on('task:created', handleTaskCreated);
      socket.on('task:updated', handleTaskUpdated);

      return () => {
        socket.off('task:created', handleTaskCreated);
        socket.off('task:updated', handleTaskUpdated);
      };
    }
  }, [socket, employeeId]);

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
      `Would you like to mark this task as ${nextStatus.replace('_', ' ')}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Update", 
          onPress: async () => {
            try {
              // Optimistically update local state if possible, or just silent refresh
              const updated = await apiService.updateTaskStatus(taskId, nextStatus);
              // The socket listener will catch 'task:updated' and refresh the specific item
            } catch (error) {
              console.error('Failed to update status:', error);
              Alert.alert("Error", "Failed to update task status.");
            }
          } 
        }
      ]
    );
  };

  const getStatusInfo = (status) => {
    const s = status ? status.toUpperCase() : '';
    switch (s) {
      case 'PENDING':
        return { bg: 'bg-orange-100', text: 'text-orange-600', dot: 'bg-orange-500', name: 'Pending' };
      case 'COMPLETE':
        return { bg: 'bg-green-100', text: 'text-green-600', dot: 'bg-green-500', name: 'Complete' };
      case 'IN_PROGRESS':
      case 'INPROGRESS':
        return { bg: 'bg-blue-100', text: 'text-blue-600', dot: 'bg-blue-500', name: 'In Progress' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-500', name: status };
    }
  };

  const getStatusTextStyle = (status) => {
    const s = status ? status.toUpperCase() : '';
    switch (s) {
      case 'PENDING':
        return '#FFA500';
      case 'COMPLETE':
        return '#008000';
      case 'IN_PROGRESS':
      case 'INPROGRESS':
        return '#0000FF';
      default:
        return '#808080';
    }
  };

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 120 }} className="pt-12 px-5 bg-blue-50">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
            <Text className="text-[20px] font-semibold">Task</Text>
        </View>
        <TouchableOpacity 
          onPress={() => navigation.navigate('TaskCreation', { initialEmployeeId: employeeId })}
          className="bg-[#00a2e4] w-8 h-8 rounded-full items-center justify-center shadow-lg"
        >
          <AntDesign name="plus" size={20} color="white" />
        </TouchableOpacity>
      </View>
      <View className="flex-row items-center justify-between py-4">
        {['All', 'PENDING', 'IN_PROGRESS', 'COMPLETE'].map(status => (
          <TouchableOpacity
            key={status}
            onPress={() => setFilter(status)}
            className={`rounded-md px-4 py-2 ${filter.toUpperCase() === status ? 'bg-blue-200' : 'bg-blue-50'}`}
          >
            <Text className="text-[#00a2e4] font-medium">{status.replace('_', ' ')}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View className="mt-4 pb-10">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((item) => {
            const statusInfo = getStatusInfo(item.status);
            return (
              <TouchableOpacity
                key={item.id} 
                onPress={() => navigation.navigate('TaskDetail', { task: item })}
                className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-gray-100 flex-row items-center justify-between"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.05,
                  shadowRadius: 10,
                  elevation: 2,
                }}
              >
                <View className="flex-1 pr-3">
                  <View className="flex-row items-center mb-1">
                    <View className={`w-2 h-2 rounded-full mr-2 ${statusInfo.dot}`} />
                    <Text className="text-[16px] font-bold text-gray-800" numberOfLines={1}>
                      {item.title}
                    </Text>
                  </View>
                  
                  <View className="flex-row items-center mb-2">
                    <EvilIcons name="calendar" size={20} color="#6B7280" />
                    <Text className="text-gray-500 text-[13px] ml-1">
                      {new Date(item.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                    </Text>
                    <View className="w-1 h-1 bg-gray-300 rounded-full mx-2" />
                    <Text className={`text-[11px] font-bold uppercase ${item.priority === 'HIGH' ? 'text-red-500' : 'text-blue-500'}`}>
                      {item.priority}
                    </Text>
                  </View>
                  
                  <Text className="text-gray-400 text-[12px] leading-4" numberOfLines={2}>
                    {item.description || "No description provided."}
                  </Text>
                </View>

                <TouchableOpacity 
                  onPress={() => handleUpdateStatus(item.id, item.status)}
                  className={`px-3 py-1.5 rounded-full ${statusInfo.bg} flex-row items-center`}
                  style={{ alignSelf: 'center', minWidth: 90, justifyContent: 'center' }}
                >
                  <Text className={`${statusInfo.text} font-bold text-[11px] text-center uppercase`}>
                    {statusInfo.name}
                  </Text>
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })
        ) : (
          <View className="items-center justify-center py-20">
            <Text className="text-gray-400 font-medium">No tasks found</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

export default DailyTask;