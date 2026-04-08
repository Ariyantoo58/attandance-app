import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Image, Animated, Easing, Dimensions, Platform } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiService } from '../../services/api';
import { Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function FaceRecognitionScreen() {
    const navigation = useNavigation();
    const route = useRoute();
    const { user } = useSelector(state => state.auth);
    const { employeeId } = route.params || {};
    const [permission, requestPermission] = useCameraPermissions();
    const [locationPermission, setLocationPermission] = useState(null);
    const [photos, setPhotos] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const cameraRef = useRef(null);
    const scanAnim = useRef(new Animated.Value(0)).current;
    const guideAnim = useRef(new Animated.Value(0)).current;

    // Result Modal State
    const [resultVisible, setResultVisible] = useState(false);
    const [resultData, setResultData] = useState({ success: false, title: '', message: '', name: '' });

    useEffect(() => {
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            setLocationPermission(status === 'granted');
        })();
    }, []);

    useEffect(() => {
        const guideLoop = Animated.loop(
            Animated.sequence([
                Animated.timing(guideAnim, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.timing(guideAnim, { toValue: 0, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
            ])
        );
        guideLoop.start();
        return () => guideLoop.stop();
    }, [guideAnim, photos.length]);

    const getGuideTransform = () => {
        const step = photos.length;
        if (mode === 'attendance' || step === 0) {
            return [{ scale: guideAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] }) }];
        }
        if (step === 1) { 
            return [{ rotateY: guideAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '50deg'] }) }];
        }
        if (step === 2) { 
            return [{ rotateY: guideAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-50deg'] }) }];
        }
        if (step === 3) { 
            return [{ rotateX: guideAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] }) }];
        }
        if (step === 4) { 
            return [{ rotateX: guideAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-45deg'] }) }];
        }
        return [];
    };

    useEffect(() => {
        const loopAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(scanAnim, {
                    toValue: 1,
                    duration: 1500,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
                Animated.timing(scanAnim, {
                    toValue: 0,
                    duration: 1500,
                    easing: Easing.linear,
                    useNativeDriver: true,
                })
            ])
        );
        loopAnimation.start();
        return () => loopAnimation.stop();
    }, [scanAnim]);

    const scannerTranslateY = scanAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 280]
    });

    const mode = route.params?.mode || 'attendance';
    const MAX_TAKES = mode === 'registration' ? 5 : 1;

    const registrationDirections = [
        "Lurus menghadap ke depan",
        "Tengok sedikit ke kanan",
        "Tengok sedikit ke kiri",
        "Sedikit mendongak ke atas",
        "Sedikit menunduk ke bawah"
    ];

    const getDirectionText = () => {
        if (photos.length >= MAX_TAKES) return "Memproses data wajah...";
        if (mode === 'attendance') return "Mohon posisikan wajah lurus ke kamera";
        return `Posisi ${photos.length + 1}/5: ${registrationDirections[photos.length]}`;
    };

    if (!permission) {
        return <View style={styles.center}><ActivityIndicator size="large" color="#3B82F6" /></View>;
    }

    if (!permission.granted) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.permissionContent}>
                    <Ionicons name="camera-outline" size={80} color="#3B82F6" />
                    <Text style={styles.permissionTitle}>Akses Kamera</Text>
                    <Text style={styles.permissionMessage}>Kami memerlukan izin kamera untuk fitur pengenalan wajah.</Text>
                    <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
                        <Text style={styles.permissionText}>Berikan Izin</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const takePicture = async () => {
        if (cameraRef.current && photos.length < MAX_TAKES && !isProcessing) {
            try {
                const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
                const newPhotos = [...photos, photo.uri];
                setPhotos(newPhotos);

                if (newPhotos.length === MAX_TAKES) {
                    processPhotos(newPhotos);
                }
            } catch (error) {
                Alert.alert("Error", "Gagal mengambil gambar.");
            }
        }
    };

    const getDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371e3; // metres
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat1 * (Math.PI / 180)) *
            Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const processPhotos = async (capturedPhotos) => {
        setIsProcessing(true);
        try {
            if (mode === 'registration') {
                let successCount = 0;
                let lastErrorMessage = "Wajah tidak terdeteksi dengan jelas.";
                
                for (let uri of capturedPhotos) {
                    const formData = new FormData();
                    formData.append('file', {
                        uri: uri,
                        name: 'photo.jpg',
                        type: 'image/jpeg',
                    });
                    formData.append('employeeId', employeeId || user?.user?.employeeId || user?.user?.id);
                    
                    const data = await apiService.registerFace(formData);
                    if (data.status === 'success') {
                        successCount++;
                    } else {
                        lastErrorMessage = data.message || lastErrorMessage;
                        if (lastErrorMessage.includes("sudah terdaftar")) {
                            Alert.alert("Registrasi Ditolak", lastErrorMessage);
                            setIsProcessing(false);
                            setPhotos([]);
                            return;
                        }
                    }
                }
                
                if (successCount > 0) {
                    setResultData({
                        success: true,
                        title: 'Registrasi Sukses!',
                        message: 'Data wajah Anda telah berhasil didaftarkan ke sistem.',
                        name: user?.user?.name
                    });
                    setResultVisible(true);
                } else {
                    setResultData({
                        success: false,
                        title: 'Registrasi Gagal',
                        message: lastErrorMessage,
                    });
                    setResultVisible(true);
                }
            } else {
                // Get Location First
                let latitude = null;
                let longitude = null;
                try {
                    const location = await Location.getCurrentPositionAsync({ 
                        accuracy: Location.Accuracy.High 
                    });
                    latitude = location.coords.latitude;
                    longitude = location.coords.longitude;
                } catch (locError) {
                    setResultData({
                        success: false,
                        title: 'Error Lokasi',
                        message: 'Gagal mendapatkan lokasi GPS. Pastikan izin lokasi diberikan dan GPS aktif.',
                    });
                    setResultVisible(true);
                    setIsProcessing(false);
                    setPhotos([]);
                    return;
                }

                // Check Geofence if branch is assigned
                const employeeProfile = user?.user?.employee || user?.user || {};
                const branch = employeeProfile.branch;

                if (branch && branch.latitude && branch.longitude) {
                    const distance = getDistance(
                        latitude,
                        longitude,
                        branch.latitude,
                        branch.longitude
                    );

                    if (distance > (branch.radius || 50)) {
                        setResultData({
                            success: false,
                            title: 'Di Luar Jangkauan',
                            message: `Anda berada ${Math.round(distance)}m dari lokasi kantor. Maksimal jarak yang diizinkan adalah ${branch.radius || 50}m.`,
                        });
                        setResultVisible(true);
                        setIsProcessing(false);
                        setPhotos([]);
                        return;
                    }
                }

                const formData = new FormData();
                formData.append('file', {
                    uri: capturedPhotos[0],
                    name: 'photo.jpg',
                    type: 'image/jpeg',
                });
                const currentEmployeeId = user?.user?.employeeId || user?.user?.id;
                if (currentEmployeeId) formData.append('employeeId', currentEmployeeId);

                if (latitude && longitude) {
                    formData.append('latitude', latitude.toString());
                    formData.append('longitude', longitude.toString());
                }

                const data = await apiService.recognizeFace(formData);
                if (data.recognized) {
                    setResultData({
                        success: true,
                        title: 'Berhasil!',
                        message: data.message || `Presensi Anda telah berhasil dicatat pada ${new Date().toLocaleTimeString()}.`,
                        name: data.name
                    });
                } else {
                    setResultData({
                        success: false,
                        title: 'Gagal!',
                        message: data.message || "Wajah tidak dikenali atau kondisi tidak terpenuhi.",
                    });
                }
                setResultVisible(true);
            }
        } catch (error) {
            console.error("API Error:", error);
            setResultData({
                success: false,
                title: 'Koneksi Gagal',
                message: 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.',
            });
            setResultVisible(true);
        } finally {
            setIsProcessing(false);
            setPhotos([]);
        }
    };


    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeHeader}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerAction}>
                        <Ionicons name="close" size={28} color="#1F2937" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Face Identity</Text>
                    <View style={styles.headerAction} />
                </View>
            </SafeAreaView>

            <View style={styles.cameraFrame}>
                <CameraView 
                    style={StyleSheet.absoluteFill} 
                    facing="front" 
                    ref={cameraRef}
                />
                
                <View style={styles.scanOverlay}>
                    <View style={styles.scanBox}>
                        <Animated.View style={[styles.scanLine, { transform: [{ translateY: scannerTranslateY }] }]} />
                    </View>
                    
                    {photos.length < MAX_TAKES && !isProcessing && (
                        <Animated.View style={[styles.centerDirectionOverlay, { transform: getGuideTransform() }]}>
                            <Ionicons name="scan-outline" size={200} color="rgba(255, 255, 255, 0.4)" />
                        </Animated.View>
                    )}
                </View>

                <View style={styles.instructionBanner}>
                     <Text style={styles.instructionText}>{getDirectionText()}</Text>
                </View>

                {isProcessing && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color="#ffffff" />
                        <Text style={styles.loadingText}>Menganalisa...</Text>
                    </View>
                )}
            </View>

            <View style={styles.controlsContainer}>
                <View style={styles.progressRow}>
                    {[...Array(MAX_TAKES)].map((_, index) => (
                        <View 
                            key={index} 
                            style={[
                                styles.progressSegment, 
                                { backgroundColor: index < photos.length ? '#3B82F6' : '#E5E7EB' }
                            ]} 
                        />
                    ))}
                </View>

                <View style={styles.shutterRow}>
                    <TouchableOpacity 
                        style={[
                            styles.shutterButton, 
                            (isProcessing || photos.length >= MAX_TAKES) && styles.shutterButtonDisabled
                        ]} 
                        disabled={isProcessing || photos.length >= MAX_TAKES}
                        onPress={takePicture}
                    >
                        <View style={styles.shutterInner} />
                    </TouchableOpacity>
                </View>

                <Text style={styles.hintText}>
                    {mode === 'registration' ? 'Ambil 5 sampel posisi wajah' : 'Posisikan wajah Anda di dalam kotak'}
                </Text>
            </View>

            {/* Modern Status Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={resultVisible}
                onRequestClose={() => setResultVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <LinearGradient
                            colors={resultData.success ? ['#F0FDF4', '#FFFFFF'] : ['#FEF2F2', '#FFFFFF']}
                            style={styles.modalGradient}
                        >
                            <View style={[styles.iconOuter, { backgroundColor: resultData.success ? '#DCFCE7' : '#FEE2E2' }]}>
                                <View style={[styles.iconInner, { backgroundColor: resultData.success ? '#10B981' : '#EF4444' }]}>
                                    <Ionicons 
                                        name={resultData.success ? "checkmark-sharp" : "close-sharp"} 
                                        size={40} 
                                        color="white" 
                                    />
                                </View>
                            </View>

                            <Text style={[styles.modalStatus, { color: resultData.success ? '#059669' : '#DC2626' }]}>
                                {resultData.success ? 'ABSENSI BERHASIL' : 'ABSENSI GAGAL'}
                            </Text>

                            <View style={styles.divider} />

                            <Text style={styles.modalTitle}>{resultData.title}</Text>
                            
                            {resultData.name && (
                                <View style={styles.userBadge}>
                                    <Ionicons name="person-circle" size={16} color="#64748B" />
                                    <Text style={styles.userNameText}>{resultData.name}</Text>
                                </View>
                            )}

                            <Text style={styles.modalMessage}>{resultData.message}</Text>

                            <TouchableOpacity 
                                style={[styles.modalButton, { backgroundColor: resultData.success ? '#10B981' : '#1E293B' }]}
                                onPress={() => {
                                    setResultVisible(false);
                                    if (resultData.success) navigation.goBack();
                                }}
                            >
                                <Text style={styles.modalButtonText}>
                                    {resultData.success ? 'Selesai' : 'Coba Lagi'}
                                </Text>
                            </TouchableOpacity>
                        </LinearGradient>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContent: {
        width: '100%',
        maxWidth: 340,
        backgroundColor: 'white',
        borderRadius: 32,
        overflow: 'hidden',
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
    },
    modalGradient: {
        padding: 30,
        alignItems: 'center',
    },
    iconOuter: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    iconInner: {
        width: 72,
        height: 72,
        borderRadius: 36,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    modalStatus: {
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 2,
        marginBottom: 8,
    },
    divider: {
        width: 40,
        height: 3,
        backgroundColor: '#E2E8F0',
        borderRadius: 2,
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#1E293B',
        textAlign: 'center',
        marginBottom: 12,
    },
    userBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 10,
        marginBottom: 16,
    },
    userNameText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#475569',
        marginLeft: 6,
    },
    modalMessage: {
        fontSize: 14,
        color: '#64748B',
        lineHeight: 22,
        textAlign: 'center',
        marginBottom: 30,
    },
    modalButton: {
        width: '100%',
        height: 56,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
    },
    modalButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    safeHeader: {
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    headerAction: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    cameraFrame: {
        flex: 1,
        margin: 20,
        borderRadius: 32,
        overflow: 'hidden',
        backgroundColor: '#000',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    scanOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.1)',
    },
    scanBox: {
        width: 280,
        height: 280,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.5)',
        borderRadius: 40,
        backgroundColor: 'transparent',
    },
    scanLine: {
        width: '100%',
        height: 2,
        backgroundColor: '#3B82F6',
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 10,
        elevation: 10,
    },
    centerDirectionOverlay: {
        position: 'absolute',
    },
    instructionBanner: {
        position: 'absolute',
        bottom: 30,
        left: 20,
        right: 20,
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: 12,
        borderRadius: 16,
        alignItems: 'center',
    },
    instructionText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#FFFFFF',
        marginTop: 12,
        fontSize: 15,
        fontWeight: '600',
    },
    controlsContainer: {
        paddingTop: 10,
        paddingBottom: Platform.OS === 'ios' ? 40 : 30,
        backgroundColor: '#F9FAFB',
        alignItems: 'center',
    },
    progressRow: {
        flexDirection: 'row',
        width: width * 0.6,
        height: 4,
        gap: 6,
        marginBottom: 25,
    },
    progressSegment: {
        flex: 1,
        borderRadius: 2,
    },
    shutterRow: {
        marginBottom: 15,
    },
    shutterButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        borderWidth: 4,
        borderColor: '#3B82F6',
        padding: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    shutterInner: {
        width: '100%',
        height: '100%',
        borderRadius: 36,
        backgroundColor: '#3B82F6',
    },
    shutterButtonDisabled: {
        borderColor: '#D1D5DB',
    },
    hintText: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '500',
    },
    permissionContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    permissionTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#111827',
        marginTop: 20,
        marginBottom: 10,
    },
    permissionMessage: {
        textAlign: 'center',
        fontSize: 16,
        color: '#6B7280',
        lineHeight: 24,
        marginBottom: 30,
    },
    permissionBtn: {
        backgroundColor: '#3B82F6',
        paddingHorizontal: 40,
        paddingVertical: 16,
        borderRadius: 16,
        elevation: 4,
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    permissionText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
});
