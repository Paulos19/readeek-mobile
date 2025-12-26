import React from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';
import { FileText, Download, Image as ImageIcon, Music, Video, File, FileCode } from 'lucide-react-native';

interface FileBubbleProps {
  fileName: string;
  fileSize?: number;
  url: string;
  isMe: boolean;
}

export function FileBubble({ fileName, fileSize, url, isMe }: FileBubbleProps) {
  
  const formatSize = (bytes?: number) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  // Helper para ícones baseados na extensão
  const getFileIcon = () => {
    const ext = fileName?.split('.').pop()?.toLowerCase();
    if (['pdf'].includes(ext || '')) return <FileText size={20} color="#ef4444" />; // Vermelho
    if (['doc', 'docx', 'txt'].includes(ext || '')) return <FileText size={20} color="#3b82f6" />; // Azul
    if (['xls', 'xlsx'].includes(ext || '')) return <FileText size={20} color="#10b981" />; // Verde
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext || '')) return <ImageIcon size={20} color="#a855f7" />; // Roxo
    if (['mp3', 'wav', 'm4a'].includes(ext || '')) return <Music size={20} color="#ec4899" />; // Rosa
    if (['mp4', 'mov', 'avi'].includes(ext || '')) return <Video size={20} color="#f97316" />; // Laranja
    if (['zip', 'rar'].includes(ext || '')) return <FileCode size={20} color="#fbbf24" />; // Amarelo
    return <File size={20} color="#94a3b8" />; // Cinza padrão
  };

  const getExtension = () => fileName?.split('.').pop()?.toUpperCase() || 'ARQUIVO';

  return (
    <TouchableOpacity 
      activeOpacity={0.7}
      onPress={() => Linking.openURL(url)}
      className={`flex-row items-center p-2 rounded-xl border ${
        isMe 
          ? 'bg-black/20 border-white/10' // Fundo mais escuro no meu balão (verde)
          : 'bg-black/20 border-white/5'  // Fundo mais escuro no balão dele (cinza)
      } w-full max-w-[240px] mt-1 mb-1`}
    >
      {/* Ícone com Fundo Branco para destaque */}
      <View className="w-10 h-10 rounded-lg bg-zinc-100 items-center justify-center mr-3 shadow-sm">
        {getFileIcon()}
      </View>
      
      {/* Informações do Arquivo */}
      <View className="flex-1 mr-2 justify-center">
        <Text numberOfLines={1} className="font-bold text-sm text-white leading-tight">
          {fileName || 'Documento'}
        </Text>
        <Text className="text-[10px] mt-0.5 font-medium text-white/70">
          {formatSize(fileSize)} • {getExtension()}
        </Text>
      </View>

      {/* Ícone de Download discreto */}
      <View className="p-1.5 rounded-full bg-white/10">
        <Download size={14} color="white" />
      </View>
    </TouchableOpacity>
  );
}