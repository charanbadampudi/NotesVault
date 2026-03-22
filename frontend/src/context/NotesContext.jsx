import { createContext, useContext, useState, useCallback } from 'react';
import api from '../utils/api';
import { encryptText, decryptText, encryptImage, decryptImage, wordCount } from '../utils/crypto';
import { useAuth } from './AuthContext';

const NotesContext = createContext(null);

const SESSION_KEY  = 'vn_unlocked';
const getUnlocked  = () => { try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)) || {}; } catch { return {}; } };
const setUnlocked  = (m) => sessionStorage.setItem(SESSION_KEY, JSON.stringify(m));

export const NotesProvider = ({ children }) => {
  const { encKey } = useAuth();
  const [notes,      setNotes]      = useState([]);
  const [trashNotes, setTrashNotes] = useState([]);
  const [loading,    setLoading]    = useState(false);

  const fetchNotes = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const { data } = await api.get('/notes', { params });
      setNotes(data.notes);
    } finally { setLoading(false); }
  }, []);

  const fetchTrash = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/notes/trash');
      setTrashNotes(data.notes);
    } finally { setLoading(false); }
  }, []);

  // Encrypt images array before saving
  const _encryptImages = (images) => {
    if (!encKey || !images?.length) return [];
    return images.map(img => {
      if (img.encryptedData) return img; // already encrypted
      const { encryptedData, iv } = encryptImage(img.base64, encKey);
      return { encryptedData, iv, mimeType: img.mimeType, name: img.name };
    });
  };

  const createNote = useCallback(async (title, content, tags, color, passcodeType, customPasscode, lockMode, images = []) => {
    if (!encKey) throw new Error('Encryption key unavailable. Please re-login.');
    const { ciphertext: encryptedContent, iv } = encryptText(content, encKey);
    const previewText = content.replace(/\n+/g,' ').trim().slice(0, 120);
    const { ciphertext: encryptedPreview, iv: previewIv } = encryptText(previewText, encKey);
    const encryptedImages = _encryptImages(images);

    const { data } = await api.post('/notes', {
      title, encryptedContent, iv, encryptedPreview, previewIv,
      images: encryptedImages,
      tags, color, wordCount: wordCount(content),
      passcodeType: passcodeType || 'default',
      customPasscode: customPasscode || undefined,
      lockMode: lockMode || 'oncePerSession',
    });
    setNotes(prev => [data.note, ...prev]);
    return data.note;
  }, [encKey]);

  const openNote = useCallback(async (noteId) => {
    if (!encKey) throw new Error('Encryption key unavailable. Please re-login.');
    const { data } = await api.get(`/notes/${noteId}`);
    const plainContent = decryptText(data.note.encryptedContent, encKey, data.note.iv);
    // Decrypt images
    const decryptedImages = (data.note.images || []).map(img => ({
      ...img,
      base64: decryptImage(img.encryptedData, encKey, img.iv),
    }));
    return { ...data.note, content: plainContent, decryptedImages };
  }, [encKey]);

  const saveNote = useCallback(async (noteId, title, content, tags, color, passcodeType, customPasscode, lockMode, images = []) => {
    if (!encKey) throw new Error('Encryption key unavailable. Please re-login.');
    const { ciphertext: encryptedContent, iv } = encryptText(content, encKey);
    const previewText = content.replace(/\n+/g,' ').trim().slice(0, 120);
    const { ciphertext: encryptedPreview, iv: previewIv } = encryptText(previewText, encKey);
    const encryptedImages = _encryptImages(images);

    const { data } = await api.patch(`/notes/${noteId}`, {
      title, encryptedContent, iv, encryptedPreview, previewIv,
      images: encryptedImages,
      tags, color, wordCount: wordCount(content),
      passcodeType: passcodeType || 'default',
      customPasscode: customPasscode || undefined,
      lockMode: lockMode || 'oncePerSession',
    });
    setNotes(prev => prev.map(n => n._id === noteId ? data.note : n));
    return data.note;
  }, [encKey]);

  const decryptPreview = useCallback((note) => {
    if (!encKey || !note.encryptedPreview) return '';
    return decryptText(note.encryptedPreview, encKey, note.previewIv);
  }, [encKey]);

  const toggleStar = useCallback(async (noteId, starred) => {
    const { data } = await api.patch(`/notes/${noteId}`, { starred });
    setNotes(prev => prev.map(n => n._id === noteId ? data.note : n));
  }, []);

  const togglePin = useCallback(async (noteId, pinned) => {
    const { data } = await api.patch(`/notes/${noteId}`, { pinned });
    setNotes(prev => prev.map(n => n._id === noteId ? data.note : n));
  }, []);

  // Soft delete — moves to trash
  const deleteNote = useCallback(async (noteId) => {
    await api.delete(`/notes/${noteId}`);
    setNotes(prev => prev.filter(n => n._id !== noteId));
  }, []);

  // Restore from trash
  const restoreNote = useCallback(async (noteId) => {
    const { data } = await api.patch(`/notes/${noteId}/restore`);
    setTrashNotes(prev => prev.filter(n => n._id !== noteId));
    setNotes(prev => [data.note, ...prev]);
  }, []);

  // Permanently delete
  const hardDeleteNote = useCallback(async (noteId) => {
    await api.delete(`/notes/${noteId}/permanent`);
    setTrashNotes(prev => prev.filter(n => n._id !== noteId));
  }, []);

  // Empty entire trash
  const emptyTrash = useCallback(async () => {
    await api.delete('/notes/trash/empty');
    setTrashNotes([]);
  }, []);

  const isUnlocked  = useCallback((id) => !!getUnlocked()[id], []);
  const markUnlocked = useCallback((id) => { const m = getUnlocked(); m[id] = true; setUnlocked(m); }, []);

  return (
    <NotesContext.Provider value={{
      notes, trashNotes, loading,
      fetchNotes, fetchTrash,
      createNote, openNote, saveNote,
      decryptPreview, toggleStar, togglePin,
      deleteNote, restoreNote, hardDeleteNote, emptyTrash,
      isUnlocked, markUnlocked,
    }}>
      {children}
    </NotesContext.Provider>
  );
};

export const useNotes = () => {
  const ctx = useContext(NotesContext);
  if (!ctx) throw new Error('useNotes must be used inside NotesProvider');
  return ctx;
};
