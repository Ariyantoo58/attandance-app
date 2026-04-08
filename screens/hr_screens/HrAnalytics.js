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
    StatusBar,
    RefreshControl,
    Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart, PieChart, BarChart } from 'react-native-chart-kit';
import { Ionicons, MaterialCommunityIcons, FontAwesome5, AntDesign } from '@expo/vector-icons';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { apiService } from '../../services/api';

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
        decimalPlaces: 0,
        color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
        labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
        style: {
            borderRadius: 16,
        },
        propsForDots: {
            r: "5",
            strokeWidth: "2",
            stroke: "#3B82F6"
        },
        barPercentage: 0.6,
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.centerBox}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={styles.loadingText}>Analyzing company data...</Text>
            </View>
        );
    }

    const kpiPieData = data ? [
        { name: 'Excellent', population: data.kpiDistribution.excellent, color: '#10B981', legendFontColor: '#64748B', legendFontSize: 12 },
        { name: 'Good', population: data.kpiDistribution.good, color: '#3B82F6', legendFontColor: '#64748B', legendFontSize: 12 },
        { name: 'Fair', population: data.kpiDistribution.fair, color: '#F59E0B', legendFontColor: '#64748B', legendFontSize: 12 },
        { name: 'Poor', population: data.kpiDistribution.poor, color: '#EF4444', legendFontColor: '#64748B', legendFontSize: 12 },
    ] : [];

    const attendanceLineData = {
        labels: data?.attendanceHistory.map(h => h.date.split('-')[2]) || [],
        datasets: [{
            data: data?.attendanceHistory.map(h => h.count) || [0],
            color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
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
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity 
                        onPress={() => navigation.dispatch(DrawerActions.openDrawer())} 
                        style={styles.headerButton}
                    >
                        <Ionicons name="menu" size={24} color="#1E293B" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Company Analytics</Text>
                    <TouchableOpacity onPress={onRefresh} style={styles.headerButton}>
                        <Ionicons name="refresh" size={20} color="#3B82F6" />
                    </TouchableOpacity>
                </View>

                <ScrollView 
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                >
                    <View style={styles.introSection}>
                        <Text style={styles.introTitle}>Performance Overviews</Text>
                        <Text style={styles.introSubtitle}>Visual insights into company productivity and metrics</Text>
                    </View>

                    {/* Summary Cards */}
                    <View style={styles.statsGrid}>
                        <View style={styles.statCard}>
                            <View style={[styles.statIcon, { backgroundColor: '#EFF6FF' }]}>
                                <Ionicons name="checkmark-circle" size={20} color="#3B82F6" />
                            </View>
                            <Text style={styles.statLabel}>Task Rate</Text>
                            <Text style={styles.statValue}>{data?.tasks.completionRate.toFixed(1)}%</Text>
                            <View style={styles.progressBar}>
                                <View style={[styles.progressFill, { width: `${data?.tasks.completionRate}%` }]} />
                            </View>
                        </View>

                        <View style={styles.statCard}>
                            <View style={[styles.statIcon, { backgroundColor: '#ECFDF5' }]}>
                                <Ionicons name="people" size={20} color="#10B981" />
                            </View>
                            <Text style={styles.statLabel}>Active Staff</Text>
                            <Text style={styles.statValue}>{data?.kpiDistribution.total}</Text>
                            <Text style={styles.statSub}>Total headcount</Text>
                        </View>
                    </View>

                    {/* KPI Distribution */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Performance Distribution</Text>
                        <Text style={styles.cardSub}>Monthly KPI rating across all staff</Text>
                        <PieChart
                            data={kpiPieData}
                            width={width - 50}
                            height={220}
                            chartConfig={chartConfig}
                            accessor="population"
                            backgroundColor="transparent"
                            paddingLeft="15"
                            absolute
                        />
                    </View>

                    {/* Attendance Trends */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Attendance Trend</Text>
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
                            <Text style={styles.cardTitle}>Top Achievehers</Text>
                            <MaterialCommunityIcons name="trophy" size={22} color="#F59E0B" />
                        </View>
                        <Text style={styles.cardSub}>Leading employees by individual KPI score</Text>
                        
                        <View style={styles.listContainer}>
                            {data?.topPerformers.length > 0 ? (
                                data?.topPerformers.map((performer, idx) => (
                                    <View key={performer.id} style={styles.listItem}>
                                        <View style={styles.rankBadge}>
                                            <Text style={styles.rankText}>{idx + 1}</Text>
                                        </View>
                                        <Image source={{ uri: performer.avatar }} style={styles.avatar} />
                                        <View style={styles.listInfo}>
                                            <Text style={styles.itemName}>{performer.name}</Text>
                                            <Text style={styles.itemSub}>{performer.designation}</Text>
                                        </View>
                                        <View style={styles.scoreBox}>
                                            <Text style={styles.scoreValue}>{performer.score.toFixed(0)}</Text>
                                            <Text style={styles.scoreLabel}>KPI</Text>
                                        </View>
                                    </View>
                                ))
                            ) : (
                                <View style={styles.emptyState}>
                                    <Text style={styles.emptyText}>No rankings available yet</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Departmental Comparison */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>Headcount by Department</Text>
                        <Text style={styles.cardSub}>Distribution of staff across organization</Text>
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
                                        <Text style={styles.deptSub}>{dept.count} Members</Text>
                                    </View>
                                    <View style={styles.deptScoreBox}>
                                        <Text style={styles.scoreLabel}>Avg KPI</Text>
                                        <Text style={[styles.deptScore, { color: dept.avgScore >= 70 ? '#10B981' : '#F59E0B' }]}>
                                            {dept.avgScore.toFixed(0)}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>

                    <View style={{ height: 60 }} />
                </ScrollView>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    safeArea: { flex: 1 },
    header: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 20,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9'
    },
    headerButton: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
    scrollContent: { padding: 20 },
    centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' },
    loadingText: { marginTop: 15, color: '#64748B', fontWeight: '600' },
    introSection: { marginBottom: 25 },
    introTitle: { fontSize: 24, fontWeight: '900', color: '#1E293B' },
    introSubtitle: { fontSize: 13, color: '#64748B', marginTop: 4, fontWeight: '500', lineHeight: 20 },
    statsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    statCard: { 
        flex: 0.48, 
        backgroundColor: 'white', 
        padding: 18, 
        borderRadius: 24, 
        borderWidth: 1, 
        borderColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 2
    },
    statIcon: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    statLabel: { fontSize: 12, fontWeight: '700', color: '#94A3B8' },
    statValue: { fontSize: 24, fontWeight: '900', color: '#1E293B', marginVertical: 4 },
    statSub: { fontSize: 11, color: '#64748B' },
    progressBar: { height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, marginTop: 8 },
    progressFill: { height: '100%', borderRadius: 3, backgroundColor: '#3B82F6' },
    card: { 
        backgroundColor: 'white', 
        borderRadius: 28, 
        padding: 20, 
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 3
    },
    cardTitle: { fontSize: 16, fontWeight: '800', color: '#1E293B', marginBottom: 4 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
    cardSub: { fontSize: 12, color: '#64748B', marginBottom: 15, lineHeight: 18 },
    chart: { marginVertical: 10, borderRadius: 16, marginLeft: -15 },
    listContainer: { marginTop: 10 },
    listItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
    rankBadge: { width: 24, height: 24, borderRadius: 8, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    rankText: { fontSize: 12, fontWeight: '800', color: '#64748B' },
    avatar: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#F1F5F9' },
    listInfo: { flex: 1, marginLeft: 12 },
    itemName: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
    itemSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
    scoreBox: { alignItems: 'flex-end', paddingLeft: 10 },
    scoreValue: { fontSize: 18, fontWeight: '900', color: '#3B82F6' },
    scoreLabel: { fontSize: 9, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase' },
    emptyState: { paddingVertical: 30, alignItems: 'center' },
    emptyText: { color: '#94A3B8', fontSize: 14, fontStyle: 'italic' },
    deptList: { marginTop: 15, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 5 },
    deptItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
    deptInfo: { flex: 1 },
    deptName: { fontSize: 15, fontWeight: '700', color: '#1E293B' },
    deptSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
    deptScoreBox: { alignItems: 'flex-end' },
    deptScore: { fontSize: 18, fontWeight: '900' }
});

export default HrAnalytics;
