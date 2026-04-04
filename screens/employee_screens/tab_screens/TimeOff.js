import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { apiService } from '../../../services/api';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';

const TimeOff = () => {
  const navigate = useNavigation();
  const [filter, setFilter] = useState('All');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const employeeId = useSelector(state => state.auth.user?.user?.employeeId);

  useEffect(() => {
    if (employeeId) {
      loadTimeOff();
    }
  }, [employeeId]);

  const loadTimeOff = async () => {
    try {
      setLoading(true);
      const data = await apiService.getTimeOffRequests(employeeId);
      setTasks(data);
    } catch (error) {
      console.error('Failed to load timeoff:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = tasks.filter(task =>
    filter === 'All' ? true : task.status === filter
  );

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'SUBMITTED':
      case 'Submited':
        return { backgroundColor: '#0000FF' };
      case 'ACCEPTED':
      case 'Accepted':
        return { backgroundColor: '#008000' };
      case 'REJECTED':
      case 'Rejected':
        return { backgroundColor: '#FF0000' };
      case 'PENDING':
        return { backgroundColor: 'orange' };
      default:
        return { backgroundColor: 'gray' };
    }
  };

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 120 }} className="pt-12 px-5 bg-blue-50">
      <View className="flex-row items-center justify-between">
        <Text className="text-[20px] font-semibold">Time Off</Text>
        <TouchableOpacity className="bg-white rounded-full p-0.5" onPress={() => navigate.navigate("Send_Timeoff_Form")}>
          <Feather name="plus-circle" size={24} color="black" />
        </TouchableOpacity>
      </View>
      <View className="flex-row items-center justify-between py-4">
        {['All', 'SUBMITTED', 'ACCEPTED', 'REJECTED'].map(status => (
          <TouchableOpacity
            key={status}
            onPress={() => setFilter(status)}
            className={`rounded-md px-3 py-2 ${filter === status ? 'bg-blue-200' : 'bg-blue-50'}`}
          >
            <Text className="text-[#00a2e4] font-medium text-[12px]">{status === 'SUBMITTED' ? 'Sent' : status === 'ACCEPTED' ? 'Approved' : status === 'REJECTED' ? 'Rejected' : 'All'}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View className="space-y-5 mt-2">
        {filteredTasks.map((item) => (
          <View className="flex-row items-center w-[97%]" key={item.id}>
            <View style={getStatusStyle(item.status)} className="w-2 p-1 h-full rounded-tl-md rounded-bl-md"></View>
            <View className="bg-white p-2.5 w-full rounded-tr-md rounded-br-md flex-row items-center justify-between">
              <View className="">
                <Text className="text-[16px] font-medium">{item.title}</Text>
                <View className="flex-row items-center pt-1">
                  <Feather name="calendar" size={10} color="gray" />
                  <Text className="text-[11px] text-gray-500 ml-1">
                    {formatDate(item.fromdate)} - {formatDate(item.todate)}
                  </Text>
                </View>
              </View>
              <View>
                <Text className={`py-1 px-3 font-medium rounded-md text-white`} style={getStatusStyle(item.status)}>
                  {item.status}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

export default TimeOff;