import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Dimensions,
    SafeAreaView,
    StatusBar,
    RefreshControl
} from 'react-native';
import { LineChart, PieChart, BarChart } from 'react-native-chart-kit';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { apiService } from '../../services/api';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const HrAnalytics = () => {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [data, setData] = useState(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            const analytics = await apiService.getHrAnalytics();
            setData(analytics);
        } catch (error) {
            console.error('Failed to fetch HR analytics:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchData();
    }, []);

    const chartConfig = {
        backgroundGradientFrom: '#ffffff',
        backgroundGradientTo: '#ffffff',
        color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
        labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
        strokeWidth: 2,
        barPercentage: 0.6,
        useShadowColorFromDataset: false,
        decimalPlaces: 0,
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.centerBox}>
                <ActivityIndicator size="large" color="#2563EB" />
                <Text style={styles.loadingText}>Analyzing company data...</Text>
            </View>
        );
    }

    const kpiPieData = data ? [
        { name: 'Excellent', population: data.kpiDistribution.excellent, color: '#10B981', legendFontColor: '#475569', legendFontSize: 12 },
        { name: 'Good', population: data.kpiDistribution.good, color: '#3B82F6', legendFontColor: '#475569', legendFontSize: 12 },
        { name: 'Fair', population: data.kpiDistribution.fair, color: '#F59E0B', legendFontColor: '#475569', legendFontSize: 12 },
        { name: 'Poor', population: data.kpiDistribution.poor, color: '#EF4444', legendFontColor: '#475569', legendFontSize: 12 },
    ] : [];

    const attendanceLineData = {
        labels: data?.attendanceHistory.map(h => h.date.split('-')[2]) || [],
        datasets: [{
            data: data?.attendanceHistory.map(h => h.count) || [0],
            color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
            strokeWidth: 3
        }]
    };

    const deptBarData = {
        labels: data?.deptStats.map(d => d.name.substring(0, 5)) || [],
        datasets: [{
            data: data?.deptStats.map(d => d.count) || [0]
        }]
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />
            <LinearGradient colors={['#1E293B', '#0F172A']} style={styles.header}>
                <View style={styles.headerContent}>
                    <TouchableOpacity 
                        onPress={() => navigation.dispatch(DrawerActions.openDrawer())} 
                        style={styles.backBtn}
                    >
                        <Ionicons name="menu" size={24} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Company Analytics</Text>
                    <TouchableOpacity onPress={onRefresh} style={styles.backBtn}>
                        <Ionicons name="refresh" size={20} color="white" />
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            <ScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                {/* Summary Cards */}
                <View style={styles.statsGrid}>
                    <View style={[styles.statCard, { borderLeftColor: '#3B82F6', borderLeftWidth: 4 }]}>
                        <Text style={styles.statLabel}>Task Completion</Text>
                        <Text style={styles.statValue}>{data?.tasks.completionRate.toFixed(1)}%</Text>
                        <View style={styles.miniProgress}>
                            <View style={[styles.miniFill, { width: `${data?.tasks.completionRate}%`, backgroundColor: '#3B82F6' }]} />
                        </View>
                    </View>
                    <View style={[styles.statCard, { borderLeftColor: '#10B981', borderLeftWidth: 4 }]}>
                        <Text style={styles.statLabel}>Active Employees</Text>
                        <Text style={styles.statValue}>{data?.kpiDistribution.total}</Text>
                        <Text style={styles.statSub}>Across all depts</Text>
                    </View>
                </View>

                {/* KPI Distribution */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Performance Distribution</Text>
                    <Text style={styles.cardSub}>Monthly KPI rating across all staff</Text>
                    <PieChart
                        data={kpiPieData}
                        width={width - 40}
                        height={200}
                        chartConfig={chartConfig}
                        accessor="population"
                        backgroundColor="transparent"
                        paddingLeft="15"
                        absolute
                    />
                </View>

                {/* Attendance Trends */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Daily Attendance Trend</Text>
                    <Text style={styles.cardSub}>Total check-ins over the last 7 days</Text>
                    <LineChart
                        data={attendanceLineData}
                        width={width - 40}
                        height={220}
                        chartConfig={chartConfig}
                        bezier
                        style={styles.chart}
                    />
                </View>

                {/* Top Performers */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>Top Employees of the month</Text>
                        <MaterialCommunityIcons name="trophy-variant" size={20} color="#F59E0B" />
                    </View>
                    <Text style={styles.cardSub}>Individual top achievers by KPI score</Text>
                    
                    <View style={styles.topPerformersList}>
                        {data?.topPerformers.length > 0 ? (
                            data?.topPerformers.map((performer, idx) => (
                                <View key={performer.id} style={styles.performerItem}>
                                    <View style={styles.performerRank}>
                                        <Text style={styles.rankText}>{idx + 1}</Text>
                                    </View>
                                    <Image source={{ uri: performer.avatar }} style={styles.performerAvatar} />
                                    <View style={styles.performerInfo}>
                                        <Text style={styles.performerName}>{performer.name}</Text>
                                        <Text style={styles.performerDept}>{performer.designation}</Text>
                                    </View>
                                    <View style={styles.performerScoreBox}>
                                        <Text style={styles.performerScore}>{performer.score.toFixed(0)}</Text>
                                        <Text style={styles.scoreLabel}>Idx</Text>
                                    </View>
                                </View>
                            ))
                        ) : (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyText}>No rankings available for this month</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Departmental Breakdown */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Headcount by Department</Text>
                    <BarChart
                        data={deptBarData}
                        width={width - 40}
                        height={220}
                        chartConfig={chartConfig}
                        style={styles.chart}
                        fromZero
                    />
                    
                    <View style={styles.deptList}>
                        {data?.deptStats.map((dept, idx) => (
                            <View key={idx} style={styles.deptItem}>
                                <View style={styles.deptInfo}>
                                    <Text style={styles.deptName}>{dept.name}</Text>
                                    <Text style={styles.deptCount}>{dept.count} Members</Text>
                                </View>
                                <View style={styles.deptScoreBox}>
                                    <Text style={styles.deptScoreLabel}>Avg KPI</Text>
                                    <Text style={[styles.deptScore, { color: dept.avgScore >= 70 ? '#10B981' : '#F59E0B' }]}>
                                        {dept.avgScore.toFixed(0)}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { paddingBottom: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
    headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10 },
    backBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12 },
    headerTitle: { fontSize: 20, fontWeight: '800', color: 'white' },
    scrollContent: { padding: 20 },
    centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 15, color: '#64748B', fontWeight: '600' },
    statsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    statCard: { flex: 0.48, backgroundColor: 'white', padding: 16, borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
    statLabel: { fontSize: 11, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase' },
    statValue: { fontSize: 22, fontWeight: '900', color: '#1E293B', marginVertical: 4 },
    statSub: { fontSize: 11, color: '#64748B' },
    miniProgress: { height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, marginTop: 8 },
    miniFill: { height: '100%', borderRadius: 2 },
    card: { backgroundColor: 'white', borderRadius: 24, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
    cardTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B', marginBottom: 4 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    cardSub: { fontSize: 12, color: '#64748B', marginBottom: 15 },
    chart: { marginVertical: 8, borderRadius: 16, marginLeft: -10 },
    topPerformersList: { marginTop: 10 },
    performerItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    performerRank: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    rankText: { fontSize: 12, fontWeight: '800', color: '#64748B' },
    performerAvatar: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F1F5F9' },
    performerInfo: { flex: 1, marginLeft: 12 },
    performerName: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
    performerDept: { fontSize: 11, color: '#64748B', marginTop: 1 },
    performerScoreBox: { alignItems: 'center', paddingLeft: 10 },
    performerScore: { fontSize: 16, fontWeight: '900', color: '#2563EB' },
    scoreLabel: { fontSize: 8, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase' },
    emptyState: { paddingVertical: 20, alignItems: 'center' },
    emptyText: { color: '#94A3B8', fontSize: 13, fontStyle: 'italic' },
    deptList: { marginTop: 15, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
    deptItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
    deptInfo: { flex: 1 },
    deptName: { fontSize: 14, fontWeight: '700', color: '#1E293B' },
    deptCount: { fontSize: 12, color: '#64748B', marginTop: 2 },
    deptScoreBox: { alignItems: 'flex-end' },
    deptScoreLabel: { fontSize: 10, color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase' },
    deptScore: { fontSize: 16, fontWeight: '900' }
});

export default HrAnalytics;
