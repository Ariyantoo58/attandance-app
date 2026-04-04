import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { LineChart, PieChart, BarChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { apiService } from '../../../services/api';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons, AntDesign } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const EmployeeDataAnalyze = () => {
    const navigation = useNavigation();
    const { user } = useSelector(state => state.auth);
    const employeeId = user?.user?.employeeId;

    const [selectedChart, setSelectedChart] = useState('attendance');
    const [loading, setLoading] = useState(true);
    const [attendance, setAttendance] = useState([]);
    
    // Processed data for charts
    const [chartData, setChartData] = useState({
        attendance: {
            pie: [],
            bar: { labels: [], datasets: [{ data: [] }] },
            line: { labels: [], datasets: [{ data: [] }] }
        },
        work: {
            title: 'Work Analytics',
            pie: [
                { name: 'Completed', population: 70, color: '#4CAF50', legendFontColor: '#7F7F7F', legendFontSize: 12 },
                { name: 'Pending', population: 30, color: '#FFC107', legendFontColor: '#7F7F7F', legendFontSize: 12 },
            ],
            bar: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
                datasets: [{ data: [20, 45, 28, 80, 99], color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})` }],
            }
        }
    });

    useFocusEffect(
        useCallback(() => {
            if (employeeId) {
                fetchData();
            }
        }, [employeeId])
    );

    const fetchData = async () => {
        try {
            setLoading(true);
            const attendanceData = await apiService.getAttendanceHistory(employeeId);
            setAttendance(attendanceData);
            processAttendanceData(attendanceData);
        } catch (error) {
            console.error('Failed to fetch analytics data:', error);
        } finally {
            setLoading(false);
        }
    };

    const processAttendanceData = (data) => {
        if (!data || data.length === 0) return;

        // 1. Pie Chart: Present vs Absent (Simplified: just present count for now vs 22 working days)
        const presentCount = data.length;
        const workingDaysInMonth = 22; // Assumption
        const absentCount = Math.max(0, workingDaysInMonth - presentCount);

        const pieData = [
            { name: 'Present', population: presentCount, color: '#0ea5e9', legendFontColor: '#475569', legendFontSize: 12 },
            { name: 'Absent/Off', population: absentCount, color: '#cbd5e1', legendFontColor: '#475569', legendFontSize: 12 },
        ];

        // 2. Bar Chart: Last 7 days status or Hours
        // Let's do hours for last 5 entries
        const recentEntries = [...data].reverse().slice(-5);
        const barLabels = recentEntries.map(item => new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' }));
        const barValues = recentEntries.map(item => {
            if (item.clockIn && item.clockOut) {
                return (new Date(item.clockOut) - new Date(item.clockIn)) / (1000 * 60 * 60);
            }
            return 8; // Default to 8 if not clocked out but present
        });

        const barData = {
            labels: barLabels,
            datasets: [{ data: barValues }],
        };

        // 3. Line Chart: Trend over time
        const lineData = {
            labels: barLabels,
            datasets: [{ 
                data: barValues,
                color: (opacity = 1) => `rgba(14, 165, 233, ${opacity})`,
                strokeWidth: 2
            }],
        };

        setChartData(prev => ({
            ...prev,
            attendance: {
                pie: pieData,
                bar: barData,
                line: lineData
            }
        }));
    };

    const chartConfig = {
        backgroundGradientFrom: '#ffffff',
        backgroundGradientTo: '#ffffff',
        decimalPlaces: 1,
        color: (opacity = 1) => `rgba(14, 165, 233, ${opacity})`,
        labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
        style: { borderRadius: 16 },
        propsForDots: {
            r: '5',
            strokeWidth: '2',
            stroke: '#0ea5e9'
        }
    };

    const renderChartGroup = () => {
        if (loading) {
            return (
                <View style={styles.centerBox}>
                    <ActivityIndicator size="large" color="#0ea5e9" />
                    <Text style={styles.loadingText}>Analyzing your data...</Text>
                </View>
            );
        }

        const currentData = selectedChart === 'attendance' ? chartData.attendance : chartData.work;

        if (selectedChart === 'attendance' && attendance.length === 0) {
            return (
                <View style={styles.centerBox}>
                    <Ionicons name="bar-chart-outline" size={80} color="#e2e8f0" />
                    <Text style={styles.emptyText}>No data available yet</Text>
                    <Text style={styles.emptySubText}>Start clocking in to see your analytics</Text>
                </View>
            );
        }

        return (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                <View style={styles.card}>
                    <Text style={styles.chartTitle}>Monthly Distribution</Text>
                    <PieChart
                        data={currentData.pie}
                        width={width - 60}
                        height={180}
                        chartConfig={chartConfig}
                        accessor="population"
                        backgroundColor="transparent"
                        paddingLeft="15"
                        absolute
                    />
                </View>

                <View style={styles.card}>
                    <Text style={styles.chartTitle}>Daily Working Hours</Text>
                    <BarChart
                        data={currentData.bar}
                        width={width - 60}
                        height={220}
                        chartConfig={chartConfig}
                        style={styles.chartStyle}
                        fromZero
                        showValuesOnTopOfBars
                        withInnerLines={false}
                    />
                </View>

                <View style={styles.card}>
                    <Text style={styles.chartTitle}>Performance Trend</Text>
                    <LineChart
                        data={currentData.line}
                        width={width - 60}
                        height={220}
                        chartConfig={chartConfig}
                        bezier
                        style={styles.chartStyle}
                    />
                </View>
            </ScrollView>
        );
    };

    return (
        <View style={styles.mainContainer}>
            <LinearGradient colors={['#00a2e4', '#007bb0']} style={styles.header}>
                <SafeAreaView edges={['top']}>
                    <View style={styles.headerRow}>
                        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                            <AntDesign name="left" size={20} color="white" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>My Analytics</Text>
                        <TouchableOpacity onPress={fetchData}>
                            <Ionicons name="refresh" size={20} color="white" />
                        </TouchableOpacity>
                    </View>
                    
                    <View style={styles.filterContainer}>
                        {['attendance', 'work'].map((key) => (
                            <TouchableOpacity 
                                key={key} 
                                onPress={() => setSelectedChart(key)} 
                                style={[styles.filterButton, selectedChart === key && styles.selectedFilterButton]}
                            >
                                <Text style={[styles.filterText, selectedChart === key && styles.selectedFilterText]}>
                                    {key.charAt(0).toUpperCase() + key.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </SafeAreaView>
            </LinearGradient>
            
            <View style={styles.content}>
                {renderChartGroup()}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        paddingBottom: 25,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    backButton: {
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 12,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: 'white',
    },
    filterContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        marginTop: 10,
    },
    filterButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 14,
        marginRight: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    selectedFilterButton: {
        backgroundColor: 'white',
        borderColor: 'white',
    },
    filterText: {
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '700',
        fontSize: 14,
    },
    selectedFilterText: {
        color: '#007bb0',
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    chartTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 15,
    },
    chartStyle: {
        marginVertical: 8,
        borderRadius: 16,
    },
    centerBox: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    loadingText: {
        marginTop: 15,
        color: '#64748b',
        fontWeight: '500',
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#334155',
        marginTop: 20,
    },
    emptySubText: {
        fontSize: 14,
        color: '#94a3b8',
        textAlign: 'center',
        marginTop: 8,
        lineHeight: 20,
    },
});

export default EmployeeDataAnalyze;

