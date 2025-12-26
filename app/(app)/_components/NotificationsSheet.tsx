import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, Dimensions, Image } from 'react-native';
import { X, Bell, ShoppingBag, MessageCircle, Info, Tag } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Notification } from '../../../lib/api';

interface NotificationsSheetProps {
  visible: boolean;
  notifications: Notification[];
  onClose: () => void;
  onMarkAsRead: (id?: string) => void;
  topOffset?: number; // Para ajustar a posição dependendo de onde é chamado
}

export function NotificationsSheet({ 
  visible, 
  notifications, 
  onClose, 
  onMarkAsRead,
  topOffset = 110 // Padrão para o Header
}: NotificationsSheetProps) {
  const router = useRouter();
  const screenHeight = Dimensions.get('window').height;

  if (!visible) return null;

  const handlePressNotification = (notif: Notification) => {
    if (!notif.read) onMarkAsRead(notif.id);
    if (notif.link) {
        onClose();
        setTimeout(() => router.push(notif.link as any), 300);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
        case 'SALE': return <ShoppingBag size={20} color="#10b981" />;
        case 'MESSAGE': return <MessageCircle size={20} color="#3b82f6" />;
        case 'ORDER': return <Tag size={20} color="#f97316" />;
        default: return <Info size={20} color="#fbbf24" />;
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity 
        style={{ flex: 1 }} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <TouchableOpacity 
            activeOpacity={1} 
            style={{ 
                position: 'absolute', 
                top: topOffset, 
                right: 20, 
                width: 320, 
                backgroundColor: '#18181b', // zinc-900
                borderRadius: 24,
                borderWidth: 1,
                borderColor: '#27272a', 
                maxHeight: screenHeight * 0.5,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.5,
                shadowRadius: 20,
                elevation: 10,
                zIndex: 50
            }}
        >
            {/* Header com Blur simulado */}
            <View className="flex-row justify-between items-center p-4 border-b border-zinc-800 bg-zinc-900/90 rounded-t-2xl">
                <View className="flex-row items-center gap-2">
                    <Bell size={16} color="#10b981" />
                    <Text className="text-white font-bold text-sm">Atualizações</Text>
                </View>
                <View className="flex-row gap-4 items-center">
                    {notifications.length > 0 && (
                        <TouchableOpacity onPress={() => onMarkAsRead()}>
                            <Text className="text-zinc-500 text-[10px] font-bold uppercase">Limpar</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Lista */}
            <ScrollView showsVerticalScrollIndicator={true} className="bg-zinc-900 rounded-b-2xl">
                {notifications.length === 0 ? (
                    <View className="p-8 items-center justify-center">
                        <Bell size={32} color="#27272a" />
                        <Text className="text-zinc-600 mt-2 text-xs font-medium">Nada de novo por aqui.</Text>
                    </View>
                ) : (
                    notifications.map((item) => (
                        <TouchableOpacity 
                            key={item.id}
                            onPress={() => handlePressNotification(item)}
                            className={`flex-row p-4 border-b border-zinc-800/50 active:bg-black/20 ${!item.read ? 'bg-emerald-500/5' : ''}`}
                        >
                            <View className="mr-3 mt-0.5 bg-zinc-800 p-2 rounded-full h-9 w-9 items-center justify-center">
                                {getIcon(item.type)}
                            </View>
                            <View className="flex-1">
                                <Text className={`text-sm mb-0.5 ${!item.read ? 'text-white font-bold' : 'text-zinc-400'}`}>
                                    {item.title}
                                </Text>
                                <Text className="text-zinc-500 text-xs leading-4 mb-1.5" numberOfLines={2}>
                                    {item.message}
                                </Text>
                                <Text className="text-zinc-700 text-[10px] font-medium">
                                    {new Date(item.createdAt).toLocaleDateString()}
                                </Text>
                            </View>
                            {!item.read && (
                                <View className="justify-center pl-2">
                                    <View className="w-2 h-2 rounded-full bg-emerald-500" />
                                </View>
                            )}
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}