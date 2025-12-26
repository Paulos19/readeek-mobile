import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { X, Bell, ShoppingBag, MessageCircle, Info, Check } from 'lucide-react-native';
import { Notification } from '../../../../lib/api';
import { useRouter } from 'expo-router';

interface NotificationsSheetProps {
  visible: boolean;
  notifications: Notification[];
  onClose: () => void;
  onMarkAsRead: (id?: string) => void;
}

export function NotificationsSheet({ visible, notifications, onClose, onMarkAsRead }: NotificationsSheetProps) {
  const router = useRouter();

  if (!visible) return null;

  const handlePressNotification = (notif: Notification) => {
    if (!notif.read) onMarkAsRead(notif.id);
    if (notif.link) {
        onClose();
        // Pequeno delay para o modal fechar suavemente antes de navegar
        setTimeout(() => router.push(notif.link as any), 300);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
        case 'SALE': return <ShoppingBag size={20} color="#10b981" />;
        case 'MESSAGE': return <MessageCircle size={20} color="#3b82f6" />;
        default: return <Info size={20} color="#fbbf24" />;
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity 
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <TouchableOpacity 
            activeOpacity={1} 
            style={{ 
                position: 'absolute', 
                top: 60, 
                right: 20, 
                width: 320, 
                backgroundColor: '#18181b', // zinc-900
                borderRadius: 16,
                borderWidth: 1,
                borderColor: '#27272a', // zinc-800
                maxHeight: 500,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 4.65,
                elevation: 8,
            }}
        >
            {/* Header */}
            <View className="flex-row justify-between items-center p-4 border-b border-zinc-800">
                <Text className="text-white font-bold text-lg">Notificações</Text>
                <View className="flex-row gap-4">
                    <TouchableOpacity onPress={() => onMarkAsRead()}>
                        <Text className="text-emerald-500 text-xs font-bold uppercase">Marcar lidas</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onClose}>
                        <X size={20} color="#a1a1aa" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Lista */}
            <ScrollView className="max-h-96">
                {notifications.length === 0 ? (
                    <View className="p-8 items-center">
                        <Bell size={32} color="#3f3f46" />
                        <Text className="text-zinc-500 mt-2 text-center">Nenhuma notificação nova</Text>
                    </View>
                ) : (
                    notifications.map((item) => (
                        <TouchableOpacity 
                            key={item.id}
                            onPress={() => handlePressNotification(item)}
                            className={`flex-row p-4 border-b border-zinc-800/50 ${!item.read ? 'bg-zinc-800/50' : ''}`}
                        >
                            <View className="mr-3 mt-1">
                                {getIcon(item.type)}
                            </View>
                            <View className="flex-1">
                                <Text className={`text-sm mb-1 ${!item.read ? 'text-white font-bold' : 'text-zinc-300'}`}>
                                    {item.title}
                                </Text>
                                <Text className="text-zinc-400 text-xs leading-4 mb-1">
                                    {item.message}
                                </Text>
                                <Text className="text-zinc-600 text-[10px]">
                                    {new Date(item.createdAt).toLocaleDateString()}
                                </Text>
                            </View>
                            {!item.read && (
                                <View className="w-2 h-2 rounded-full bg-emerald-500 mt-2" />
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