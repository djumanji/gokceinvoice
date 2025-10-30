import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Image, Alert } from 'react-native';
import {
  TextInput,
  Button,
  Text,
  Card,
  Checkbox,
  SegmentedButtons,
  Menu,
  IconButton,
  ActivityIndicator,
} from 'react-native-paper';
import DatePicker from 'react-native-date-picker';
import * as ImagePicker from 'expo-image-picker';
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from '@/constants/expenseCategories';
import { apiClient } from '@/services/api';
import type { Expense, CreateExpenseData } from '@/types';
import { format } from 'date-fns';

interface ExpenseFormProps {
  expense?: Expense;
  onSubmit: (data: CreateExpenseData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ExpenseForm({
  expense,
  onSubmit,
  onCancel,
  isLoading = false,
}: ExpenseFormProps) {
  const [description, setDescription] = useState(expense?.description || '');
  const [category, setCategory] = useState(expense?.category || 'other');
  const [amount, setAmount] = useState(expense?.amount || '');
  const [date, setDate] = useState(expense ? new Date(expense.date) : new Date());
  const [vendor, setVendor] = useState(expense?.vendor || '');
  const [paymentMethod, setPaymentMethod] = useState(expense?.paymentMethod || 'card');
  const [tags, setTags] = useState(expense?.tags || '');
  const [isTaxDeductible, setIsTaxDeductible] = useState(expense?.isTaxDeductible ?? true);
  const [receipt, setReceipt] = useState<string | null>(expense?.receipt || null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleImagePick = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please grant camera roll permissions to upload receipts.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleCameraCapture = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please grant camera permissions to capture receipts.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error capturing image:', error);
      Alert.alert('Error', 'Failed to capture image. Please try again.');
    }
  };

  const uploadImage = async (uri: string) => {
    setUploading(true);
    try {
      const response = await apiClient.uploadImage(uri);
      setReceipt(response.url);
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Upload Failed', 'Failed to upload receipt. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setReceipt(null);
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Validation Error', 'Please enter a description.');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid amount.');
      return;
    }

    const data: CreateExpenseData = {
      description,
      category,
      amount: String(amount),
      date: format(date, 'yyyy-MM-dd'),
      paymentMethod,
      vendor: vendor.trim() || undefined,
      isTaxDeductible,
      receipt: receipt || undefined,
      tags: tags.trim() || undefined,
    };

    await onSubmit(data);
  };

  const selectedCategory = EXPENSE_CATEGORIES.find(c => c.value === category);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.title}>
              {expense ? 'Edit Expense' : 'Add New Expense'}
            </Text>

            <TextInput
              label="Description *"
              value={description}
              onChangeText={setDescription}
              mode="outlined"
              style={styles.input}
              placeholder="e.g., Client lunch meeting"
            />

            <View style={styles.categoryContainer}>
              <Text variant="bodyMedium" style={styles.label}>
                Category *
              </Text>
              <Menu
                visible={showCategoryMenu}
                onDismiss={() => setShowCategoryMenu(false)}
                anchor={
                  <Button
                    mode="outlined"
                    onPress={() => setShowCategoryMenu(true)}
                    style={styles.categoryButton}
                  >
                    {selectedCategory ? `${selectedCategory.icon} ${selectedCategory.label}` : 'Select category'}
                  </Button>
                }
              >
                {EXPENSE_CATEGORIES.map((cat) => (
                  <Menu.Item
                    key={cat.value}
                    onPress={() => {
                      setCategory(cat.value);
                      setShowCategoryMenu(false);
                    }}
                    title={`${cat.icon} ${cat.label}`}
                  />
                ))}
              </Menu>
            </View>

            <TextInput
              label="Amount (EUR) *"
              value={amount}
              onChangeText={setAmount}
              mode="outlined"
              style={styles.input}
              keyboardType="decimal-pad"
              placeholder="0.00"
            />

            <View style={styles.dateContainer}>
              <Text variant="bodyMedium" style={styles.label}>
                Date *
              </Text>
              <Button
                mode="outlined"
                onPress={() => setShowDatePicker(true)}
                style={styles.dateButton}
              >
                {format(date, 'PPP')}
              </Button>
              <DatePicker
                modal
                open={showDatePicker}
                date={date}
                onConfirm={(selectedDate) => {
                  setDate(selectedDate);
                  setShowDatePicker(false);
                }}
                onCancel={() => setShowDatePicker(false)}
              />
            </View>

            <TextInput
              label="Vendor/Business"
              value={vendor}
              onChangeText={setVendor}
              mode="outlined"
              style={styles.input}
              placeholder="e.g., Starbucks"
            />

            <View style={styles.paymentContainer}>
              <Text variant="bodyMedium" style={styles.label}>
                Payment Method
              </Text>
              <SegmentedButtons
                value={paymentMethod}
                onValueChange={setPaymentMethod}
                buttons={PAYMENT_METHODS.map((method) => ({
                  value: method.value,
                  label: method.label,
                }))}
                style={styles.segmentedButtons}
              />
            </View>

            <TextInput
              label="Tags (comma separated)"
              value={tags}
              onChangeText={setTags}
              mode="outlined"
              style={styles.input}
              placeholder="e.g., client meeting, deductible"
            />

            <View style={styles.receiptContainer}>
              <Text variant="bodyMedium" style={styles.label}>
                Receipt/Invoice Image
              </Text>
              {receipt ? (
                <View style={styles.imageContainer}>
                  <Image source={{ uri: receipt }} style={styles.image} />
                  <IconButton
                    icon="delete"
                    size={20}
                    onPress={handleRemoveImage}
                    style={styles.deleteButton}
                  />
                </View>
              ) : (
                <View style={styles.imageButtons}>
                  <Button
                    mode="outlined"
                    onPress={handleImagePick}
                    disabled={uploading}
                    style={styles.imageButton}
                    icon="image"
                  >
                    {uploading ? 'Uploading...' : 'Gallery'}
                  </Button>
                  <Button
                    mode="outlined"
                    onPress={handleCameraCapture}
                    disabled={uploading}
                    style={styles.imageButton}
                    icon="camera"
                  >
                    Camera
                  </Button>
                </View>
              )}
              {uploading && <ActivityIndicator style={styles.uploadIndicator} />}
            </View>

            <View style={styles.checkboxContainer}>
              <Checkbox
                status={isTaxDeductible ? 'checked' : 'unchecked'}
                onPress={() => setIsTaxDeductible(!isTaxDeductible)}
              />
              <Text variant="bodyMedium" style={styles.checkboxLabel}>
                Tax Deductible
              </Text>
            </View>

            <View style={styles.buttonContainer}>
              <Button
                mode="outlined"
                onPress={onCancel}
                disabled={isLoading}
                style={styles.button}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleSubmit}
                disabled={isLoading}
                style={styles.button}
              >
                {isLoading ? 'Saving...' : 'Save Expense'}
              </Button>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    elevation: 4,
  },
  title: {
    marginBottom: 24,
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
    fontWeight: '500',
  },
  categoryContainer: {
    marginBottom: 16,
  },
  categoryButton: {
    marginTop: 8,
  },
  dateContainer: {
    marginBottom: 16,
  },
  dateButton: {
    marginTop: 8,
  },
  paymentContainer: {
    marginBottom: 16,
  },
  segmentedButtons: {
    marginTop: 8,
  },
  receiptContainer: {
    marginBottom: 16,
  },
  imageContainer: {
    position: 'relative',
    marginTop: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 200,
    resizeMode: 'contain',
    backgroundColor: '#f0f0f0',
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  imageButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  imageButton: {
    flex: 1,
  },
  uploadIndicator: {
    marginTop: 8,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkboxLabel: {
    marginLeft: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  button: {
    minWidth: 100,
  },
});

