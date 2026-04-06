import * as React from 'react';
import { MenuProvider } from 'react-native-popup-menu';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DrawerActions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import StartingScreen from './screens/employee_screens/StartingScreen';
import EmployeeLogin from './screens/loginscreens/EmployeeLogin';
import ManagerLogin from './screens/loginscreens/ManagerLogin';
import WelcomeScreen from './screens/loginscreens/WelcomeScreen';
import UserProfile from './screens/employee_screens/profile/UserProfile';
import History from './screens/employee_screens/drawer_pages/History';
import CustomDrawerContent from './screens/employee_screens/drawer_pages/CustomDrawerContent';
import DailyTask from './screens/employee_screens/tab_screens/DailyTask';
import Notification from './screens/employee_screens/tab_screens/Notification';
import TimeOff from './screens/employee_screens/tab_screens/TimeOff';
import Send_Timeoff_Form from './screens/employee_screens/timeoff_section/Send_Timeoff_Form';
import PaySlip from './screens/employee_screens/profile/PaySlip';
import ProfileDetails from './screens/employee_screens/profile/ProfileDetails';
import ProfileSetting from './screens/employee_screens/profile/ProfileSetting';
import EmployeDataAnalyze from './screens/employee_screens/analytics/EmployeDataAnalyze';
import ManagerHomeScreen from './screens/hr_screens/ManagerHomeScreen';
import store from './auth/store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Provider, useSelector } from 'react-redux';
import EmployeeList from './screens/hr_screens/drawescreens/EmployeeList';
import Leave_Applications from './screens/hr_screens/overviewscreens/Leave_Applications';
import AddNewEmployee from './screens/hr_screens/add_new_employee/NewEmployee';
import NotificationHR from './screens/hr_screens/overviewscreens/NotificationHR';
import ProjectTasks from './screens/hr_screens/overviewscreens/ProjectTasks';
import TaskCreation from './screens/hr_screens/overviewscreens/TaskCreation';
import Teams from './screens/hr_screens/overviewscreens/Teams';
import PaySlipofEmployee from './screens/hr_screens/overviewscreens/PaySlip';
import PaySlipSummary from './screens/hr_screens/employeePayslip/PaySlipSummary';
import Attendance from './screens/hr_screens/overviewscreens/Attendance';
import EmployeeDetails from './screens/hr_screens/employeedetails/EmployeeDetails';
import FaceRecognitionScreen from './screens/employee_screens/FaceRecognitionScreen';
import ManagerCustomDrawerContent from './screens/hr_screens/drawescreens/ManagerCustomDrawerContent';
import EmployeeEdit from './screens/hr_screens/add_new_employee/EmployeeEdit';
import TaskDetail from './screens/common/TaskDetail';
import MyCorrectionList from './screens/employee_screens/attendance_correction/MyCorrectionList';
import AttendanceCorrectionManager from './screens/hr_screens/overviewscreens/AttendanceCorrectionManager';
import AttendanceCorrectionRequest from './screens/employee_screens/attendance_correction/AttendanceCorrectionRequest';
import { SocketProvider } from './context/SocketContext';
import { registerForPushNotificationsAsync, saveTokenToBackend, setupNotificationListeners } from './services/NotificationManager';
import { useSocket } from './context/SocketContext';
import { useDispatch } from 'react-redux';
import { updateUserProfile } from './auth/authSlice';
import { 
    fetchHrDashboard,
    fetchEmployeeTasks, 
    fetchEmployeeTimeOff,
    fetchNotifications,
    fetchEmployeeAttendance,
    updateRecentLeave,
    updateTask,
    updateTimeOff,
    addNotification,
    setHrSummary
} from './auth/dataSlice';
// import AutorityScreen from './screens/AutorityScreen'

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

const roles = {
    employee: 'employee',
    manager: 'manager',
    none: 'none',
};

function HomeScreen({ navigation }) {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="StartingScreen" component={StartingScreen} />
        </Stack.Navigator>
    );
}

function TabNavigator({ navigation }) {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;
                    if (route.name === 'Home') {
                        iconName = focused ? 'home' : 'home-outline';
                    } else if (route.name === 'Profile') {
                        iconName = focused ? 'person' : 'person-outline';
                    } else if (route.name === 'Time Off') {
                        iconName = focused ? 'time' : 'time-outline';
                    } else if (route.name === 'Task') {
                        iconName = focused ? 'list' : 'list-outline';
                    }

                    return (
                        <View style={[styles.iconContainer, focused && styles.focusedIcon]}>
                            <Ionicons name={iconName} size={22} color={focused ? '#00a2e4' : color} />
                        </View>
                    );
                },
                tabBarActiveTintColor: '#00a2e4',
                tabBarInactiveTintColor: 'gray',
                tabBarStyle: styles.tabBar,
                tabBarShowLabel: false,
                headerShown: false,
                headerLeft: () => (
                    <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())}>
                        <Ionicons name="menu" size={30} color="black" style={{ marginLeft: 10 }} />
                    </TouchableOpacity>
                ),
            })}
        >
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Task" component={DailyTask} />
            <Tab.Screen name="Time Off" component={TimeOff} />
            <Tab.Screen name="Profile" component={UserProfile} />
        </Tab.Navigator>
    );
}

function DrawerNavigator() {
    return (
        <Drawer.Navigator
            useLegacyImplementation={false}
            initialRouteName="Home Screen"
            drawerContent={(props) => <CustomDrawerContent {...props} />}
            screenOptions={{
                headerShown: false,
                drawerActiveTintColor: '#00a2e4',
                drawerInactiveTintColor: 'black',
                drawerLabelStyle: {
                    marginLeft: 0,
                },
                drawerItemStyle: {
                    marginVertical: 0,
                },
            }}
        >
            <Drawer.Screen
                name="Home Screen"
                component={TabNavigator}
                options={{
                    drawerIcon: ({ focused, color, size }) => (
                        <Ionicons name="grid" size={size} color={color} />
                    ),
                }}
            />
            <Drawer.Screen
                name="Attendance"
                component={History}
                options={{
                    drawerIcon: ({ focused, color, size }) => (
                        <Ionicons name="calendar" size={size} color={color} />
                    ),
                }}
            />
            <Drawer.Screen
                name="Analytics"
                component={EmployeDataAnalyze}
                options={{
                    drawerIcon: ({ focused, color, size }) => (
                        <Ionicons name="analytics" size={size} color={color} />
                    ),
                }}
            />
            <Drawer.Screen
                name="Payslips"
                component={PaySlip}
                options={{
                    drawerIcon: ({ focused, color, size }) => (
                        <Ionicons name="receipt-outline" size={size} color={color} />
                    ),
                }}
            />
            <Drawer.Screen
                name="Setting"
                component={ProfileSetting}
                options={{
                    drawerIcon: ({ focused, color, size }) => (
                        <Ionicons name="settings" size={size} color={color} />
                    ),
                }}
            />
        </Drawer.Navigator>
    );
}

function ManagerTabNavigator({ navigation }) {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;
                    if (route.name === 'Overview') {
                        iconName = focused ? 'speedometer' : 'speedometer-outline';
                    } else if (route.name === 'Employees') {
                        iconName = focused ? 'people' : 'people-outline';
                    } else if (route.name === 'AttendanceHR') {
                        iconName = focused ? 'calendar' : 'calendar-outline';
                    } else if (route.name === 'Tasks') {
                        iconName = focused ? 'briefcase' : 'briefcase-outline';
                    }

                    return (
                        <View style={[styles.iconContainer, focused && styles.managerFocusedIcon]}>
                            <Ionicons name={iconName} size={22} color={focused ? '#2D3748' : color} />
                        </View>
                    );
                },
                tabBarActiveTintColor: '#2D3748',
                tabBarInactiveTintColor: 'gray',
                tabBarStyle: styles.tabBar,
                tabBarShowLabel: false,
                headerShown: false,
            })}
        >
            <Tab.Screen name="Overview" component={ManagerHomeScreen} />
            <Tab.Screen name="Employees" component={EmployeeList} />
            <Tab.Screen name="AttendanceHR" component={Attendance} options={{ title: 'Attendance' }} />
            <Tab.Screen name="Tasks" component={ProjectTasks} />
        </Tab.Navigator>
    );
}

function ManagerDrawer() {
    return (
        <Drawer.Navigator
            useLegacyImplementation={false}
            initialRouteName="Dashboard"
            drawerContent={(props) => <ManagerCustomDrawerContent {...props} />}
            screenOptions={{
                headerShown: false,
                drawerActiveTintColor: '#2D3748',
                drawerInactiveTintColor: '#4A5568',
                drawerLabelStyle: {
                    marginLeft: 0,
                    fontWeight: '600',
                },
                drawerItemStyle: {
                    marginVertical: 4,
                },
            }}
        >
            <Drawer.Screen
                name="Dashboard"
                component={ManagerTabNavigator}
                options={{
                    drawerIcon: ({ color, size }) => (
                        <Ionicons name="apps" size={size} color={color} />
                    ),
                }}
            />
            <Drawer.Screen
                name="Employee List"
                component={EmployeeList}
                options={{
                    drawerIcon: ({ color, size }) => (
                        <Ionicons name="people-circle" size={size} color={color} />
                    ),
                }}
            />
            <Drawer.Screen
                name="Leave Applications"
                component={Leave_Applications}
                options={{
                    drawerIcon: ({ color, size }) => (
                        <Ionicons name="document-text" size={size} color={color} />
                    ),
                }}
            />
            <Drawer.Screen
                name="Attendance History"
                component={Attendance}
                options={{
                    drawerIcon: ({ color, size }) => (
                        <Ionicons name="calendar-clear" size={size} color={color} />
                    ),
                }}
            />
            <Drawer.Screen
                name="Payroll"
                component={PaySlipofEmployee}
                options={{
                    drawerIcon: ({ color, size }) => (
                        <Ionicons name="receipt-sharp" size={size} color={color} />
                    ),
                }}
            />
            <Drawer.Screen
                name="Settings"
                component={ProfileSetting}
                options={{
                    drawerIcon: ({ color, size }) => (
                        <Ionicons name="settings-outline" size={size} color={color} />
                    ),
                }}
            />
        </Drawer.Navigator>
    );
}

function EmployeeStackNavigator() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="DrawerNavigator" component={DrawerNavigator} />
            <Stack.Screen name="Notification" component={Notification} />
            <Stack.Screen name="Send_Timeoff_Form" component={Send_Timeoff_Form} />
            <Stack.Screen name="PaySlip" component={PaySlip} />
            <Stack.Screen name="ProfileDetails" component={ProfileDetails} />
            <Stack.Screen name="ProfileSetting" component={ProfileSetting} />
            <Stack.Screen name="FaceRecognition" component={FaceRecognitionScreen} />
            <Stack.Screen name="TaskDetail" component={TaskDetail} />
            <Stack.Screen name="TaskCreation" component={TaskCreation} />
            <Stack.Screen name="AttendanceCorrectionRequest" component={AttendanceCorrectionRequest} />
            <Stack.Screen name="MyCorrectionList" component={MyCorrectionList} />
        </Stack.Navigator>
    );
}

function ManagerStackNavigator() {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="ManagerDrawer" component={ManagerDrawer} />
            <Stack.Screen name="LeaveApplications" component={Leave_Applications} />
            <Stack.Screen name="AddNewEmployee" component={AddNewEmployee} />
            <Stack.Screen name="NotificationHR" component={NotificationHR} />
            <Stack.Screen name="ProjectTasks" component={ProjectTasks} />
            <Stack.Screen name="TaskCreation" component={TaskCreation} />
            <Stack.Screen name="Teams" component={Teams} />
            <Stack.Screen name="PaySlipofEmployee" component={PaySlipofEmployee} />
            <Stack.Screen name="PaySlipSummary" component={PaySlipSummary} />
            <Stack.Screen name="Attendance" component={Attendance} />
            <Stack.Screen name="EmployeeDetails" component={EmployeeDetails} />
            <Stack.Screen name="EmployeeEdit" component={EmployeeEdit} />
            <Stack.Screen name="FaceRecognition" component={FaceRecognitionScreen} />
            <Stack.Screen name="TaskDetail" component={TaskDetail} />
            <Stack.Screen name="AttendanceCorrectionManager" component={AttendanceCorrectionManager} />
        </Stack.Navigator>
    );
}

function AppNavigator() {
    const { isAuthenticated, loading, isHydrated, user } = useSelector(state => state.auth);
    const [role, setRole] = React.useState(roles.none);
    const dispatch = useDispatch();
    const { socket } = useSocket();

    // Global Profile & Data Sync
    React.useEffect(() => {
        if (socket && isAuthenticated) {
            const employeeId = user?.user?.employeeId || user?.user?.employee?.id;
            
            // Initial data fetch
            if (role === roles.manager) {
                dispatch(fetchHrDashboard());
            } else if (role === roles.employee && employeeId) {
                dispatch(fetchEmployeeTasks(employeeId));
                dispatch(fetchEmployeeTimeOff(employeeId));
                dispatch(fetchNotifications(employeeId));
                dispatch(fetchEmployeeAttendance(employeeId));
            }

            const handleEmployeeUpdate = (data) => {
                if (data.employee?.id === employeeId) {
                    dispatch(updateUserProfile(data.employee));
                }
                if (role === roles.manager) {
                    dispatch(fetchHrDashboard()); // Full refresh for manager on any employee change might be heavy, but it's safe
                }
            };

            const handleAttendanceUpdate = (data) => {
                if (role === roles.manager) {
                    // Update summary counts
                    dispatch(fetchHrDashboard()); 
                }
            };

            const handleTimeOffUpdate = (data) => {
                if (role === roles.manager) {
                    dispatch(fetchHrDashboard());
                } else if (data.employeeId === employeeId || data.employee?.id === employeeId) {
                    // It could be a full object or just a status update
                    if (data.id) {
                        dispatch(updateTimeOff(data));
                    } else {
                        dispatch(fetchEmployeeTimeOff(employeeId));
                    }
                }
            };

            const handleTaskUpdate = (data) => {
                if (role === roles.manager) {
                    dispatch(fetchHrDashboard());
                }
                
                // If it's a new task creation, we only get partial data in broadcast, so refresh
                if (!data.id) {
                   if (data.employeeIds?.includes(employeeId)) {
                       dispatch(fetchEmployeeTasks(employeeId));
                   }
                   return;
                }

                // Check if task involves current user
                if (data.employeeId === employeeId) {
                    dispatch(updateTask(data));
                }
            };

            const handleCorrectionUpdate = (data) => {
                if (role === roles.manager) {
                    dispatch(fetchHrDashboard());
                }
            };

            const handleNotification = (notif) => {
                dispatch(addNotification(notif));
            };

            socket.on('employee_changed', handleEmployeeUpdate);
            socket.on('attendance_updated', handleAttendanceUpdate);
            socket.on('time_off:requested', handleTimeOffUpdate);
            socket.on('time_off:changed', handleTimeOffUpdate);
            socket.on('task:created', handleTaskUpdate);
            socket.on('task:updated', handleTaskUpdate);
            socket.on('correction:requested', handleCorrectionUpdate);
            socket.on('correction:changed', handleCorrectionUpdate);
            socket.on('notification', handleNotification);
            
            return () => {
                socket.off('employee_changed', handleEmployeeUpdate);
                socket.off('attendance_updated', handleAttendanceUpdate);
                socket.off('time_off:requested', handleTimeOffUpdate);
                socket.off('time_off:updated', handleTimeOffUpdate);
                socket.off('task:created', handleTaskUpdate);
                socket.off('task:updated', handleTaskUpdate);
                socket.off('correction:requested', handleCorrectionUpdate);
                socket.off('correction:changed', handleCorrectionUpdate);
                socket.off('notification', handleNotification);
            };
        }
    }, [socket, isAuthenticated, user, role]);

    React.useEffect(() => {
        const userRole = user?.user?.role?.toLowerCase();
        if (isAuthenticated && userRole) {
            if (userRole === 'admin' || userRole === 'manager' || userRole === 'hr') {
                setRole(roles.manager);
                AsyncStorage.setItem('role', roles.manager);
            } else {
                setRole(roles.employee);
                AsyncStorage.setItem('role', roles.employee);
            }
        }
    }, [isAuthenticated, user]);

    React.useEffect(() => {
        if (isAuthenticated) {
            AsyncStorage.setItem('isAuthenticated', 'true');
        } else {
            AsyncStorage.removeItem('isAuthenticated');
            AsyncStorage.removeItem('role');
        }
    }, [isAuthenticated]);

    React.useEffect(() => {
        const loadRole = async () => {
            const savedRole = await AsyncStorage.getItem('role');
            if (savedRole) setRole(savedRole);
        };

        if (isHydrated) loadRole();
    }, [isHydrated]);

    // Handle Push Notifications
    React.useEffect(() => {
        let notificationListener;
        let responseListener;

        const initNotifications = async () => {
            if (isAuthenticated) {
                const token = await registerForPushNotificationsAsync();
                if (token) {
                    await saveTokenToBackend(token);
                }
                
                const listeners = setupNotificationListeners();
                notificationListener = listeners.notificationListener;
                responseListener = listeners.responseListener;
            }
        };

        initNotifications();

        return () => {
            if (notificationListener) {
                import('expo-notifications').then(Notifications => 
                    Notifications.removeNotificationSubscription(notificationListener)
                );
            }
            if (responseListener) {
                import('expo-notifications').then(Notifications => 
                    Notifications.removeNotificationSubscription(responseListener)
                );
            }
        };
    }, [isAuthenticated]);

    if (!isHydrated) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Loading...</Text>
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {!isAuthenticated ? (
                    <>
                        <Stack.Screen name="Welcome" component={WelcomeScreen} />
                        <Stack.Screen name="EmployeeLogin">
                            {props => <EmployeeLogin {...props} setRole={setRole} />}
                        </Stack.Screen>
                        <Stack.Screen name="ManagerLogin">
                            {props => <ManagerLogin {...props} setRole={setRole} />}
                        </Stack.Screen>
                    </>
                ) : (
                    <>
                        {role === roles.employee ? (
                            <Stack.Screen name="EmployeeStackNavigator" component={EmployeeStackNavigator} />
                        ) : (
                            <Stack.Screen name="ManagerStackNavigator" component={ManagerStackNavigator} />
                        )}
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}

export default function App() {
    return (
        <SafeAreaProvider>
            <StatusBar style="auto" />
            <Provider store={store}>
                <SocketProvider>
                    <MenuProvider>
                        <AppNavigator />
                    </MenuProvider>
                </SocketProvider>
            </Provider>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        height: Platform.OS === 'ios' ? 88 : 65,
        backgroundColor: 'white',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingTop: 10,
    },
    customTabBarButton: {
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.5,
        elevation: 5,
    },
    customTabBarButtonView: {
        width: 70,
        height: 70,
        borderRadius: 35,
    },
    iconContainer: {
        width: 56,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    focusedIcon: {
        backgroundColor: '#EBF8FF', // Very light blue
    },
    managerFocusedIcon: {
        backgroundColor: '#EDF2F7', // Very light gray/slate
    },
    shadow: {
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
});