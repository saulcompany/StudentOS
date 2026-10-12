import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { userProfile as defaultProfile } from '../data/mockData';
import {
  getRememberMePreference,
  isSupabaseConfigured,
  setRememberMePreference,
  supabase,
} from '../services/supabaseClient';

const AppContext = createContext(null);
const defaultStudyStreak = { current: 0, longest: 0, lastActiveDate: '', history: {} };

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function updateStreak(previous = defaultStudyStreak, activeDate = localDateKey()) {
  const safePrevious = { ...defaultStudyStreak, ...previous, history: previous?.history || {} };
  const history = { ...safePrevious.history };
  history[activeDate] = true;

  if (!safePrevious.lastActiveDate) {
    return { ...safePrevious, current: 1, longest: 1, lastActiveDate: activeDate, history };
  }

  const previousDate = new Date(`${safePrevious.lastActiveDate}T00:00:00`);
  const activeDateValue = new Date(`${activeDate}T00:00:00`);
  const diffDays = Math.round((activeDateValue - previousDate) / 86400000);

  if (diffDays === 0) {
    return { ...safePrevious, history };
  }

  const nextCurrent = diffDays === 1 ? safePrevious.current + 1 : 1;
  return {
    ...safePrevious,
    current: nextCurrent,
    longest: Math.max(safePrevious.longest || 0, nextCurrent),
    lastActiveDate: activeDate,
    history,
  };
}

const emptyData = {
  user: defaultProfile,
  tasks: [],
  subjects: [],
  calendar: [],
  assignments: [],
  notes: [],
  goals: [],
  habits: [],
  fitness: [],
  studyStreak: defaultStudyStreak,
};

function loadLegacyDataForUser(email) {
  try {
    const legacyData = JSON.parse(localStorage.getItem('studentos-data-v1') || 'null');
    const legacyEmail = legacyData?.user?.email?.trim().toLowerCase();
    if (legacyData && legacyEmail && legacyEmail === email?.trim().toLowerCase()) {
      return legacyData;
    }
  } catch (error) {
    console.error('Could not read legacy StudentOS data for migration:', error);
  }
  return null;
}

export function AppProvider({ children }) {
  const [data, setData] = useState(emptyData);
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(isSupabaseConfigured);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataSyncError, setDataSyncError] = useState('');
  const activeUserId = session?.user?.id;
  const activeUserEmail = session?.user?.email || '';
  const activeUserName = session?.user?.user_metadata?.full_name || '';
  const loadedUserId = useRef(null);

  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return undefined;
    }

    let active = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (active) setSession(nextSession);
    });

    supabase.auth.getSession()
      .then(({ data: sessionData, error }) => {
        if (!active) return;
        if (error) setDataSyncError(`Could not restore your Supabase session: ${error.message}`);
        setSession(sessionData?.session || null);
      })
      .catch((error) => {
        if (active) setDataSyncError(`Could not restore your Supabase session: ${error.message}`);
      })
      .finally(() => {
        if (active) setAuthLoading(false);
      });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!supabase || !activeUserId) {
      loadedUserId.current = null;
      setData(emptyData);
      setDataLoading(false);
      setDataSyncError('');
      return undefined;
    }

    let active = true;
    loadedUserId.current = null;
    setDataLoading(true);
    setDataSyncError('');

    const loadUserData = async () => {
      try {
        const { data: row, error } = await supabase
          .from('student_data')
          .select('data')
          .eq('user_id', activeUserId)
          .maybeSingle();
        if (error) throw error;

        const legacyData = row ? null : loadLegacyDataForUser(activeUserEmail);
        const cloudData = row?.data || legacyData || {
          ...emptyData,
          user: {
            ...defaultProfile,
            id: activeUserId,
            email: activeUserEmail,
            name: activeUserName || 'Student',
          },
        };

        const hydratedData = {
          ...emptyData,
          ...cloudData,
          user: {
            ...defaultProfile,
            ...(cloudData.user || {}),
            id: activeUserId,
            email: activeUserEmail || cloudData.user?.email || '',
            name: cloudData.user?.name || activeUserName || 'Student',
          },
          studyStreak: { ...defaultStudyStreak, ...(cloudData.studyStreak || {}) },
        };

        if (!row) {
          const { error: insertError } = await supabase
            .from('student_data')
            .insert({ user_id: activeUserId, data: hydratedData });
          if (insertError) throw insertError;
          if (legacyData) localStorage.removeItem('studentos-data-v1');
        }

        if (active) {
          loadedUserId.current = activeUserId;
          setData(hydratedData);
        }
      } catch (error) {
        if (active) {
          setDataSyncError(`Could not load your Supabase data: ${error.message}`);
        }
      } finally {
        if (active) setDataLoading(false);
      }
    };

    loadUserData();
    return () => {
      active = false;
    };
  }, [activeUserId, activeUserEmail, activeUserName]);

  useEffect(() => {
    if (!supabase || !activeUserId || dataLoading || loadedUserId.current !== activeUserId) return undefined;

    const timeoutId = setTimeout(async () => {
      try {
        const { error } = await supabase
          .from('student_data')
          .upsert({ user_id: activeUserId, data }, { onConflict: 'user_id' });
        if (error) throw error;
        setDataSyncError('');
      } catch (error) {
        setDataSyncError(`Could not save your Supabase data: ${error.message}`);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [activeUserId, data, dataLoading]);

  const login = async ({ email, password, rememberMe = getRememberMePreference() } = {}) => {
    if (!supabase) {
      throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to the project-root .env file, then restart the app.');
    }
    setRememberMePreference(rememberMe);
    const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    setSession(authData.session);
  };

  const signUp = async ({ email, password, name } = {}) => {
    if (!supabase) {
      throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to the project-root .env file, then restart the app.');
    }
    const { data: signupData, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    if (error) throw error;
    if (signupData.session) setSession(signupData.session);
    return signupData;
  };

  const logout = async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const requestPasswordReset = async (email) => {
    if (!supabase) {
      throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to the project-root .env file, then restart the app.');
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  };

  const updatePassword = async (password) => {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  };

  const recordStudyActivity = () => {
    setData((current) => ({
      ...current,
      studyStreak: updateStreak(current.studyStreak, localDateKey()),
    }));
  };

  const updateTask = (taskId, updates) => {
    setData((current) => {
      const nextState = {
        ...current,
        tasks: current.tasks.map((task) => (
          task.id === taskId
            ? {
              ...task,
              ...updates,
              ...(updates.status === 'Completed' ? { completedAt: new Date().toISOString() } : {}),
            }
            : task
        )),
      };

      if (updates.status === 'Completed') {
        return {
          ...nextState,
          studyStreak: updateStreak(current.studyStreak, localDateKey()),
        };
      }

      return nextState;
    });
  };

  const updateTaskStatus = (taskId, status) => updateTask(taskId, { status });

  const addTask = (task) => {
    const id = globalThis.crypto?.randomUUID?.() ?? `task-${Date.now()}`;
    setData((current) => ({
      ...current,
      tasks: [...current.tasks, {
        description: '',
        category: 'Study',
        subject: '',
        priority: 'Medium',
        status: 'Pending',
        dueDate: '',
        duration: 30,
        reminder: 'None',
        ...task,
        id,
      }],
    }));
    return id;
  };

  const removeTask = (taskId) => setData((current) => ({
    ...current,
    tasks: current.tasks.filter((task) => task.id !== taskId),
  }));

  const addSubject = (name) => {
    const cleanedName = name.trim();
    if (!cleanedName) return;
    setData((current) => current.subjects.some(
      (subject) => subject.name.toLowerCase() === cleanedName.toLowerCase(),
    ) ? current : {
      ...current,
      subjects: [...current.subjects, {
        name: cleanedName,
        progress: 0,
        completedTopics: 0,
        totalTopics: 0,
        weakTopics: [],
        strongTopics: [],
      }],
      user: { ...current.user, subjects: [...current.user.subjects, cleanedName] },
    });
  };

  const updateSubject = (name, updates) => setData((current) => ({
    ...current,
    subjects: current.subjects.map((subject) => (
      subject.name === name ? { ...subject, ...updates } : subject
    )),
  }));

  const removeSubject = (name) => setData((current) => ({
    ...current,
    subjects: current.subjects.filter((subject) => subject.name !== name),
    user: { ...current.user, subjects: current.user.subjects.filter((subject) => subject !== name) },
  }));

  const addRecord = (collection, record) => {
    const id = globalThis.crypto?.randomUUID?.() ?? `${collection}-${Date.now()}`;
    setData((current) => {
      const nextState = {
        ...current,
        [collection]: [...current[collection], { id, createdAt: new Date().toISOString(), ...record }],
      };

      if (collection === 'notes' || collection === 'assignments') {
        return {
          ...nextState,
          studyStreak: updateStreak(current.studyStreak, localDateKey()),
        };
      }

      return nextState;
    });
    return id;
  };

  const updateRecord = (collection, recordId, updates) => setData((current) => {
    const nextState = {
      ...current,
      [collection]: current[collection].map((record) => (
        record.id === recordId ? { ...record, ...updates } : record
      )),
    };

    if (collection === 'assignments' && updates.completed) {
      return {
        ...nextState,
        studyStreak: updateStreak(current.studyStreak, localDateKey()),
      };
    }

    return nextState;
  });

  const removeRecord = (collection, recordId) => setData((current) => ({
    ...current,
    [collection]: current[collection].filter((record) => record.id !== recordId),
  }));

  const saveProfile = (profile) => setData((current) => ({
    ...current,
    user: { ...current.user, ...profile },
  }));

  const value = {
    isAuthenticated: Boolean(session?.user),
    supabaseConfigured: isSupabaseConfigured,
    authLoading,
    dataLoading,
    dataSyncError,
    user: data.user,
    taskList: data.tasks,
    subjectList: data.subjects,
    calendarItems: data.calendar,
    assignments: data.assignments,
    notes: data.notes,
    goals: data.goals,
    habits: data.habits,
    fitnessLogs: data.fitness,
    studyStreak: data.studyStreak,
    login,
    signUp,
    logout,
    requestPasswordReset,
    updatePassword,
    recordStudyActivity,
    updateTask,
    updateTaskStatus,
    addTask,
    removeTask,
    addSubject,
    updateSubject,
    removeSubject,
    addRecord,
    updateRecord,
    removeRecord,
    saveProfile,
    setUser: saveProfile,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
}
