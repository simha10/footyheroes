import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import FontAwesomeIcon from '@expo/vector-icons/FontAwesome';
import { useRoute } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { io } from 'socket.io-client';

const MatchChatScreen = () => {
  const route = useRoute();
  const { matchId } = route.params || {};
  const dispatch = useDispatch();

  const [message, setMessage] = useState('');
  const [typing, setTyping] = useState(false);

  const messagesEndRef = useRef();
  const inputRef = useRef(null);

  // Mock initial messages
  const initialMessages = [
    { id: 1, sender: 'John' , content:'Hey Team' },
    { id: 2, sender: 'Manager', content:'Soccer Stadium', timestamp: ` ${new Date().toLocaleDateString()} ${5}:00 PM`, role: 'manager' },
    { id: 2, sender: 'Coach', content:'Tomorrow Match played', timestamp:`${new Date().toLocaleDateString()}`, coachMarker: true },
      {
      id: 2,
      body: 'Tomorrow the game time is at Regents Park at 7:30 pm',
      type: 'notice',
      sender: 'Manager',
    },
  ];

  const messages = useSelector((state) => state.chat.messages) || initialMessages;
  const isLoading = useSelector((state) => state.chat.loading);

  // Socket connection setup
  useEffect(() => {
    const socket = io('ws://localhost:3000');
    socket.on('connect', () => {
      console.log('Socket connected for chat');
    });
    return () => { socket.close(); };
  }, []);

  useEffect(() => {
    // Focus input when mounted
    if (Platform.OS === 'web') {
      setTimeout(() => inputRef?.current?.focus?.(), 300);
    }
  }, []);

  useEffect(() => {
    messagesEndRef?.scrollToEnd?.();
  }, [messages]);

  const sendMessage = async () => {
    if (message.trim().length < 1) return;

    try {
      const mockMessage = {
        id: Date.now(),
        sender: 'You',
        body: message.trim(),
      };
      dispatch(addMessage(mockMessage));
      setMessage('');
    } catch (err) {
      console.error(err);
    }
  };

  const addMessage = (msg) => {
    setTyping(false);
    // Will be handled by Redux asynchronously
  };

  const renderMessage = ({ item, index }) => (
    <View 
      key={item.id || index}
      style={item.coachMarker ? styles.noticeBox : styles.rightMsg}
    >
      <View>
        <Text style={styles.timeText}>{item.timestamp}</Text>
      </View>
      <View style={[styles.msgText, { backgroundColor: item.coachMarker ? '#e8e6e6' : '#666' }]}>
        <Text style={styles.senderName}> {item.sender}</Text>
        <Text style={styles.msg}>{item.content || item.body}</Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : null}
      keyboardVerticalOffset={80}
    >
      <SafeAreaView style={styles.wrapper}>
        <FlatList
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item => (`msg_${item.id}`))}
          showsVerticalScrollIndicator={false}
          ref={messagesEndRef}
        />
        {typing && (
          <View style={styles.typingContainer}>
            <Text style={styles.typing1}>Someone is typing... </Text>
          </View>
        )}
        <View style={styles.inputBox}>
          <TextInput
            ref={inputRef}
            style={styles.inputText}
            value={message}
            onChangeText={t => setMessage(t)}
            placeholder="Type here..."
            multiline
          />
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.sendButton}
            onPress={sendMessage}
          >
            {isLoading 
              ? (<ActivityIndicator size="small" color="#fff" />) 
              : (<FontAwesomeIcon name="paper-plane" size={14} color="#fff" />)
            }
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  wrapper: { flex: 1 },
  rightMsg:{ marginBottom: 10 },
  timeText:{ fontSize:12, color:'#888', textAlign:'right'},
  msgText:{ borderRadius:10, padding:12, borderBottomEndRadius:4, borderBottomStartRadius:4},
  senderName:{ color:'#ffffff', fontSize:14, fontWeight:'bold' },
  msg:{ color:'#ffffff', marginTop:2 },
  noticeBox:{ marginBottom:8 },
  typingContainer: { alignItems:'center', paddingVertical:6 },
  typing1:{ color:'#999'},
  inputBox:{ 
    flexDirection:'row', 
    alignItems:'center', 
    width:'100%', 
    paddingHorizontal:12, 
    paddingVertical:8, 
    backgroundColor:'#fff'
  },
  inputText:{ 
    flex:1, 
    padding:(Platform.OS === 'web')?12:undefined,
    fontSize:14,
  },
  sendButton:{ 
    backgroundColor:'#824298', 
    borderRadius:20, 
    paddingVertical:8, 
    paddingHorizontal:12, 
    marginLeft:4, 
    alignItems:'center'
  },
});
