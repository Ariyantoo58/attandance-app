import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    Dimensions,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import MapView, { Marker, Circle } from 'react-native-maps';
import * as Location from 'expo-location';
import { apiService } from '../../../services/api';

const { width, height } = Dimensions.get('window');

const BranchAddEdit = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const branch = route.params?.branch;
    const isEdit = !!branch;

    const [name, setName] = useState(branch?.name || '');
    const [address, setAddress] = useState(branch?.address || '');
    const [latitude, setLatitude] = useState(branch?.latitude?.toString() || '-6.2088');
    const [longitude, setLongitude] = useState(branch?.longitude?.toString() || '106.8456');
    const [radius, setRadius] = useState(branch?.radius?.toString() || '50');
    const [loading, setLoading] = useState(false);
    const [mapRegion, setMapRegion] = useState({
        latitude: branch?.latitude || -6.2088,
        longitude: branch?.longitude || 106.8456,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
    });

    useEffect(() => {
        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);
        if (!isNaN(lat) && !isNaN(lng)) {
            setMapRegion(prev => ({
                ...prev,
                latitude: lat,
                longitude: lng,
            }));
        }
    }, [latitude, longitude]);

    const getCurrentLocation = async () => {
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Akses lokasi diperlukan untuk mengambil koordinat saat ini.');
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            setLatitude(location.coords.latitude.toString());
            setLongitude(location.coords.longitude.toString());
        } catch (error) {
            Alert.alert('Error', 'Gagal mengambil lokasi saat ini.');
        }
    };

    const handleSave = async () => {
        if (!name || !latitude || !longitude || !radius) {
            Alert.alert('Error', 'Mohon lengkapi semua data wajib.');
            return;
        }

        setLoading(true);
        try {
            const data = {
                name,
                address,
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
                radius: parseInt(radius),
            };

            if (isEdit) {
                await apiService.updateBranch(branch.id, data);
                Alert.alert('Sukses', 'Data cabang berhasil diperbarui.');
            } else {
                await apiService.createBranch(data);
                Alert.alert('Sukses', 'Cabang baru berhasil didaftarkan.');
            }
            navigation.goBack();
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Gagal menyimpan data cabang.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('BranchList')} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={styles.title}>{isEdit ? 'Edit Cabang' : 'Cabang Baru'}</Text>
                <TouchableOpacity 
                    onPress={handleSave} 
                    disabled={loading} 
                    style={[styles.saveBtn, loading && { opacity: 0.7 }]}
                >
                    {loading ? <ActivityIndicator size="small" color="white" /> : <Text style={styles.saveBtnText}>Simpan</Text>}
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Informasi Cabang</Text>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Nama Cabang *</Text>
                            <TextInput 
                                style={styles.input}
                                value={name}
                                onChangeText={setName}
                                placeholder="Contoh: Kantor Pusat Jakarta"
                            />
                        </View>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Alamat Lengkap</Text>
                            <TextInput 
                                style={[styles.input, styles.textArea]}
                                value={address}
                                onChangeText={setAddress}
                                placeholder="Alamat lengkap lokasi..."
                                multiline
                                numberOfLines={3}
                            />
                        </View>
                    </View>

                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Lokasi & Geofence</Text>
                            <TouchableOpacity onPress={getCurrentLocation} style={styles.locationBtn}>
                                <Ionicons name="locate" size={16} color="#2563EB" />
                                <Text style={styles.locationBtnText}>Lokasi Saya</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                                <Text style={styles.label}>Latitude *</Text>
                                <TextInput 
                                    style={styles.input}
                                    value={latitude}
                                    onChangeText={setLatitude}
                                    keyboardType="numeric"
                                    placeholder="-6.xxx"
                                />
                            </View>
                            <View style={[styles.inputGroup, { flex: 1 }]}>
                                <Text style={styles.label}>Longitude *</Text>
                                <TextInput 
                                    style={styles.input}
                                    value={longitude}
                                    onChangeText={setLongitude}
                                    keyboardType="numeric"
                                    placeholder="106.xxx"
                                />
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Radius Absensi (Meter) *</Text>
                            <View style={styles.radiusInputContainer}>
                                <TextInput 
                                    style={[styles.input, { flex: 1 }]}
                                    value={radius}
                                    onChangeText={setRadius}
                                    keyboardType="numeric"
                                    placeholder="50"
                                />
                                <Text style={styles.unitText}>Meter</Text>
                            </View>
                            <Text style={styles.hintText}>Jarak maksimum karyawan bisa melakukan absen dari titik pusat.</Text>
                        </View>

                        <View style={styles.mapContainer}>
                            <MapView
                                style={styles.map}
                                region={mapRegion}
                                onRegionChangeComplete={setMapRegion}
                            >
                                <Marker 
                                    coordinate={{
                                        latitude: parseFloat(latitude) || 0,
                                        longitude: parseFloat(longitude) || 0,
                                    }}
                                    title={name || "Lokasi Cabang"}
                                />
                                <Circle 
                                    center={{
                                        latitude: parseFloat(latitude) || 0,
                                        longitude: parseFloat(longitude) || 0,
                                    }}
                                    radius={parseInt(radius) || 0}
                                    strokeColor="rgba(37, 99, 235, 0.5)"
                                    fillColor="rgba(37, 99, 235, 0.1)"
                                />
                            </MapView>
                        </View>
                    </View>

                    <View style={{ height: 40 }} />
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 0 : 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F8FAFC',
        backgroundColor: 'white',
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#F8FAFC',
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 19,
        fontWeight: '900',
        color: '#1E293B',
        letterSpacing: -0.5,
    },
    saveBtn: {
        backgroundColor: '#2563EB',
        paddingHorizontal: 22,
        paddingVertical: 12,
        borderRadius: 14,
        elevation: 6,
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
    },
    saveBtnText: {
        color: 'white',
        fontWeight: '900',
        fontSize: 14,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    scrollContent: {
        padding: 24,
    },
    section: {
        marginBottom: 32,
        backgroundColor: 'white',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '900',
        color: '#1E293B',
        letterSpacing: -0.3,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 13,
        fontWeight: '800',
        color: '#64748B',
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    input: {
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        paddingHorizontal: 18,
        height: 56,
        fontSize: 15,
        color: '#1E293B',
        borderWidth: 1.5,
        borderColor: '#F1F5F9',
        fontWeight: '600',
    },
    textArea: {
        height: 100,
        paddingTop: 15,
        textAlignVertical: 'top',
    },
    row: {
        flexDirection: 'row',
    },
    locationBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 10,
    },
    locationBtnText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#2563EB',
        marginLeft: 6,
    },
    radiusInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    unitText: {
        marginLeft: 15,
        fontSize: 15,
        fontWeight: '800',
        color: '#64748B',
    },
    hintText: {
        fontSize: 12,
        color: '#94A3B8',
        marginTop: 8,
        fontWeight: '600',
        lineHeight: 18,
    },
    mapContainer: {
        height: 280,
        borderRadius: 24,
        overflow: 'hidden',
        marginTop: 20,
        borderWidth: 1.5,
        borderColor: '#F1F5F9',
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
});

export default BranchAddEdit;
