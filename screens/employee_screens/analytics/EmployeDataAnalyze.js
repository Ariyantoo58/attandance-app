import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Dimensions, StatusBar } from 'react-native';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { apiService } from '../../../services/api';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons, AntDesign, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import moment from 'moment';

const { width } = Dimensions.get('window');

const EmployeeDataAnalyze = () => {
    const navigation = useNavigation();
    const { user } = useSelector(state => state.auth);
    const employeeId = user?.user?.employeeId;

    const [selectedChart, setSelectedChart] = useState('attendance');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        present: 0,
        absent: 0,
        avgHours: 0,
        totalHours: 0
    });
    
    const [chartData, setChartData] = useState({
        pie: [],
        line: { labels: [], datasets: [{ data: [0] }] }
    });
    const [kpiData, setKpiData] = useState(null);

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
            processAnalytics(attendanceData);
            
            // Fetch KPI Data
            const month = new Date().getMonth() + 1;
            const year = new Date().getFullYear();
            const kpi = await apiService.getEmployeeKpi(employeeId, month, year);
            setKpiData(kpi);
        } catch (error) {
            console.error('Failed to fetch analytics data:', error);
        } finally {
            setLoading(false);
        }
    };

    const processAnalytics = (data) => {
        if (!data || data.length === 0) return;

        // 1. Calculate Stats
        const presentCount = data.length;
        const workingDaysInMonth = 22; 
        const absentCount = Math.max(0, workingDaysInMonth - presentCount);
        
        let totalH = 0;
        const hoursArray = data.map(item => {
            if (item.clockIn && item.clockOut) {
                const diff = (new Date(item.clockOut) - new Date(item.clockIn)) / (1000 * 60 * 60);
                totalH += diff;
                return parseFloat(diff.toFixed(1));
            }
            return 8; // Default
        });

        setStats({
            present: presentCount,
            absent: absentCount,
            totalHours: Math.round(totalH),
            avgHours: presentCount > 0 ? (totalH / presentCount).toFixed(1) : 0
        });

        // 2. Pie Chart (Donut style)
        const pieData = [
            { name: 'Hadir', population: presentCount, color: '#2563EB', legendFontColor: '#475569', legendFontSize: 12 },
            { name: 'Absen', population: absentCount, color: '#E2E8F0', legendFontColor: '#475569', legendFontSize: 12 },
        ];

        // 3. Line Chart (Recent 7 days)
        const recentEntries = [...data].reverse().slice(-7);
        const labels = recentEntries.map(item => moment(item.date).format('ddd'));
        const values = recentEntries.map(item => {
            if (item.clockIn && item.clockOut) {
                return (new Date(item.clockOut) - new Date(item.clockIn)) / (1000 * 60 * 60);
            }
            return 8;
        });

        setChartData({
            pie: pieData,
            line: {
                labels: labels,
                datasets: [{ 
                    data: values.length > 0 ? values : [0],
                    color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
                    strokeWidth: 3
                }]
            }
        });
    };

    const chartConfig = {
        backgroundGradientFrom: '#ffffff',
        backgroundGradientTo: '#ffffff',
        decimalPlaces: 1,
        color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
        labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
        style: { borderRadius: 16 },
        propsForDots: {
            r: '6',
            strokeWidth: '2',
            stroke: '#ffffff'
        },
        propsForBackgroundLines: {
            strokeDasharray: '', // solid background lines
            stroke: '#F1F5F9'
        }
    };

    const StatusCard = ({ title, value, icon, color, sub }) => (
        <View style={styles.statusCard}>
            <View style={[styles.iconBox, { backgroundColor: color + '15' }]}>
                <Ionicons name={icon} size={20} color={color} />
            </View>
            <View style={{ marginLeft: 12 }}>
                <Text style={styles.statusLabel}>{title}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                    <Text style={styles.statusValue}>{value}</Text>
                    {sub && <Text style={styles.statusSub}> {sub}</Text>}
                </View>
            </View>
        </View>
    );

    return (
        <View style={styles.mainContainer}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={['#2563EB', '#1D4ED8']} style={styles.header}>
                <SafeAreaView edges={['top']}>
                    <View style={styles.headerRow}>
                        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                            <AntDesign name="left" size={20} color="white" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>My Analytics</Text>
                        <TouchableOpacity onPress={fetchData} style={styles.backButton}>
                            <Ionicons name="refresh" size={20} color="white" />
                        </TouchableOpacity>
                    </View>
                    
                    <View style={{ height: 10 }} />
                </SafeAreaView>
            </LinearGradient>
            
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {loading ? (
                    <View style={styles.centerBox}>
                        <ActivityIndicator size="large" color="#2563EB" />
                        <Text style={styles.loadingText}>Menghitung performa Anda...</Text>
                    </View>
                ) : (
                    <>
                        {/* KPI Score Card */}
                        {kpiData && kpiData.stats && (
                            <View style={[styles.card, { backgroundColor: '#1E293B', borderColor: '#334155' }]}>
                                <View style={styles.cardHeader}>
                                    <View>
                                        <Text style={[styles.chartTitle, { color: 'white' }]}>Performance Index</Text>
                                        <Text style={{ color: '#94A3B8', fontSize: 12 }}>Period: {moment().format('MMMM YYYY')}</Text>
                                    </View>
                                    <View style={styles.kpiBadge}>
                                        <Text style={styles.kpiScore}>{kpiData.stats.overallScore?.toFixed(0) || 0}</Text>
                                    </View>
                                </View>
                                
                                <View style={styles.kpiMetrics}>
                                    <View style={styles.kpiMetric}>
                                        <Text style={styles.kpiMetricLabel}>Tasks</Text>
                                        <View style={styles.kpiBarBg}>
                                            <View style={[styles.kpiBarFill, { width: `${kpiData.stats.taskScore || 0}%`, backgroundColor: '#3B82F6' }]} />
                                        </View>
                                    </View>
                                    <View style={styles.kpiMetric}>
                                        <Text style={styles.kpiMetricLabel}>Attendance</Text>
                                        <View style={styles.kpiBarBg}>
                                            <View style={[styles.kpiBarFill, { width: `${kpiData.stats.attendanceScore || 0}%`, backgroundColor: '#10B981' }]} />
                                        </View>
                                    </View>
                                    <View style={styles.kpiMetric}>
                                        <Text style={styles.kpiMetricLabel}>Behavior</Text>
                                        <View style={styles.kpiBarBg}>
                                            <View style={[styles.kpiBarFill, { width: `${kpiData.stats.behavioralScore || 0}%`, backgroundColor: '#F59E0B' }]} />
                                        </View>
                                        {/* Behavior Metrics Breakdown */}
                                        {kpiData.stats.metrics && kpiData.stats.metrics.length > 0 && (
                                            <View style={styles.metricBreakdown}>
                                                {kpiData.stats.metrics.map((m, idx) => (
                                                    <View key={idx} style={styles.breakdownItem}>
                                                        <Text style={styles.breakdownName}>{m.name}</Text>
                                                        <Text style={styles.breakdownVal}>{m.score}%</Text>
                                                    </View>
                                                ))}
                                            </View>
                                        )}
                                    </View>
                                </View>
                            </View>
                        )}


                        <View style={styles.statsGrid}>
                            <View style={{ flex: 1, marginRight: 10 }}>
                                <StatusCard title="Kehadiran" value={stats.present} sub="Hari" icon="calendar" color="#2563EB" />
                                <StatusCard title="Rata-rata" value={stats.avgHours} sub="Jam" icon="time-outline" color="#F59E0B" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <StatusCard title="Absen / Off" value={stats.absent} sub="Hari" icon="close-circle-outline" color="#EF4444" />
                                <StatusCard title="Total Kerja" value={stats.totalHours} sub="Jam" icon="briefcase-outline" color="#10B981" />
                            </View>
                        </View>

                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.chartTitle}>Distribusi Kehadiran</Text>
                                <Ionicons name="information-circle-outline" size={18} color="#94A3B8" />
                            </View>
                            <PieChart
                                data={chartData.pie}
                                width={width - 60}
                                height={200}
                                chartConfig={chartConfig}
                                accessor="population"
                                backgroundColor="transparent"
                                paddingLeft="15"
                                absolute
                                hasLegend={true}
                            />
                        </View>

                        <View style={styles.card}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.chartTitle}>Tren Jam Kerja (7 Hari Terakhir)</Text>
                                <MaterialCommunityIcons name="trending-up" size={18} color="#10B981" />
                            </View>
                            <LineChart
                                data={chartData.line}
                                width={width - 50}
                                height={220}
                                chartConfig={chartConfig}
                                bezier
                                style={styles.chartStyle}
                                withHorizontalLabels={true}
                                withVerticalLabels={true}
                                withDots={true}
                                withShadow={true}
                                withInnerLines={false}
                                withOuterLines={false}
                            />
                        </View>

                        <View style={styles.infoBox}>
                            <Ionicons name="sparkles" size={20} color="#2563EB" />
                            <Text style={styles.infoText}>
                                Performa kehadiran Anda stabil. Pertahankan ritme kerja Anda untuk produktivitas maksimal.
                            </Text>
                        </View>
                    </>
                )}
                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    mainContainer: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { paddingBottom: 15, borderBottomLeftRadius: 36, borderBottomRightRadius: 36 },
    headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15 },
    backButton: { padding: 10, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 14 },
    headerTitle: { fontSize: 22, fontWeight: '900', color: 'white', letterSpacing: 0.5 },
    tabContainer: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 15 },
    tab: { paddingHorizontal: 22, paddingVertical: 10, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, marginRight: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    activeTab: { backgroundColor: 'white', borderColor: 'white' },
    tabText: { color: 'rgba(255,255,255,0.9)', fontWeight: '700', fontSize: 13 },
    activeTabText: { color: '#2563EB' },
    scrollContent: { padding: 20 },
    statsGrid: { flexDirection: 'row', marginBottom: 10 },
    statusCard: { backgroundColor: 'white', borderRadius: 20, padding: 15, marginBottom: 15, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
    iconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    statusLabel: { fontSize: 11, color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase' },
    statusValue: { fontSize: 18, fontWeight: '900', color: '#1E293B', marginTop: 2 },
    statusSub: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },
    card: { backgroundColor: 'white', borderRadius: 28, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 15, elevation: 3, borderWidth: 1, borderColor: '#F1F5F9' },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    chartTitle: { fontSize: 15, fontWeight: '800', color: '#1E293B' },
    chartStyle: { marginLeft: -15, marginTop: 10 },
    centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 100 },
    loadingText: { marginTop: 15, color: '#64748B', fontWeight: '600' },
    infoBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', padding: 20, borderRadius: 24, marginBottom: 20, borderWidth: 1, borderColor: '#DBEAFE' },
    infoText: { flex: 1, marginLeft: 15, fontSize: 13, color: '#1E40AF', lineHeight: 20, fontWeight: '600' },
    kpiBadge: { width: 50, height: 50, borderRadius: 15, backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center' },
    kpiScore: { color: 'white', fontSize: 22, fontWeight: '900' },
    kpiMetrics: { marginTop: 20 },
    kpiMetric: { marginBottom: 12 },
    kpiMetricLabel: { color: '#94A3B8', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', marginBottom: 6 },
    kpiBarBg: { height: 6, backgroundColor: '#334155', borderRadius: 3, overflow: 'hidden' },
    kpiBarFill: { height: '100%', borderRadius: 3 },
    metricBreakdown: { marginTop: 10, paddingLeft: 10, borderLeftWidth: 1, borderLeftColor: '#334155' },
    breakdownItem: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    breakdownName: { fontSize: 10, color: '#94A3B8', fontWeight: '500' },
    breakdownVal: { fontSize: 10, color: '#F59E0B', fontWeight: '700' },
});

export default EmployeeDataAnalyze;
