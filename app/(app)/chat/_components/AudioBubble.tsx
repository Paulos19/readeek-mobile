import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, PanResponder } from 'react-native';
import { Audio } from 'expo-av';
import { Play, Pause } from 'lucide-react-native';

interface AudioBubbleProps {
  uri: string;
  isMe: boolean;
  tintColor: string;
}

export function AudioBubble({ uri, isMe, tintColor }: AudioBubbleProps) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState<number>(0);
  const [position, setPosition] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  // Largura da área da waveform para cálculo de toque (valor inicial estimado)
  const [waveformWidth, setWaveformWidth] = useState(0);

  // Gera alturas aleatórias para simular a onda sonora (apenas uma vez)
  const bars = useMemo(() => {
    return Array.from({ length: 30 }).map(() => Math.max(20, Math.random() * 100)); 
  }, []);

  useEffect(() => {
    return () => {
      if (sound) sound.unloadAsync();
    };
  }, [sound]);

  const loadSound = async () => {
    setIsLoading(true);
    try {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      const { sound: newSound, status } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: false },
        onPlaybackStatusUpdate
      );
      setSound(newSound);
      if (status.isLoaded) setDuration(status.durationMillis || 0);
    } catch (error) {
      console.log("Erro ao carregar áudio", error);
    } finally {
      setIsLoading(false);
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setPosition(status.positionMillis);
      setDuration(status.durationMillis || 0);
      setIsPlaying(status.isPlaying);
      if (status.didJustFinish) {
        setIsPlaying(false);
        setPosition(0);
      }
    }
  };

  const handlePlayPause = async () => {
    if (!sound) {
      await loadSound();
      // O useEffect abaixo iniciará o play assim que o som estiver pronto
      return; 
    }
    
    if (isPlaying) {
      await sound.pauseAsync();
    } else {
      if (position >= duration && duration > 0) {
        await sound.replayAsync();
      } else {
        await sound.playAsync();
      }
    }
  };

  // Auto-play ao carregar pela primeira vez após clique
  useEffect(() => {
    if (sound && !isPlaying && !isLoading && position === 0) {
        sound.playAsync();
    }
  }, [sound]);

  // --- LÓGICA DE SEEK (BARRAS) ---
  const handleSeek = async (x: number) => {
    if (!sound || duration === 0 || waveformWidth === 0) return;
    
    const percentage = Math.max(0, Math.min(1, x / waveformWidth));
    const newPosition = percentage * duration;
    
    setPosition(newPosition); // Atualiza visual instantaneamente
    await sound.setPositionAsync(newPosition);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => handleSeek(evt.nativeEvent.locationX),
      onPanResponderMove: (evt) => handleSeek(evt.nativeEvent.locationX),
    })
  ).current;

  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const activeColor = isMe ? '#ffffff' : tintColor; 
  const inactiveColor = isMe ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.2)'; 

  return (
    <View className="flex-row items-center w-64 py-2">
      {/* Botão Play/Pause */}
      <TouchableOpacity 
        onPress={handlePlayPause}
        disabled={isLoading}
        className="w-10 h-10 rounded-full items-center justify-center mr-3"
        style={{ backgroundColor: isMe ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)' }}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={activeColor} />
        ) : isPlaying ? (
          <Pause size={18} color={activeColor} fill={activeColor} />
        ) : (
          <Play size={18} color={activeColor} fill={activeColor} style={{ marginLeft: 2 }} />
        )}
      </TouchableOpacity>

      <View className="flex-1">
        {/* WAVEFORM VISUAL INTERATIVA */}
        <View 
            className="flex-row items-center justify-between h-8 mb-1"
            onLayout={(e) => setWaveformWidth(e.nativeEvent.layout.width)}
            {...panResponder.panHandlers}
        >
            {bars.map((heightPercent, index) => {
                const barProgress = (index / bars.length);
                const currentProgress = duration > 0 ? position / duration : 0;
                const isActive = barProgress <= currentProgress;

                return (
                    <View 
                        key={index}
                        style={{
                            width: 3, 
                            height: `${heightPercent}%`,
                            backgroundColor: isActive ? activeColor : inactiveColor,
                            borderRadius: 2,
                        }}
                    />
                );
            })}
        </View>

        {/* Tempo */}
        <Text style={{ color: isMe ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)', fontSize: 10, fontWeight: '600' }}>
            {formatTime(position)} / {formatTime(duration || 0)}
        </Text>
      </View>
    </View>
  );
}