// App.js - Enhanced Double Assistant with Smart Conversation Understanding
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Vibration,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DoubleAssistant = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [currentTasks, setCurrentTasks] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [userName, setUserName] = useState('');
  const [isSetup, setIsSetup] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [conversationMode, setConversationMode] = useState('normal'); // 'normal', 'task-adding', 'setup'
  const [alarms, setAlarms] = useState([]);
  const scrollViewRef = useRef(null);

  // Load data when app starts
  useEffect(() => {
    loadData();
    checkDailyReminder();
  }, []);

  // Initialize Double
  useEffect(() => {
    if (!isSetup && userName === '') {
      setConversationMode('setup');
      addMessage("Hello! I'm Double, your personal AI assistant for growth and productivity! 🚀", 'double');
      addMessage("What's your name? I'd love to get to know you better!", 'double');
    }
  }, [isSetup]);

  // Daily reminder check
  const checkDailyReminder = () => {
    const now = new Date();
    const hours = now.getHours();
    
    // Morning motivation (8 AM)
    if (hours === 8) {
      addMessage("Good morning! Ready to crush today's goals? 🌅", 'double');
    }
    
    // Evening check-in (8 PM)
    if (hours === 20) {
      addMessage("Evening check-in! How did your tasks go today? 🌙", 'double');
    }
  };

  // Smart task detection
  const isTaskMessage = (message) => {
    const taskPatterns = [
      /^(\d+\.|•|-)\s*.+/gm, // Numbered or bulleted lists
      /(?:task|todo|do|complete|finish|accomplish).*:/i, // Task keywords with colon
      /(?:need to|have to|must|should|will|gonna)\s+.{10,}/i, // Intent phrases
      /(?:tomorrow|today|this week).*(?:do|complete|finish)/i, // Time-based tasks
    ];
    
    const lines = message.split('\n').filter(line => line.trim());
    
    // If multiple lines, likely tasks
    if (lines.length >= 2) {
      return lines.some(line => 
        taskPatterns.some(pattern => pattern.test(line)) ||
        line.length > 15 // Substantial content
      );
    }
    
    // Single line task detection
    return taskPatterns.some(pattern => pattern.test(message));
  };

  // Smart conversation understanding
  const analyzeMessage = (message) => {
    const msg = message.toLowerCase().trim();
    
    // Setup mode
    if (conversationMode === 'setup') {
      return { type: 'setup', content: message };
    }
    
    // Explicit task adding
    if (msg.includes('add task') || msg.includes('new task') || conversationMode === 'task-adding') {
      return { type: 'task', content: message };
    }
    
    // Task completion
    if (msg.includes('completed') || msg.includes('finished') || msg.includes('done with')) {
      return { type: 'task-completion', content: message };
    }
    
    // Stats request
    if (msg.includes('progress') || msg.includes('stats') || msg.includes('how many')) {
      return { type: 'stats', content: message };
    }
    
    // Alarm/reminder
    if (msg.includes('remind me') || msg.includes('alarm') || msg.includes('notification')) {
      return { type: 'alarm', content: message };
    }
    
    // Social media distraction
    if (msg.includes('facebook') || msg.includes('youtube') || msg.includes('instagram') || 
        msg.includes('tiktok') || msg.includes('social media')) {
      return { type: 'distraction', content: message };
    }
    
    // Auto-detect tasks
    if (isTaskMessage(message)) {
      return { type: 'task', content: message };
    }
    
    // General conversation
    return { type: 'conversation', content: message };
  };

  // Save data to phone storage
  const saveData = async () => {
    try {
      const data = {
        userName,
        isSetup,
        currentTasks,
        completedTasks,
        allTasks,
        messages,
        alarms,
        conversationMode,
      };
      await AsyncStorage.setItem('doubleAssistantData', JSON.stringify(data));
    } catch (error) {
      console.log('Error saving data:', error);
    }
  };

  // Load data from phone storage
  const loadData = async () => {
    try {
      const data = await AsyncStorage.getItem('doubleAssistantData');
      if (data) {
        const parsedData = JSON.parse(data);
        setUserName(parsedData.userName || '');
        setIsSetup(parsedData.isSetup || false);
        setCurrentTasks(parsedData.currentTasks || []);
        setCompletedTasks(parsedData.completedTasks || []);
        setAllTasks(parsedData.allTasks || []);
        setMessages(parsedData.messages || []);
        setAlarms(parsedData.alarms || []);
        setConversationMode(parsedData.conversationMode || 'normal');
      }
    } catch (error) {
      console.log('Error loading data:', error);
    }
  };

  // Save data whenever important state changes
  useEffect(() => {
    if (isSetup) {
      saveData();
    }
  }, [userName, isSetup, currentTasks, completedTasks, allTasks, messages, alarms, conversationMode]);

  const addMessage = (text, sender, isTask = false) => {
    const newMessage = {
      id: Date.now() + Math.random(),
      text,
      sender,
      timestamp: new Date(),
      isTask
    };
    setMessages(prev => [...prev, newMessage]);
    
    // Auto-scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleSetup = (name) => {
    setUserName(name);
    setIsSetup(true);
    setConversationMode('normal');
    addMessage(`Nice to meet you, ${name}! 🎉`, 'double');
    addMessage("I'm here to help you grow every day. My superpowers include:", 'double');
    addMessage("🎯 Smart task planning & tracking\n⏰ Setting reminders & alarms\n📊 Progress analytics\n💪 Keeping you motivated\n🧠 Understanding when you're adding tasks vs. chatting", 'double');
    setTimeout(() => {
      addMessage("I'm pretty smart - I can tell the difference between tasks and regular conversation! Try chatting with me or tell me your tasks.", 'double');
    }, 1500);
  };

  const processTasks = (taskText) => {
    // Extract actual tasks from message
    const lines = taskText.split('\n').filter(line => line.trim());
    let tasks = [];
    
    // Smart task extraction
    lines.forEach(line => {
      // Remove numbering, bullets, or prefixes
      let cleanTask = line.replace(/^\d+\.\s*/, '')
                         .replace(/^[-•]\s*/, '')
                         .replace(/^(task|todo):\s*/i, '')
                         .trim();
      
      if (cleanTask.length > 3) { // Only meaningful tasks
        tasks.push(cleanTask);
      }
    });
    
    // If no clear task format, treat whole message as one task
    if (tasks.length === 0 && taskText.trim().length > 5) {
      tasks = [taskText.trim()];
    }
    
    const newTasks = tasks.map(task => ({
      id: Date.now() + Math.random(),
      text: task,
      completed: false,
      createdAt: new Date(),
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      priority: 'medium'
    }));
    
    setCurrentTasks(prev => [...prev, ...newTasks]);
    setAllTasks(prev => [...prev, ...newTasks]);
    setConversationMode('normal');
    
    if (newTasks.length > 0) {
      addMessage(`Perfect! I've added ${newTasks.length} task${newTasks.length > 1 ? 's' : ''} for you:`, 'double');
      newTasks.forEach((task, index) => {
        addMessage(`${index + 1}. ${task.text}`, 'double', true);
      });
      addMessage("I'll help you stay on track! Need to set any reminders for these? 🔔", 'double');
      Vibration.vibrate(100); // Feedback
    }
  };

  const completeTask = (taskId) => {
    const taskToComplete = currentTasks.find(task => task.id === taskId);
    if (!taskToComplete) return;

    setCurrentTasks(prev => prev.filter(task => task.id !== taskId));
    const updatedTask = { ...taskToComplete, completed: true, completedAt: new Date() };
    setCompletedTasks(prev => [...prev, updatedTask]);
    setAllTasks(prev => prev.map(task => 
      task.id === taskId ? updatedTask : task
    ));
    
    const celebrations = [
      `🎉 Boom! You crushed: "${taskToComplete.text}"`,
      `⚡️ Amazing! Task completed: "${taskToComplete.text}"`,
      `🔥 You're on fire! Finished: "${taskToComplete.text}"`,
      `🏆 Victory! You completed: "${taskToComplete.text}"`
    ];
    
    addMessage(celebrations[Math.floor(Math.random() * celebrations.length)], 'double');
    Vibration.vibrate([100, 50, 100]); // Success vibration
    
    if (currentTasks.length === 1) {
      setTimeout(() => {
        addMessage("🌟 INCREDIBLE! All tasks completed for today! You're absolutely crushing it!", 'double');
        addMessage("Ready to plan tomorrow's wins? Or just tell me how you're feeling! 😊", 'double');
      }, 1500);
    }
  };

  const setReminder = (message) => {
    // Simple reminder parsing
    const timeMatch = message.match(/(\d+)\s*(hour|minute|am|pm)/i);
    if (timeMatch) {
      const newAlarm = {
        id: Date.now(),
        message: message,
        time: new Date(Date.now() + 60000), // 1 minute for demo
        active: true
      };
      setAlarms(prev => [...prev, newAlarm]);
      addMessage("⏰ Reminder set! I'll notify you soon.", 'double');
    } else {
      addMessage("I'd love to set a reminder! Try saying something like 'remind me in 1 hour' or 'remind me at 3pm'", 'double');
    }
  };

  const generateSmartResponse = (analysis) => {
    const { type, content } = analysis;
    
    switch (type) {
      case 'distraction':
        const distractionResponses = [
          `Hey ${userName}! Social media break detected 📱 How about we check your tasks first? You've got ${currentTasks.length} waiting!`,
          `${userName}, I see you mentioned social media! Quick question - have you tackled your goals today? 🎯`,
          `Pause! Before diving into social feeds, let's celebrate - you have ${completedTasks.length} tasks completed! What's next? 💪`,
          `${userName}, social media will still be there after you complete your tasks! Which one should we tackle first? 🚀`
        ];
        return distractionResponses[Math.floor(Math.random() * distractionResponses.length)];
        
      case 'stats':
        setShowStats(true);
        const completionRate = allTasks.length > 0 ? Math.round((completedTasks.length / allTasks.length) * 100) : 0;
        return `📊 Here's your amazing progress, ${userName}!\n\n✅ Completed: ${completedTasks.length}\n⏳ Pending: ${currentTasks.length}\n📈 Total: ${allTasks.length}\n🏆 Success Rate: ${completionRate}%\n\nYou're doing fantastic! Keep it up! 🌟`;
        
      case 'task-completion':
        return `Awesome! Which task did you complete? You can tap the ✅ button next to it, or just tell me the task name!`;
        
      case 'alarm':
        setReminder(content);
        return '';
        
      case 'conversation':
        const conversationalResponses = [
          `That's interesting, ${userName}! I love our chats. How are your goals coming along? 😊`,
          `Thanks for sharing that with me! Speaking of progress, how's your day going? 🌟`,
          `I hear you, ${userName}! Life's full of moments like these. What's energizing you today? ⚡️`,
          `Absolutely! I'm here for both the big goals and daily conversations. What's on your mind? 💭`,
          `I get it! Sometimes we just need to talk. I'm all ears - and ready to help when you need it! 🤗`
        ];
        return conversationalResponses[Math.floor(Math.random() * conversationalResponses.length)];
        
      default:
        return `I'm here to help, ${userName}! Whether it's tasks, reminders, or just a chat - what do you need? 🚀`;
    }
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    addMessage(inputMessage, 'user');
    const userMsg = inputMessage;
    setInputMessage('');

    setTimeout(() => {
      const analysis = analyzeMessage(userMsg);
      
      if (analysis.type === 'setup') {
        handleSetup(userMsg);
      } else if (analysis.type === 'task') {
        processTasks(userMsg);
      } else {
        const response = generateSmartResponse(analysis);
        if (response) {
          addMessage(response, 'double');
        }
      }
    }, 800);
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f0f4ff" />
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header - Moved down with padding */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>🤖</Text>
            </View>
            <View>
              <Text style={styles.headerTitle}>Double</Text>
              <Text style={styles.headerSubtitle}>Smart AI Growth Assistant</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.statsButton}
            onPress={() => setShowStats(!showStats)}
          >
            <Text style={styles.statsButtonText}>📊 Stats</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Panel - Moved down */}
        {showStats && (
          <View style={styles.statsPanel}>
            <Text style={styles.statsPanelTitle}>📈 Your Progress Dashboard</Text>
            <View style={styles.statsRow}>
              <View style={[styles.statCard, styles.completedCard]}>
                <Text style={styles.statEmoji}>✅</Text>
                <Text style={styles.statLabel}>Completed</Text>
                <Text style={styles.statNumber}>{completedTasks.length}</Text>
              </View>
              <View style={[styles.statCard, styles.pendingCard]}>
                <Text style={styles.statEmoji}>⏳</Text>
                <Text style={styles.statLabel}>Pending</Text>
                <Text style={styles.statNumber}>{currentTasks.length}</Text>
              </View>
              <View style={[styles.statCard, styles.totalCard]}>
                <Text style={styles.statEmoji}>🎯</Text>
                <Text style={styles.statLabel}>Total</Text>
                <Text style={styles.statNumber}>{allTasks.length}</Text>
              </View>
            </View>
            {allTasks.length > 0 && (
              <Text style={styles.successRate}>
                🏆 Success Rate: {Math.round((completedTasks.length / allTasks.length) * 100)}%
              </Text>
            )}
          </View>
        )}

        {/* Conversation Mode Indicator */}
        {conversationMode === 'task-adding' && (
          <View style={styles.modeIndicator}>
            <Text style={styles.modeText}>📝 Task Mode - I'm listening for your tasks!</Text>
          </View>
        )}

        {/* Messages */}
        <ScrollView 
          ref={scrollViewRef}
          style={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
        >
          {messages.map(message => (
            <View
              key={message.id}
              style={[
                styles.messageContainer,
                message.sender === 'user' ? styles.userMessage : styles.doubleMessage
              ]}
            >
              <View
                style={[
                  styles.messageBubble,
                  message.sender === 'user' ? styles.userBubble : styles.doubleBubble
                ]}
              >
                <Text style={[
                  styles.messageText,
                  message.sender === 'user' ? styles.userText : styles.doubleText
                ]}>
                  {message.text}
                </Text>
                <Text style={[
                  styles.messageTime,
                  message.sender === 'user' ? styles.userTime : styles.doubleTime
                ]}>
                  {formatDate(message.timestamp)}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Current Tasks */}
        {currentTasks.length > 0 && (
          <View style={styles.tasksContainer}>
            <Text style={styles.tasksTitle}>🎯 Your Active Tasks ({currentTasks.length})</Text>
            {currentTasks.map(task => (
              <View key={task.id} style={styles.taskItem}>
                <View style={styles.taskContent}>
                  <Text style={styles.taskText}>{task.text}</Text>
                  <Text style={styles.taskDate}>Created: {formatDate(task.createdAt)}</Text>
                </View>
                <TouchableOpacity
                  style={styles.completeButton}
                  onPress={() => completeTask(task.id)}
                >
                  <Text style={styles.completeButtonText}>✅ Done</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Smart Input with Mode Toggle */}
        <View style={styles.inputContainer}>
          <View style={styles.inputHeader}>
            <TouchableOpacity
              style={[styles.modeButton, conversationMode === 'task-adding' && styles.activeModeButton]}
              onPress={() => setConversationMode(conversationMode === 'task-adding' ? 'normal' : 'task-adding')}
            >
              <Text style={styles.modeButtonText}>
                {conversationMode === 'task-adding' ? '💬 Chat Mode' : '📝 Task Mode'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              value={inputMessage}
              onChangeText={setInputMessage}
              placeholder={
                conversationMode === 'setup' 
                  ? "Enter your name..." 
                  : conversationMode === 'task-adding'
                  ? "Add your tasks here..."
                  : "Chat with Double or add tasks..."
              }
              multiline
              returnKeyType="send"
              onSubmitEditing={handleSendMessage}
            />
            <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
              <Text style={styles.sendButtonText}>🚀</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4ff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    paddingTop: 24, // Extra padding from top
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    backgroundColor: '#3b82f6',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  statsButton: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  statsButtonText: {
    color: '#1d4ed8',
    fontWeight: '600',
    fontSize: 12,
  },
  statsPanel: {
    backgroundColor: 'white',
    padding: 16,
    paddingTop: 20, // Extra padding from header
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  statsPanelTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  completedCard: {
    backgroundColor: '#dcfce7',
  },
  pendingCard: {
    backgroundColor: '#fed7aa',
  },
  totalCard: {
    backgroundColor: '#dbeafe',
  },
  statEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    color: '#374151',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  successRate: {
    textAlign: 'center',
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  modeIndicator: {
    backgroundColor: '#fef3c7',
    padding: 12,
    alignItems: 'center',
  },
  modeText: {
    color: '#92400e',
    fontWeight: '600',
    fontSize: 14,
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  messageContainer: {
    marginBottom: 16,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  doubleMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '85%',
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: '#3b82f6',
  },
  doubleBubble: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: 'white',
  },
  doubleText: {
    color: '#1f2937',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  userTime: {
    color: '#bfdbfe',
  },
  doubleTime: {
    color: '#6b7280',
  },
  tasksContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    maxHeight: 200,
  },
  tasksTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#1f2937',
  },
  taskItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  taskContent: {
    flex: 1,
  },
  taskText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  taskDate: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  completeButton: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  completeButtonText: {
    color: '#166534',
    fontSize: 12,
    fontWeight: '600',
  },
  inputContainer: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingBottom: Platform.OS === 'ios' ? 20 : 16,
  },
  inputHeader: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  modeButton: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  activeModeButton: {
    backgroundColor: '#dbeafe',
  },
  modeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  inputRow: {
    flexDirection: 'row',
    padding: 16,
    paddingTop: 8,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    maxHeight: 100,
    fontSize: 16,
    backgroundColor: '#f9fafb',
  },
  sendButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: 'center',
    minWidth: 50,
    alignItems: 'center',
  },
  sendButtonText: {
    fontSize: 18,
  },
});

export default DoubleAssistant;
