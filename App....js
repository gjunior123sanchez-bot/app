import React, { useState, useRef } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  StatusBar,
  Image,
  PanResponder,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Path } from 'react-native-svg';

const COLORS = {
  primary: '#2563EB',
  dark: '#0F172A',
  muted: '#64748B',
  border: '#CBD5E1',
  bg: '#F8FAFC',
  white: '#FFFFFF',
};

// ---------- Reusable components ----------
function Field({ label, value, onChangeText, secure, placeholder, keyboardType, maxLength }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        maxLength={maxLength}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        secureTextEntry={secure}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
}

function PrimaryButton({ title, onPress }) {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress} activeOpacity={0.85}>
      <Text style={styles.buttonText}>{title}</Text>
    </TouchableOpacity>
  );
}

function Header({ subtitle }) {
  return (
    <View style={styles.header}>
      <Text style={styles.logo}>IKONEK</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

// ---------- Helpers ----------
// Auto-formats typed digits as MM/DD/YYYY
function formatBirthday(text) {
  const digits = text.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

// Returns true only for a real, non-future date in MM/DD/YYYY format
function isValidBirthday(text) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text);
  if (!m) return false;
  const month = Number(m[1]);
  const day = Number(m[2]);
  const year = Number(m[3]);
  const d = new Date(year, month - 1, day);
  const realDate =
    d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day;
  return realDate && year >= 1900 && d <= new Date();
}

// Accepts 10-13 digits, optional leading +
function isValidPhone(text) {
  return /^\+?\d{10,13}$/.test(text.replace(/[\s-]/g, ''));
}

// ---------- Screens ----------
function SignInScreen({ users, go, onSuccess }) {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');

  const handleSignIn = () => {
    if (!name.trim() || !password) {
      Alert.alert('Missing info', 'Please enter your name and password.');
      return;
    }
    const user = users.find(
      (u) => u.name.toLowerCase() === name.trim().toLowerCase() && u.password === password
    );
    if (!user) {
      Alert.alert('Sign in failed', 'Incorrect name or password.');
      return;
    }
    onSuccess(user);
  };

  return (
    <>
      <Header subtitle="Sign in to continue" />
      <Field label="Name" value={name} onChangeText={setName} placeholder="Enter your name" />
      <Field
        label="Password"
        value={password}
        onChangeText={setPassword}
        secure
        placeholder="Enter your password"
      />
      <TouchableOpacity onPress={() => go('forgot')} style={styles.linkRight}>
        <Text style={styles.link}>Forgot password?</Text>
      </TouchableOpacity>
      <PrimaryButton title="Sign In" onPress={handleSignIn} />
      <View style={styles.row}>
        <Text style={styles.muted}>Don't have an account? </Text>
        <TouchableOpacity onPress={() => go('create')}>
          <Text style={styles.link}>Create account</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

function CreateAccountScreen({ users, setUsers, go }) {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [birthday, setBirthday] = useState('');
  const [phone, setPhone] = useState('');

  const handleCreate = () => {
    if (!name.trim() || !password || !confirm || !birthday || !phone.trim()) {
      Alert.alert('Missing info', 'Please fill in all fields.');
      return;
    }
    if (!isValidBirthday(birthday)) {
      Alert.alert('Invalid birthday', 'Enter a valid date as MM/DD/YYYY.');
      return;
    }
    if (!isValidPhone(phone)) {
      Alert.alert('Invalid number', 'Enter a valid cellphone number (10-13 digits).');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Mismatch', 'Passwords do not match.');
      return;
    }
    if (users.some((u) => u.name.toLowerCase() === name.trim().toLowerCase())) {
      Alert.alert('Name taken', 'That name is already registered.');
      return;
    }
    const cleanPhone = phone.replace(/[\s-]/g, '');
    if (users.some((u) => u.phone === cleanPhone)) {
      Alert.alert('Number in use', 'That cellphone number is already registered.');
      return;
    }
    setUsers([...users, { name: name.trim(), password, birthday, phone: cleanPhone }]);
    Alert.alert('Success', 'Account created! You can now sign in.');
    go('signin');
  };

  return (
    <>
      <Header subtitle="Create your account" />
      <Field label="Name" value={name} onChangeText={setName} placeholder="Choose a name" />
      <Field
        label="Password"
        value={password}
        onChangeText={setPassword}
        secure
        placeholder="At least 6 characters"
      />
      <Field
        label="Confirm Password"
        value={confirm}
        onChangeText={setConfirm}
        secure
        placeholder="Re-enter password"
      />
      <Field
        label="Birthday"
        value={birthday}
        onChangeText={(t) => setBirthday(formatBirthday(t))}
        keyboardType="number-pad"
        maxLength={10}
        placeholder="MM/DD/YYYY"
      />
      <Field
        label="Cellphone Number"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        maxLength={16}
        placeholder="e.g. 09171234567"
      />
      <PrimaryButton title="Create Account" onPress={handleCreate} />
      <View style={styles.row}>
        <Text style={styles.muted}>Already have an account? </Text>
        <TouchableOpacity onPress={() => go('signin')}>
          <Text style={styles.link}>Sign in</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

function ForgotPasswordScreen({ users, setUsers, go }) {
  const [name, setName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const handleReset = () => {
    if (!name.trim() || !newPassword || !confirm) {
      Alert.alert('Missing info', 'Please fill in all fields.');
      return;
    }
    const exists = users.some((u) => u.name.toLowerCase() === name.trim().toLowerCase());
    if (!exists) {
      Alert.alert('Not found', 'No account found with that name.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirm) {
      Alert.alert('Mismatch', 'Passwords do not match.');
      return;
    }
    setUsers(
      users.map((u) =>
        u.name.toLowerCase() === name.trim().toLowerCase() ? { ...u, password: newPassword } : u
      )
    );
    Alert.alert('Password reset', 'Your password has been updated.');
    go('signin');
  };

  return (
    <>
      <Header subtitle="Reset your password" />
      <Field label="Name" value={name} onChangeText={setName} placeholder="Enter your account name" />
      <Field
        label="New Password"
        value={newPassword}
        onChangeText={setNewPassword}
        secure
        placeholder="At least 6 characters"
      />
      <Field
        label="Confirm New Password"
        value={confirm}
        onChangeText={setConfirm}
        secure
        placeholder="Re-enter new password"
      />
      <PrimaryButton title="Reset Password" onPress={handleReset} />
      <TouchableOpacity onPress={() => go('signin')} style={styles.center}>
        <Text style={styles.link}>Back to sign in</Text>
      </TouchableOpacity>
    </>
  );
}

// Computes age from a MM/DD/YYYY birthday; returns '' if not available
function computeAge(birthday) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(birthday || '');
  if (!m) return '';
  const today = new Date();
  let age = today.getFullYear() - Number(m[3]);
  const beforeBirthday =
    today.getMonth() + 1 < Number(m[1]) ||
    (today.getMonth() + 1 === Number(m[1]) && today.getDate() < Number(m[2]));
  if (beforeBirthday) age -= 1;
  return age >= 0 ? String(age) : '';
}

function SignaturePad({ strokes, setStrokes, setScrollEnabled }) {
  const current = useRef('');
  const [live, setLive] = useState('');

  const finish = () => {
    setScrollEnabled(true);
    if (current.current) {
      const done = current.current;
      setStrokes((prev) => [...prev, done]);
    }
    current.current = '';
    setLive('');
  };

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => {
        setScrollEnabled(false);
        const { locationX: x, locationY: y } = e.nativeEvent;
        current.current = `M${x.toFixed(1)},${y.toFixed(1)} L${x.toFixed(1)},${y.toFixed(1)}`;
        setLive(current.current);
      },
      onPanResponderMove: (e) => {
        const { locationX: x, locationY: y } = e.nativeEvent;
        current.current += ` L${x.toFixed(1)},${y.toFixed(1)}`;
        setLive(current.current);
      },
      onPanResponderRelease: finish,
      onPanResponderTerminate: finish,
    })
  ).current;

  const pathProps = {
    stroke: COLORS.dark,
    strokeWidth: 2.5,
    fill: 'none',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  };

  return (
    <View style={styles.sigBox} {...responder.panHandlers}>
      <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
        {strokes.map((d, i) => (
          <Path key={i} d={d} {...pathProps} />
        ))}
        {live ? <Path d={live} {...pathProps} /> : null}
      </Svg>
      {strokes.length === 0 && !live && <Text style={styles.sigHint}>Sign here</Text>}
    </View>
  );
}

function PersonalDataScreen({ user, onSave, onBack, setScrollEnabled }) {
  const p = user.profile || {};
  const [fullName, setFullName] = useState(p.fullName ?? user.name);
  const [age, setAge] = useState(p.age ?? computeAge(user.birthday));
  const [sex, setSex] = useState(p.sex ?? '');
  const [address, setAddress] = useState(p.address ?? '');
  const [cellLeader, setCellLeader] = useState(p.cellLeader ?? '');
  const [strokes, setStrokes] = useState(p.signature ?? []);
  const [photo, setPhoto] = useState(p.photo ?? null);

  const pickFromGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Please allow photo library access.');
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!res.canceled) setPhoto(res.assets[0].uri);
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Please allow camera access.');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!res.canceled) setPhoto(res.assets[0].uri);
  };

  const handleSave = () => {
    if (!fullName.trim() || !age || !sex || !address.trim()) {
      Alert.alert('Missing info', 'Full name, age, sex, and address are required.');
      return;
    }
    const ageNum = Number(age);
    if (!/^\d{1,3}$/.test(age) || ageNum < 1 || ageNum > 120) {
      Alert.alert('Invalid age', 'Enter a valid age.');
      return;
    }
    onSave({
      fullName: fullName.trim(),
      age,
      sex,
      address: address.trim(),
      cellLeader: cellLeader.trim(),
      signature: strokes,
      photo,
    });
    Alert.alert('Saved', 'Your personal data has been saved.');
    onBack();
  };

  return (
    <>
      <Header subtitle="Personal Data" />

      <View style={styles.photoWrap}>
        {photo ? (
          <Image source={{ uri: photo }} style={styles.photo} />
        ) : (
          <View style={[styles.photo, styles.photoPlaceholder]}>
            <Text style={styles.muted}>No photo</Text>
          </View>
        )}
        <View style={styles.row}>
          <TouchableOpacity style={styles.smallBtn} onPress={pickFromGallery}>
            <Text style={styles.smallBtnText}>Gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.smallBtn} onPress={takePhoto}>
            <Text style={styles.smallBtnText}>Camera</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Field label="Full Name" value={fullName} onChangeText={setFullName} placeholder="Enter your full name" />
      <Field
        label="Age"
        value={age}
        onChangeText={(t) => setAge(t.replace(/\D/g, ''))}
        keyboardType="number-pad"
        maxLength={3}
        placeholder="Enter your age"
      />

      <View style={styles.fieldWrap}>
        <Text style={styles.label}>Sex</Text>
        <View style={styles.chipRow}>
          {['Male', 'Female'].map((opt) => (
            <TouchableOpacity
              key={opt}
              style={[styles.chip, sex === opt && styles.chipActive]}
              onPress={() => setSex(opt)}
            >
              <Text style={[styles.chipText, sex === opt && styles.chipTextActive]}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Field label="Address" value={address} onChangeText={setAddress} placeholder="Enter your address" />
      <Field label="Cell Leader" value={cellLeader} onChangeText={setCellLeader} placeholder="Enter your cell leader's name" />

      <View style={styles.fieldWrap}>
        <Text style={styles.label}>Signature</Text>
        <SignaturePad strokes={strokes} setStrokes={setStrokes} setScrollEnabled={setScrollEnabled} />
        <TouchableOpacity onPress={() => setStrokes([])} style={styles.linkRight}>
          <Text style={styles.link}>Clear signature</Text>
        </TouchableOpacity>
      </View>

      <PrimaryButton title="Save Personal Data" onPress={handleSave} />
      <TouchableOpacity onPress={onBack} style={styles.center}>
        <Text style={styles.link}>Back</Text>
      </TouchableOpacity>
    </>
  );
}

function HomeScreen({ user, onPersonal, onSignOut }) {
  const photo = user.profile && user.profile.photo;
  const displayName = (user.profile && user.profile.fullName) || user.name;
  return (
    <View style={styles.homeWrap}>
      {photo ? <Image source={{ uri: photo }} style={styles.avatar} /> : null}
      <Text style={styles.logo}>IKONEK</Text>
      <Text style={styles.welcome}>Welcome, {displayName}!</Text>
      <Text style={styles.muted}>You are signed in.</Text>
      <View style={{ height: 24 }} />
      <View style={styles.fullWidth}>
        <PrimaryButton title="Personal Data" onPress={onPersonal} />
        <PrimaryButton title="Sign Out" onPress={onSignOut} />
      </View>
    </View>
  );
}

// ---------- App ----------
export default function App() {
  const [screen, setScreen] = useState('signin'); // signin | create | forgot | home
  const [users, setUsers] = useState([]); // in-memory demo storage
  const [currentUser, setCurrentUser] = useState(null);
  const [scrollEnabled, setScrollEnabled] = useState(true);

  const saveProfile = (profile) => {
    const updated = { ...currentUser, profile };
    setUsers(users.map((u) => (u.name === currentUser.name ? updated : u)));
    setCurrentUser(updated);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          scrollEnabled={scrollEnabled}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {screen === 'signin' && (
            <SignInScreen
              users={users}
              go={setScreen}
              onSuccess={(u) => {
                setCurrentUser(u);
                setScreen('home');
              }}
            />
          )}
          {screen === 'create' && (
            <CreateAccountScreen users={users} setUsers={setUsers} go={setScreen} />
          )}
          {screen === 'forgot' && (
            <ForgotPasswordScreen users={users} setUsers={setUsers} go={setScreen} />
          )}
          {screen === 'personal' && (
            <PersonalDataScreen
              user={currentUser}
              onSave={saveProfile}
              onBack={() => setScreen('home')}
              setScrollEnabled={setScrollEnabled}
            />
          )}
          {screen === 'home' && (
            <HomeScreen
              user={currentUser}
              onPersonal={() => setScreen('personal')}
              onSignOut={() => {
                setCurrentUser(null);
                setScreen('signin');
              }}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 32 },
  logo: { fontSize: 40, fontWeight: '800', letterSpacing: 4, color: COLORS.primary },
  subtitle: { marginTop: 8, fontSize: 16, color: COLORS.muted },
  fieldWrap: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.dark, marginBottom: 6 },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.dark,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  row: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  center: { alignItems: 'center', marginTop: 24 },
  linkRight: { alignSelf: 'flex-end', marginBottom: 8 },
  link: { color: COLORS.primary, fontWeight: '600', fontSize: 14 },
  muted: { color: COLORS.muted, fontSize: 14 },
  homeWrap: { alignItems: 'center' },
  welcome: { fontSize: 22, fontWeight: '700', color: COLORS.dark, marginTop: 24, marginBottom: 4 },
  fullWidth: { alignSelf: 'stretch' },
  avatar: { width: 96, height: 96, borderRadius: 48, marginBottom: 16 },
  photoWrap: { alignItems: 'center', marginBottom: 16 },
  photo: { width: 120, height: 120, borderRadius: 60, marginBottom: 8 },
  photoPlaceholder: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallBtn: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 18,
    marginHorizontal: 6,
    marginTop: 0,
  },
  smallBtnText: { color: COLORS.primary, fontWeight: '600' },
  chipRow: { flexDirection: 'row' },
  chip: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginRight: 8,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { color: COLORS.dark, fontWeight: '600' },
  chipTextActive: { color: COLORS.white },
  sigBox: {
    height: 160,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  sigHint: { color: '#94A3B8', fontSize: 16 },
});
