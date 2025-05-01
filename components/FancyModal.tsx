import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Modal from 'react-native-modal';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '@/colors';

interface FancyModalProps {
  isVisible: boolean;
  onClose: () => void;
  title: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  children: React.ReactNode;
  buttonText?: string;
  onConfirm?: () => void;
  onBackdropPress?: () => void; 
}

const FancyModal = ({ isVisible, onClose, title, icon, children, buttonText = "Got it", onConfirm }: FancyModalProps) => {
  return (
    <Modal isVisible={isVisible} onBackdropPress={onClose}>
      <View style={styles.modalContainer}>
        {icon && <MaterialCommunityIcons name={icon} size={28} color={colors.primary} style={styles.icon} />}
        <Text style={styles.title}>{title}</Text>
        <View style={styles.body}>{children}</View>
        {onConfirm && (
          <Pressable style={styles.button} onPress={onConfirm}>
            <Text style={styles.buttonText}>{buttonText}</Text>
          </Pressable>
        )}
      </View>
    </Modal>
  );
};

export default FancyModal;

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  icon: {
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
  },
  body: {
    marginBottom: 16,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
});
