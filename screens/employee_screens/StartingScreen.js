import React, { useState, useCallback } from 'react'
import { View, Text, Image, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, DrawerActions, useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '@/auth/authSlice';
import { AntDesign, EvilIcons, Ionicons } from '@expo/vector-icons';
import { apiService } from '@/services/api';

const StartingScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const employeeId = user?.user?.employeeId;
  
  const [tasks, setTasks] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [notifCount, setNotifCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (employeeId) {
        loadDashboardData();
      }
    }, [employeeId])
  );

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [tasksData, attendanceData, notifsData] = await Promise.all([
        apiService.getTasks(employeeId),
        apiService.getAttendanceHistory(employeeId),
        apiService.getNotifications(employeeId)
      ]);
      setTasks(tasksData);
      setAttendance(attendanceData);
      setNotifCount(notifsData.filter(n => !n.isRead).length);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const todayAttendance = attendance.find(a => 
    new Date(a.date).toDateString() === new Date().toDateString()
  );

  const formatTime = (date) => date ? new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Logout", onPress: () => dispatch(logout()) }
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#eff6ff' }}>
      <SafeAreaView edges={['top']} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
      <View className="px-5 py-4 flex-row justify-between items-center">
        <View className="flex-row items-center space-x-3">
          <TouchableOpacity className="h-14 w-14 bg-white rounded-full p-[3px] overflow-hidden" onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
            {user?.user?.employee?.avatarUrl ? (
              <Image
                source={{ uri: user.user.employee.avatarUrl }}
                className="h-full w-full object-cover rounded-full"
              />
            ) : (
              <View className="h-full w-full bg-[#00a2e4] rounded-full items-center justify-center">
                <Text className="text-white text-xl font-bold">
                  {user?.user?.employee?.name ? user.user.employee.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : '??'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <View className="space-y-1">
            <Text className="text-[18px] font-semibold">
              {user?.user?.employee?.name || user?.user?.name || 'User'}
            </Text>
            <Text className="text-gray-500 font-semibold text-[13px]">
              {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </Text>
          </View>
        </View>
        <View className="flex-row items-center space-x-3">
          <TouchableOpacity onPress={() => navigation.navigate("Notification")}>
            <Ionicons name="notifications-circle-outline" size={38} color="#00a2e4" className="relative" />
            {notifCount > 0 && (
              <Text className="absolute bg-red-500 text-white rounded-full h-4 w-4 text-center text-[10px] left-[25px]">
                {notifCount}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
      {/* --------------------- Shift Data ---------------------------------------*/}
      <View className="px-5 pb-6 mt-1 space-y-3">
        <View className="flex-row justify-between items-center space-x-3">
          <View className="flex-1 h-[12vh] bg-white rounded-lg p-3">
            <Text className="text-gray-500 font-semibold text-[12px]">Clock In</Text>
            <Text className="text-[20px] font-semibold mt-1">{formatTime(todayAttendance?.clockIn)}</Text>
            <Text className="text-gray-400 text-[11px] mt-1">Today</Text>
          </View>
          <View className="flex-1 h-[12vh] bg-white rounded-lg p-3">
            <Text className="text-gray-500 font-semibold text-[12px]">Clock Out</Text>
            <Text className="text-[20px] font-semibold mt-1">{formatTime(todayAttendance?.clockOut)}</Text>
            <Text className="text-gray-400 text-[11px] mt-1">Today</Text>
          </View>
        </View>
      </View>

      {/* --------------------- Face Attendance ------------------------------------*/}
      <View className="px-5 mb-6">
        <TouchableOpacity 
          className="bg-[#00a2e4] rounded-xl p-4 flex-row items-center justify-between shadow-sm"
          onPress={() => navigation.navigate("FaceRecognition", { mode: 'attendance' })}
        >
          <View className="flex-row items-center space-x-3">
            <View className="bg-white/20 p-2 rounded-lg">
              <Ionicons name="scan-outline" size={24} color="white" />
            </View>
            <View>
              <Text className="text-white font-bold text-[16px]">Face Attendance</Text>
              <Text className="text-white/80 text-[12px]">Scan your face to clock in/out</Text>
            </View>
          </View>
          <AntDesign name="right" size={20} color="white" />
        </TouchableOpacity>
      </View>
      {/* --------------------- Tasks -------------------------------------------*/}
      <View className="px-5">
        <View className="flex-row items-center justify-between">
          <Text className="font-semibold text-[18px]">Today's Task</Text>
          <TouchableOpacity className="flex-row items-center space-x-1" onPress={() => navigation.navigate("Task")}>
            <Text className="text-gray-500 text-right text-[14px] font-medium pb-0.5 ">See more</Text>
            <AntDesign name="right" size={14} color="gray" className="ml-2" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="small" color="#00a2e4" className="mt-5" />
        ) : tasks.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }} className="mt-4 flex-row">
            {tasks.map((item) => (
              <View className="bg-white rounded-lg p-2.5 space-y-0.5 w-[280px] mr-4 border-l-4 border-[#00a2e4]" key={item.id}>
                <Text className=" text-[15px] font-medium">{item.title}</Text>
                <View className="flex-row items-center space-x-0.5">
                  <EvilIcons name="calendar" size={22} color="#00a2e4" />
                  <Text className="pt-0.5 text-[15px] font-medium text-[#00a2e4]">{new Date(item.date).toLocaleDateString()}</Text>
                </View>
                <Text className="text-[11px] text-gray-400 font-medium pt-0.5" numberOfLines={1}>{item.description}</Text>
              </View>
            ))}
          </ScrollView>
        ) : (
          <Text className="text-center mt-5 font-medium text-gray-500">No Task Available</Text>
        )}
      </View>
      {/* --------------------- Recent Activity ---------------------------------*/}
      <View className="px-5">
        <View className="flex-row items-center justify-between pt-5 pb-1">
          <Text className="font-semibold text-[18px]">Recent Activity</Text>
          <TouchableOpacity className="flex-row items-center space-x-1" onPress={() => navigation.navigate("Attendance")}>
            <Text className="text-gray-500 text-right text-[14px] font-medium pb-0.5 ">View all</Text>
            <AntDesign name="right" size={14} color="gray" className="ml-2" />
          </TouchableOpacity>
        </View>
        {loading ? (
          <ActivityIndicator size="small" color="#00a2e4" className="mt-5" />
        ) : attendance.length > 0 ? (
          <View className="space-y-3">
            {attendance.slice(0, 5).map((item) => (
              <View key={item.id} className="bg-white p-4 rounded-2xl flex-row items-center justify-between shadow-sm border border-slate-50">
                <View className="flex-row items-center space-x-4">
                  <View className={`h-12 w-12 rounded-xl justify-center items-center ${item.clockOut ? 'bg-green-50' : 'bg-amber-50'}`}>
                    <Ionicons 
                      name={item.clockOut ? "checkmark-circle" : "time"} 
                      size={24} 
                      color={item.clockOut ? "#10b981" : "#f59e0b"} 
                    />
                  </View>
                  <View>
                    <Text className="text-[15px] font-bold text-slate-800">
                      {item.clockOut ? 'Completed' : 'Clocked In'}
                    </Text>
                    <Text className="text-[12px] font-medium text-slate-400">
                      {new Date(item.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} • {item.location || 'Office'}
                    </Text>
                  </View>
                </View>
                <View className="items-end">
                  <Text className="font-bold text-slate-700">{formatTime(item.clockIn)}</Text>
                  <Text className="text-[11px] font-semibold text-slate-400 uppercase">In Time</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (

          <View className="py-4">
            <Text className="text-center font-medium text-gray-500">No Activity Available</Text>
          </View>
        )}
      </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}

export default StartingScreen;