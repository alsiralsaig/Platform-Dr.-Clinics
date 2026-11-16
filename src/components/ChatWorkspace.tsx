import React from 'react';
import {
  CalendarClock,
  Lock,
  MessageSquareText,
  Send,
  Stethoscope,
  UserRound,
} from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';
import {
  getConversationId,
  sendDoctorPatientMessage,
  subscribeConversationMessages,
  subscribeDoctorConversations,
  subscribePatientConversations,
} from '../lib/firestoreService';
import type { ChatMessage, Conversation } from '../types/medical';

export interface ChatContactOption {
  uid: string;
  name: string;
  subtitle: string;
  appointmentId?: string;
  appointmentDate?: string;
}

interface ChatWorkspaceProps {
  mode: 'patient' | 'doctor';
  currentUserUid: string;
  currentUserName: string;
  contacts: ChatContactOption[];
  initialSelectedContactUid?: string | null;
  initialAppointmentRef?: string;
  onClearInitialContact?: () => void;
}

function formatMessageTime(ts: unknown, lang: 'ar' | 'en', nowLabel: string): string {
  if (!ts) return nowLabel;
  let date: Date | null = null;
  if (
    typeof ts === 'object' &&
    ts !== null &&
    'toDate' in ts &&
    typeof (ts as { toDate: () => Date }).toDate === 'function'
  ) {
    date = (ts as { toDate: () => Date }).toDate();
  } else if (typeof ts === 'object' && ts !== null && 'seconds' in ts) {
    date = new Date(Number((ts as { seconds: number }).seconds) * 1000);
  }
  if (!date || Number.isNaN(date.getTime())) return nowLabel;
  return date.toLocaleString(lang === 'en' ? 'en-US' : 'ar-SD', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const ChatWorkspace: React.FC<ChatWorkspaceProps> = ({
  mode,
  currentUserUid,
  currentUserName,
  contacts,
  initialSelectedContactUid,
  initialAppointmentRef,
  onClearInitialContact,
}) => {
  const { lang, t } = useI18n();
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [selectedContactUid, setSelectedContactUid] = React.useState<string>('');
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [draftText, setDraftText] = React.useState('');
  const [appointmentRefInput, setAppointmentRefInput] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [newContactUid, setNewContactUid] = React.useState('');

  const messagesEndRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (initialSelectedContactUid) {
      setSelectedContactUid(initialSelectedContactUid);
      if (initialAppointmentRef) {
        setAppointmentRefInput(initialAppointmentRef);
      }
      onClearInitialContact?.();
    }
  }, [initialSelectedContactUid, initialAppointmentRef, onClearInitialContact]);

  React.useEffect(() => {
    if (!currentUserUid) return;
    const unsub =
      mode === 'patient'
        ? subscribePatientConversations(currentUserUid, (list) => {
            setConversations(list);
          })
        : subscribeDoctorConversations(currentUserUid, (list) => {
            setConversations(list);
          });
    return () => unsub();
  }, [mode, currentUserUid]);

  React.useEffect(() => {
    if (selectedContactUid) return;
    if (conversations.length > 0) {
      const first = conversations[0];
      setSelectedContactUid(mode === 'patient' ? first.doctorUid : first.patientUid);
    }
  }, [conversations, selectedContactUid, mode]);

  const activeConversationId = React.useMemo(() => {
    if (!selectedContactUid || !currentUserUid) return null;
    return mode === 'patient'
      ? getConversationId(currentUserUid, selectedContactUid)
      : getConversationId(selectedContactUid, currentUserUid);
  }, [mode, currentUserUid, selectedContactUid]);

  const activeConversation = React.useMemo(
    () => conversations.find((c) => c.id === activeConversationId) || null,
    [conversations, activeConversationId]
  );

  const activeContact = React.useMemo(() => {
    if (!selectedContactUid) return null;
    const fromContacts = contacts.find((c) => c.uid === selectedContactUid);
    if (fromContacts) return fromContacts;
    if (activeConversation) {
      return mode === 'patient'
        ? {
            uid: activeConversation.doctorUid,
            name: activeConversation.doctorName,
            subtitle: activeConversation.doctorSpecialty,
            appointmentId: activeConversation.appointmentId,
            appointmentDate: activeConversation.appointmentDate,
          }
        : {
            uid: activeConversation.patientUid,
            name: activeConversation.patientName,
            subtitle: activeConversation.appointmentDate
              ? `${t.chat.appointmentBadgePrefix} ${activeConversation.appointmentDate}`
              : t.chat.rolePatient,
            appointmentId: activeConversation.appointmentId,
            appointmentDate: activeConversation.appointmentDate,
          };
    }
    return null;
  }, [selectedContactUid, contacts, activeConversation, mode, t.chat.appointmentBadgePrefix, t.chat.rolePatient]);

  React.useEffect(() => {
    if (!activeConversationId || !currentUserUid) {
      setMessages([]);
      return;
    }
    const unsub = subscribeConversationMessages(
      activeConversationId,
      mode,
      currentUserUid,
      (list) => {
        setMessages(list);
      }
    );
    return () => unsub();
  }, [activeConversationId, mode, currentUserUid]);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const contactsWithoutThread = React.useMemo(() => {
    const existingOtherUids = new Set(
      conversations.map((c) => (mode === 'patient' ? c.doctorUid : c.patientUid))
    );
    return contacts.filter((c) => !existingOtherUids.has(c.uid));
  }, [contacts, conversations, mode]);

  const handleStartNewThread = () => {
    if (!newContactUid) return;
    const contact = contacts.find((c) => c.uid === newContactUid);
    setSelectedContactUid(newContactUid);
    if (contact?.appointmentDate) {
      setAppointmentRefInput(`${t.chat.appointmentBadgePrefix} ${contact.appointmentDate}`);
    }
    setNewContactUid('');
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeContact || !draftText.trim() || sending) return;

    setSending(true);
    setErrorMsg(null);
    try {
      const patientUid = mode === 'patient' ? currentUserUid : activeContact.uid;
      const patientName = mode === 'patient' ? currentUserName : activeContact.name;
      const doctorUid = mode === 'patient' ? activeContact.uid : currentUserUid;
      const doctorName = mode === 'patient' ? activeContact.name : currentUserName;
      const doctorSpecialty =
        mode === 'patient'
          ? activeContact.subtitle
          : activeConversation?.doctorSpecialty || t.chat.roleDoctor;

      await sendDoctorPatientMessage({
        patientUid,
        patientName,
        doctorUid,
        doctorName,
        doctorSpecialty,
        senderUid: currentUserUid,
        senderName: currentUserName,
        senderRole: mode,
        text: draftText,
        appointmentId: activeContact.appointmentId || activeConversation?.appointmentId || '',
        appointmentDate: activeContact.appointmentDate || activeConversation?.appointmentDate || '',
        appointmentRef: appointmentRefInput.trim(),
      });
      setDraftText('');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Message failed to send.');
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <MessageSquareText className="w-5 h-5 text-teal-700 dark:text-teal-400" />
            {mode === 'patient' ? t.chat.patientTitle : t.chat.doctorTitle}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {mode === 'patient' ? t.chat.patientDesc : t.chat.doctorDesc}
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 rounded-lg whitespace-nowrap">
          <Lock className="w-3.5 h-3.5 shrink-0" />
          <span>{t.chat.secureBadge}</span>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/50 text-red-800 dark:text-red-300 text-xs">
          {errorMsg}
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[540px]">
        {/* Conversations & Contacts Sidebar */}
        <div className="lg:col-span-4 border-b lg:border-b-0 lg:border-e border-slate-200 dark:border-slate-800 flex flex-col bg-slate-50/50 dark:bg-slate-800/40">
          <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {t.chat.startNewTitle} ({contacts.length} {t.chat.availableSuffix})
            </p>
            <div className="flex items-center gap-2">
              <select
                value={newContactUid}
                onChange={(e) => setNewContactUid(e.target.value)}
                className="flex-1 min-w-0 px-2.5 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700"
              >
                <option value="">
                  {mode === 'patient'
                    ? t.chat.selectDoctorPlaceholder
                    : t.chat.selectPatientPlaceholder}
                </option>
                {(contactsWithoutThread.length > 0 ? contactsWithoutThread : contacts).map((c) => (
                  <option key={c.uid} value={c.uid}>
                    {c.name} · {c.subtitle}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={!newContactUid}
                onClick={handleStartNewThread}
                className="px-3 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-lg cursor-pointer disabled:opacity-40 whitespace-nowrap shrink-0"
              >
                {t.chat.openBtn}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {conversations.length === 0 && !activeContact ? (
              <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400 space-y-2">
                <MessageSquareText className="w-7 h-7 text-slate-300 dark:text-slate-600 mx-auto" />
                <p>{t.chat.noThreadsYet}</p>
              </div>
            ) : (
              <>
                {activeContact && !activeConversation && (
                  <button
                    type="button"
                    onClick={() => setSelectedContactUid(activeContact.uid)}
                    className="w-full text-start p-3.5 bg-teal-50/80 dark:bg-teal-950/50 border-b border-teal-100 dark:border-teal-900 cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-sm text-teal-950 dark:text-teal-200 truncate">
                        {activeContact.name}
                      </span>
                      <span className="text-[11px] font-semibold text-teal-700 dark:text-teal-400">
                        {t.chat.newThreadBadge}
                      </span>
                    </div>
                    <p className="text-xs text-teal-800 dark:text-teal-300 truncate mt-0.5">
                      {activeContact.subtitle}
                    </p>
                  </button>
                )}

                {conversations.map((conv) => {
                  const otherUid = mode === 'patient' ? conv.doctorUid : conv.patientUid;
                  const otherName = mode === 'patient' ? conv.doctorName : conv.patientName;
                  const otherMeta =
                    mode === 'patient'
                      ? conv.doctorSpecialty
                      : conv.appointmentDate
                      ? `${t.chat.appointmentBadgePrefix} ${conv.appointmentDate}`
                      : t.chat.rolePatient;
                  const isSelected = selectedContactUid === otherUid;

                  return (
                    <button
                      key={conv.id}
                      type="button"
                      onClick={() => setSelectedContactUid(otherUid)}
                      className={`w-full text-start p-3.5 transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-teal-50/90 dark:bg-teal-950/50'
                          : 'hover:bg-white dark:hover:bg-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                          {otherName}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums shrink-0">
                          {formatMessageTime(conv.lastMessageAt, lang, t.chat.nowLabel)}
                        </span>
                      </div>
                      <p className="text-[11px] text-teal-800 dark:text-teal-400 font-medium mt-0.5 truncate">
                        {otherMeta}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 truncate mt-1">
                        {conv.lastSenderUid === currentUserUid ? `${t.chat.youPrefix}: ` : ''}
                        {conv.lastMessageText}
                      </p>
                    </button>
                  );
                })}
              </>
            )}
          </div>
        </div>

        {/* Active Conversation Thread */}
        <div className="lg:col-span-8 flex flex-col bg-white dark:bg-slate-900">
          {!activeContact ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3 text-slate-500 dark:text-slate-400">
              <MessageSquareText className="w-10 h-10 text-slate-300 dark:text-slate-600" />
              <div className="space-y-1 max-w-sm">
                <p className="font-display text-base font-bold text-slate-800 dark:text-slate-200">
                  {t.chat.emptyStateTitle}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {mode === 'patient'
                    ? t.chat.emptyStateDescPatient
                    : t.chat.emptyStateDescDoctor}
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/60 dark:bg-slate-800/50">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 flex items-center justify-center shrink-0">
                    {mode === 'patient' ? (
                      <Stethoscope className="w-5 h-5" />
                    ) : (
                      <UserRound className="w-5 h-5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                      {activeContact.name}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                      {activeContact.subtitle}
                    </p>
                  </div>
                </div>
                {(activeContact.appointmentDate || activeConversation?.appointmentDate) && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-1 rounded-lg font-mono tabular-nums">
                    <CalendarClock className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400" />
                    {t.chat.appointmentBadgePrefix}{' '}
                    {activeContact.appointmentDate || activeConversation?.appointmentDate}
                  </span>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[380px] bg-slate-50/30 dark:bg-slate-950/50">
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-center py-12 text-xs text-slate-500 dark:text-slate-400">
                    {t.chat.noMessagesYet}
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMine = msg.senderUid === currentUserUid;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMine ? 'items-start' : 'items-end'}`}
                      >
                        <div
                          className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 space-y-1 text-sm ${
                            isMine
                              ? 'bg-teal-700 text-white rounded-te-sm'
                              : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-ts-sm'
                          }`}
                        >
                          <div
                            className={`flex items-center justify-between gap-3 text-[11px] ${
                              isMine ? 'text-teal-100' : 'text-slate-500 dark:text-slate-400'
                            }`}
                          >
                            <span className="font-semibold">
                              {isMine ? t.chat.youPrefix : msg.senderName} ·{' '}
                              {msg.senderRole === 'doctor'
                                ? t.chat.roleDoctor
                                : t.chat.rolePatient}
                            </span>
                            <span className="font-mono tabular-nums">
                              {formatMessageTime(msg.createdAt, lang, t.chat.nowLabel)}
                            </span>
                          </div>
                          {msg.appointmentRef && (
                            <p
                              className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                                isMine
                                  ? 'bg-teal-800/70 text-teal-50'
                                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                              }`}
                            >
                              {msg.appointmentRef}
                            </p>
                          )}
                          <p className="leading-relaxed whitespace-pre-wrap break-words">
                            {msg.text}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <form
                onSubmit={handleSendMessage}
                className="p-3.5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <input
                    type="text"
                    maxLength={160}
                    value={appointmentRefInput}
                    onChange={(e) => setAppointmentRefInput(e.target.value)}
                    placeholder={t.chat.refPlaceholder}
                    className="flex-1 px-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700"
                  />
                </div>
                <div className="flex items-end gap-2">
                  <textarea
                    rows={2}
                    maxLength={1000}
                    required
                    value={draftText}
                    onChange={(e) => setDraftText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (draftText.trim() && !sending) {
                          handleSendMessage(e as unknown as React.FormEvent);
                        }
                      }
                    }}
                    placeholder={t.chat.messagePlaceholder}
                    className="flex-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700 resize-none"
                  />
                  <button
                    type="submit"
                    disabled={sending || !draftText.trim()}
                    className="px-4 py-3 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-xl cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
                  >
                    <Send className="w-4 h-4" />
                    <span>{sending ? t.chat.sendingBtn : t.chat.sendBtn}</span>
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </section>
  );
};
